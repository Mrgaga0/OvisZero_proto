export interface Channel {
  id: string;
  name: string;
  type: 'youtube' | 'instagram' | 'tiktok' | 'podcast' | 'custom';
  description: string;
  style: string;
  isLearned: boolean;
  createdAt: string;
  editingRules: string[];
  learningHistory?: LearningSession[];
  confidenceScore?: number;
}

export interface LearningSession {
  id: string;
  channelId?: string;
  date?: string;
  duration?: string;
  patternsLearned?: number;
  confidenceImprovement?: number;
  projectName?: string;
  status?: 'idle' | 'learning' | 'completed' | 'failed';
  progress?: number;
  startTime?: Date;
  endTime?: Date;
  projectsAnalyzed?: number;
  patternsFound?: number;
}

export interface LearningHistory {
  date: string;
  projectCount: number;
  confidence: number;
  improvements: string[];
}

export interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: string;
  sequences: SequenceData[];
}

export interface SequenceData {
  name: string;
  duration: string;
  resolution: string;
  frameRate: number;
  trackCount: number;
  hasAudio: boolean;
  hasVideo: boolean;
  clipCount: number;
  cuts?: number;
  transitions?: number;
  effects?: number;
}

export interface TrainingData {
  id: string;
  channelId: string;
  sequenceName: string;
  projectName: string;
  addedDate: string;
  duration: string;
  cuts: number;
  transitions: number;
  effects: number;
}

export interface LearningResult {
  learnedPatterns: string[];
  improvementAreas: string[];
  confidenceScore: number;
  processingTime: number;
}

export interface ProjectStatus {
  hasSubtitles: boolean;
  projectName: string;
  projectPath: string;
  timeline: {
    detected: boolean;
    duration: string;
  };
  isReady: boolean;
}

export interface UIVisibility {
  statusInfo: boolean;
  tipInfo: boolean;
  appInfo: boolean;
}

export type DeleteStep = 1 | 2 | 3;