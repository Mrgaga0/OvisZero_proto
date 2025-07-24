import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { cache } from '../../config/redis';
import { prisma } from '../../config/database';
import { videoProcessingService, RESOLUTION_PRESETS } from './video-processing.service';
import { Server } from 'socket.io';

// 5-3. 렌더링 큐 시스템
export interface RenderJob {
  id: string;
  userId: string;
  channelId: string;
  projectId: string;
  sequenceId: string;
  type: 'ai-edit' | 'export' | 'preview';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  
  // 입력 데이터
  inputData: {
    projectPath: string;
    sequenceName: string;
    outputSettings: OutputSettings;
    editingInstructions?: EditingInstruction[];
  };

  // 출력 결과
  output?: {
    filePaths: string[];
    thumbnailPath?: string;
    duration: number;
    fileSize: number;
  };

  // 메타데이터
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export interface OutputSettings {
  format: 'mp4' | 'mov' | 'avi';
  preset: keyof typeof RESOLUTION_PRESETS;
  quality: 'draft' | 'preview' | 'high' | 'master';
  includeAudio: boolean;
  customSettings?: Record<string, any>;
}

export interface EditingInstruction {
  type: 'cut' | 'transition' | 'effect' | 'audio';
  timestamp: number;
  duration?: number;
  parameters: Record<string, any>;
}

// 5-3-1. 작업 큐 관리
class RenderQueueService extends EventEmitter {
  private queues: Map<string, RenderJob[]> = new Map(); // priority -> jobs
  private activeJobs: Map<string, RenderJob> = new Map();
  private workers: Map<string, boolean> = new Map(); // workerId -> isAvailable
  private maxConcurrentJobs: number;
  private io?: Server;

  constructor(maxConcurrentJobs: number = 3) {
    super();
    this.maxConcurrentJobs = maxConcurrentJobs;
    
    // 우선순위별 큐 초기화
    this.queues.set('urgent', []);
    this.queues.set('high', []);
    this.queues.set('normal', []);
    this.queues.set('low', []);

    // 워커 초기화
    for (let i = 0; i < maxConcurrentJobs; i++) {
      this.workers.set(`worker-${i}`, true);
    }

    // 주기적으로 큐 처리
    this.startQueueProcessor();
  }

  setSocketIO(io: Server) {
    this.io = io;
  }

  // 작업 추가
  async addJob(job: Omit<RenderJob, 'id' | 'status' | 'progress' | 'createdAt' | 'retryCount'>): Promise<string> {
    const renderJob: RenderJob = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    // 큐에 추가
    const priorityQueue = this.queues.get(job.priority) || [];
    priorityQueue.push(renderJob);
    this.queues.set(job.priority, priorityQueue);

    // 캐시에 저장
    await cache.set(`job:${renderJob.id}`, renderJob, 3600 * 24); // 24시간

    // 데이터베이스에 로그
    await prisma.auditLog.create({
      data: {
        userId: job.userId,
        action: 'RENDER_JOB_QUEUED',
        entityType: 'PROJECT',
        entityId: job.projectId,
        metadata: {
          jobId: renderJob.id,
          type: job.type,
          priority: job.priority
        }
      }
    });

    logger.info(`Render job ${renderJob.id} added to ${job.priority} priority queue`);
    this.emit('jobQueued', renderJob);

    return renderJob.id;
  }

  // 5-3-2. 우선순위 처리
  private getNextJob(): RenderJob | null {
    // 우선순위 순서대로 작업 찾기
    const priorities = ['urgent', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = this.queues.get(priority) || [];
      if (queue.length > 0) {
        const job = queue.shift()!;
        this.queues.set(priority, queue);
        return job;
      }
    }

    return null;
  }

  // 큐 프로세서 시작
  private startQueueProcessor() {
    setInterval(async () => {
      await this.processQueue();
    }, 1000); // 1초마다 체크
  }

