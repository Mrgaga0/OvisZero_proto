import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { RuleType } from '@prisma/client';
import { 
  CutPatterns, 
  TransitionAnalysis, 
  AudioPatterns, 
  NormalizedTimeline 
} from './data-preprocessing.service';

// 4-2-1. 특징 추출 (Feature Engineering)
export interface ExtractedFeatures {
  temporal: TemporalFeatures;
  visual: VisualFeatures;
  audio: AudioFeatures;
  contextual: ContextualFeatures;
}

export interface TemporalFeatures {
  cutFrequency: number; // 초당 컷 수
  rhythmComplexity: number; // 리듬 복잡도 (0-1)
  paceVariation: number; // 페이스 변화도
  transitionDensity: number; // 전환 밀도
  timeDistribution: number[]; // 시간대별 편집 밀도
}

export interface VisualFeatures {
  compositionRules: CompositionRule[];
  colorPalette: ColorAnalysis;
  motionIntensity: number;
  sceneComplexity: number;
}

export interface AudioFeatures {
  rhythmAlignment: number; // 리듬 정렬도
  dynamicRange: number;
  speechMusicBalance: number;
  audioSyncAccuracy: number;
}

export interface ContextualFeatures {
  contentType: string; // 'vlog', 'tutorial', 'music', etc.
  platformOptimization: PlatformFeatures;
  genreCharacteristics: GenreFeatures;
}

export interface CompositionRule {
  type: 'rule-of-thirds' | 'leading-lines' | 'symmetry' | 'depth';
  adherence: number; // 0-1
  frequency: number;
}

export interface ColorAnalysis {
  dominantColors: string[];
  colorTemperature: 'warm' | 'cool' | 'neutral';
  saturation: number;
  contrast: number;
}

export interface PlatformFeatures {
  aspectRatio: number;
  durationOptimal: boolean;
  engagementPatterns: EngagementPattern[];
}

export interface EngagementPattern {
  timestamp: number;
  intensity: number;
  type: 'hook' | 'climax' | 'transition' | 'ending';
}

export interface GenreFeatures {
  genre: string;
  characteristics: Record<string, number>;
  adherenceScore: number;
}

export function extractFeatures(
  timeline: NormalizedTimeline,
  cutPatterns: CutPatterns,
  transitions: TransitionAnalysis,
  audioPatterns: AudioPatterns
): ExtractedFeatures {
  const temporal = extractTemporalFeatures(timeline, cutPatterns);
  const visual = extractVisualFeatures(timeline);
  const audio = extractAudioFeatures(audioPatterns);
  const contextual = extractContextualFeatures(timeline, temporal);

  const features: ExtractedFeatures = {
    temporal,
    visual,
    audio,
    contextual
  };

  logger.debug('Features extracted:', {
    temporalComplexity: temporal.rhythmComplexity,
    visualComplexity: visual.sceneComplexity,
    audioQuality: audio.audioSyncAccuracy,
    contentType: contextual.contentType
  });

  return features;
}

function extractTemporalFeatures(
  timeline: NormalizedTimeline, 
  cutPatterns: CutPatterns
): TemporalFeatures {
  const totalCuts = timeline.cuts.length;
  const duration = timeline.totalDuration;
  
  return {
    cutFrequency: totalCuts / duration,
    rhythmComplexity: calculateRhythmComplexity(cutPatterns),
    paceVariation: cutPatterns.rhythm.variance / cutPatterns.rhythm.averageInterval,
    transitionDensity: cutPatterns.transitions.usageRate,
    timeDistribution: calculateTimeDistribution(timeline.cuts, duration)
  };
}

function calculateRhythmComplexity(patterns: CutPatterns): number {
  let complexity = 0;
  
  // 리듬 타입별 복잡도
  switch (patterns.rhythm.type) {
    case 'steady': complexity += 0.2; break;
    case 'accelerating': complexity += 0.6; break;
    case 'decelerating': complexity += 0.6; break;
    case 'dynamic': complexity += 1.0; break;
  }
  
  // 분산 기반 복잡도 추가
  complexity += Math.min(patterns.rhythm.variance / 10, 0.5);
  
  // 전환 사용률 고려
  complexity += patterns.transitions.usageRate * 0.3;
  
  return Math.min(complexity, 1.0);
}

function calculateTimeDistribution(cuts: any[], duration: number): number[] {
  const bins = Array(10).fill(0);
  const binSize = duration / 10;
  
  cuts.forEach(cut => {
    const binIndex = Math.floor(cut.timestamp / binSize);
    if (binIndex < bins.length) {
      bins[binIndex]++;
    }
  });
  
  // 정규화
  const maxCuts = Math.max(...bins);
  return bins.map(count => maxCuts > 0 ? count / maxCuts : 0);
}

