import { SequenceAnalysis } from '../../types';
import { logger } from '../../utils/logger';

// 4-1-1. 비디오 메타데이터 추출
export interface VideoMetadata {
  duration: number;
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
  aspectRatio: number;
  bitrate?: number;
  codec?: string;
  colorSpace?: string;
  audioChannels?: number;
  audioSampleRate?: number;
}

export function extractVideoMetadata(sequenceData: SequenceAnalysis): VideoMetadata {
  const metadata: VideoMetadata = {
    duration: sequenceData.duration,
    frameRate: sequenceData.frameRate,
    resolution: sequenceData.resolution,
    aspectRatio: sequenceData.resolution.width / sequenceData.resolution.height,
    audioChannels: sequenceData.audioTracks
  };

  // 해상도 기반 포맷 분류
  const { width, height } = sequenceData.resolution;
  if (width === 1920 && height === 1080) {
    metadata.codec = 'H.264';
    metadata.bitrate = 8000; // 추정값
  } else if (width === 1080 && height === 1920) {
    metadata.codec = 'H.264';
    metadata.bitrate = 6000; // 세로형 비디오
  }

  logger.debug('Video metadata extracted:', metadata);
  return metadata;
}

// 4-1-2. 타임라인 데이터 정규화
export interface NormalizedTimeline {
  totalDuration: number;
  clips: NormalizedClip[];
  cuts: NormalizedCut[];
  effects: NormalizedEffect[];
  audioLevels: AudioLevel[];
}

export interface NormalizedClip {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'video' | 'audio' | 'graphic';
  layer: number;
  sourceFile?: string;
  trimIn?: number;
  trimOut?: number;
}

export interface NormalizedCut {
  timestamp: number;
  type: 'cut' | 'transition';
  transitionType?: string;
  duration?: number;
  confidence: number;
}

export interface NormalizedEffect {
  id: string;
  type: string;
  startTime: number;
  endTime: number;
  intensity: number;
  parameters: Record<string, any>;
}

export interface AudioLevel {
  timestamp: number;
  level: number; // dB
  channel: number;
}

export function normalizeTimelineData(sequenceData: SequenceAnalysis): NormalizedTimeline {
  const normalized: NormalizedTimeline = {
    totalDuration: sequenceData.duration,
    clips: [],
    cuts: [],
    effects: [],
    audioLevels: []
  };

  // 클립 정규화
  normalized.clips = sequenceData.clips.map((clip, index) => ({
    id: clip.id || `clip-${index}`,
    startTime: clip.startTime,
    endTime: clip.endTime,
    duration: clip.endTime - clip.startTime,
    type: clip.type,
    layer: index, // 간단한 레이어 할당
    sourceFile: clip.name
  }));

  // 컷 정규화 및 신뢰도 계산
  normalized.cuts = sequenceData.cuts.map(cut => ({
    timestamp: cut.timestamp,
    type: cut.type,
    transitionType: cut.transitionType,
    duration: cut.transitionType ? 1.0 : 0, // 전환 효과 기본 1초
    confidence: calculateCutConfidence(cut, sequenceData)
  }));

  // 이펙트 정규화
  normalized.effects = sequenceData.effects.map((effect, index) => ({
    id: `effect-${index}`,
    type: effect.type,
    startTime: effect.startTime,
    endTime: effect.endTime,
    intensity: extractIntensity(effect.parameters),
    parameters: effect.parameters
  }));

  // 오디오 레벨 생성 (샘플링)
  normalized.audioLevels = generateAudioLevels(sequenceData.duration);

  logger.debug('Timeline data normalized:', {
    clips: normalized.clips.length,
    cuts: normalized.cuts.length,
    effects: normalized.effects.length
  });

  return normalized;
}

// 컷 신뢰도 계산
function calculateCutConfidence(cut: any, sequence: SequenceAnalysis): number {
  let confidence = 0.5; // 기본값

  // 전환 효과가 있으면 신뢰도 증가
  if (cut.transitionType) {
    confidence += 0.2;
  }

  // 클립 경계와 일치하면 신뢰도 증가
  const nearClipBoundary = sequence.clips.some(clip => 
    Math.abs(clip.startTime - cut.timestamp) < 0.1 ||
    Math.abs(clip.endTime - cut.timestamp) < 0.1
  );
  
  if (nearClipBoundary) {
    confidence += 0.3;
  }

  return Math.min(confidence, 1.0);
}