  // 큐 처리
  private async processQueue() {
    // 사용 가능한 워커 찾기
    const availableWorker = Array.from(this.workers.entries())
      .find(([workerId, isAvailable]) => isAvailable);

    if (!availableWorker) {
      return; // 모든 워커가 사용 중
    }

    const [workerId] = availableWorker;
    const job = this.getNextJob();

    if (!job) {
      return; // 처리할 작업 없음
    }

    // 워커 할당 및 작업 시작
    this.workers.set(workerId, false);
    this.activeJobs.set(job.id, job);

    try {
      await this.processJob(job, workerId);
    } catch (error) {
      await this.handleJobError(job, error as Error);
    } finally {
      // 워커 해제
      this.workers.set(workerId, true);
      this.activeJobs.delete(job.id);
    }
  }

  // 작업 처리
  private async processJob(job: RenderJob, workerId: string) {
    logger.info(`Worker ${workerId} started processing job ${job.id}`);

    // 작업 상태 업데이트
    await this.updateJobStatus(job.id, 'processing', 0);
    job.startedAt = new Date();

    try {
      // 작업 타입별 처리
      switch (job.type) {
        case 'ai-edit':
          await this.processAIEditJob(job);
          break;
        case 'export':
          await this.processExportJob(job);
          break;
        case 'preview':
          await this.processPreviewJob(job);
          break;
      }

      // 완료 처리
      await this.completeJob(job);
      
    } catch (error) {
      await this.handleJobError(job, error as Error);
    }
  }

  // AI 편집 작업 처리
  private async processAIEditJob(job: RenderJob) {
    const { inputData } = job;
    
    // 1단계: 프로젝트 분석 (20%)
    await this.updateJobStatus(job.id, 'processing', 20);
    await this.simulateProcessing(2000);

    // 2단계: AI 편집 적용 (60%)
    await this.updateJobStatus(job.id, 'processing', 40);
    
    if (inputData.editingInstructions) {
      for (const instruction of inputData.editingInstructions) {
        await this.applyEditingInstruction(instruction);
        const progress = 40 + (60 * (inputData.editingInstructions.indexOf(instruction) + 1) / inputData.editingInstructions.length);
        await this.updateJobStatus(job.id, 'processing', progress);
      }
    }

    // 3단계: 렌더링 (100%)
    await this.updateJobStatus(job.id, 'processing', 90);
    const outputPath = await this.renderVideo(job);
    
    // 결과 설정
    job.output = {
      filePaths: [outputPath],
      duration: 120, // Mock
      fileSize: 50 * 1024 * 1024 // 50MB Mock
    };
  }

  // 내보내기 작업 처리
  private async processExportJob(job: RenderJob) {
    const { inputData } = job;
    const preset = RESOLUTION_PRESETS[inputData.outputSettings.preset];
    
    if (!preset) {
      throw new Error(`Unknown preset: ${inputData.outputSettings.preset}`);
    }

    // 진행 상황 시뮬레이션
    for (let progress = 0; progress <= 90; progress += 10) {
      await this.updateJobStatus(job.id, 'processing', progress);
      await this.simulateProcessing(1000);
    }

    const outputPath = await this.renderVideo(job);
    
    job.output = {
      filePaths: [outputPath],
      duration: 300, // Mock
      fileSize: 100 * 1024 * 1024 // 100MB Mock
    };
  }

  // 미리보기 작업 처리
  private async processPreviewJob(job: RenderJob) {
    // 빠른 미리보기 생성
    await this.updateJobStatus(job.id, 'processing', 50);
    await this.simulateProcessing(1000);

    const outputPath = await this.renderVideo(job, true); // 저화질 미리보기
    
    job.output = {
      filePaths: [outputPath],
      duration: 60,
      fileSize: 10 * 1024 * 1024 // 10MB Mock
    };
  }