function extractVisualFeatures(timeline: NormalizedTimeline): VisualFeatures {
  // Mock 구현 - 실제로는 컴퓨터 비전 분석 필요
  return {
    compositionRules: [
      { type: 'rule-of-thirds', adherence: 0.7, frequency: 0.8 },
      { type: 'leading-lines', adherence: 0.5, frequency: 0.3 },
    ],
    colorPalette: {
      dominantColors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
      colorTemperature: 'warm',
      saturation: 0.7,
      contrast: 0.8
    },
    motionIntensity: 0.6,
    sceneComplexity: calculateSceneComplexity(timeline)
  };
}

function calculateSceneComplexity(timeline: NormalizedTimeline): number {
  let complexity = 0;
  
  // 클립 수 기반 복잡도
  complexity += Math.min(timeline.clips.length / 50, 0.4);
  
  // 이펙트 수 기반 복잡도
  complexity += Math.min(timeline.effects.length / 20, 0.3);
  
  // 레이어 복잡도
  const maxLayer = Math.max(...timeline.clips.map(c => c.layer));
  complexity += Math.min(maxLayer / 5, 0.3);
  
  return Math.min(complexity, 1.0);
}

function extractAudioFeatures(audioPatterns: AudioPatterns): AudioFeatures {
  return {
    rhythmAlignment: audioPatterns.musicSync.syncPoints.length > 0 ? 0.8 : 0.3,
    dynamicRange: Math.min(audioPatterns.dynamicRange.range / 30, 1.0),
    speechMusicBalance: audioPatterns.musicSync.speechMusicRatio,
    audioSyncAccuracy: audioPatterns.levelConsistency.consistencyScore
  };
}

function extractContextualFeatures(
  timeline: NormalizedTimeline,
  temporal: TemporalFeatures
): ContextualFeatures {
  const contentType = detectContentType(timeline, temporal);
  
  return {
    contentType,
    platformOptimization: {
      aspectRatio: 16/9, // timeline에서 추출해야 함
      durationOptimal: timeline.totalDuration > 30 && timeline.totalDuration < 600,
      engagementPatterns: detectEngagementPatterns(timeline)
    },
    genreCharacteristics: {
      genre: contentType,
      characteristics: getGenreCharacteristics(contentType),
      adherenceScore: 0.7
    }
  };
}

function detectContentType(timeline: NormalizedTimeline, temporal: TemporalFeatures): string {
  // 간단한 콘텐츠 타입 감지 로직
  if (temporal.cutFrequency > 1.0) {
    return 'music-video';
  } else if (temporal.cutFrequency < 0.1) {
    return 'tutorial';
  } else if (timeline.totalDuration < 60) {
    return 'social-media';
  } else {
    return 'vlog';
  }
}

function detectEngagementPatterns(timeline: NormalizedTimeline): EngagementPattern[] {
  const patterns: EngagementPattern[] = [];
  const duration = timeline.totalDuration;
  
  // 시작 부분 후킹 패턴
  if (timeline.cuts.length > 0 && timeline.cuts[0].timestamp < 5) {
    patterns.push({
      timestamp: 0,
      intensity: 0.9,
      type: 'hook'
    });
  }
  
  // 중간 클라이맥스 감지
  const midPoint = duration / 2;
  const midCuts = timeline.cuts.filter(c => 
    Math.abs(c.timestamp - midPoint) < duration * 0.1
  );
  
  if (midCuts.length > 3) {
    patterns.push({
      timestamp: midPoint,
      intensity: 0.8,
      type: 'climax'
    });
  }
  
  // 엔딩 패턴
  patterns.push({
    timestamp: duration * 0.9,
    intensity: 0.7,
    type: 'ending'
  });
  
  return patterns;
}

function getGenreCharacteristics(genre: string): Record<string, number> {
  const characteristics: Record<string, Record<string, number>> = {
    'vlog': {
      personalIntimacy: 0.8,
      casualPacing: 0.7,
      directAddress: 0.9
    },
    'tutorial': {
      structuredFlow: 0.9,
      clearTransitions: 0.8,
      repetition: 0.6
    },
    'music-video': {
      rhythmSync: 0.9,
      visualImpact: 0.8,
      creativeCuts: 0.9
    },
    'social-media': {
      quickPacing: 0.9,
      'attention-grabbing': 0.8,
      viralElements: 0.7
    }
  };
  
  return characteristics[genre] || {};
}