// 이펙트 강도 추출
function extractIntensity(parameters: Record<string, any>): number {
  // 파라미터에서 강도 추출 (0-1 범위)
  if (parameters.opacity !== undefined) {
    return parameters.opacity / 100;
  }
  if (parameters.scale !== undefined) {
    return Math.abs(parameters.scale - 100) / 100;
  }
  return 0.5; // 기본값
}

// 오디오 레벨 생성 (Mock 데이터)
function generateAudioLevels(duration: number): AudioLevel[] {
  const levels: AudioLevel[] = [];
  const sampleRate = 10; // 0.1초마다 샘플링
  
  for (let t = 0; t < duration; t += 1 / sampleRate) {
    levels.push({
      timestamp: t,
      level: -20 + Math.random() * 15, // -20dB ~ -5dB 범위
      channel: 0
    });
  }
  
  return levels;
}

// 4-1-3. 컷 패턴 추출 알고리즘
export interface CutPatterns {
  rhythm: RhythmPattern;
  distribution: CutDistribution;
  transitions: TransitionPattern;
  beatSynchronization: BeatSync;
}

export interface RhythmPattern {
  type: 'steady' | 'accelerating' | 'decelerating' | 'dynamic';
  averageInterval: number;
  variance: number;
  peaks: number[]; // 컷이 집중된 시간대
}

export interface CutDistribution {
  shortCuts: number; // < 2초
  mediumCuts: number; // 2-10초
  longCuts: number; // > 10초
  averageLength: number;
}

export interface TransitionPattern {
  usageRate: number;
  preferredTypes: string[];
  averageDuration: number;
}

export interface BeatSync {
  isDetected: boolean;
  bpm?: number;
  synchronizationRate?: number;
}

export function extractCutPatterns(timeline: NormalizedTimeline): CutPatterns {
  const cuts = timeline.cuts;
  const clips = timeline.clips;

  // 리듬 패턴 분석
  const intervals = [];
  for (let i = 1; i < cuts.length; i++) {
    intervals.push(cuts[i].timestamp - cuts[i-1].timestamp);
  }

  const avgInterval = intervals.length > 0 
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length 
    : 0;
  
  const variance = intervals.length > 0
    ? intervals.map(i => Math.pow(i - avgInterval, 2)).reduce((a, b) => a + b, 0) / intervals.length
    : 0;

  // 리듬 타입 결정
  let rhythmType: RhythmPattern['type'] = 'steady';
  if (variance > avgInterval * 0.5) {
    rhythmType = 'dynamic';
  } else if (isAccelerating(intervals)) {
    rhythmType = 'accelerating';
  } else if (isDecelerating(intervals)) {
    rhythmType = 'decelerating';
  }

  // 컷 분포 분석
  const clipDurations = clips.map(c => c.duration);
  const distribution: CutDistribution = {
    shortCuts: clipDurations.filter(d => d < 2).length,
    mediumCuts: clipDurations.filter(d => d >= 2 && d <= 10).length,
    longCuts: clipDurations.filter(d => d > 10).length,
    averageLength: clipDurations.reduce((a, b) => a + b, 0) / clipDurations.length
  };

  // 전환 패턴 분석
  const transitions = cuts.filter(c => c.type === 'transition');
  const transitionTypes = transitions.reduce((acc, t) => {
    acc[t.transitionType || 'unknown'] = (acc[t.transitionType || 'unknown'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const transitionPattern: TransitionPattern = {
    usageRate: transitions.length / cuts.length,
    preferredTypes: Object.keys(transitionTypes).sort((a, b) => transitionTypes[b] - transitionTypes[a]),
    averageDuration: transitions.reduce((sum, t) => sum + (t.duration || 0), 0) / transitions.length
  };

  // 비트 동기화 감지 (간단한 구현)
  const beatSync: BeatSync = {
    isDetected: false
  };

  if (intervals.length > 5) {
    const potentialBpm = 60 / avgInterval;
    if (potentialBpm > 60 && potentialBpm < 180) {
      beatSync.isDetected = true;
      beatSync.bpm = potentialBpm;
      beatSync.synchronizationRate = calculateBeatSyncRate(intervals, potentialBpm);
    }
  }

  const patterns: CutPatterns = {
    rhythm: {
      type: rhythmType,
      averageInterval: avgInterval,
      variance,
      peaks: findCutPeaks(cuts, timeline.totalDuration)
    },
    distribution,
    transitions: transitionPattern,
    beatSynchronization: beatSync
  };

  logger.debug('Cut patterns extracted:', patterns);
  return patterns;
}

// 가속/감속 패턴 감지
function isAccelerating(intervals: number[]): boolean {
  if (intervals.length < 3) return false;
  
  let decreasingCount = 0;
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i] < intervals[i-1]) {
      decreasingCount++;
    }
  }
  
  return decreasingCount / (intervals.length - 1) > 0.6;
}

function isDecelerating(intervals: number[]): boolean {
  if (intervals.length < 3) return false;
  
  let increasingCount = 0;
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i] > intervals[i-1]) {
      increasingCount++;
    }
  }
  
  return increasingCount / (intervals.length - 1) > 0.6;
}