  // 편집 지시사항 적용 (Mock)
  private async applyEditingInstruction(instruction: EditingInstruction) {
    logger.debug(`Applying ${instruction.type} at ${instruction.timestamp}s`);
    await this.simulateProcessing(500);
  }

  // 비디오 렌더링 (Mock)
  private async renderVideo(job: RenderJob, isPreview: boolean = false): Promise<string> {
    const { inputData } = job;
    const outputDir = process.env.OUTPUT_DIR || './output';
    const filename = `${job.id}${isPreview ? '_preview' : ''}.${inputData.outputSettings.format}`;
    const outputPath = `${outputDir}/${filename}`;
    
    // 실제로는 videoProcessingService를 사용
    logger.info(`Rendering video to ${outputPath}`);
    
    // Mock 렌더링 시뮬레이션
    await this.simulateProcessing(3000);
    
    return outputPath;
  }

  // 작업 완료 처리
  private async completeJob(job: RenderJob) {
    job.completedAt = new Date();
    await this.updateJobStatus(job.id, 'completed', 100);

    // 썸네일 생성
    if (job.output?.filePaths[0]) {
      job.output.thumbnailPath = await this.generateThumbnail(job.output.filePaths[0]);
    }

    // 완료 알림
    this.emit('jobCompleted', job);
    
    if (this.io) {
      this.io.to(`user:${job.userId}`).emit('render:completed', {
        jobId: job.id,
        output: job.output
      });
    }

    logger.info(`Job ${job.id} completed successfully`);
  }

  // 5-3-4. 실패 처리 및 재시도
  private async handleJobError(job: RenderJob, error: Error) {
    job.errorMessage = error.message;
    job.retryCount++;

    logger.error(`Job ${job.id} failed (attempt ${job.retryCount}/${job.maxRetries}): ${error.message}`);

    if (job.retryCount < job.maxRetries) {
      // 재시도를 위해 큐에 다시 추가
      const queue = this.queues.get(job.priority) || [];
      queue.unshift(job); // 우선순위를 높여 앞쪽에 추가
      this.queues.set(job.priority, queue);
      
      await this.updateJobStatus(job.id, 'queued', 0);
      logger.info(`Job ${job.id} queued for retry (${job.retryCount}/${job.maxRetries})`);
    } else {
      // 최대 재시도 횟수 초과
      await this.updateJobStatus(job.id, 'failed', 0);
      
      this.emit('jobFailed', job);
      
      if (this.io) {
        this.io.to(`user:${job.userId}`).emit('render:failed', {
          jobId: job.id,
          error: error.message
        });
      }
    }
  }

  // 작업 상태 업데이트
  private async updateJobStatus(jobId: string, status: RenderJob['status'], progress: number) {
    const job = await cache.get<RenderJob>(`job:${jobId}`);
    if (job) {
      job.status = status;
      job.progress = progress;
      await cache.set(`job:${jobId}`, job, 3600 * 24);
    }

    // 실시간 업데이트
    if (this.io) {
      this.io.to(`user:${job?.userId}`).emit('render:progress', {
        jobId,
        status,
        progress
      });
    }
  }

  // 썸네일 생성 (Mock)
  private async generateThumbnail(videoPath: string): Promise<string> {
    const thumbnailPath = videoPath.replace(/\.[^.]+$/, '_thumb.jpg');
    logger.debug(`Generating thumbnail: ${thumbnailPath}`);
    
    // 실제로는 videoProcessingService.extractFrames 사용
    await this.simulateProcessing(500);
    
    return thumbnailPath;
  }