// 4-2-2. 모델 아키텍처 설계
export interface ModelArchitecture {
  type: 'neural-network' | 'decision-tree' | 'ensemble';
  layers: LayerConfig[];
  hyperparameters: Hyperparameters;
  training: TrainingConfig;
}

export interface LayerConfig {
  type: 'input' | 'hidden' | 'output';
  size: number;
  activation?: string;
  dropout?: number;
}

export interface Hyperparameters {
  learningRate: number;
  batchSize: number;
  epochs: number;
  regularization: number;
  momentum?: number;
}

export interface TrainingConfig {
  optimizer: string;
  lossFunction: string;
  metrics: string[];
  validationSplit: number;
  earlyStopping: boolean;
}

export function designModelArchitecture(
  features: ExtractedFeatures,
  channelType: string
): ModelArchitecture {
  const inputSize = calculateInputSize(features);
  
  // 채널 타입별 아키텍처 선택
  const architecture: ModelArchitecture = {
    type: 'neural-network',
    layers: [
      { type: 'input', size: inputSize },
      { type: 'hidden', size: Math.floor(inputSize * 0.7), activation: 'relu', dropout: 0.3 },
      { type: 'hidden', size: Math.floor(inputSize * 0.5), activation: 'relu', dropout: 0.2 },
      { type: 'output', size: getOutputSize(channelType), activation: 'softmax' }
    ],
    hyperparameters: getOptimalHyperparameters(channelType),
    training: {
      optimizer: 'adam',
      lossFunction: 'categorical_crossentropy',
      metrics: ['accuracy', 'precision', 'recall'],
      validationSplit: 0.2,
      earlyStopping: true
    }
  };
  
  logger.debug('Model architecture designed:', {
    type: architecture.type,
    layers: architecture.layers.length,
    inputSize,
    outputSize: architecture.layers[architecture.layers.length - 1].size
  });
  
  return architecture;
}

function calculateInputSize(features: ExtractedFeatures): number {
  let size = 0;
  
  // Temporal features
  size += 5; // cutFrequency, rhythmComplexity, paceVariation, transitionDensity + one more
  size += features.temporal.timeDistribution.length;
  
  // Visual features
  size += 4; // motionIntensity, sceneComplexity + composition rules
  size += 3; // color analysis
  
  // Audio features
  size += 4; // all audio features
  
  // Contextual features
  size += 3; // platform optimization
  size += Object.keys(features.contextual.genreCharacteristics.characteristics).length;
  
  return size;
}

function getOutputSize(channelType: string): number {
  // 채널 타입별 출력 클래스 수
  const outputSizes: Record<string, number> = {
    'YOUTUBE': 8, // 다양한 편집 스타일
    'INSTAGRAM': 5, // 제한적 포맷
    'TIKTOK': 6, // 트렌드 기반
    'PODCAST': 3, // 단순한 편집
    'CUSTOM': 10 // 모든 가능성
  };
  
  return outputSizes[channelType] || 8;
}

function getOptimalHyperparameters(channelType: string): Hyperparameters {
  const baseParams: Hyperparameters = {
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100,
    regularization: 0.01
  };
  
  // 채널 타입별 조정
  switch (channelType) {
    case 'TIKTOK':
      baseParams.learningRate = 0.002; // 빠른 학습
      baseParams.epochs = 50;
      break;
    case 'YOUTUBE':
      baseParams.batchSize = 64; // 더 큰 배치
      baseParams.epochs = 150;
      break;
    case 'PODCAST':
      baseParams.learningRate = 0.0005; // 안정적 학습
      break;
  }
  
  return baseParams;
}

// 4-2-3. 하이퍼파라미터 최적화
export interface OptimizationResult {
  bestParams: Hyperparameters;
  bestScore: number;
  iterations: number;
  convergenceHistory: number[];
}

export async function optimizeHyperparameters(
  architecture: ModelArchitecture,
  trainingData: any[],
  channelId: string
): Promise<OptimizationResult> {
  logger.info(`Starting hyperparameter optimization for channel ${channelId}`);
  
  const paramSpace = generateParameterSpace(architecture.hyperparameters);
  let bestScore = 0;
  let bestParams = architecture.hyperparameters;
  const convergenceHistory: number[] = [];
  
  // Grid Search (간단한 구현)
  let iterations = 0;
  for (const params of paramSpace) {
    iterations++;
    
    // 모델 훈련 시뮬레이션
    const score = await simulateTraining(params, trainingData);
    convergenceHistory.push(score);
    
    if (score > bestScore) {
      bestScore = score;
      bestParams = params;
    }
    
    // 조기 종료 조건
    if (iterations > 20 && score < bestScore * 0.9) {
      break;
    }
  }
  
  logger.info(`Hyperparameter optimization completed: ${bestScore.toFixed(3)} score in ${iterations} iterations`);
  
  return {
    bestParams,
    bestScore,
    iterations,
    convergenceHistory
  };
}

