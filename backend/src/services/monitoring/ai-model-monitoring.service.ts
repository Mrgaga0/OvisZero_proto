import { prisma } from '../../config/database';
import { cache } from '../../config/redis';
import { logger } from '../../utils/logger';

// 7-3. AI 모델 모니터링
export interface AIModelMetrics {
  modelId: string;
  modelName: string;
  accuracy: ModelAccuracyMetrics;
  performance: ModelPerformanceMetrics;
  drift: ModelDriftMetrics;
  bias: ModelBiasMetrics;
  usage: ModelUsageMetrics;
  timestamp: Date;
}

export interface ModelAccuracyMetrics {
  currentAccuracy: number;
  baselineAccuracy: number;
  accuracyTrend: number; // percentage change
  confidenceDistribution: number[];
  errorRate: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface ModelPerformanceMetrics {
  averageInferenceTime: number;
  throughput: number; // requests per second
  memoryUsage: number;
  cpuUsage: number;
  gpuUsage?: number;
  queuedRequests: number;
}

export interface ModelDriftMetrics {
  dataDrift: {
    score: number;
    threshold: number;
    isDetected: boolean;
    affectedFeatures: string[];
  };
  conceptDrift: {
    score: number;
    threshold: number;
    isDetected: boolean;
    performanceChange: number;
  };
  predictionDrift: {
    score: number;
    threshold: number;
    isDetected: boolean;
    distributionChange: number;
  };
}

export interface ModelBiasMetrics {
  overallBias: number;
  demographicParity: number;
  equalizedOdds: number;
  biasedFeatures: Array<{
    feature: string;
    biasScore: number;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface ModelUsageMetrics {
  totalPredictions: number;
  uniqueUsers: number;
  averagePredictionsPerUser: number;
  peakUsageTime: string;
  usageByChannel: Array<{
    channelType: string;
    predictions: number;
    accuracy: number;
  }>;
}

// 7-3-1. 모델 정확도 추적
export class AIModelMonitoringService {
  private monitoringInterval?: NodeJS.Timeout;
  private models: Map<string, AIModelMetrics> = new Map();

  constructor() {
    this.startMonitoring();
  }

  // 모니터링 시작
  private startMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectAllModelMetrics();
        await this.checkForAlerts();
      } catch (error) {
        logger.error('AI model monitoring error:', error);
      }
    }, 60000); // 1분마다

