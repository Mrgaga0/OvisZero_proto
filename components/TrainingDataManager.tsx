import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, X, Trash2, Edit3, CheckCircle2, AlertCircle, Eye, EyeOff, Calendar, Clock, TrendingUp, FileVideo, Save, RotateCcw } from 'lucide-react';

interface Channel {
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

interface LearningSession {
  id: string;
  date: string;
  duration: string;
  patternsLearned: number;
  confidenceImprovement: number;
  projectName: string;
}

interface TrainingDataManagerProps {
  channel: Channel;
  isVisible: boolean;
  onClose: () => void;
  onUpdate: (updatedChannel: Channel) => void;
}

interface EditingSession extends LearningSession {
  isEditing: boolean;
  tempProjectName: string;
  tempDate: string;
  hasChanges: boolean;
}

export function TrainingDataManager({ channel, isVisible, onClose, onUpdate }: TrainingDataManagerProps) {
  const [sessions, setSessions] = useState<EditingSession[]>(
    (channel.learningHistory || []).map(session => ({
      ...session,
      isEditing: false,
      tempProjectName: session.projectName,
      tempDate: session.date,
      hasChanges: false
    }))
  );

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 세션 편집 시작
  const handleEditSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, isEditing: true }
        : { ...session, isEditing: false }
    ));
  };

  // 세션 편집 취소
  const handleCancelEdit = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            isEditing: false, 
            tempProjectName: session.projectName,
            tempDate: session.date,
            hasChanges: false
          }
        : session
    ));
    updateUnsavedChanges();
  };

  // 세션 저장
  const handleSaveSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId && session.isEditing
        ? { 
            ...session, 
            projectName: session.tempProjectName,
            date: session.tempDate,
            isEditing: false,
            hasChanges: false
          }
        : session
    ));
    setHasUnsavedChanges(true);
  };

  // 임시 값 업데이트
  const handleTempUpdate = (sessionId: string, field: 'tempProjectName' | 'tempDate', value: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { 
            ...session, 
            [field]: value,
            hasChanges: session.tempProjectName !== session.projectName || 
                      session.tempDate !== session.date ||
                      (field === 'tempProjectName' && value !== session.projectName) ||
                      (field === 'tempDate' && value !== session.date)
          }
        : session
    ));
  };

  // 삭제 요청
  const handleDeleteRequest = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteStep(1);
    setShowDeleteConfirmation(true);
  };

  // 삭제 단계 진행
  const handleDeleteNext = () => {
    if (deleteStep < 2) {
      setDeleteStep(prev => prev + 1);
    } else {
      // 실제 삭제 실행
      if (sessionToDelete) {
        setSessions(prev => prev.filter(session => session.id !== sessionToDelete));
        setHasUnsavedChanges(true);
      }
      setShowDeleteConfirmation(false);
      setSessionToDelete(null);
      setDeleteStep(1);
    }
  };

  // 삭제 취소
  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
    setSessionToDelete(null);
    setDeleteStep(1);
  };

  // 전체 변경사항 저장
  const handleSaveAll = () => {
    const updatedChannel: Channel = {
      ...channel,
      learningHistory: sessions.map(({ isEditing, tempProjectName, tempDate, hasChanges, ...session }) => session)
    };
    
    onUpdate(updatedChannel);
    setHasUnsavedChanges(false);
  };

  // 변경사항 확인
  const updateUnsavedChanges = () => {
    const hasChanges = sessions.some(session => session.hasChanges) || 
                      sessions.length !== (channel.learningHistory || []).length;
    setHasUnsavedChanges(hasChanges);
  };

  // 변경사항 리셋
  const handleResetChanges = () => {
    setSessions((channel.learningHistory || []).map(session => ({
      ...session,
      isEditing: false,
      tempProjectName: session.projectName,
      tempDate: session.date,
      hasChanges: false
    })));
    setHasUnsavedChanges(false);
  };

  const getDeleteStepContent = () => {
    const session = sessions.find(s => s.id === sessionToDelete);
    switch (deleteStep) {
      case 1:
        return {
          title: '학습 세션 삭제',
          message: `"${session?.projectName}" 학습 세션을 삭제하시겠습니까?`,
          warning: '이 세션의 학습 데이터가 영구적으로 삭제됩니다.',
          buttonText: '삭제',
          buttonColor: 'bg-status-error hover:bg-red-600'
        };
      case 2:
        return {
          title: '정말 삭제하시겠습니까?',
          message: '삭제된 학습 데이터는 복구할 수 없으며, AI 모델의 성능에 영향을 줄 수 있습니다.',
          warning: `${session?.patternsLearned}개의 학습 패턴이 영구 삭제됩니다.`,
          buttonText: '최종 삭제',
          buttonColor: 'bg-red-700 hover:bg-red-800'
        };
      default:
        return { title: '', message: '', warning: '', buttonText: '', buttonColor: '' };
    }
  };

  const deleteContent = getDeleteStepContent();

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
        className="bg-surface-elevated rounded-lg max-w-2xl w-full m-4 max-h-[85vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-chart-2" />
            <div>
              <h3 className="font-semibold">{channel.name} - 훈련 데이터</h3>
              <p className="text-xs text-muted-foreground">
                {sessions.length}개 학습 세션 · 신뢰도 {channel.confidenceScore?.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetChanges}
                  className="p-1 hover:bg-surface-dark rounded text-muted-foreground hover:text-foreground"
                  title="변경사항 취소"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSaveAll}
                  className="flex items-center gap-1 px-2 py-1 bg-accent-green/10 hover:bg-accent-green/20 text-accent-green text-xs rounded transition-colors"
                >
                  <Save className="w-3 h-3" />
                  저장
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-dark rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 학습 세션 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">학습 세션이 없습니다</p>
              <p className="text-xs text-muted-foreground/70">채널을 학습하면 훈련 데이터가 생성됩니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    session.isEditing ? 'border-accent-green bg-accent-green/5' : 'border-border bg-surface-dark/50'
                  }`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-chart-2/20 flex items-center justify-center flex-shrink-0">
                      <FileVideo className="w-5 h-5 text-chart-2" />
                    </div>

                    <div className="flex-1 space-y-2">
                      {session.isEditing ? (
                        // 편집 모드
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium mb-1">프로젝트 이름</label>
                            <input
                              type="text"
                              value={session.tempProjectName}
                              onChange={(e) => handleTempUpdate(session.id, 'tempProjectName', e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-surface-elevated border border-border rounded focus:ring-1 focus:ring-accent-green/50 focus:border-accent-green"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium mb-1">학습 날짜</label>
                            <input
                              type="date"
                              value={session.tempDate}
                              onChange={(e) => handleTempUpdate(session.id, 'tempDate', e.target.value)}
                              className="w-full px-2 py-1 text-sm bg-surface-elevated border border-border rounded focus:ring-1 focus:ring-accent-green/50 focus:border-accent-green"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveSession(session.id)}
                              disabled={!session.hasChanges}
                              className="flex items-center gap-1 px-3 py-1 bg-accent-green text-background text-xs rounded hover:bg-accent-green-hover disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              저장
                            </button>
                            <button
                              onClick={() => handleCancelEdit(session.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-surface-elevated text-muted-foreground text-xs rounded hover:bg-surface-dark"
                            >
                              <X className="w-3 h-3" />
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 보기 모드
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{session.projectName}</h4>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditSession(session.id)}
                                className="p-1 hover:bg-surface-elevated rounded text-muted-foreground hover:text-foreground"
                                title="편집"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(session.id)}
                                className="p-1 hover:bg-status-error/10 rounded text-status-error/70 hover:text-status-error"
                                title="삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">날짜:</span>
                                <span className="font-medium">{session.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">시간:</span>
                                <span className="font-medium">{session.duration}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <FileVideo className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">패턴:</span>
                                <span className="font-medium">{session.patternsLearned}개</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">개선:</span>
                                <span className="font-medium text-accent-green">+{session.confidenceImprovement.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="p-4 border-t border-border bg-surface-dark/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>총 학습 패턴: {sessions.reduce((sum, s) => sum + s.patternsLearned, 0)}개</span>
              <span>평균 신뢰도 증가: +{(sessions.reduce((sum, s) => sum + s.confidenceImprovement, 0) / (sessions.length || 1)).toFixed(1)}%</span>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-1 text-accent-green">
                <AlertCircle className="w-3 h-3" />
                <span>저장되지 않은 변경사항</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteConfirmation && sessionToDelete && (
          <motion.div
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-10"
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
                      <span>단계 {deleteStep}/2</span>
                      <div className="flex gap-1">
                        {[1, 2].map((step) => (
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
                      <AlertCircle className="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-status-error">{deleteContent.warning}</p>
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
    </motion.div>
  );
}