function generateParameterSpace(baseParams: Hyperparameters): Hyperparameters[] {
  const learningRates = [0.0001, 0.001, 0.01];
  const batchSizes = [16, 32, 64];
  const regularizations = [0.001, 0.01, 0.1];
  
  const paramSpace: Hyperparameters[] = [];
  
  learningRates.forEach(lr => {
    batchSizes.forEach(batch => {
      regularizations.forEach(reg => {
        paramSpace.push({
          ...baseParams,
          learningRate: lr,
          batchSize: batch,
          regularization: reg
        });
      });
    });
  });
  
  return paramSpace.slice(0, 27); // 최대 27개 조합
}

async function simulateTraining(params: Hyperparameters, trainingData: any[]): Promise<number> {
  // 실제 훈련 시뮬레이션 (Mock)
  await new Promise(resolve => setTimeout(resolve, 100)); // 훈련 시간 시뮬레이션
  
  // 파라미터 기반 점수 계산
  let score = 0.5;
  
  // 학습률이 너무 높거나 낮으면 점수 감소
  if (params.learningRate > 0.01 || params.learningRate < 0.0001) {
    score -= 0.2;
  }
  
  // 적절한 배치 크기 보상
  if (params.batchSize >= 32 && params.batchSize <= 64) {
    score += 0.1;
  }
  
  // 정규화 효과
  if (params.regularization > 0.001 && params.regularization < 0.1) {
    score += 0.1;
  }
  
  // 랜덤 노이즈 추가
  score += (Math.random() - 0.5) * 0.3;
  
  return Math.max(0, Math.min(1, score));
}

// 4-2-4. 모델 검증 프로세스
export interface ValidationResult {
  crossValidationScore: number;
  confusionMatrix: number[][];
  metrics: ValidationMetrics;
  overfittingCheck: OverfittingAnalysis;
}

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
}

export interface OverfittingAnalysis {
  isOverfitted: boolean;
  trainingAccuracy: number;
  validationAccuracy: number;
  gap: number;
  recommendation: string;
}

export async function validateModel(
  architecture: ModelArchitecture,
  params: Hyperparameters,
  trainingData: any[],
  channelId: string
): Promise<ValidationResult> {
  logger.info(`Starting model validation for channel ${channelId}`);
  
  // K-Fold Cross Validation (k=5)
  const k = 5;
  const foldSize = Math.floor(trainingData.length / k);
  const cvScores: number[] = [];
  
  for (let i = 0; i < k; i++) {
    const validationStart = i * foldSize;
    const validationEnd = validationStart + foldSize;
    
    const validationSet = trainingData.slice(validationStart, validationEnd);
    const trainingSet = [
      ...trainingData.slice(0, validationStart),
      ...trainingData.slice(validationEnd)
    ];
    
    const score = await simulateTraining(params, trainingSet);
    cvScores.push(score);
  }
  
  const crossValidationScore = cvScores.reduce((a, b) => a + b, 0) / cvScores.length;
  
  // 혼동 행렬 생성 (Mock)
  const outputSize = getOutputSize('CUSTOM');
  const confusionMatrix = generateMockConfusionMatrix(outputSize);
  
  // 메트릭 계산
  const metrics = calculateMetrics(confusionMatrix);
  
  // 오버피팅 검사
  const overfittingCheck = checkOverfitting(crossValidationScore);
  
  const result: ValidationResult = {
    crossValidationScore,
    confusionMatrix,
    metrics,
    overfittingCheck
  };
  
  logger.info(`Model validation completed: CV Score ${crossValidationScore.toFixed(3)}`);
  
  return result;
}

function generateMockConfusionMatrix(size: number): number[][] {
  const matrix: number[][] = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // 대각선 우세한 행렬 생성 (좋은 분류기)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i === j) {
        matrix[i][j] = Math.floor(Math.random() * 50) + 50; // 50-100
      } else {
        matrix[i][j] = Math.floor(Math.random() * 20); // 0-20
      }
    }
  }
  
  return matrix;
}