// 컷 집중 구간 찾기
function findCutPeaks(cuts: NormalizedCut[], totalDuration: number): number[] {
  const windowSize = totalDuration / 10; // 10개 구간으로 나누기
  const bins = Array(10).fill(0);
  
  cuts.forEach(cut => {
    const binIndex = Math.floor(cut.timestamp / windowSize);
    if (binIndex < bins.length) {
      bins[binIndex]++;
    }
  });
  
  const peaks: number[] = [];
  const avgCuts = bins.reduce((a, b) => a + b, 0) / bins.length;
  
  bins.forEach((count, index) => {
    if (count > avgCuts * 1.5) {
      peaks.push(index * windowSize + windowSize / 2);
    }
  });
  
  return peaks;
}

// 비트 동기화율 계산
function calculateBeatSyncRate(intervals: number[], bpm: number): number {
  const beatInterval = 60 / bpm;
  let syncCount = 0;
  
  intervals.forEach(interval => {
    const beatRatio = interval / beatInterval;
    const nearestBeat = Math.round(beatRatio);
    if (Math.abs(beatRatio - nearestBeat) < 0.1) {
      syncCount++;
    }
  });
  
  return syncCount / intervals.length;
}

// 4-1-4. 전환 효과 분석
export interface TransitionAnalysis {
  types: TransitionTypeStats[];
  timingPatterns: TransitionTiming;
  contextualUsage: ContextualTransition[];
}

export interface TransitionTypeStats {
  type: string;
  count: number;
  percentage: number;
  averageDuration: number;
  contexts: string[]; // 어떤 상황에서 사용되는지
}

export interface TransitionTiming {
  preferredPositions: number[]; // 비디오 내 선호 위치 (0-1)
  sceneChangeAlignment: number; // 장면 전환과의 일치도
  musicSyncRate: number; // 음악과의 동기화율
}

export interface ContextualTransition {
  fromType: string; // 이전 클립 타입
  toType: string; // 다음 클립 타입
  preferredTransition: string;
  confidence: number;
}

export function analyzeTransitions(timeline: NormalizedTimeline): TransitionAnalysis {
  const transitions = timeline.cuts.filter(c => c.type === 'transition');
  const clips = timeline.clips;
  
  // 전환 타입 통계
  const typeStats = new Map<string, {count: number, durations: number[], contexts: Set<string>}>();
  
  transitions.forEach(transition => {
    const type = transition.transitionType || 'unknown';
    if (!typeStats.has(type)) {
      typeStats.set(type, {count: 0, durations: [], contexts: new Set()});
    }
    
    const stats = typeStats.get(type)!;
    stats.count++;
    stats.durations.push(transition.duration || 0);
    
    // 컨텍스트 분석
    const context = getTransitionContext(transition, clips);
    stats.contexts.add(context);
  });
  
  const types: TransitionTypeStats[] = Array.from(typeStats.entries()).map(([type, stats]) => ({
    type,
    count: stats.count,
    percentage: (stats.count / transitions.length) * 100,
    averageDuration: stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length,
    contexts: Array.from(stats.contexts)
  }));
  
  // 타이밍 패턴 분석
  const timingPatterns: TransitionTiming = {
    preferredPositions: transitions.map(t => t.timestamp / timeline.totalDuration),
    sceneChangeAlignment: calculateSceneAlignment(transitions, clips),
    musicSyncRate: 0.7 // Mock 값
  };
  
  // 컨텍스트별 전환 선호도
  const contextualUsage = analyzeContextualTransitions(transitions, clips);
  
  return {
    types,
    timingPatterns,
    contextualUsage
  };
}

function getTransitionContext(transition: NormalizedCut, clips: NormalizedClip[]): string {
  // 전환이 발생하는 컨텍스트 분석
  const beforeClip = clips.find(c => c.endTime <= transition.timestamp);
  const afterClip = clips.find(c => c.startTime >= transition.timestamp);
  
  if (beforeClip && afterClip) {
    return `${beforeClip.type}-to-${afterClip.type}`;
  }
  return 'unknown';
}

