import React, { useState, useEffect } from 'react';
import { MagicButton } from './components/MagicButton';
import { LearningInterface } from './components/LearningInterface';
import { TrainingDataManager } from './components/TrainingDataManager';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Loader2, Settings, Edit3, Eye, EyeOff, Brain, Plus, Users, BookOpen, Trash2, Copy, TrendingUp, Award, History, Database, AlertCircle, X } from 'lucide-react';
import { Channel, SequenceData, LearningSession, LearningResult, ProjectStatus, UIVisibility, DeleteStep } from './types';



// CEP Bridge type declaration
declare global {
  interface Window {
    CEPBridge: any;
    cepBridge: any;
  }
}

export default function App() {
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>({
    hasSubtitles: false,
    projectName: '',
    projectPath: '',
    timeline: {
      detected: false,
      duration: ''
    },
    isReady: false
  });

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [aiStatus, setAiStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  
  // 채널 관련 상태
  const [showChannelLibrary, setShowChannelLibrary] = useState(false);
  const [showChannelDetail, setShowChannelDetail] = useState(false);
  const [selectedChannelForDetail, setSelectedChannelForDetail] = useState<Channel | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);

  // 삭제 확인 관련 상태
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>(1);
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);

  // 학습 인터페이스 상태
  const [showLearningInterface, setShowLearningInterface] = useState(false);
  const [learningChannel, setLearningChannel] = useState<Channel | null>(null);

  // 훈련 데이터 관리 상태
  const [showTrainingDataManager, setShowTrainingDataManager] = useState(false);
  const [trainingDataChannel, setTrainingDataChannel] = useState<Channel | null>(null);

  // UI 표시/숨김 상태
  const [uiVisibility, setUIVisibility] = useState<UIVisibility>({
    statusInfo: false,
    tipInfo: false,
    appInfo: false
  });

  const [showAllDetails, setShowAllDetails] = useState(false);

  // 채널 라이브러리 (목 데이터 - 학습 히스토리 포함)
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: '1',
      name: 'Gaming Review',
      type: 'youtube',
      description: '게임 리뷰 채널',
      style: '다이나믹 컷 + 강조 자막',
      isLearned: true,
      createdAt: '2024-01-15',
      editingRules: ['빠른 컷', '강조 자막', '배경음악 자동 조절'],
      confidenceScore: 87.5,
      learningHistory: [
        {
          id: '1',
          date: '2024-01-15',
          duration: '4:23',
          patternsLearned: 12,
          confidenceImprovement: 23.5,
          projectName: '신작 RPG 리뷰'
        },
        {
          id: '2',
          date: '2024-01-20',
          duration: '3:45',
          patternsLearned: 8,
          confidenceImprovement: 12.3,
          projectName: 'FPS 게임 분석'
        }
      ]
    },
    {
      id: '2',
      name: 'Daily Vlog',
      type: 'instagram',
      description: '일상 브이로그',
      style: '자연스러운 컷 + 감성 자막',
      isLearned: false,
      createdAt: '2024-01-20',
      editingRules: ['자연스러운 전환', '감성 자막', '색감 보정'],
      confidenceScore: 0,
      learningHistory: []
    },
    {
      id: '3',
      name: 'Tech Tips',
      type: 'youtube',
      description: '기술 팁 채널',
      style: '설명형 편집 + 정보 자막',
      isLearned: true,
      createdAt: '2024-01-10',
      editingRules: ['화면 분할', '정보 자막', '하이라이트 표시'],
      confidenceScore: 92.8,
      learningHistory: [
        {
          id: '3',
          date: '2024-01-10',
          duration: '5:12',
          patternsLearned: 15,
          confidenceImprovement: 35.2,
          projectName: '코딩 튜토리얼'
        }
      ]
    }
  ]);

  // 새 채널 생성 상태
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    type: 'youtube' as Channel['type'],
    description: ''
  });

  // 프리미어 프로젝트 상태 감지
  const detectProjectStatus = async () => {
    if (window.CEPBridge) {
      try {
        const sequence = await window.CEPBridge.getActiveSequence();
        if (sequence && !sequence.error) {
          setProjectStatus({
            hasSubtitles: false,
            projectName: sequence.name,
            projectPath: 'Active Project',
            timeline: {
              detected: true,
              duration: formatDuration(sequence.duration)
            },
            isReady: true
          });
        } else {
          setProjectStatus(prev => ({ ...prev, isReady: false }));
        }
      } catch (error) {
        console.error('Error checking project status:', error);
      }
    } else {
      // Fallback for development
      setTimeout(() => {
        const mockProject = {
          name: "게임리뷰_에피소드15",
          path: "/Users/editor/Projects/GameReview15.prproj",
          hasTimeline: true,
          duration: "8:34",
          hasSubtitles: true
        };
        
        setProjectStatus({
          hasSubtitles: mockProject.hasSubtitles,
          projectName: mockProject.name,
          projectPath: mockProject.path,
          timeline: {
            detected: mockProject.hasTimeline,
            duration: mockProject.duration
          },
          isReady: mockProject.hasSubtitles && mockProject.hasTimeline
        });
      }, 1000);
    }
  };

  // 삭제 확인 시작
  const handleDeleteChannelRequest = (channel: Channel) => {
    setChannelToDelete(channel);
    setDeleteStep(1);
    setShowDeleteConfirmation(true);
  };

  // 삭제 단계 진행
  const handleDeleteNext = () => {
    if (deleteStep < 3) {
      setDeleteStep((prev) => (prev + 1) as DeleteStep);
    } else {
      // 최종 삭제 실행
      if (channelToDelete) {
        setChannels(prev => prev.filter(ch => ch.id !== channelToDelete.id));
        if (selectedChannel?.id === channelToDelete.id) {
          setSelectedChannel(null);
        }
      }
      handleDeleteCancel();
    }
  };

  // 삭제 취소
  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
    setDeleteStep(1);
    setChannelToDelete(null);
  };

  // 편집 학습 시작 (새 인터페이스 사용)
  const handleStartLearning = (channel: Channel) => {
    setLearningChannel(channel);
    setShowLearningInterface(true);
    setShowChannelDetail(false);
  };

  // 훈련 데이터 관리 열기
  const handleOpenTrainingData = (channel: Channel) => {
    setTrainingDataChannel(channel);
    setShowTrainingDataManager(true);
    setShowChannelDetail(false);
  };

  // 학습 완료 처리
  const handleLearningComplete = (result: LearningResult) => {
    if (!learningChannel) return;

    // 새 학습 세션 생성
    const newSession: LearningSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      duration: formatDuration(result.processingTime),
      patternsLearned: result.learnedPatterns.length,
      confidenceImprovement: result.confidenceScore,
      projectName: projectStatus.projectName || '현재 프로젝트'
    };

    // 채널 업데이트
    setChannels(prev => prev.map(ch => 
      ch.id === learningChannel.id ? {
        ...ch,
        isLearned: true,
        confidenceScore: result.confidenceScore,
        editingRules: result.learnedPatterns,
        learningHistory: [...(ch.learningHistory || []), newSession]
      } : ch
    ));

    // 선택된 채널도 업데이트
    if (selectedChannel?.id === learningChannel.id) {
      setSelectedChannel(prev => prev ? {
        ...prev,
        isLearned: true,
        confidenceScore: result.confidenceScore,
        editingRules: result.learnedPatterns
      } : null);
    }

    setShowLearningInterface(false);
    setLearningChannel(null);
  };

  // 학습 인터페이스 닫기
  const handleLearningClose = () => {
    setShowLearningInterface(false);
    setLearningChannel(null);
  };

  // 훈련 데이터 관리자 닫기
  const handleTrainingDataClose = () => {
    setShowTrainingDataManager(false);
    setTrainingDataChannel(null);
  };

  // 훈련 데이터 업데이트
  const handleTrainingDataUpdate = (updatedChannel: Channel) => {
    setChannels(prev => prev.map(ch => 
      ch.id === updatedChannel.id ? updatedChannel : ch
    ));
    
    if (selectedChannel?.id === updatedChannel.id) {
      setSelectedChannel(updatedChannel);
    }
  };


  // 채널 적용
  const handleApplyChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setShowChannelDetail(false);
    setShowChannelLibrary(false);
  };

  // 새 채널 생성
  const handleCreateChannel = () => {
    if (!newChannelData.name) return;

    const newChannel: Channel = {
      id: Date.now().toString(),
      name: newChannelData.name,
      type: newChannelData.type,
      description: newChannelData.description,
      style: '기본 편집 스타일',
      isLearned: false,
      createdAt: new Date().toISOString().split('T')[0],
      editingRules: ['기본 컷', '기본 자막'],
      confidenceScore: 0,
      learningHistory: []
    };

    setChannels(prev => [...prev, newChannel]);
    setNewChannelData({ name: '', type: 'youtube', description: '' });
    setShowCreateChannel(false);
  };

  useEffect(() => {
    detectProjectStatus();
    
    // CEP 이벤트 리스너 설정
    if (window.CEPBridge) {
      window.addEventListener('cep-update', handleCEPUpdate);
      
      // 주기적으로 프로젝트 상태 확인
      const interval = setInterval(detectProjectStatus, 5000);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('cep-update', handleCEPUpdate);
      };
    }
  }, []);
  
  // CEP 업데이트 핸들러
  const handleCEPUpdate = (event: any) => {
    const data = event.detail;
    console.log('CEP Update:', data);
  };
  
  // 시간 포맷 함수 (밀리초와 초 모두 지원)
  const formatDuration = (timeValue: number): string => {
    // 1000보다 큰 값은 밀리초로 간주
    const seconds = timeValue > 1000 ? Math.floor(timeValue / 1000) : Math.floor(timeValue);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMagicButtonClick = async () => {
    if (!selectedChannel) return;
    
    setAiStatus('processing');
    setProgress(0);

    // CEP 환경에서 AI 편집 적용
    if (window.CEPBridge) {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      try {
        const result = await window.CEPBridge.applyAIEditing(selectedChannel.type);
        clearInterval(progressInterval);
        setProgress(100);
        setAiStatus('complete');
        
        console.log('AI Editing Result:', result);
        
        // 3초 후 초기화
        setTimeout(() => {
          setAiStatus('idle');
          setProgress(0);
        }, 3000);
      } catch (error) {
        clearInterval(progressInterval);
        setAiStatus('error');
        console.error('Error applying AI editing:', error);
        
        setTimeout(() => {
          setAiStatus('idle');
          setProgress(0);
        }, 3000);
      }
    } else {
      // 개발 환경용 시뮬레이션
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setAiStatus('complete');
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);
    }
  };

  const resetToIdle = () => {
    setAiStatus('idle');
    setProgress(0);
  };

  const getChannelIcon = (type: Channel['type']) => {
    switch (type) {
      case 'youtube': return '📺';
      case 'instagram': return '📸';
      case 'tiktok': return '🎵';
      case 'podcast': return '🎙️';
      default: return '📁';
    }
  };

  const getChannelTypeName = (type: Channel['type']) => {
    switch (type) {
      case 'youtube': return 'YouTube';
      case 'instagram': return 'Instagram';
      case 'tiktok': return 'TikTok';
      case 'podcast': return 'Podcast';
      default: return '커스텀';
    }
  };

  // 전체 토글
  const toggleAllDetails = () => {
    const newState = !showAllDetails;
    setShowAllDetails(newState);
    setUIVisibility({
      statusInfo: newState,
      tipInfo: newState,
      appInfo: newState
    });
  };

  // 삭제 확인 메시지 및 버튼 텍스트
  const getDeleteStepContent = () => {
    switch (deleteStep) {
      case 1:
        return {
          title: '채널 삭제',
          message: `"${channelToDelete?.name}" 채널을 삭제하시겠습니까?`,
          warning: '이 작업은 되돌릴 수 없습니다.',
          buttonText: '삭제',
          buttonColor: 'bg-status-error hover:bg-red-600'
        };
      case 2:
        return {
          title: '정말 삭제하시겠습니까?',
          message: '모든 학습 데이터와 설정이 영구적으로 삭제됩니다.',
          warning: `${channelToDelete?.learningHistory?.length || 0}개의 학습 세션이 삭제됩니다.`,
          buttonText: '네, 삭제합니다',
          buttonColor: 'bg-status-error hover:bg-red-600'
        };
      case 3:
        return {
          title: '최종 확인',
          message: '정말로, 정말로 삭제하시겠습니까?',
          warning: '이 채널의 모든 데이터가 완전히 삭제되며 복구할 수 없습니다.',
          buttonText: '최종 삭제',
          buttonColor: 'bg-red-700 hover:bg-red-800'
        };
      default:
        return {
          title: '',
          message: '',
          warning: '',
          buttonText: '',
          buttonColor: ''
        };
    }
  };

  const deleteContent = getDeleteStepContent();

  return (
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      {/* CEP 패널 컨테이너 */}
      <div className="w-full max-w-sm space-y-3">
        
        {/* 전체 토글 컨트롤 */}
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={toggleAllDetails}
            className="flex items-center gap-2 px-3 py-1 bg-surface-elevated hover:bg-surface-dark rounded-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAllDetails ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showAllDetails ? '세부정보 숨김' : '세부정보 표시'}
          </button>
        </motion.div>

        {/* 채널 선택 버튼 */}
        <motion.div 
          className="flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={() => setShowChannelLibrary(true)}
            className="flex items-center gap-2 px-4 py-2 bg-chart-2/10 hover:bg-chart-2/20 border border-chart-2/30 rounded-lg text-sm font-medium text-chart-2 hover:text-chart-1 transition-colors"
          >
            <Users className="w-4 h-4" />
            {selectedChannel ? selectedChannel.name : '채널 선택'}
          </button>
        </motion.div>

        {/* 선택된 채널 정보 */}
        <AnimatePresence>
          {selectedChannel && (
            <motion.div
              className="glass-subtle rounded-lg p-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getChannelIcon(selectedChannel.type)}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedChannel.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedChannel.description}</p>
                </div>
                {selectedChannel.isLearned && (
                  <div className="flex items-center gap-1 text-xs text-accent-green">
                    <Brain className="w-3 h-3" />
                    <span>{selectedChannel.confidenceScore?.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-chart-2">🎨 {selectedChannel.style}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 상태 표시 */}
        <AnimatePresence>
          {uiVisibility.statusInfo && (
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {aiStatus === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="space-y-2">
                      {/* 타임라인 상태 */}
                      <div className="flex items-center justify-center gap-2">
                        {projectStatus.timeline.detected ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-accent-green" />
                            <span className="text-sm text-accent-green">타임라인 감지됨</span>
                            {projectStatus.timeline.duration && (
                              <span className="text-xs text-muted-foreground">
                                ({projectStatus.timeline.duration})
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-status-warning" />
                            <span className="text-sm text-status-warning">타임라인이 필요합니다</span>
                          </>
                        )}
                      </div>

                      {/* 자막 상태 */}
                      <div className="flex items-center justify-center gap-2">
                        {projectStatus.hasSubtitles ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-accent-green" />
                            <span className="text-sm text-accent-green">자막 감지됨</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-status-warning" />
                            <span className="text-sm text-status-warning">타임라인에 자막을 추가하세요</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 준비 상태 요약 */}
                    <div className={`p-3 rounded-lg ${projectStatus.isReady ? 'bg-accent-green/10' : 'bg-status-warning/10'}`}>
                      <div className="flex items-center justify-center gap-2">
                        {projectStatus.isReady ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-accent-green" />
                            <span className="font-medium text-accent-green">편집 준비 완료!</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-5 h-5 text-status-warning" />
                            <span className="font-medium text-status-warning">준비 중...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {aiStatus === 'processing' && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-center gap-2 text-accent-green">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-5 h-5" />
                      </motion.div>
                      <span className="font-medium">AI 편집 처리 중...</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        {Math.round(progress)}% 완료
                      </p>
                      {selectedChannel && (
                        <p className="text-xs text-center text-chart-2">
                          {selectedChannel.name} 스타일 적용 중
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {aiStatus === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-center gap-2 text-accent-green">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">편집 완료!</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      프리미어 프로 타임라인에 적용되었습니다
                    </p>
                    
                    <button
                      onClick={resetToIdle}
                      className="text-xs text-chart-2 hover:text-chart-1 underline"
                    >
                      새로 시작하기
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 매직 버튼 - 항상 표시 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MagicButton
            onClick={handleMagicButtonClick}
            disabled={!projectStatus.isReady || aiStatus === 'processing' || !selectedChannel}
            className="w-full"
          />
        </motion.div>

        {/* 사용 팁 */}
        <AnimatePresence>
          {uiVisibility.tipInfo && !projectStatus.isReady && aiStatus === 'idle' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center p-3 bg-chart-2/10 rounded-lg"
            >
              <p className="text-xs text-chart-2">
                💡 <span className="font-medium">팁:</span> 채널을 선택하고 자막을 추가해보세요
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 채널 라이브러리 모달 */}
        <AnimatePresence>
          {showChannelLibrary && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChannelLibrary(false)}
            >
              <motion.div
                className="bg-surface-elevated p-4 rounded-lg max-w-md w-full m-4 max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">채널 라이브러리</h3>
                  <button
                    onClick={() => setShowCreateChannel(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-accent-green/10 hover:bg-accent-green/20 text-accent-green text-xs rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    새 채널
                  </button>
                </div>
                
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedChannel?.id === channel.id
                          ? 'border-accent-green bg-accent-green/10'
                          : 'border-border bg-surface-dark hover:bg-surface-elevated'
                      }`}
                      onClick={() => {
                        setSelectedChannelForDetail(channel);
                        setShowChannelDetail(true);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getChannelIcon(channel.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{channel.name}</h4>
                            <span className="text-xs text-muted-foreground">{getChannelTypeName(channel.type)}</span>
                            {channel.isLearned && (
                              <div className="flex items-center gap-1 text-xs text-accent-green">
                                <Brain className="w-3 h-3" />
                                <span>{channel.confidenceScore?.toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
                          <p className="text-xs text-chart-2">{channel.style}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-4 mt-4 border-t border-border">
                  <button
                    onClick={() => setShowChannelLibrary(false)}
                    className="flex-1 px-3 py-2 text-xs bg-surface-dark rounded hover:bg-surface-elevated transition-colors"
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 채널 상세보기 모달 */}
        <AnimatePresence>
          {showChannelDetail && selectedChannelForDetail && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChannelDetail(false)}
            >
              <motion.div
                className="bg-surface-elevated p-4 rounded-lg max-w-sm w-full m-4 max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getChannelIcon(selectedChannelForDetail.type)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedChannelForDetail.name}</h3>
                      <p className="text-xs text-muted-foreground">{getChannelTypeName(selectedChannelForDetail.type)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteChannelRequest(selectedChannelForDetail)}
                      className="text-status-error hover:bg-status-error/10 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">{selectedChannelForDetail.description}</p>
                    <p className="text-xs text-chart-2">🎨 {selectedChannelForDetail.style}</p>
                    <p className="text-xs text-muted-foreground">생성일: {selectedChannelForDetail.createdAt}</p>
                  </div>

                  {/* 학습 상태 및 신뢰도 */}
                  {selectedChannelForDetail.isLearned && (
                    <div className="bg-accent-green/10 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-accent-green" />
                          <span className="text-sm font-medium text-accent-green">학습 완료</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-accent-green" />
                          <span className="text-sm font-semibold text-accent-green">
                            {selectedChannelForDetail.confidenceScore?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-1">학습된 편집 규칙:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {selectedChannelForDetail.editingRules.map((rule, index) => (
                            <li key={index}>• {rule}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 학습 히스토리 */}
                  {selectedChannelForDetail.learningHistory && selectedChannelForDetail.learningHistory.length > 0 && (
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <History className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium">학습 히스토리</span>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedChannelForDetail.learningHistory.map((session) => (
                          <div key={session.id} className="bg-surface-dark/50 rounded p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{session.projectName}</span>
                              <span className="text-xs text-muted-foreground">{session.date}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>⏱️ {session.duration}</span>
                              <span>📝 {session.patternsLearned}개 패턴</span>
                              <span>📈 +{session.confidenceImprovement.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 버튼 그룹 */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApplyChannel(selectedChannelForDetail)}
                        className="flex-1 px-3 py-2 bg-accent-green text-background font-medium rounded hover:bg-accent-green-hover transition-colors"
                      >
                        적용
                      </button>
                      <button
                        onClick={() => handleStartLearning(selectedChannelForDetail)}
                        className="flex-1 px-3 py-2 bg-chart-2/10 text-chart-2 font-medium rounded hover:bg-chart-2/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        학습
                      </button>
                    </div>

                    {/* 데이터 관리 버튼 */}
                    {selectedChannelForDetail.isLearned && (
                      <button
                        onClick={() => handleOpenTrainingData(selectedChannelForDetail)}
                        className="w-full px-3 py-2 bg-surface-dark text-foreground rounded hover:bg-surface-elevated transition-colors flex items-center justify-center gap-2"
                      >
                        <Database className="w-4 h-4" />
                        <span>훈련 데이터 관리</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 삭제 확인 모달 */}
        <AnimatePresence>
          {showDeleteConfirmation && channelToDelete && (
            <motion.div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-surface-elevated p-6 rounded-lg max-w-sm w-full m-4"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
              >
                <div className="space-y-4">
                  {/* 헤더 */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-status-error/20 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-status-error" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-status-error">{deleteContent.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>단계 {deleteStep}/3</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((step) => (
                            <div
                              key={step}
                              className={`w-1.5 h-1.5 rounded-full ${
                                step <= deleteStep ? 'bg-status-error' : 'bg-surface-dark'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 메시지 */}
                  <div className="space-y-2">
                    <p className="text-sm">{deleteContent.message}</p>
                    <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-status-error">{deleteContent.warning}</p>
                      </div>
                    </div>
                  </div>

                  {/* 채널 정보 */}
                  <div className="bg-surface-dark/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getChannelIcon(channelToDelete.type)}</span>
                      <div>
                        <p className="font-medium text-sm">{channelToDelete.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {channelToDelete.learningHistory?.length || 0}개 학습 세션
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleDeleteCancel}
                      className="flex-1 px-3 py-2 text-sm bg-surface-dark rounded hover:bg-surface-elevated transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDeleteNext}
                      className={`flex-1 px-3 py-2 text-sm text-white font-medium rounded transition-colors ${deleteContent.buttonColor}`}
                    >
                      {deleteContent.buttonText}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 새 채널 생성 모달 */}
        <AnimatePresence>
          {showCreateChannel && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateChannel(false)}
            >
              <motion.div
                className="bg-surface-elevated p-4 rounded-lg max-w-sm w-full m-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <h3 className="font-semibold mb-3">새 채널 생성</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">채널 이름</label>
                    <input
                      type="text"
                      value={newChannelData.name}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2 py-1 text-xs bg-surface-dark border border-border rounded"
                      placeholder="채널 이름을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">플랫폼</label>
                    <select
                      value={newChannelData.type}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, type: e.target.value as Channel['type'] }))}
                      className="w-full px-2 py-1 text-xs bg-surface-dark border border-border rounded"
                    >
                      <option value="youtube">YouTube</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="podcast">Podcast</option>
                      <option value="custom">커스텀</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">설명 (선택)</label>
                    <input
                      type="text"
                      value={newChannelData.description}
                      onChange={(e) => setNewChannelData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-2 py-1 text-xs bg-surface-dark border border-border rounded"
                      placeholder="채널 설명"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowCreateChannel(false)}
                    className="flex-1 px-3 py-2 text-xs bg-surface-dark rounded hover:bg-surface-elevated transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCreateChannel}
                    disabled={!newChannelData.name}
                    className="flex-1 px-3 py-2 text-xs bg-accent-green text-background font-medium rounded hover:bg-accent-green-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    생성
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CEP 패널 정보 */}
        <AnimatePresence>
          {uiVisibility.appInfo && (
            <motion.div
              className="text-center text-xs text-muted-foreground/50 space-y-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p>팀_오비스트라 v1.0</p>
              <p>One Vision, Intelligent Strategy</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 학습 인터페이스 */}
      <AnimatePresence>
        {showLearningInterface && learningChannel && (
          <LearningInterface
            channel={learningChannel}
            isVisible={showLearningInterface}
            onClose={handleLearningClose}
            onComplete={handleLearningComplete}
          />
        )}
      </AnimatePresence>

      {/* 훈련 데이터 관리자 */}
      <AnimatePresence>
        {showTrainingDataManager && trainingDataChannel && (
          <TrainingDataManager
            channel={trainingDataChannel}
            isVisible={showTrainingDataManager}
            onClose={handleTrainingDataClose}
            onUpdate={handleTrainingDataUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}