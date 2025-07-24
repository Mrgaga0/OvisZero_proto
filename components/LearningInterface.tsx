import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, FileVideo, Brain, X, Play, Pause, RotateCcw, TrendingUp, Zap, Target, Settings, Clock, AlertCircle } from 'lucide-react';

interface SequenceData {
  name: string;
  duration: string;
  resolution: string;
  frameRate: number;
  trackCount: number;
  hasAudio: boolean;
  hasVideo: boolean;
  clipCount: number;
  subtitleCount?: number;
  colorProfile?: string;
}

interface LearningStep {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'error';
  duration?: number;
}

interface Channel {
  id: string;
  name: string;
  type: 'youtube' | 'instagram' | 'tiktok' | 'podcast' | 'custom';
  description: string;
  style: string;
  isLearned: boolean;
  editingRules: string[];
}

interface LearningResult {
  learnedPatterns: string[];
  improvementAreas: string[];
  confidenceScore: number;
  processingTime: number;
}

interface LearningInterfaceProps {
  channel: Channel;
  isVisible: boolean;
  onClose: () => void;
  onComplete: (result: LearningResult) => void;
}

type LearningPhase = 'preparing' | 'ready' | 'learning' | 'completed';

export function LearningInterface({ channel, isVisible, onClose, onComplete }: LearningInterfaceProps) {
  const [phase, setPhase] = useState<LearningPhase>('preparing');
  const [currentStep, setCurrentStep] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [sequenceData, setSequenceData] = useState<SequenceData | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [learningSteps, setLearningSteps] = useState<LearningStep[]>([
    {
      id: 'sequence-read',
      name: '시퀀스 분석',
      description: '프리미어 프로 타임라인 구조 분석',
      icon: FileVideo,
      progress: 0,
      status: 'pending'
    },
    {
      id: 'pattern-detect',
      name: '패턴 감지',
      description: '편집 스타일과 컷 패턴 식별',
      icon: Target,
      progress: 0,
      status: 'pending'
    },
    {
      id: 'style-learn',
      name: '스타일 학습',
      description: 'AI 모델에 편집 스타일 반영',
      icon: Brain,
      progress: 0,
      status: 'pending'
    },
    {
      id: 'optimization',
      name: '최적화',
      description: '채널별 맞춤 설정 적용',
      icon: Zap,
      progress: 0,
      status: 'pending'
    }
  ]);

  // 타이머 효과
  useEffect(() => {
    if (startTime && !isPaused && phase === 'learning') {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, isPaused, phase]);

  // 초기 시퀀스 분석 (준비 단계)
  useEffect(() => {
    if (!isVisible) return;

    if (phase === 'preparing') {
      // 시퀀스 데이터 미리 로드
      setTimeout(() => {
        setSequenceData({
          name: "메인 시퀀스",
          duration: "8:34",
          resolution: "1920x1080",
          frameRate: 29.97,
          trackCount: 5,
          hasAudio: true,
          hasVideo: true,
          clipCount: 23,
          subtitleCount: 45,
          colorProfile: "Rec. 709"
        });
        setPhase('ready');
      }, 2000);
    }
  }, [isVisible, phase]);

  // 학습 시작
  const handleStartLearning = () => {
    setPhase('learning');
    setStartTime(Date.now());
    setElapsedTime(0);
    
    // 학습 프로세스 시작
    processLearningSteps();
  };

  // 학습 프로세스 시뮬레이션
  const processLearningSteps = () => {
    const processStep = (stepIndex: number) => {
      if (stepIndex >= learningSteps.length) {
        // 학습 완료
        const result: LearningResult = {
          learnedPatterns: [
            '빠른 컷 패턴 (평균 2.3초)',
            '강조 자막 위치 및 타이밍',
            '배경음악 볼륨 조절 패턴',
            '전환 효과 사용 빈도',
            '색상 보정 일관성'
          ],
          improvementAreas: [
            '무음 구간 제거 최적화',
            '자막 가독성 개선',
            '썸네일 컷 자동 선택'
          ],
          confidenceScore: 87.5,
          processingTime: elapsedTime
        };
        setPhase('completed');
        setTimeout(() => onComplete(result), 2000);
        return;
      }

      setCurrentStep(stepIndex);
      
      // 현재 스텝을 active로 설정
      setLearningSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === stepIndex ? 'active' : 
               index < stepIndex ? 'completed' : 'pending'
      })));

      // 스텝별 진행률 애니메이션
      const stepDuration = 3000 + Math.random() * 2000; // 3-5초
      const progressInterval = setInterval(() => {
        if (isPaused) return;
        
        setLearningSteps(prev => prev.map((step, index) => {
          if (index === stepIndex) {
            const newProgress = Math.min(step.progress + Math.random() * 15, 100);
            return { ...step, progress: newProgress };
          }
          return step;
        }));
      }, 200);

      // 전체 진행률 업데이트
      const overallInterval = setInterval(() => {
        if (isPaused) return;
        
        const baseProgress = (stepIndex / learningSteps.length) * 100;
        const stepProgress = (learningSteps[stepIndex]?.progress || 0) / learningSteps.length;
        setOverallProgress(baseProgress + stepProgress);
      }, 100);

      // 스텝 완료 후 다음 스텝으로
      setTimeout(() => {
        if (isPaused) return;
        
        clearInterval(progressInterval);
        clearInterval(overallInterval);
        
        setLearningSteps(prev => prev.map((step, index) => {
          if (index === stepIndex) {
            return { ...step, progress: 100, status: 'completed' };
          }
          return step;
        }));

        setTimeout(() => processStep(stepIndex + 1), 500);
      }, stepDuration);
    };

    processStep(0);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const togglePause = () => {
    if (phase === 'learning') {
      setIsPaused(!isPaused);
    }
  };

  const resetLearning = () => {
    setPhase('ready');
    setCurrentStep(0);
    setOverallProgress(0);
    setStartTime(null);
    setElapsedTime(0);
    setIsPaused(false);
    setLearningSteps(prev => prev.map(step => ({
      ...step,
      progress: 0,
      status: 'pending'
    })));
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-surface-elevated rounded-lg max-w-lg w-full m-4 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-accent-green" />
            <div>
              <h3 className="font-semibold">{channel.name} 학습</h3>
              <p className="text-xs text-muted-foreground">
                {phase === 'preparing' && '시퀀스 분석 중...'}
                {phase === 'ready' && 'AI 편집 스타일 학습 준비'}
                {phase === 'learning' && 'AI 편집 스타일 학습 진행 중'}
                {phase === 'completed' && '학습 완료'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {phase === 'learning' && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTime(elapsedTime)}
              </div>
            )}
            {phase === 'learning' && (
              <button
                onClick={togglePause}
                className="p-1 hover:bg-surface-dark rounded"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            )}
            {(phase === 'ready' || phase === 'completed') && (
              <button
                onClick={resetLearning}
                className="p-1 hover:bg-surface-dark rounded"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-dark rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 준비 단계 */}
        <AnimatePresence mode="wait">
          {phase === 'preparing' && (
            <motion.div
              key="preparing"
              className="p-6 text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-chart-2/20 to-accent-green/20 flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <FileVideo className="w-8 h-8 text-chart-2" />
              </motion.div>
              
              <div>
                <h4 className="font-medium text-chart-2 mb-1">시퀀스 분석 중...</h4>
                <p className="text-xs text-muted-foreground">프리미어 프로 프로젝트를 분석하고 있습니다</p>
              </div>

              <div className="progress-bar">
                <motion.div
                  className="h-full bg-chart-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* 준비 완료 단계 */}
          {phase === 'ready' && (
            <motion.div
              key="ready"
              className="p-6 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* 시퀀스 정보 */}
              {sequenceData && (
                <div className="bg-surface-dark/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileVideo className="w-4 h-4 text-accent-green" />
                    <span className="font-medium text-sm">감지된 시퀀스</span>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-3">{sequenceData.name}</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground">길이:</span>
                        <span className="ml-1 font-medium">{sequenceData.duration}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">해상도:</span>
                        <span className="ml-1 font-medium">{sequenceData.resolution}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">클립:</span>
                        <span className="ml-1 font-medium">{sequenceData.clipCount}개</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground">자막:</span>
                        <span className="ml-1 font-medium">{sequenceData.subtitleCount}개</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">트랙:</span>
                        <span className="ml-1 font-medium">{sequenceData.trackCount}개</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">색상:</span>
                        <span className="ml-1 font-medium">{sequenceData.colorProfile}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 학습 예정 단계들 */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-center mb-3">학습 예정 단계</h4>
                {learningSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-dark/30">
                      <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-xs font-medium">{step.name}</h5>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 주의사항 */}
              <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-status-warning mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-status-warning mb-1">학습 시 주의사항</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• 학습 중에는 프리미어 프로를 종료하지 마세요</li>
                      <li>• 학습 시간은 약 3-5분 정도 소요됩니다</li>
                      <li>• 시스템 성능에 따라 시간이 달라질 수 있습니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 학습 시작 버튼 */}
              <motion.button
                onClick={handleStartLearning}
                className="w-full py-4 bg-gradient-to-r from-accent-green to-accent-green-hover text-background font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  <span>학습 시작</span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* 학습 진행 단계 */}
          {phase === 'learning' && (
            <motion.div
              key="learning"
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* 전체 진행률 */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">전체 진행률</span>
                  <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
                </div>
                <div className="progress-bar h-3">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-green to-chart-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* 학습 단계 */}
              <div className="p-4 space-y-3">
                {learningSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = step.status === 'active';
                  const isCompleted = step.status === 'completed';
                  
                  return (
                    <motion.div
                      key={step.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isActive ? 'border-accent-green bg-accent-green/5' :
                        isCompleted ? 'border-accent-green/30 bg-accent-green/5' :
                        'border-border bg-surface-dark/30'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-accent-green text-background' :
                          isActive ? 'bg-accent-green/20 text-accent-green' :
                          'bg-surface-elevated text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium text-sm ${
                              isActive ? 'text-accent-green' : isCompleted ? 'text-accent-green' : 'text-foreground'
                            }`}>
                              {step.name}
                            </h4>
                            {(isActive || isCompleted) && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(step.progress)}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                          
                          {isActive && (
                            <div className="mt-2">
                              <div className="progress-bar h-1">
                                <motion.div
                                  className="h-full bg-accent-green rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${step.progress}%` }}
                                  transition={{ duration: 0.3 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* AI 학습 시각화 */}
              <AnimatePresence>
                {learningSteps[2]?.status === 'active' && (
                  <motion.div
                    className="p-4 border-t border-border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="text-center space-y-3">
                      <motion.div
                        className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-accent-green/20 to-chart-2/20 flex items-center justify-center"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 180, 360] 
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Brain className="w-8 h-8 text-accent-green" />
                      </motion.div>
                      
                      <div>
                        <p className="text-sm font-medium text-accent-green">뉴럴 네트워크 학습 중</p>
                        <p className="text-xs text-muted-foreground">편집 패턴을 AI 모델에 반영하고 있습니다</p>
                      </div>

                      {/* 가상 네트워크 시각화 */}
                      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                        {Array.from({ length: 16 }, (_, i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-accent-green/30"
                            animate={{
                              opacity: [0.3, 1, 0.3],
                              scale: [0.8, 1.2, 0.8]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.1
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 하단 액션 */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>CPU: 45%</span>
                    <span>메모리: 2.1GB</span>
                  </div>
                  <span>처리 속도: {(23 + Math.random() * 10).toFixed(1)} fps</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 완료 단계 */}
          {phase === 'completed' && (
            <motion.div
              key="completed"
              className="p-6 text-center space-y-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto rounded-full bg-accent-green/20 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle2 className="w-8 h-8 text-accent-green" />
              </motion.div>
              
              <div>
                <h4 className="font-medium text-accent-green mb-1">학습 완료!</h4>
                <p className="text-xs text-muted-foreground">
                  {channel.name} 편집 스타일이 성공적으로 학습되었습니다
                </p>
              </div>

              <div className="bg-accent-green/10 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  처리 시간: {formatTime(elapsedTime)} | 신뢰도: 87.5%
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}