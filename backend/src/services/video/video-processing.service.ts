import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../../utils/logger';
import { cache } from '../../config/redis';

// 5-1-1. FFmpeg 통합
export interface FFmpegConfig {
  ffmpegPath?: string;
  ffprobePath?: string;
  tempDir: string;
  maxConcurrentJobs: number;
}

export interface VideoInfo {
  filename: string;
  duration: number;
  bitrate: number;
  format: string;
  videoCodec: string;
  audioCodec: string;
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  aspectRatio: string;
  fileSize: number;
}

class VideoProcessingService {
  private config: FFmpegConfig;
  private activeJobs: Map<string, any> = new Map();

  constructor(config: FFmpegConfig) {
    this.config = config;
    
    // FFmpeg 경로 설정
    if (config.ffmpegPath) {
      ffmpeg.setFfmpegPath(config.ffmpegPath);
    }
    if (config.ffprobePath) {
      ffmpeg.setFfprobePath(config.ffprobePath);
    }
  }

  // 비디오 정보 추출
  async getVideoInfo(inputPath: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          logger.error('Error probing video:', err);
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const info: VideoInfo = {
          filename: path.basename(inputPath),
          duration: metadata.format.duration || 0,
          bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : 0,
          format: metadata.format.format_name || 'unknown',
          videoCodec: videoStream.codec_name || 'unknown',
          audioCodec: audioStream?.codec_name || 'none',
          resolution: {
            width: videoStream.width || 0,
            height: videoStream.height || 0
          },
          frameRate: this.parseFrameRate(videoStream.avg_frame_rate || videoStream.r_frame_rate),
          aspectRatio: this.calculateAspectRatio(videoStream.width || 0, videoStream.height || 0),
          fileSize: metadata.format.size ? parseInt(metadata.format.size) : 0
        };

        resolve(info);
      });
    });
  }

  // 프레임률 파싱
  private parseFrameRate(frameRateStr?: string): number {
    if (!frameRateStr) return 0;
    
    const parts = frameRateStr.split('/');
    if (parts.length === 2) {
      const numerator = parseInt(parts[0]);
      const denominator = parseInt(parts[1]);
      return denominator > 0 ? numerator / denominator : 0;
    }
    
    return parseFloat(frameRateStr) || 0;
  }

  // 화면비 계산
  private calculateAspectRatio(width: number, height: number): string {
    if (width === 0 || height === 0) return '0:0';
    
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    
    return `${width / divisor}:${height / divisor}`;
  }

  // 5-1-2. 다중 코덱 지원
  async convertVideo(
    inputPath: string,
    outputPath: string,
    options: VideoConvertOptions
  ): Promise<void> {
    const jobId = `convert_${Date.now()}`;
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // 비디오 코덱 설정
      if (options.videoCodec) {
        command = command.videoCodec(options.videoCodec);
      }

      // 오디오 코덱 설정
      if (options.audioCodec) {
        command = command.audioCodec(options.audioCodec);
      }

      // 해상도 설정
      if (options.resolution) {
        command = command.size(`${options.resolution.width}x${options.resolution.height}`);
      }

      // 비트레이트 설정
      if (options.videoBitrate) {
        command = command.videoBitrate(options.videoBitrate);
      }
      if (options.audioBitrate) {
        command = command.audioBitrate(options.audioBitrate);
      }

      // 프레임레이트 설정
      if (options.frameRate) {
        command = command.fps(options.frameRate);
      }

      // 품질 설정
      if (options.quality) {
        command = command.addOption('-crf', options.quality.toString());
      }

      // 추가 옵션
      if (options.customOptions) {
        options.customOptions.forEach(option => {
          command = command.addOption(option.key, option.value);
        });
      }

      // 진행 상황 추적
      command
        .on('start', (commandLine) => {
          logger.info(`FFmpeg process started: ${commandLine}`);
          this.activeJobs.set(jobId, { command, startTime: Date.now() });
        })
        .on('progress', async (progress) => {
          // 진행 상황을 캐시에 저장
          await cache.set(`video_progress:${jobId}`, {
            percent: progress.percent || 0,
            currentTime: progress.timemark,
            targetSize: progress.targetSize
          }, 3600);
        })
        .on('end', () => {
          logger.info(`Video conversion completed: ${outputPath}`);
          this.activeJobs.delete(jobId);
          resolve();
        })
        .on('error', (err) => {
          logger.error(`Video conversion failed: ${err.message}`);
          this.activeJobs.delete(jobId);
          reject(err);
        })
        .save(outputPath);
    });
  }

  // 5-1-3. 해상도별 변환
  async createMultipleResolutions(
    inputPath: string,
    outputDir: string,
    resolutions: ResolutionPreset[]
  ): Promise<VideoOutput[]> {
    const outputs: VideoOutput[] = [];
    const inputInfo = await this.getVideoInfo(inputPath);
    const baseName = path.parse(inputPath).name;

    for (const preset of resolutions) {
      const outputPath = path.join(outputDir, `${baseName}_${preset.name}.${preset.format}`);
      
      try {
        await this.convertVideo(inputPath, outputPath, {
          videoCodec: preset.videoCodec,
          audioCodec: preset.audioCodec,
          resolution: preset.resolution,
          videoBitrate: preset.videoBitrate,
          audioBitrate: preset.audioBitrate,
          quality: preset.quality
        });

        const outputInfo = await this.getVideoInfo(outputPath);
        
        outputs.push({
          preset: preset.name,
          path: outputPath,
          info: outputInfo,
          size: outputInfo.fileSize
        });

        logger.info(`Created ${preset.name} version: ${outputPath}`);
      } catch (error) {
        logger.error(`Failed to create ${preset.name} version:`, error);
      }
    }

    return outputs;
  }

  // 5-1-4. 프레임 추출 시스템
  async extractFrames(
    inputPath: string,
    outputDir: string,
    options: FrameExtractionOptions
  ): Promise<string[]> {
    const framePaths: string[] = [];
    const baseName = path.parse(inputPath).name;

    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // 시작 시간 설정
      if (options.startTime) {
        command = command.seekInput(options.startTime);
      }

      // 지속 시간 설정
      if (options.duration) {
        command = command.duration(options.duration);
      }

      // 프레임 추출 간격 설정
      if (options.interval) {
        command = command.fps(1 / options.interval);
      } else if (options.count) {
        // 총 개수로 간격 계산
        const videoInfo = this.getVideoInfo(inputPath);
        videoInfo.then(info => {
          const interval = info.duration / options.count!;
          command = command.fps(1 / interval);
        });
      }

      // 출력 형식 설정
      const outputPattern = path.join(outputDir, `${baseName}_frame_%04d.${options.format || 'jpg'}`);

      command
        .on('start', () => {
          logger.info(`Frame extraction started: ${inputPath}`);
        })
        .on('end', async () => {
          // 생성된 프레임 파일 목록 수집
          try {
            const files = await fs.readdir(outputDir);
            const frameFiles = files
              .filter(file => file.startsWith(`${baseName}_frame_`))
              .map(file => path.join(outputDir, file))
              .sort();
            
            framePaths.push(...frameFiles);
            logger.info(`Extracted ${frameFiles.length} frames`);
            resolve(framePaths);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) => {
          logger.error(`Frame extraction failed: ${err.message}`);
          reject(err);
        })
        .save(outputPattern);
    });
  }

  // 5-1-5. 오디오 트랙 처리
  async processAudioTracks(
    inputPath: string,
    outputPath: string,
    options: AudioProcessingOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // 오디오 트랙 선택
      if (options.trackIndex !== undefined) {
        command = command.audioChannels(options.trackIndex);
      }

      // 볼륨 조정
      if (options.volume !== undefined) {
        command = command.audioFilters(`volume=${options.volume}`);
      }

      // 오디오 정규화
      if (options.normalize) {
        command = command.audioFilters('loudnorm');
      }

      // 노이즈 제거
      if (options.denoising) {
        command = command.audioFilters('afftdn');
      }

      // 오디오 코덱 및 품질 설정
      if (options.codec) {
        command = command.audioCodec(options.codec);
      }
      if (options.bitrate) {
        command = command.audioBitrate(options.bitrate);
      }
      if (options.sampleRate) {
        command = command.audioFrequency(options.sampleRate);
      }

      command
        .on('start', () => {
          logger.info(`Audio processing started: ${inputPath}`);
        })
        .on('end', () => {
          logger.info(`Audio processing completed: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          logger.error(`Audio processing failed: ${err.message}`);
          reject(err);
        })
        .save(outputPath);
    });
  }

  // 활성 작업 상태 조회
  async getJobStatus(jobId: string): Promise<any> {
    const progress = await cache.get(`video_progress:${jobId}`);
    const activeJob = this.activeJobs.get(jobId);
    
    return {
      isActive: !!activeJob,
      startTime: activeJob?.startTime,
      progress: progress || { percent: 0 }
    };
  }

  // 작업 취소
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (job && job.command) {
      job.command.kill('SIGKILL');
      this.activeJobs.delete(jobId);
      await cache.del(`video_progress:${jobId}`);
      logger.info(`Job ${jobId} cancelled`);
      return true;
    }
    return false;
  }

  // 임시 파일 정리
  async cleanup(olderThanHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.config.tempDir);
      const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.config.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoff) {
          await fs.unlink(filePath);
          logger.debug(`Cleaned up temp file: ${file}`);
        }
      }
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

// 인터페이스 정의
export interface VideoConvertOptions {
  videoCodec?: string;
  audioCodec?: string;
  resolution?: {
    width: number;
    height: number;
  };
  videoBitrate?: string;
  audioBitrate?: string;
  frameRate?: number;
  quality?: number; // CRF value for quality
  customOptions?: Array<{key: string, value: string}>;
}

export interface ResolutionPreset {
  name: string;
  resolution: {
    width: number;
    height: number;
  };
  videoBitrate: string;
  audioBitrate: string;
  videoCodec: string;
  audioCodec: string;
  format: string;
  quality?: number;
}

export interface VideoOutput {
  preset: string;
  path: string;
  info: VideoInfo;
  size: number;
}

export interface FrameExtractionOptions {
  startTime?: number; // seconds
  duration?: number; // seconds
  interval?: number; // seconds between frames
  count?: number; // total number of frames
  format?: 'jpg' | 'png' | 'bmp';
  quality?: number; // for JPEG
}

export interface AudioProcessingOptions {
  trackIndex?: number;
  volume?: number; // multiplier (1.0 = original)
  normalize?: boolean;
  denoising?: boolean;
  codec?: string;
  bitrate?: string;
  sampleRate?: number;
}

// 미리 정의된 해상도 프리셋
export const RESOLUTION_PRESETS: Record<string, ResolutionPreset> = {
  '4K': {
    name: '4K',
    resolution: { width: 3840, height: 2160 },
    videoBitrate: '15000k',
    audioBitrate: '320k',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    format: 'mp4',
    quality: 18
  },
  '1080p': {
    name: '1080p',
    resolution: { width: 1920, height: 1080 },
    videoBitrate: '8000k',
    audioBitrate: '192k',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    format: 'mp4',
    quality: 20
  },
  '720p': {
    name: '720p',
    resolution: { width: 1280, height: 720 },
    videoBitrate: '4000k',
    audioBitrate: '128k',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    format: 'mp4',
    quality: 22
  },
  '480p': {
    name: '480p',
    resolution: { width: 854, height: 480 },
    videoBitrate: '2000k',
    audioBitrate: '128k',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    format: 'mp4',
    quality: 24
  },
  'Instagram_Story': {
    name: 'Instagram_Story',
    resolution: { width: 1080, height: 1920 },
    videoBitrate: '6000k',
    audioBitrate: '128k',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    format: 'mp4',
    quality: 20
  },
  'TikTok': {
    name: 'TikTok',
    resolution: { width: 1080, height: 1920 },
    videoBitrate: '4000k',
    audioBitrate: '128k',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    format: 'mp4',
    quality: 22
  },
  'YouTube_Shorts': {
    name: 'YouTube_Shorts',
    resolution: { width: 1080, height: 1920 },
    videoBitrate: '5000k',
    audioBitrate: '192k',
    videoCodec: 'libx264',
    audioCodec: 'aac',
    format: 'mp4',
    quality: 20
  }
};

// 싱글톤 인스턴스 생성
const defaultConfig: FFmpegConfig = {
  tempDir: process.env.TEMP_DIR || './temp',
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '3')
};

export const videoProcessingService = new VideoProcessingService(defaultConfig);

// 편의 함수들
export async function getVideoInformation(filePath: string): Promise<VideoInfo> {
  return videoProcessingService.getVideoInfo(filePath);
}

export async function convertToPreset(
  inputPath: string, 
  outputPath: string, 
  presetName: keyof typeof RESOLUTION_PRESETS
): Promise<void> {
  const preset = RESOLUTION_PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  return videoProcessingService.convertVideo(inputPath, outputPath, {
    videoCodec: preset.videoCodec,
    audioCodec: preset.audioCodec,
    resolution: preset.resolution,
    videoBitrate: preset.videoBitrate,
    audioBitrate: preset.audioBitrate,
    quality: preset.quality
  });
}

export async function extractVideoFrames(
  inputPath: string,
  outputDir: string,
  count: number = 10
): Promise<string[]> {
  return videoProcessingService.extractFrames(inputPath, outputDir, {
    count,
    format: 'jpg'
  });
}