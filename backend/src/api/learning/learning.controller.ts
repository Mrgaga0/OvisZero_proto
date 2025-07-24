import { Response } from 'express';
import { prisma } from '../../config/database';
import { cache } from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { LearningProgress, SequenceAnalysis, PaginatedResponse } from '../../types';
import { LearningStatus, RuleType } from '@prisma/client';
import { socketEmitter } from '../../services/socket.service';
import { Server } from 'socket.io';

// Socket.io instance (will be injected)
let io: Server;

export function setSocketIO(socketIO: Server) {
  io = socketIO;
}

// 학습 세션 시작
export async function startLearning(req: AuthRequest, res: Response) {
  const { channelId, sequenceData } = req.body;
  const userId = req.user!.id;

  // 채널 확인
  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      userId,
      deletedAt: null
    }
  });

  if (!channel) {
    throw new AppError('Channel not found', 404);
  }

  // 동시 학습 세션 제한 확인 (채널당 1개)
  const activeSession = await prisma.learningSession.findFirst({
    where: {
      channelId,
      status: {
        in: ['PENDING', 'ANALYZING', 'PROCESSING']
      }
    }
  });

  if (activeSession) {
    throw new AppError('Another learning session is already in progress for this channel', 409);
  }

  // 학습 세션 생성
  const session = await prisma.learningSession.create({
    data: {
      channelId,
      userId,
      status: 'ANALYZING',
      sequenceData: sequenceData as any,
      analysisResults: {}
    }
  });

  // 학습 프로세스 시작 (비동기)
  startLearningProcess(session.id, channel.id, sequenceData).catch(err => {
    logger.error('Learning process failed:', err);
  });

  // 로그 기록
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'LEARNING_STARTED',
      entityType: 'LEARNING_SESSION',
      entityId: session.id,
      metadata: { channelId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

  res.status(201).json({
    success: true,
    data: {
      sessionId: session.id,
      status: session.status,
      message: 'Learning session started. Monitor progress via WebSocket or polling.'
    }
  });
}

// 비동기 학습 프로세스
async function startLearningProcess(
  sessionId: string, 
  channelId: string, 
  sequenceData: SequenceAnalysis
) {
  try {
    // 진행 상황 업데이트 함수
    const updateProgress = async (progress: number, status: LearningStatus, currentStep?: string) => {
      await prisma.learningSession.update({
        where: { id: sessionId },
        data: { status }
      });

      if (io) {
        socketEmitter.learningProgress(io, sessionId, progress, status);
      }

      // 캐시에도 상태 저장
      await cache.set(`learning:${sessionId}`, {
        sessionId,
        status,
        progress,
        currentStep
      }, 600);
    };

    // 1단계: 데이터 분석 (20%)
    await updateProgress(20, 'ANALYZING', 'Analyzing sequence data');
    const patterns = await analyzeEditingPatterns(sequenceData);
    
    // 2단계: 패턴 추출 (40%)
    await updateProgress(40, 'PROCESSING', 'Extracting editing patterns');
    const rules = await extractEditingRules(patterns, channelId);
    
    // 3단계: 기존 규칙과 비교 (60%)
    await updateProgress(60, 'PROCESSING', 'Comparing with existing rules');
    const updatedRules = await updateExistingRules(channelId, rules);
    
    // 4단계: 신뢰도 계산 (80%)
    await updateProgress(80, 'PROCESSING', 'Calculating confidence scores');
    const confidence = await calculateConfidence(updatedRules);
    
    // 5단계: 완료 처리 (100%)
    await prisma.$transaction(async (tx) => {
      // 학습 세션 업데이트
      await tx.learningSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          analysisResults: {
            patterns,
            rules: updatedRules,
            metrics: {
              totalPatterns: patterns.length,
              newRules: rules.length,
              updatedRules: updatedRules.length
            }
          } as any,
          confidence,
          patternsFound: patterns.length,
          clipsAnalyzed: sequenceData.clips.length
        }
      });

      // 채널 신뢰도 업데이트
      await tx.channel.update({
        where: { id: channelId },
        data: {
          confidence,
          lastTrainedAt: new Date()
        }
      });
    });

    await updateProgress(100, 'COMPLETED', 'Learning completed successfully');
    
    logger.info(`Learning session ${sessionId} completed successfully`);
  } catch (error) {
    logger.error(`Learning session ${sessionId} failed:`, error);
    
    // 실패 처리
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    if (io) {
      socketEmitter.learningProgress(io, sessionId, 0, 'FAILED');
    }
  }
}