function calculateSceneAlignment(transitions: NormalizedCut[], clips: NormalizedClip[]): number {
  let alignedCount = 0;
  
  transitions.forEach(transition => {
    const isAligned = clips.some(clip => 
      Math.abs(clip.startTime - transition.timestamp) < 0.5 ||
      Math.abs(clip.endTime - transition.timestamp) < 0.5
    );
    
    if (isAligned) alignedCount++;
  });
  
  return alignedCount / transitions.length;
}

function analyzeContextualTransitions(
  transitions: NormalizedCut[], 
  clips: NormalizedClip[]
): ContextualTransition[] {
  const contexts = new Map<string, Map<string, number>>();
  
  transitions.forEach(transition => {
    const beforeClip = clips.find(c => c.endTime <= transition.timestamp);
    const afterClip = clips.find(c => c.startTime >= transition.timestamp);
    
    if (beforeClip && afterClip) {
      const contextKey = `${beforeClip.type}-${afterClip.type}`;
      const transitionType = transition.transitionType || 'cut';
      
      if (!contexts.has(contextKey)) {
        contexts.set(contextKey, new Map());
      }
      
      const transitionMap = contexts.get(contextKey)!;
      transitionMap.set(transitionType, (transitionMap.get(transitionType) || 0) + 1);
    }
  });
  
  return Array.from(contexts.entries()).map(([context, transitionMap]) => {
    const [fromType, toType] = context.split('-');
    const totalCount = Array.from(transitionMap.values()).reduce((a, b) => a + b, 0);
    const preferredTransition = Array.from(transitionMap.entries())
      .sort(([,a], [,b]) => b - a)[0][0];
    const confidence = (transitionMap.get(preferredTransition) || 0) / totalCount;
    
    return {
      fromType,
      toType,
      preferredTransition,
      confidence
    };
  });
}

// 4-1-5. 오디오 패턴 분석
export interface AudioPatterns {
  levelConsistency: AudioLevelAnalysis;
  dynamicRange: DynamicRangeAnalysis;
  musicSync: MusicSyncAnalysis;
  speechPatterns: SpeechPatternAnalysis;
}

export interface AudioLevelAnalysis {
  averageLevel: number;
  peakLevel: number;
  variance: number;
  consistencyScore: number; // 0-1, 1이 가장 일관적
}

export interface DynamicRangeAnalysis {
  range: number; // dB
  compressionRatio: number;
  loudnessPeaks: number[];
  quietSections: number[];
}

export interface MusicSyncAnalysis {
  hasBackgroundMusic: boolean;
  musicVolume: number;
  speechMusicRatio: number;
  syncPoints: number[]; // 음악과 컷이 동기화된 시점
}

export interface SpeechPatternAnalysis {
  speechSections: Array<{start: number, end: number, confidence: number}>;
  silenceDuration: number;
  speechRatio: number;
  averageSpeechLevel: number;
}

export function analyzeAudioPatterns(timeline: NormalizedTimeline): AudioPatterns {
  const audioLevels = timeline.audioLevels;
  
  if (audioLevels.length === 0) {
    return createEmptyAudioPatterns();
  }
  
  // 레벨 일관성 분석
  const levels = audioLevels.map(a => a.level);
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  const peakLevel = Math.max(...levels);
  const variance = levels.map(l => Math.pow(l - avgLevel, 2)).reduce((a, b) => a + b, 0) / levels.length;
  const consistencyScore = Math.max(0, 1 - (variance / 100)); // 정규화
  
  const levelConsistency: AudioLevelAnalysis = {
    averageLevel: avgLevel,
    peakLevel,
    variance,
    consistencyScore
  };
  
  // 다이나믹 레인지 분석
  const minLevel = Math.min(...levels);
  const dynamicRange: DynamicRangeAnalysis = {
    range: peakLevel - minLevel,
    compressionRatio: calculateCompressionRatio(levels),
    loudnessPeaks: findLoudnessPeaks(audioLevels, avgLevel + 5),
    quietSections: findQuietSections(audioLevels, avgLevel - 10)
  };
  
  // 음악 동기화 분석 (Mock)
  const musicSync: MusicSyncAnalysis = {
    hasBackgroundMusic: true,
    musicVolume: -15,
    speechMusicRatio: 0.7,
    syncPoints: findMusicSyncPoints(timeline.cuts, audioLevels)
  };
  
  // 음성 패턴 분석
  const speechPatterns: SpeechPatternAnalysis = {
    speechSections: detectSpeechSections(audioLevels),
    silenceDuration: calculateSilenceDuration(audioLevels, avgLevel - 20),
    speechRatio: 0.6,
    averageSpeechLevel: avgLevel + 3
  };
  
  return {
    levelConsistency,
    dynamicRange,
    musicSync,
    speechPatterns
  };
}