function calculateMetrics(confusionMatrix: number[][]): ValidationMetrics {
  const size = confusionMatrix.length;
  let totalCorrect = 0;
  let totalSamples = 0;
  
  // 정확도 계산
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i === j) totalCorrect += confusionMatrix[i][j];
      totalSamples += confusionMatrix[i][j];
    }
  }
  
  const accuracy = totalCorrect / totalSamples;
  
  // 정밀도, 재현율 계산 (매크로 평균)
  let totalPrecision = 0;
  let totalRecall = 0;
  
  for (let i = 0; i < size; i++) {
    let tp = confusionMatrix[i][i];
    let fp = 0;
    let fn = 0;
    
    for (let j = 0; j < size; j++) {
      if (j !== i) {
        fp += confusionMatrix[j][i];
        fn += confusionMatrix[i][j];
      }
    }
    
    const precision = tp / (tp + fp);
    const recall = tp / (tp + fn);
    
    totalPrecision += precision;
    totalRecall += recall;
  }
  
  const avgPrecision = totalPrecision / size;
  const avgRecall = totalRecall / size;
  const f1Score = 2 * (avgPrecision * avgRecall) / (avgPrecision + avgRecall);
  
  return {
    accuracy,
    precision: avgPrecision,
    recall: avgRecall,
    f1Score,
    auc: accuracy * 0.9 // 간단한 추정
  };
}

function checkOverfitting(cvScore: number): OverfittingAnalysis {
  // Mock 오버피팅 분석
  const trainingAccuracy = Math.min(cvScore + 0.1 + Math.random() * 0.1, 1.0);
  const validationAccuracy = cvScore;
  const gap = trainingAccuracy - validationAccuracy;
  
  const isOverfitted = gap > 0.1;
  
  let recommendation = 'Model appears to be well-balanced.';
  if (isOverfitted) {
    recommendation = 'Model shows signs of overfitting. Consider increasing regularization or reducing model complexity.';
  } else if (gap < 0.02) {
    recommendation = 'Model might be underfitting. Consider increasing model complexity or reducing regularization.';
  }
  
  return {
    isOverfitted,
    trainingAccuracy,
    validationAccuracy,
    gap,
    recommendation
  };
}

// 4-2-5. 모델 버전 관리
export interface ModelVersion {
  id: string;
  channelId: string;
  version: string;
  architecture: ModelArchitecture;
  hyperparameters: Hyperparameters;
  metrics: ValidationMetrics;
  trainingDate: Date;
  isActive: boolean;
  modelData?: Buffer; // 실제 모델 가중치
}

export async function saveModelVersion(
  channelId: string,
  architecture: ModelArchitecture,
  params: Hyperparameters,
  metrics: ValidationMetrics
): Promise<ModelVersion> {
  // 기존 버전 확인
  const existingVersions = await prisma.editingRule.count({
    where: { channelId }
  });
  
  const version = `v${existingVersions + 1}.0`;
  
  // 모델 메타데이터를 EditingRule로 저장
  const modelRule = await prisma.editingRule.create({
    data: {
      channelId,
      ruleType: 'PACE_RHYTHM', // 모델 저장용 타입
      parameters: {
        version,
        architecture: architecture as any,
        hyperparameters: params,
        metrics: metrics
      } as any,
      confidence: metrics.accuracy,
      usageCount: 0
    }
  });
  
  const modelVersion: ModelVersion = {
    id: modelRule.id,
    channelId,
    version,
    architecture,
    hyperparameters: params,
    metrics,
    trainingDate: modelRule.createdAt,
    isActive: true
  };
  
  logger.info(`Model version ${version} saved for channel ${channelId}`);
  
  return modelVersion;
}

export async function getModelVersions(channelId: string): Promise<ModelVersion[]> {
  const rules = await prisma.editingRule.findMany({
    where: {
      channelId,
      ruleType: 'PACE_RHYTHM'
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return rules.map(rule => ({
    id: rule.id,
    channelId: rule.channelId,
    version: (rule.parameters as any).version || 'v1.0',
    architecture: (rule.parameters as any).architecture,
    hyperparameters: (rule.parameters as any).hyperparameters,
    metrics: (rule.parameters as any).metrics,
    trainingDate: rule.createdAt,
    isActive: rule.confidence > 0.7
  }));
}

export async function activateModelVersion(
  channelId: string, 
  versionId: string
): Promise<void> {
  // 모든 버전 비활성화
  await prisma.editingRule.updateMany({
    where: {
      channelId,
      ruleType: 'PACE_RHYTHM'
    },
    data: { usageCount: 0 }
  });
  
  // 선택된 버전 활성화
  await prisma.editingRule.update({
    where: { id: versionId },
    data: { usageCount: 1 }
  });
  
  logger.info(`Model version ${versionId} activated for channel ${channelId}`);
}