// 편집 패턴 분석
async function analyzeEditingPatterns(sequenceData: SequenceAnalysis): Promise<any[]> {
  const patterns = [];

  // 컷 타이밍 패턴 분석
  if (sequenceData.cuts && sequenceData.cuts.length > 0) {
    const cutIntervals = [];
    for (let i = 1; i < sequenceData.cuts.length; i++) {
      cutIntervals.push(sequenceData.cuts[i].timestamp - sequenceData.cuts[i-1].timestamp);
    }
    
    patterns.push({
      type: 'CUT_TIMING',
      data: {
        averageInterval: cutIntervals.reduce((a, b) => a + b, 0) / cutIntervals.length,
        minInterval: Math.min(...cutIntervals),
        maxInterval: Math.max(...cutIntervals),
        rhythm: detectRhythmPattern(cutIntervals)
      }
    });
  }

  // 전환 효과 패턴 분석
  const transitions = sequenceData.cuts.filter(cut => cut.type === 'transition');
  if (transitions.length > 0) {
    const transitionTypes = transitions.reduce((acc, t) => {
      acc[t.transitionType || 'unknown'] = (acc[t.transitionType || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    patterns.push({
      type: 'TRANSITION_STYLE',
      data: {
        preferredTypes: Object.keys(transitionTypes),
        frequency: transitions.length / sequenceData.cuts.length,
        distribution: transitionTypes
      }
    });
  }

  // 추가 패턴 분석 로직...
  
  return patterns;
}

// 리듬 패턴 감지
function detectRhythmPattern(intervals: number[]): string {
  // 간단한 리듬 패턴 감지 로직
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.map(i => Math.pow(i - avg, 2)).reduce((a, b) => a + b, 0) / intervals.length;
  
  if (variance < avg * 0.1) return 'steady';
  if (variance < avg * 0.3) return 'moderate';
  return 'dynamic';
}

// 편집 규칙 추출
async function extractEditingRules(patterns: any[], channelId: string): Promise<any[]> {
  const rules = [];

  for (const pattern of patterns) {
    switch (pattern.type) {
      case 'CUT_TIMING':
        rules.push({
          channelId,
          ruleType: 'CUT_TIMING' as RuleType,
          parameters: pattern.data,
          confidence: 0.7 // 초기 신뢰도
        });
        break;
        
      case 'TRANSITION_STYLE':
        rules.push({
          channelId,
          ruleType: 'TRANSITION_STYLE' as RuleType,
          parameters: pattern.data,
          confidence: 0.7
        });
        break;
        
      // 추가 규칙 타입...
    }
  }

  return rules;
}

// 기존 규칙 업데이트
async function updateExistingRules(channelId: string, newRules: any[]): Promise<any[]> {
  const existingRules = await prisma.editingRule.findMany({
    where: { channelId }
  });

  const updatedRules = [];

  for (const newRule of newRules) {
    const existing = existingRules.find(r => r.ruleType === newRule.ruleType);
    
    if (existing) {
      // 기존 규칙 업데이트 (가중 평균)
      const updatedParams = mergeRuleParameters(
        existing.parameters as any,
        newRule.parameters,
        existing.usageCount
      );
      
      const updated = await prisma.editingRule.update({
        where: { id: existing.id },
        data: {
          parameters: updatedParams,
          confidence: Math.min(existing.confidence + 0.05, 0.95), // 신뢰도 증가
          usageCount: { increment: 1 }
        }
      });
      
      updatedRules.push(updated);
    } else {
      // 새 규칙 생성
      const created = await prisma.editingRule.create({
        data: newRule
      });
      updatedRules.push(created);
    }
  }

  return updatedRules;
}

// 규칙 파라미터 병합
function mergeRuleParameters(existing: any, newParams: any, weight: number): any {
  // 가중 평균을 사용한 파라미터 병합
  const merged: any = {};
  
  for (const key in newParams) {
    if (typeof newParams[key] === 'number' && typeof existing[key] === 'number') {
      // 숫자형 파라미터는 가중 평균
      merged[key] = (existing[key] * weight + newParams[key]) / (weight + 1);
    } else {
      // 다른 타입은 새 값으로 대체
      merged[key] = newParams[key];
    }
  }
  
  return merged;
}

// 신뢰도 계산
async function calculateConfidence(rules: any[]): Promise<number> {
  if (rules.length === 0) return 0;
  
  const totalConfidence = rules.reduce((sum, rule) => sum + rule.confidence, 0);
  return totalConfidence / rules.length;
}

// 학습 세션 상태 조회
export async function getLearningStatus(req: AuthRequest, res: Response) {
  const { sessionId } = req.params;
  const userId = req.user!.id;

  // 캐시에서 먼저 확인
  const cached = await cache.get(`learning:${sessionId}`);
  if (cached) {
    return res.json({
      success: true,
      data: cached
    });
  }

  // 데이터베이스에서 조회
  const session = await prisma.learningSession.findFirst({
    where: {
      id: sessionId,
      userId
    },
    include: {
      channel: {
        select: {
          id: true,
          name: true,
          type: true
        }
      }
    }
  });

  if (!session) {
    throw new AppError('Learning session not found', 404);
  }

  const progress: LearningProgress = {
    sessionId: session.id,
    status: session.status as any,
    progress: calculateProgressPercentage(session.status),
    currentStep: getStatusMessage(session.status)
  };

  res.json({
    success: true,
    data: {
      ...progress,
      channel: session.channel,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      confidence: session.confidence,
      patternsFound: session.patternsFound,
      clipsAnalyzed: session.clipsAnalyzed,
      error: session.errorMessage
    }
  });
}

// 진행률 계산
function calculateProgressPercentage(status: LearningStatus): number {
  switch (status) {
    case 'PENDING': return 0;
    case 'ANALYZING': return 20;
    case 'PROCESSING': return 60;
    case 'COMPLETED': return 100;
    case 'FAILED': return 0;
    case 'CANCELLED': return 0;
    default: return 0;
  }
}

// 상태 메시지
function getStatusMessage(status: LearningStatus): string {
  switch (status) {
    case 'PENDING': return 'Waiting to start';
    case 'ANALYZING': return 'Analyzing sequence data';
    case 'PROCESSING': return 'Processing editing patterns';
    case 'COMPLETED': return 'Learning completed successfully';
    case 'FAILED': return 'Learning failed';
    case 'CANCELLED': return 'Learning cancelled';
    default: return 'Unknown status';
  }
}

// 학습 결과 조회
export async function getLearningResults(req: AuthRequest, res: Response) {
  const { sessionId } = req.params;
  const userId = req.user!.id;

  const session = await prisma.learningSession.findFirst({
    where: {
      id: sessionId,
      userId,
      status: 'COMPLETED'
    },
    include: {
      channel: {
        include: {
          editingRules: {
            orderBy: { confidence: 'desc' },
            take: 10
          }
        }
      }
    }
  });

  if (!session) {
    throw new AppError('Completed learning session not found', 404);
  }

  res.json({
    success: true,
    data: {
      sessionId: session.id,
      channelId: session.channelId,
      channelName: session.channel.name,
      completedAt: session.completedAt,
      confidence: session.confidence,
      analysisResults: session.analysisResults,
      topRules: session.channel.editingRules.map(rule => ({
        type: rule.ruleType,
        confidence: rule.confidence,
        usageCount: rule.usageCount,
        parameters: rule.parameters
      }))
    }
  });
}

// 학습 세션 목록 조회
export async function getLearningSessions(req: AuthRequest, res: Response) {
  const { page = 1, limit = 10, channelId, status } = req.query;
  const userId = req.user!.id;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = { userId };
  if (channelId) where.channelId = channelId;
  if (status) where.status = status;

  const [sessions, total] = await Promise.all([
    prisma.learningSession.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { startedAt: 'desc' },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    }),
    prisma.learningSession.count({ where })
  ]);

  const response: PaginatedResponse<any> = {
    data: sessions,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };

  res.json({
    success: true,
    ...response
  });
}