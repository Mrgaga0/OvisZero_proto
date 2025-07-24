// Common types used across the backend

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  timestamp: string;
}

export interface DeletionStep {
  step: number;
  token: string;
  message: string;
  affectedCount?: number;
  expiresAt: Date;
}

export interface LearningProgress {
  sessionId: string;
  status: 'analyzing' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  estimatedTimeRemaining?: number;
}

export interface ChannelSettings {
  cutTiming?: {
    minDuration: number;
    maxDuration: number;
    rhythmPattern?: string;
  };
  transitions?: {
    preferredTypes: string[];
    duration: number;
  };
  audio?: {
    targetLoudness: number;
    musicDucking: boolean;
  };
  subtitles?: {
    style: string;
    position: string;
    fontSize: number;
  };
}

export interface SequenceAnalysis {
  duration: number;
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
  videoTracks: number;
  audioTracks: number;
  clips: Array<{
    id: string;
    name: string;
    startTime: number;
    endTime: number;
    type: 'video' | 'audio' | 'graphic';
  }>;
  cuts: Array<{
    timestamp: number;
    type: 'cut' | 'transition';
    transitionType?: string;
  }>;
  effects: Array<{
    type: string;
    startTime: number;
    endTime: number;
    parameters: Record<string, any>;
  }>;
}

export interface AIEditingJob {
  id: string;
  channelId: string;
  projectId: string;
  sequenceId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    editsApplied: number;
    renderUrl?: string;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}