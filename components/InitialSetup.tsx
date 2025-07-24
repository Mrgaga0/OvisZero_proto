import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, FolderPlus, Check, Settings, Sparkles, Folder, Brain } from 'lucide-react'

interface InitialSetupProps {
  onComplete: (settings: any) => void
}

interface SetupStep {
  id: number
  title: string
  description: string
  completed: boolean
}

export function InitialSetup({ onComplete }: InitialSetupProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [setupData, setSetupData] = useState({
    folderStructure: {
      workFolder: '/작업폴더/',
      channels: ['YouTube', 'Instagram', 'TikTok', '외주작업']
    },
    selectedWorkFolder: '/작업폴더/',
    aiModels: {
      main: 'qwen3',
      korean: 'hyperclova-x',
      backup: 'gpt-4'
    }
  })

  const steps: SetupStep[] = [
    {
      id: 1,
      title: '작업 폴더 구조 설정 (예시)',
      description: '프로젝트 자동 감지를 위한 폴더 구조를 설정합니다',
      completed: currentStep > 1
    },
    {
      id: 2,
      title: 'AI 모델 선택',
      description: '사용할 AI 모델과 설정을 선택합니다',
      completed: currentStep > 2
    }
  ]

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    onComplete({
      folderStructure: setupData.folderStructure,
      workFolder: setupData.selectedWorkFolder,
      aiModels: setupData.aiModels,
      channels: [] // 채널 설정 단계가 삭제되었으므로 빈 배열
    })
  }

  const handleFolderSelect = () => {
    // 실제로는 CEP API를 통해 폴더 선택 다이얼로그 표시
    // 시뮬레이션을 위해 몇 가지 옵션 제공
    const selectedFolder = window.prompt('작업 폴더 경로를 입력하세요:', setupData.selectedWorkFolder)
    if (selectedFolder) {
      setSetupData(prev => ({
        ...prev,
        selectedWorkFolder: selectedFolder
      }))
    }
  }

  const handleAIModelChange = (category: 'main' | 'korean' | 'backup', model: string) => {
    setSetupData(prev => ({
      ...prev,
      aiModels: {
        ...prev.aiModels,
        [category]: model
      }
    }))
  }

  const aiModelOptions = {
    main: [
      { value: 'qwen3', label: 'Qwen3', description: '최신 다목적 AI 모델 (권장)' },
      { value: 'gpt-4', label: 'GPT-4', description: '강력한 텍스트 이해' },
      { value: 'claude-3', label: 'Claude-3', description: '정교한 분석 능력' }
    ],
    korean: [
      { value: 'hyperclova-x', label: 'HyperCLOVA X', description: '한국어 특화 모델 (권장)' },
      { value: 'qwen3-korean', label: 'Qwen3 Korean', description: '한국어 튜닝 버전' },
      { value: 'gemini-korean', label: 'Gemini Korean', description: '구글 한국어 모델' }
    ],
    backup: [
      { value: 'gpt-4', label: 'GPT-4', description: '안정적인 백업 모델' },
      { value: 'claude-3', label: 'Claude-3', description: '대안 백업 모델' },
      { value: 'qwen3', label: 'Qwen3', description: '메인과 동일' }
    ]
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* 헤더 */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-accent-green" />
            <h1 className="text-xl font-bold">팀_오비스트라</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            초기 설정을 완료하고 AI 편집을 시작하세요
          </p>
        </motion.div>

        {/* 진행 단계 */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                    ${step.completed 
                      ? 'bg-accent-green text-background' 
                      : currentStep === step.id 
                        ? 'bg-accent-green/20 text-accent-green border-2 border-accent-green' 
                        : 'bg-surface-elevated text-muted-foreground'
                    }
                  `}>
                    {step.completed ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className="text-xs mt-1 text-center max-w-20 text-muted-foreground leading-tight">
                    {step.title.split(' ')[0]}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                    step.completed ? 'bg-accent-green' : 'bg-surface-elevated'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        {/* 단계별 컨텐츠 */}
        <motion.div
          className="bg-surface-elevated rounded-lg p-6 mb-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {/* 단계 1: 폴더 구조 설정 */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <FolderPlus className="w-5 h-5 text-accent-green" />
                  <h3 className="font-semibold">작업 폴더 구조 설정 (예시)</h3>
                </div>
                
                <div className="bg-surface-dark p-4 rounded font-mono text-sm">
                  <div className="space-y-1 text-muted-foreground">
                    <div>📁 {setupData.selectedWorkFolder}</div>
                    <div className="ml-4">└─ YouTube/</div>
                    <div className="ml-4">└─ Instagram/</div>
                    <div className="ml-4">└─ TikTok/</div>
                    <div className="ml-4">└─ 외주작업/</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    이 구조를 통해 프로젝트 경로로 채널을 자동 감지합니다.
                    나중에 설정에서 변경 가능합니다.
                  </p>
                  
                  {/* 폴더 선택 섹션 */}
                  <div className="p-3 bg-chart-2/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-chart-2">현재 작업 폴더</span>
                      <button
                        onClick={handleFolderSelect}
                        className="flex items-center gap-1 px-3 py-1 bg-accent-green/20 hover:bg-accent-green/30 text-accent-green rounded text-xs font-medium transition-colors"
                      >
                        <Folder className="w-3 h-3" />
                        폴더 선택
                      </button>
                    </div>
                    <p className="text-xs text-chart-2 font-mono">
                      {setupData.selectedWorkFolder}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 단계 2: AI 모델 선택 */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-accent-green" />
                  <h3 className="font-semibold">AI 모델 선택</h3>
                </div>
                
                <div className="space-y-4">
                  {/* 메인 모델 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">메인 모델</label>
                    <p className="text-xs text-muted-foreground">일반적인 편집 작업에 사용</p>
                    <div className="space-y-1">
                      {aiModelOptions.main.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAIModelChange('main', option.value)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            setupData.aiModels.main === option.value
                              ? 'border-accent-green bg-accent-green/10 text-accent-green'
                              : 'border-border bg-surface-dark hover:bg-surface-elevated'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                            {setupData.aiModels.main === option.value && (
                              <Check className="w-4 h-4 text-accent-green" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 한국어 특화 모델 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">한국어 특화 모델</label>
                    <p className="text-xs text-muted-foreground">자막 및 텍스트 처리에 사용</p>
                    <div className="space-y-1">
                      {aiModelOptions.korean.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleAIModelChange('korean', option.value)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            setupData.aiModels.korean === option.value
                              ? 'border-accent-green bg-accent-green/10 text-accent-green'
                              : 'border-border bg-surface-dark hover:bg-surface-elevated'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{option.label}</div>
                              <div className="text-xs text-muted-foreground">{option.description}</div>
                            </div>
                            {setupData.aiModels.korean === option.value && (
                              <Check className="w-4 h-4 text-accent-green" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 백업 모델 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">백업 모델</label>
                    <p className="text-xs text-muted-foreground">메인 모델 오류 시 사용</p>
                    <select
                      value={setupData.aiModels.backup}
                      onChange={(e) => handleAIModelChange('backup', e.target.value)}
                      className="w-full bg-surface-elevated border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-green/50 focus:border-accent-green"
                    >
                      {aiModelOptions.backup.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="p-3 bg-chart-2/10 rounded-lg">
                  <p className="text-xs text-chart-2">
                    <span className="font-medium">💡 참고:</span> 
                    모델은 나중에 고급 설정에서 변경할 수 있습니다.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 액션 버튼 */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 px-4 py-3 bg-surface-dark hover:bg-surface-elevated rounded-lg text-sm font-medium transition-colors"
            >
              이전
            </button>
          )}
          
          <button
            onClick={nextStep}
            className="flex-1 px-4 py-3 bg-accent-green hover:bg-accent-green-hover text-background rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {currentStep === 2 ? (
              <>
                <Check className="w-4 h-4" />
                설정 완료
              </>
            ) : (
              <>
                다음
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}