function createEmptyAudioPatterns(): AudioPatterns {
  return {
    levelConsistency: {
      averageLevel: -20,
      peakLevel: -5,
      variance: 0,
      consistencyScore: 0
    },
    dynamicRange: {
      range: 15,
      compressionRatio: 1,
      loudnessPeaks: [],
      quietSections: []
    },
    musicSync: {
      hasBackgroundMusic: false,
      musicVolume: -40,
      speechMusicRatio: 0,
      syncPoints: []
    },
    speechPatterns: {
      speechSections: [],
      silenceDuration: 0,
      speechRatio: 0,
      averageSpeechLevel: -40
    }
  };
}

function calculateCompressionRatio(levels: number[]): number {
  // 간단한 압축률 계산
  const sortedLevels = [...levels].sort((a, b) => b - a);
  const top10Percent = sortedLevels.slice(0, Math.floor(sortedLevels.length * 0.1));
  const bottom10Percent = sortedLevels.slice(-Math.floor(sortedLevels.length * 0.1));
  
  const topAvg = top10Percent.reduce((a, b) => a + b, 0) / top10Percent.length;
  const bottomAvg = bottom10Percent.reduce((a, b) => a + b, 0) / bottom10Percent.length;
  
  return (topAvg - bottomAvg) / 20; // 정규화
}

function findLoudnessPeaks(audioLevels: AudioLevel[], threshold: number): number[] {
  return audioLevels
    .filter(level => level.level > threshold)
    .map(level => level.timestamp);
}

function findQuietSections(audioLevels: AudioLevel[], threshold: number): number[] {
  const quietTimes: number[] = [];
  let inQuietSection = false;
  let sectionStart = 0;
  
  audioLevels.forEach(level => {
    if (level.level < threshold && !inQuietSection) {
      inQuietSection = true;
      sectionStart = level.timestamp;
    } else if (level.level >= threshold && inQuietSection) {
      inQuietSection = false;
      if (level.timestamp - sectionStart > 1.0) { // 1초 이상의 조용한 구간만
        quietTimes.push(sectionStart);
      }
    }
  });
  
  return quietTimes;
}

function findMusicSyncPoints(cuts: NormalizedCut[], audioLevels: AudioLevel[]): number[] {
  const syncPoints: number[] = [];
  
  cuts.forEach(cut => {
    // 컷 시점 근처의 오디오 레벨 변화 확인
    const nearbyLevels = audioLevels.filter(
      level => Math.abs(level.timestamp - cut.timestamp) < 0.5
    );
    
    if (nearbyLevels.length > 0) {
      const hasSignificantChange = nearbyLevels.some((level, index) => {
        if (index === 0) return false;
        return Math.abs(level.level - nearbyLevels[index - 1].level) > 3;
      });
      
      if (hasSignificantChange) {
        syncPoints.push(cut.timestamp);
      }
    }
  });
  
  return syncPoints;
}

function detectSpeechSections(audioLevels: AudioLevel[]): Array<{start: number, end: number, confidence: number}> {
  const sections: Array<{start: number, end: number, confidence: number}> = [];
  let inSpeech = false;
  let sectionStart = 0;
  
  // 간단한 음성 감지 (레벨 기반)
  const avgLevel = audioLevels.reduce((sum, level) => sum + level.level, 0) / audioLevels.length;
  const speechThreshold = avgLevel - 5;
  
  audioLevels.forEach((level, index) => {
    if (level.level > speechThreshold && !inSpeech) {
      inSpeech = true;
      sectionStart = level.timestamp;
    } else if (level.level <= speechThreshold && inSpeech) {
      inSpeech = false;
      const duration = level.timestamp - sectionStart;
      if (duration > 0.5) { // 0.5초 이상의 음성만
        sections.push({
          start: sectionStart,
          end: level.timestamp,
          confidence: 0.7 // Mock 신뢰도
        });
      }
    }
  });
  
  return sections;
}

function calculateSilenceDuration(audioLevels: AudioLevel[], silenceThreshold: number): number {
  let silenceDuration = 0;
  let lastTimestamp = 0;
  
  audioLevels.forEach((level, index) => {
    if (level.level < silenceThreshold) {
      if (index > 0) {
        silenceDuration += level.timestamp - lastTimestamp;
      }
    }
    lastTimestamp = level.timestamp;
  });
  
  return silenceDuration;
}