    logger.info('AI model monitoring started');
  }

  // 모든 모델 메트릭 수집
  private async collectAllModelMetrics() {
    const activeModels = await this.getActiveModels();

    for (const model of activeModels) {
      const metrics = await this.collectModelMetrics(model.id, model.name);
      this.models.set(model.id, metrics);
      
      // Redis에 캐시
      await cache.set(`ai:model:${model.id}:metrics`, metrics, 300);
    }
  }

  // 활성 모델 목록 조회
  private async getActiveModels(): Promise<Array<{id: string, name: string}>> {
    const channels = await prisma.channel.findMany({
      where: {
        modelData: { not: null }
      },
      select: {
        id: true,
        name: true,
        type: true
      }
    });

    return channels.map(channel => ({
      id: channel.id,
      name: `${channel.name} (${channel.type})`
    }));
  }

  // 개별 모델 메트릭 수집
  async collectModelMetrics(modelId: string, modelName: string): Promise<AIModelMetrics> {
    const [accuracy, performance, drift, bias, usage] = await Promise.all([
      this.collectAccuracyMetrics(modelId),
      this.collectPerformanceMetrics(modelId),
      this.collectDriftMetrics(modelId),
      this.collectBiasMetrics(modelId),
      this.collectUsageMetrics(modelId)
    ]);

    const metrics: AIModelMetrics = {
      modelId,
      modelName,
      accuracy,
      performance,
      drift,
      bias,
      usage,
      timestamp: new Date()
    };

    logger.debug(`Model metrics collected for ${modelName}:`, {
      accuracy: accuracy.currentAccuracy,
      drift: drift.dataDrift.isDetected || drift.conceptDrift.isDetected,
      usage: usage.totalPredictions
    });

    return metrics;
  }

  // 정확도 메트릭 수집
  private async collectAccuracyMetrics(modelId: string): Promise<ModelAccuracyMetrics> {
    // 최근 예측 결과 분석
    const recentPredictions = await this.getRecentPredictions(modelId, 1000);
    
    // 정확도 계산 (Mock 구현)
    const correctPredictions = recentPredictions.filter(p => p.isCorrect).length;
    const currentAccuracy = recentPredictions.length > 0 
      ? correctPredictions / recentPredictions.length 
      : 0;

    // 베이스라인 정확도 (모델 생성 시점)
    const baselineAccuracy = await this.getBaselineAccuracy(modelId);
    const accuracyTrend = baselineAccuracy > 0 
      ? ((currentAccuracy - baselineAccuracy) / baselineAccuracy) * 100 
      : 0;

    // 신뢰도 분포
    const confidenceDistribution = this.calculateConfidenceDistribution(recentPredictions);

    // 에러율 계산
    const falsePositives = recentPredictions.filter(p => !p.isCorrect && p.predicted).length;
    const falseNegatives = recentPredictions.filter(p => !p.isCorrect && !p.predicted).length;
    const totalPositives = recentPredictions.filter(p => p.actual).length;
    const totalNegatives = recentPredictions.length - totalPositives;

    return {
      currentAccuracy,
      baselineAccuracy,
      accuracyTrend,
      confidenceDistribution,
      errorRate: 1 - currentAccuracy,
      falsePositiveRate: totalNegatives > 0 ? falsePositives / totalNegatives : 0,
      falseNegativeRate: totalPositives > 0 ? falseNegatives / totalPositives : 0
    };
  }

  // 성능 메트릭 수집
  private async collectPerformanceMetrics(modelId: string): Promise<ModelPerformanceMetrics> {
    // 최근 추론 시간 분석
    const recentInferences = await this.getRecentInferences(modelId, 100);
    const averageInferenceTime = recentInferences.length > 0
      ? recentInferences.reduce((sum, inf) => sum + inf.duration, 0) / recentInferences.length
      : 0;

    // 처리량 계산
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentRequests = recentInferences.filter(inf => inf.timestamp > oneMinuteAgo).length;
    const throughput = recentRequests; // requests per minute

    // 리소스 사용량 (Mock)
    const memoryUsage = Math.random() * 2048; // MB
    const cpuUsage = Math.random() * 100; // percentage
    const gpuUsage = Math.random() * 100; // percentage

    return {
      averageInferenceTime,
      throughput,
      memoryUsage,
      cpuUsage,
      gpuUsage,
      queuedRequests: Math.floor(Math.random() * 10)
    };
  }

  // 7-3-2. 드리프트 감지
  private async collectDriftMetrics(modelId: string): Promise<ModelDriftMetrics> {
    // 데이터 드리프트 감지
    const dataDrift = await this.detectDataDrift(modelId);
    
    // 컨셉 드리프트 감지
    const conceptDrift = await this.detectConceptDrift(modelId);
    
    // 예측 드리프트 감지
    const predictionDrift = await this.detectPredictionDrift(modelId);

    return {
      dataDrift,
      conceptDrift,
      predictionDrift
    };
  }

  private async detectDataDrift(modelId: string): Promise<ModelDriftMetrics['dataDrift']> {
    // KL Divergence나 Jensen-Shannon Divergence 계산 (Mock)
    const score = Math.random() * 0.5; // 0-0.5 범위
    const threshold = 0.3;
    const isDetected = score > threshold;

    const affectedFeatures: string[] = [];
    if (isDetected) {
      affectedFeatures.push('cut_frequency', 'transition_type', 'color_grading');
    }

    return {
      score,
      threshold,
      isDetected,
      affectedFeatures
    };
  }

  private async detectConceptDrift(modelId: string): Promise<ModelDriftMetrics['conceptDrift']> {
    // ADWIN이나 DDM 알고리즘 구현 (Mock)
    const currentAccuracy = await this.getCurrentAccuracy(modelId);
    const historicalAccuracy = await this.getHistoricalAccuracy(modelId);
    
    const performanceChange = currentAccuracy - historicalAccuracy;
    const score = Math.abs(performanceChange);
    const threshold = 0.1; // 10% 변화
    const isDetected = score > threshold;

    return {
      score,
      threshold,
      isDetected,
      performanceChange
    };
  }

  private async detectPredictionDrift(modelId: string): Promise<ModelDriftMetrics['predictionDrift']> {
    // 예측 분포 변화 감지 (Mock)
    const score = Math.random() * 0.4;
    const threshold = 0.25;
    const isDetected = score > threshold;
    const distributionChange = score * 100; // percentage

    return {
      score,
      threshold,
      isDetected,
      distributionChange
    };
  }

  // 7-3-3. 편향성 모니터링
  private async collectBiasMetrics(modelId: string): Promise<ModelBiasMetrics> {
    // 전체 편향성 점수
    const overallBias = await this.calculateOverallBias(modelId);
    
    // Demographic Parity 계산
    const demographicParity = await this.calculateDemographicParity(modelId);
    
    // Equalized Odds 계산
    const equalizedOdds = await this.calculateEqualizedOdds(modelId);
    
    // 편향된 특성 식별
    const biasedFeatures = await this.identifyBiasedFeatures(modelId);

    return {
      overallBias,
      demographicParity,
      equalizedOdds,
      biasedFeatures
    };
  }

  private async calculateOverallBias(modelId: string): Promise<number> {
    // 종합 편향성 점수 계산 (Mock)
    return Math.random() * 0.3; // 0-30% 편향성
  }

  private async calculateDemographicParity(modelId: string): Promise<number> {
    // 인구통계학적 균등성 계산 (Mock)
    return 0.85 + Math.random() * 0.1; // 85-95%
  }

  private async calculateEqualizedOdds(modelId: string): Promise<number> {
    // 균등화 확률 계산 (Mock)
    return 0.80 + Math.random() * 0.15; // 80-95%
  }

  private async identifyBiasedFeatures(modelId: string): Promise<ModelBiasMetrics['biasedFeatures']> {
    // 편향된 특성 식별 (Mock)
    const features = [
      { feature: 'video_length', biasScore: 0.15, impact: 'LOW' as const },
      { feature: 'content_type', biasScore: 0.25, impact: 'MEDIUM' as const },
      { feature: 'creation_time', biasScore: 0.05, impact: 'LOW' as const }
    ];

    return features.filter(f => f.biasScore > 0.1); // 10% 이상 편향성
  }

  // 사용량 메트릭 수집
  private async collectUsageMetrics(modelId: string): Promise<ModelUsageMetrics> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // 총 예측 수
    const totalPredictions = await prisma.auditLog.count({
      where: {
        action: 'AI_PREDICTION',
        metadata: {
          path: ['modelId'],
          equals: modelId
        } as any,
        createdAt: { gte: oneWeekAgo }
      }
    });

    // 고유 사용자 수
    const uniqueUsers = await prisma.auditLog.findMany({
      where: {
        action: 'AI_PREDICTION',
        metadata: {
          path: ['modelId'],
          equals: modelId
        } as any,
        createdAt: { gte: oneWeekAgo }
      },
      select: { userId: true },
      distinct: ['userId']
    });

    // 채널별 사용량
    const channel = await prisma.channel.findUnique({
      where: { id: modelId },
      select: { type: true }
    });

    const usageByChannel = [{
      channelType: channel?.type || 'unknown',
      predictions: totalPredictions,
      accuracy: await this.getCurrentAccuracy(modelId)
    }];

    return {
      totalPredictions,
      uniqueUsers: uniqueUsers.length,
      averagePredictionsPerUser: uniqueUsers.length > 0 ? totalPredictions / uniqueUsers.length : 0,
      peakUsageTime: '14:00-16:00', // Mock
      usageByChannel
    };
  }

  // 7-3-4. 재학습 트리거
  private async checkForAlerts() {
    for (const [modelId, metrics] of this.models) {
      const alerts: ModelAlert[] = [];

      // 정확도 감소 알림
      if (metrics.accuracy.accuracyTrend < -10) { // 10% 이상 감소
        alerts.push({
          type: 'ACCURACY_DEGRADATION',
          severity: 'WARNING',
          modelId,
          message: `Model accuracy decreased by ${Math.abs(metrics.accuracy.accuracyTrend).toFixed(1)}%`,
          value: metrics.accuracy.currentAccuracy,
          threshold: metrics.accuracy.baselineAccuracy * 0.9,
          timestamp: new Date()
        });
      }

      // 드리프트 감지 알림
      if (metrics.drift.dataDrift.isDetected) {
        alerts.push({
          type: 'DATA_DRIFT',
          severity: 'CRITICAL',
          modelId,
          message: `Data drift detected in features: ${metrics.drift.dataDrift.affectedFeatures.join(', ')}`,
          value: metrics.drift.dataDrift.score,
          threshold: metrics.drift.dataDrift.threshold,
          timestamp: new Date()
        });
      }

      // 성능 저하 알림
      if (metrics.performance.averageInferenceTime > 5000) { // 5초 이상
        alerts.push({
          type: 'PERFORMANCE_DEGRADATION',
          severity: 'WARNING',
          modelId,
          message: `Average inference time is ${metrics.performance.averageInferenceTime}ms`,
          value: metrics.performance.averageInferenceTime,
          threshold: 5000,
          timestamp: new Date()
        });
      }

      // 편향성 알림
      if (metrics.bias.overallBias > 0.2) { // 20% 이상 편향성
        alerts.push({
          type: 'BIAS_DETECTION',
          severity: 'CRITICAL',
          modelId,
          message: `High bias detected: ${(metrics.bias.overallBias * 100).toFixed(1)}%`,
          value: metrics.bias.overallBias,
          threshold: 0.2,
          timestamp: new Date()
        });
      }

      // 알림 처리
      for (const alert of alerts) {
        await this.processModelAlert(alert);
      }

      // 재학습 트리거 확인
      if (this.shouldTriggerRetraining(metrics)) {
        await this.triggerRetraining(modelId, metrics);
      }
    }
  }

  // 재학습 필요 여부 판단
  private shouldTriggerRetraining(metrics: AIModelMetrics): boolean {
    const conditions = [
      metrics.accuracy.accuracyTrend < -15, // 15% 이상 정확도 감소
      metrics.drift.dataDrift.isDetected && metrics.drift.dataDrift.score > 0.4,
      metrics.drift.conceptDrift.isDetected && Math.abs(metrics.drift.conceptDrift.performanceChange) > 0.15,
      metrics.bias.overallBias > 0.3 // 30% 이상 편향성
    ];

    return conditions.filter(Boolean).length >= 2; // 2개 이상 조건 만족 시
  }

  // 재학습 트리거
  private async triggerRetraining(modelId: string, metrics: AIModelMetrics) {
    logger.warn(`Triggering retraining for model ${modelId}`, {
      accuracy: metrics.accuracy.currentAccuracy,
      drift: metrics.drift,
      bias: metrics.bias.overallBias
    });

    // 재학습 작업 생성
    await prisma.auditLog.create({
      data: {
        action: 'MODEL_RETRAINING_TRIGGERED',
        entityType: 'AI_MODEL',
        entityId: modelId,
        metadata: {
          reason: 'automated_monitoring',
          metrics: {
            accuracy: metrics.accuracy.currentAccuracy,
            accuracyTrend: metrics.accuracy.accuracyTrend,
            dataDrift: metrics.drift.dataDrift.isDetected,
            conceptDrift: metrics.drift.conceptDrift.isDetected,
            bias: metrics.bias.overallBias
          }
        } as any
      }
    });

    // 실제 재학습 프로세스 시작 (별도 서비스에서 처리)
    // await this.modelTrainingService.startRetraining(modelId, metrics);
  }

  // 모델 알림 처리
  private async processModelAlert(alert: ModelAlert) {
    logger.warn(`Model Alert [${alert.severity}]: ${alert.message}`, alert);

    // 데이터베이스에 알림 저장
    await prisma.auditLog.create({
      data: {
        action: 'MODEL_ALERT',
        entityType: 'AI_MODEL',
        entityId: alert.modelId,
        metadata: alert as any
      }
    });

    // 중요한 알림은 즉시 통지
    if (alert.severity === 'CRITICAL') {
      await this.sendCriticalAlert(alert);
    }
  }

  // 중요 알림 발송
  private async sendCriticalAlert(alert: ModelAlert) {
    // 실제로는 이메일, Slack 등으로 알림
    logger.error(`CRITICAL MODEL ALERT: ${alert.message}`, alert);
  }

  // 공개 메서드들
  async getModelMetrics(modelId: string): Promise<AIModelMetrics | null> {
    return this.models.get(modelId) || null;
  }

  async getAllModelMetrics(): Promise<AIModelMetrics[]> {
    return Array.from(this.models.values());
  }

  async getModelHealth(modelId: string): Promise<ModelHealth> {
    const metrics = await this.getModelMetrics(modelId);
    if (!metrics) {
      return { status: 'UNKNOWN', score: 0, issues: ['Model not found'] };
    }

    let score = 100;
    const issues: string[] = [];

    // 정확도 점수
    if (metrics.accuracy.currentAccuracy < 0.7) {
      score -= 30;
      issues.push('Low accuracy');
    } else if (metrics.accuracy.currentAccuracy < 0.8) {
      score -= 15;
      issues.push('Below optimal accuracy');
    }

    // 드리프트 점수
    if (metrics.drift.dataDrift.isDetected) {
      score -= 25;
      issues.push('Data drift detected');
    }
    if (metrics.drift.conceptDrift.isDetected) {
      score -= 20;
      issues.push('Concept drift detected');
    }

    // 편향성 점수
    if (metrics.bias.overallBias > 0.2) {
      score -= 20;
      issues.push('High bias detected');
    }

    // 성능 점수
    if (metrics.performance.averageInferenceTime > 3000) {
      score -= 10;
      issues.push('Slow inference time');
    }

    let status: ModelHealth['status'];
    if (score >= 90) status = 'HEALTHY';
    else if (score >= 70) status = 'WARNING';
    else if (score >= 50) status = 'DEGRADED';
    else status = 'CRITICAL';

    return { status, score, issues };
  }

  // Helper 메서드들
  private async getRecentPredictions(modelId: string, limit: number): Promise<PredictionResult[]> {
    // Mock 구현
    return Array.from({ length: Math.min(limit, 100) }, () => ({
      predicted: Math.random() > 0.5,
      actual: Math.random() > 0.5,
      confidence: Math.random(),
      isCorrect: Math.random() > 0.2, // 80% 정확도
      timestamp: new Date()
    }));
  }

  private async getRecentInferences(modelId: string, limit: number): Promise<InferenceResult[]> {
    // Mock 구현
    return Array.from({ length: Math.min(limit, 50) }, () => ({
      duration: Math.random() * 2000 + 500, // 500-2500ms
      timestamp: new Date(Date.now() - Math.random() * 3600000) // 최근 1시간
    }));
  }

  private calculateConfidenceDistribution(predictions: PredictionResult[]): number[] {
    const buckets = new Array(10).fill(0);
    predictions.forEach(p => {
      const bucket = Math.floor(p.confidence * 10);
      if (bucket < 10) buckets[bucket]++;
    });
    return buckets;
  }

  private async getBaselineAccuracy(modelId: string): Promise<number> {
    // 모델 생성 시점의 정확도 (Mock)
    return 0.85; // 85%
  }

  private async getCurrentAccuracy(modelId: string): Promise<number> {
    const predictions = await this.getRecentPredictions(modelId, 100);
    const correct = predictions.filter(p => p.isCorrect).length;
    return predictions.length > 0 ? correct / predictions.length : 0;
  }

  private async getHistoricalAccuracy(modelId: string): Promise<number> {
    // 과거 정확도 (Mock)
    return 0.82; // 82%
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    logger.info('AI model monitoring stopped');
  }
}

// 인터페이스 정의
interface PredictionResult {
  predicted: boolean;
  actual: boolean;
  confidence: number;
  isCorrect: boolean;
  timestamp: Date;
}

interface InferenceResult {
  duration: number;
  timestamp: Date;
}

interface ModelAlert {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  modelId: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface ModelHealth {
  status: 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';
  score: number;
  issues: string[];
}

// 싱글톤 인스턴스
export const aiModelMonitoringService = new AIModelMonitoringService();

// 프로세스 종료 시 정리
process.on('SIGTERM', () => {
  aiModelMonitoringService.stopMonitoring();
});

process.on('SIGINT', () => {
  aiModelMonitoringService.stopMonitoring();
});