  // 처리 지연 시뮬레이션
  private async simulateProcessing(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // 5-3-5. 리소스 할당 최적화
  async optimizeResourceAllocation() {
    const queueSizes = {
      urgent: this.queues.get('urgent')?.length || 0,
      high: this.queues.get('high')?.length || 0,
      normal: this.queues.get('normal')?.length || 0,
      low: this.queues.get('low')?.length || 0
    };

    const totalQueued = Object.values(queueSizes).reduce((a, b) => a + b, 0);
    const activeJobCount = this.activeJobs.size;

    // 부하가 높을 때 워커 수 동적 조정
    if (totalQueued > 10 && activeJobCount < this.maxConcurrentJobs) {
      const additionalWorkers = Math.min(2, this.maxConcurrentJobs - activeJobCount);
      for (let i = 0; i < additionalWorkers; i++) {
        const workerId = `dynamic-worker-${Date.now()}-${i}`;
        this.workers.set(workerId, true);
      }
      logger.info(`Added ${additionalWorkers} dynamic workers due to high load`);
    }

    // 메모리 사용량 모니터링
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB 이상
      logger.warn('High memory usage detected, considering garbage collection');
      if (global.gc) {
        global.gc();
      }
    }

    // 큐 통계 로깅
    logger.debug('Queue status:', {
      queueSizes,
      activeJobs: activeJobCount,
      availableWorkers: Array.from(this.workers.values()).filter(Boolean).length
    });
  }

  // 공개 메서드들
  async getJobStatus(jobId: string): Promise<RenderJob | null> {
    return cache.get<RenderJob>(`job:${jobId}`);
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJobStatus(jobId);
    if (!job) return false;

    if (job.status === 'queued') {
      // 큐에서 제거
      for (const [priority, queue] of this.queues.entries()) {
        const index = queue.findIndex(j => j.id === jobId);
        if (index !== -1) {
          queue.splice(index, 1);
          this.queues.set(priority, queue);
          break;
        }
      }
    }

    await this.updateJobStatus(jobId, 'cancelled', job.progress);
    logger.info(`Job ${jobId} cancelled`);
    
    return true;
  }

  async getQueueStatus(): Promise<{
    queues: Record<string, number>;
    activeJobs: number;
    availableWorkers: number;
  }> {
    return {
      queues: {
        urgent: this.queues.get('urgent')?.length || 0,
        high: this.queues.get('high')?.length || 0,
        normal: this.queues.get('normal')?.length || 0,
        low: this.queues.get('low')?.length || 0
      },
      activeJobs: this.activeJobs.size,
      availableWorkers: Array.from(this.workers.values()).filter(Boolean).length
    };
  }

  async getUserJobs(userId: string, limit: number = 10): Promise<RenderJob[]> {
    // 실제로는 데이터베이스에서 조회해야 하지만, 여기서는 캐시에서 검색
    const jobs: RenderJob[] = [];
    
    // Mock 구현 - 실제로는 데이터베이스 쿼리 필요
    for (let i = 0; i < limit; i++) {
      const mockJob: RenderJob = {
        id: `job_${i}`,
        userId,
        channelId: 'channel-1',
        projectId: 'project-1',
        sequenceId: 'seq-1',
        type: 'export',
        priority: 'normal',
        status: i === 0 ? 'processing' : (i < 3 ? 'completed' : 'queued'),
        progress: i === 0 ? 45 : (i < 3 ? 100 : 0),
        inputData: {
          projectPath: '/path/to/project',
          sequenceName: 'Main Sequence',
          outputSettings: {
            format: 'mp4',
            preset: '1080p',
            quality: 'high',
            includeAudio: true
          }
        },
        createdAt: new Date(Date.now() - i * 3600000),
        retryCount: 0,
        maxRetries: 3
      };
      
      if (mockJob.status === 'completed') {
        mockJob.completedAt = new Date();
        mockJob.output = {
          filePaths: [`/output/job_${i}.mp4`],
          duration: 180,
          fileSize: 75 * 1024 * 1024
        };
      }
      
      jobs.push(mockJob);
    }
    
    return jobs;
  }
}

// 싱글톤 인스턴스
export const renderQueueService = new RenderQueueService();

// 정기적인 리소스 최적화
setInterval(() => {
  renderQueueService.optimizeResourceAllocation();
}, 30000); // 30초마다