# 팀_오비스트라 (Team_Ovistra) 프론트엔드 PRD
## Product Requirements Document for Frontend Engineering

> **"One Vision, Intelligent Strategy"** - AI 영상 편집 오케스트라 프론트엔드 시스템

---

## 📋 문서 정보

| 항목 | 내용 |
|------|------|
| **프로젝트명** | 팀_오비스트라 (Team_Ovistra) |
| **문서 버전** | v1.0.0 |
| **작성일** | 2025-01-22 |
| **대상 독자** | 프론트엔드 개발자, UI/UX 디자이너, QA 엔지니어 |
| **승인자** | CTO, Lead Frontend Engineer |

---

## 🎯 제품 개요

### 비전
**"버튼 하나로 완성되는 프로페셔널 영상 편집"**을 실현하는 직관적이고 혁신적인 사용자 인터페이스 구축

### 핵심 가치
- **극단적 단순함**: 복잡한 AI 기술을 단순한 버튼 하나로
- **실시간 피드백**: AI 처리 상태의 실시간 시각화
- **프리미어 프로 경험**: 기존 편집자들에게 친숙한 UX
- **한국형 최적화**: 한국 사용자 경험에 특화된 UI

### 사용자 페르소나
```typescript
interface UserPersona {
  primary: {
    name: "유튜브 크리에이터"
    experience: "편집 경험 1-3년"
    painPoint: "반복적인 편집 작업의 피로감"
    goal: "편집 시간 단축과 품질 향상"
  }
  
  secondary: {
    name: "편집 전문가"
    experience: "편집 경험 5년 이상"
    painPoint: "클라이언트 요구사항의 빠른 변화"
    goal: "AI를 활용한 효율성 극대화"
  }
}
```

---

## 🛠️ 기술 스택

### 핵심 프레임워크
```json
{
  "framework": "React 18 + TypeScript",
  "bundler": "Vite 5",
  "state": "Zustand",
  "styling": "Tailwind CSS v4 + CSS Modules",
  "ui": "Radix UI + Custom Components", 
  "animation": "Framer Motion",
  "charts": "Recharts",
  "testing": "Vitest + React Testing Library"
}
```

### 추가 라이브러리
```typescript
// 패키지 의존성
"dependencies": {
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "zustand": "^4.4.0",
  "framer-motion": "^10.16.0",
  "recharts": "^2.8.0",
  "@radix-ui/react-avatar": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-progress": "^1.0.3",
  "lucide-react": "^0.292.0",
  "tailwindcss": "^4.0.0-alpha",
  "socket.io-client": "^4.7.0"
}

// 개발 의존성
"devDependencies": {
  "vite": "^5.0.0",
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "eslint": "^8.55.0",
  "@typescript-eslint/eslint-plugin": "^6.0.0"
}
```

---

## 🏗️ 애플리케이션 아키텍처

### 컴포넌트 계층 구조
```
App.tsx
├── Layout/
│   ├── Sidebar.tsx                 # 채널 관리 + 프로필 선택
│   ├── MainContent.tsx             # 중앙 작업 영역
│   └── StatusBar.tsx               # 하단 상태 표시
│
├── Core/
│   ├── MagicButton.tsx             # 핵심 AI 실행 버튼
│   ├── TimelineVisualizer.tsx      # 타임라인 시각화
│   ├── AIStatusMonitor.tsx         # AI 처리 상태 모니터
│   └── FileUploader.tsx            # 파일 업로드 인터페이스
│
├── Features/
│   ├── ProfileManager/
│   │   ├── ProfileSelector.tsx
│   │   ├── ProfileEditor.tsx
│   │   └── ProfileSettings.tsx
│   │
│   ├── ProjectManager/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDetails.tsx
│   │   └── ProjectHistory.tsx
│   │
│   └── ChannelIntegration/
│       ├── ChannelConnector.tsx
│       ├── PlatformOptimizer.tsx
│       └── UploadScheduler.tsx
│
└── UI/
    ├── radix-ui/                   # Radix UI 기반 컴포넌트
    ├── charts/                     # Recharts 래퍼
    └── animations/                 # Framer Motion 컴포넌트
```

---

## 🧩 핵심 컴포넌트 명세

### 1. 매직 버튼 컴포넌트

#### 인터페이스 정의
```typescript
interface MagicButtonProps {
  onClick: () => Promise<void>
  disabled?: boolean
  processing?: boolean
  complete?: boolean
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

interface MagicButtonState {
  isHovered: boolean
  isPressed: boolean
  rippleEffect: boolean
  glowIntensity: number
}
```

#### 구현 명세
```typescript
const MagicButton: React.FC<MagicButtonProps> = ({ 
  onClick, 
  disabled = false, 
  processing = false,
  complete = false,
  variant = 'primary',
  size = 'lg'
}) => {
  const [state, setState] = useState<MagicButtonState>({
    isHovered: false,
    isPressed: false,
    rippleEffect: false,
    glowIntensity: 0.3
  })

  const buttonVariants = {
    idle: { 
      scale: 1, 
      y: 0,
      boxShadow: "0 4px 20px rgba(0, 255, 136, 0.3)"
    },
    hover: { 
      scale: 1.05, 
      y: -2,
      boxShadow: "0 6px 30px rgba(0, 255, 136, 0.4)"
    },
    tap: { 
      scale: 0.95, 
      y: 0,
      boxShadow: "0 2px 10px rgba(0, 255, 136, 0.5)"
    }
  }

  return (
    <motion.button
      className={cn(
        "magic-button",
        `magic-button--${variant}`,
        `magic-button--${size}`,
        { "magic-button--disabled": disabled || processing }
      )}
      variants={buttonVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      disabled={disabled || processing}
    >
      <AnimatePresence mode="wait">
        {processing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI가 작업 중...</span>
          </motion.div>
        ) : complete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <Check className="w-5 h-5" />
            <span>편집 완료!</span>
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5" />
            <span>AI 편집 시작</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 글로우 이펙트 */}
      <motion.div
        className="magic-glow"
        animate={{ 
          opacity: state.isPressed ? 1 : 0,
          scale: state.isPressed ? 1.2 : 1
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}
```

### 2. 타임라인 시각화 컴포넌트

#### 인터페이스 정의
```typescript
interface TimelineVisualizerProps {
  timeline: Timeline
  markers: Marker[]
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  onMarkerAdd: (time: number, type: MarkerType) => void
  zoom: number
  readonly?: boolean
}

interface Timeline {
  tracks: Track[]
  duration: number
  frameRate: number
  resolution: { width: number, height: number }
}

interface Track {
  id: string
  type: 'video' | 'audio' | 'subtitle' | 'effect'
  clips: Clip[]
  height: number
  visible: boolean
  locked: boolean
}

interface Marker {
  id: string
  time: number
  type: 'cut' | 'highlight' | 'note' | 'ai_suggestion'
  label: string
  color: string
  confidence?: number // AI 제안의 신뢰도
}
```

#### 구현 명세
```typescript
const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  timeline,
  markers,
  currentTime,
  duration,
  onSeek,
  onMarkerAdd,
  zoom = 1,
  readonly = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 타임라인 렌더링 로직
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 캔버스 크기 설정
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    
    // 타임라인 렌더링
    renderTimeline(ctx, {
      timeline,
      markers,
      currentTime,
      duration,
      zoom,
      width: rect.width,
      height: rect.height
    })
  }, [timeline, markers, currentTime, duration, zoom])
  
  // 클릭 이벤트 처리
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (readonly) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const time = (x / rect.width) * duration
    
    onSeek(time)
  }, [duration, onSeek, readonly])
  
  // 마커 추가 (더블클릭)
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    if (readonly) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const time = (x / rect.width) * duration
    
    onMarkerAdd(time, 'note')
  }, [duration, onMarkerAdd, readonly])
  
  return (
    <div 
      ref={containerRef}
      className="timeline-container relative w-full h-32 bg-surface-dark border border-border rounded-lg overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-pointer"
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
      />
      
      {/* 현재 시간 인디케이터 */}
      <motion.div
        className="absolute top-0 w-0.5 h-full bg-accent-green z-10"
        style={{
          left: `${(currentTime / duration) * 100}%`
        }}
        initial={false}
        animate={{ 
          left: `${(currentTime / duration) * 100}%` 
        }}
        transition={{ type: "tween", duration: 0.1 }}
      >
        <div className="absolute -top-1 -left-2 w-4 h-3 bg-accent-green rounded-sm" />
      </motion.div>
      
      {/* 마커 표시 */}
      {markers.map((marker) => (
        <motion.div
          key={marker.id}
          className={cn(
            "absolute top-0 w-0.5 h-full z-20",
            {
              "bg-blue-500": marker.type === 'cut',
              "bg-yellow-500": marker.type === 'highlight',
              "bg-gray-500": marker.type === 'note',
              "bg-purple-500": marker.type === 'ai_suggestion'
            }
          )}
          style={{
            left: `${(marker.time / duration) * 100}%`
          }}
          whileHover={{ scale: 1.5 }}
          title={marker.label}
        />
      ))}
      
      {/* 타임라인 컨트롤 */}
      <TimelineControls 
        currentTime={currentTime}
        duration={duration}
        zoom={zoom}
        onZoomChange={(newZoom) => {/* 줌 변경 로직 */}}
      />
    </div>
  )
}
```

### 3. AI 상태 모니터 컴포넌트

#### 인터페이스 정의
```typescript
interface AIStatusMonitorProps {
  className?: string
  showDetails?: boolean
  realtime?: boolean
}

interface AIUsageData {
  models: {
    [modelName: string]: {
      tokens: number
      cost: number
      requests: number
      avgResponseTime: number
    }
  }
  totalCost: number
  totalTokens: number
  currentQuota: number
  quotaLimit: number
}
```

#### 구현 명세
```typescript
const AIStatusMonitor: React.FC<AIStatusMonitorProps> = ({ 
  className,
  showDetails = true,
  realtime = true 
}) => {
  const { usage, costs, isLoading } = useAIUsage({ realtime })
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  
  const usagePercentage = (usage.totalTokens / usage.quotaLimit) * 100
  const costTrend = useCostTrend(7) // 7일간 비용 추이
  
  return (
    <Card className={cn("ai-status-monitor", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent-green" />
          <h3 className="font-semibold">AI 사용 현황</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span className="text-sm text-muted-foreground">실시간</span>
        </div>
      </div>
      
      {/* 사용량 요약 */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">이번 달 사용량</span>
          <span className="font-medium">
            {usage.totalTokens.toLocaleString()} / {usage.quotaLimit.toLocaleString()} 토큰
          </span>
        </div>
        
        <Progress 
          value={usagePercentage} 
          className="w-full h-2"
        />
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">총 비용</span>
          <span className="font-medium text-lg">
            ${costs.totalCost.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* 모델별 상세 */}
      {showDetails && (
        <div className="p-4 border-t border-border">
          <h4 className="font-medium mb-3">모델별 사용량</h4>
          <div className="space-y-3">
            {Object.entries(usage.models).map(([modelName, data]) => (
              <motion.div
                key={modelName}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors",
                  selectedModel === modelName 
                    ? "bg-accent-green/10 border border-accent-green/20" 
                    : "bg-surface-elevated hover:bg-surface-elevated/80"
                )}
                onClick={() => setSelectedModel(
                  selectedModel === modelName ? null : modelName
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-chart-1" />
                    <span className="font-medium">{modelName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${data.cost.toFixed(4)}</div>
                    <div className="text-xs text-muted-foreground">
                      {data.tokens.toLocaleString()} 토큰
                    </div>
                  </div>
                </div>
                
                {/* 확장된 상세 정보 */}
                <AnimatePresence>
                  {selectedModel === modelName && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-border/50"
                    >
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">요청 횟수</span>
                          <div className="font-medium">{data.requests}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">평균 응답시간</span>
                          <div className="font-medium">{data.avgResponseTime}ms</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* 비용 추이 차트 */}
      {showDetails && costTrend.length > 0 && (
        <div className="p-4 border-t border-border">
          <h4 className="font-medium mb-3">7일간 비용 추이</h4>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costTrend}>
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="var(--color-accent-green)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  )
}
```

---

## 🗄️ 상태 관리 (Zustand)

### 전역 상태 구조
```typescript
interface AppState {
  // 프로젝트 상태
  currentProject: Project | null
  timeline: Timeline | null
  projectHistory: ProjectVersion[]
  
  // AI 처리 상태
  aiStatus: 'idle' | 'analyzing' | 'processing' | 'complete' | 'error'
  aiProgress: number
  aiStage: string
  aiError: string | null
  
  // 프로필 관리
  activeProfile: Profile | null
  profiles: Profile[]
  profileSettings: ProfileSettings
  
  // 채널 연동
  connectedChannels: Channel[]
  platformSettings: PlatformSettings
  
  // UI 상태
  sidebarCollapsed: boolean
  timelineZoom: number
  selectedMarkers: string[]
  
  // 실시간 데이터
  aiUsage: AIUsageData
  systemStatus: SystemStatus
}

interface AppActions {
  // 프로젝트 액션
  loadProject: (projectId: string) => Promise<void>
  saveProject: () => Promise<void>
  createProject: (data: CreateProjectData) => Promise<string>
  
  // AI 처리 액션
  startAIEdit: (options?: AIEditOptions) => Promise<void>
  pauseAIEdit: () => void
  resumeAIEdit: () => void
  cancelAIEdit: () => void
  
  // 프로필 액션
  selectProfile: (profileId: string) => void
  createProfile: (data: CreateProfileData) => Promise<string>
  updateProfile: (profileId: string, updates: Partial<Profile>) => Promise<void>
  deleteProfile: (profileId: string) => Promise<void>
  
  // 타임라인 액션
  updateTimeline: (timeline: Timeline) => void
  addMarker: (marker: Marker) => void
  removeMarker: (markerId: string) => void
  seekTo: (time: number) => void
  
  // UI 액션
  toggleSidebar: () => void
  setTimelineZoom: (zoom: number) => void
  selectMarkers: (markerIds: string[]) => void
}
```

### Store 구현
```typescript
const useAppStore = create<AppState & AppActions>((set, get) => ({
  // 초기 상태
  currentProject: null,
  timeline: null,
  projectHistory: [],
  aiStatus: 'idle',
  aiProgress: 0,
  aiStage: '',
  aiError: null,
  activeProfile: null,
  profiles: [],
  profileSettings: {},
  connectedChannels: [],
  platformSettings: {},
  sidebarCollapsed: false,
  timelineZoom: 1,
  selectedMarkers: [],
  aiUsage: {
    models: {},
    totalCost: 0,
    totalTokens: 0,
    currentQuota: 0,
    quotaLimit: 5000
  },
  systemStatus: {
    connected: true,
    latency: 0,
    serverStatus: 'healthy'
  },
  
  // 프로젝트 액션
  loadProject: async (projectId: string) => {
    try {
      const project = await api.projects.get(projectId)
      const timeline = await api.timelines.get(projectId)
      
      set({ 
        currentProject: project,
        timeline: timeline,
        aiStatus: 'idle'
      })
    } catch (error) {
      console.error('Failed to load project:', error)
      set({ aiError: error.message })
    }
  },
  
  saveProject: async () => {
    const { currentProject, timeline } = get()
    if (!currentProject) return
    
    try {
      await api.projects.update(currentProject.id, {
        timeline,
        lastModified: new Date()
      })
    } catch (error) {
      console.error('Failed to save project:', error)
    }
  },
  
  createProject: async (data: CreateProjectData) => {
    try {
      const project = await api.projects.create(data)
      set({ currentProject: project })
      return project.id
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  },
  
  // AI 처리 액션
  startAIEdit: async (options: AIEditOptions = {}) => {
    const { currentProject, activeProfile } = get()
    if (!currentProject || !activeProfile) return
    
    set({ 
      aiStatus: 'analyzing',
      aiProgress: 0,
      aiStage: '영상 분석 중...',
      aiError: null
    })
    
    try {
      // WebSocket 연결을 통한 실시간 진행 상황 업데이트
      const socket = getSocket()
      
      socket.on('ai:progress', (data) => {
        set({ 
          aiProgress: data.progress,
          aiStage: data.stage 
        })
      })
      
      socket.on('ai:complete', (result) => {
        set({ 
          aiStatus: 'complete',
          timeline: result.timeline,
          aiProgress: 100
        })
      })
      
      socket.on('ai:error', (error) => {
        set({ 
          aiStatus: 'error',
          aiError: error.message 
        })
      })
      
      // AI 편집 시작
      await api.ai.startEdit({
        projectId: currentProject.id,
        profileId: activeProfile.id,
        ...options
      })
      
      set({ aiStatus: 'processing' })
      
    } catch (error) {
      set({ 
        aiStatus: 'error',
        aiError: error.message 
      })
    }
  },
  
  pauseAIEdit: () => {
    const socket = getSocket()
    socket.emit('ai:pause')
    // 로컬 상태는 서버 응답 후 업데이트
  },
  
  resumeAIEdit: () => {
    const socket = getSocket()
    socket.emit('ai:resume')
  },
  
  cancelAIEdit: () => {
    const socket = getSocket()
    socket.emit('ai:cancel')
    set({ 
      aiStatus: 'idle',
      aiProgress: 0,
      aiStage: '',
      aiError: null 
    })
  },
  
  // 프로필 액션
  selectProfile: (profileId: string) => {
    const { profiles } = get()
    const profile = profiles.find(p => p.id === profileId)
    set({ activeProfile: profile || null })
  },
  
  createProfile: async (data: CreateProfileData) => {
    try {
      const profile = await api.profiles.create(data)
      const { profiles } = get()
      set({ 
        profiles: [...profiles, profile],
        activeProfile: profile 
      })
      return profile.id
    } catch (error) {
      console.error('Failed to create profile:', error)
      throw error
    }
  },
  
  // 타임라인 액션
  updateTimeline: (timeline: Timeline) => {
    set({ timeline })
    
    // 자동 저장 (디바운스)
    const { saveProject } = get()
    debouncedSave(saveProject)
  },
  
  addMarker: (marker: Marker) => {
    const { timeline } = get()
    if (!timeline) return
    
    const updatedTimeline = {
      ...timeline,
      markers: [...(timeline.markers || []), marker]
    }
    
    set({ timeline: updatedTimeline })
  },
  
  seekTo: (time: number) => {
    // 타임라인의 현재 시간 업데이트
    const socket = getSocket()
    socket.emit('timeline:seek', { time })
  },
  
  // UI 액션
  toggleSidebar: () => {
    const { sidebarCollapsed } = get()
    set({ sidebarCollapsed: !sidebarCollapsed })
  },
  
  setTimelineZoom: (zoom: number) => {
    set({ timelineZoom: Math.max(0.1, Math.min(10, zoom)) })
  }
}))

// 디바운스된 저장 함수
const debouncedSave = debounce((saveProject: () => Promise<void>) => {
  saveProject()
}, 1000)
```

---

## 🌐 API 연동

### REST API 클라이언트
```typescript
// API 클라이언트 구성
class APIClient {
  private baseURL: string
  private token: string | null = null
  
  constructor(baseURL: string) {
    this.baseURL = baseURL
  }
  
  setAuthToken(token: string) {
    this.token = token
  }
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    if (!response.ok) {
      throw new APIError(response.status, await response.text())
    }
    
    return response.json()
  }
  
  // 프로젝트 API
  projects = {
    list: () => this.request<Project[]>('/api/projects'),
    get: (id: string) => this.request<Project>(`/api/projects/${id}`),
    create: (data: CreateProjectData) => 
      this.request<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Project>) =>
      this.request<Project>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      this.request<void>(`/api/projects/${id}`, {
        method: 'DELETE'
      })
  }
  
  // AI API
  ai = {
    startEdit: (data: AIEditRequest) =>
      this.request<AIEditResponse>('/api/ai/edit', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getModels: () =>
      this.request<AIModel[]>('/api/ai/models'),
    switchModel: (category: string, modelId: string) =>
      this.request<void>(`/api/ai/models/${category}/active`, {
        method: 'PUT',
        body: JSON.stringify({ modelId })
      }),
    getUsage: (period?: string) =>
      this.request<AIUsageData>(`/api/ai/usage${period ? `?period=${period}` : ''}`)
  }
  
  // 프로필 API
  profiles = {
    list: () => this.request<Profile[]>('/api/profiles'),
    get: (id: string) => this.request<Profile>(`/api/profiles/${id}`),
    create: (data: CreateProfileData) =>
      this.request<Profile>('/api/profiles', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: Partial<Profile>) =>
      this.request<Profile>(`/api/profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      this.request<void>(`/api/profiles/${id}`, {
        method: 'DELETE'
      }),
    export: (id: string) =>
      this.request<ProfileExport>(`/api/profiles/${id}/export`),
    import: (data: ProfileImport) =>
      this.request<Profile>('/api/profiles/import', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
}

// API 인스턴스
export const api = new APIClient(process.env.REACT_APP_API_URL || 'http://localhost:3000')
```

### WebSocket 연결
```typescript
class WebSocketManager {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  connect(token: string) {
    this.socket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:3000', {
      auth: { token },
      transports: ['websocket']
    })
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    })
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      this.handleReconnect()
    })
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.handleReconnect()
    })
    
    // AI 처리 이벤트
    this.socket.on('ai:progress', (data) => {
      useAppStore.getState().updateAIProgress(data)
    })
    
    this.socket.on('ai:complete', (result) => {
      useAppStore.getState().completeAIEdit(result)
    })
    
    this.socket.on('ai:error', (error) => {
      useAppStore.getState().setAIError(error)
    })
    
    // 실시간 협업 이벤트
    this.socket.on('timeline:changed', (timeline) => {
      useAppStore.getState().updateTimeline(timeline)
    })
    
    this.socket.on('user:joined', (user) => {
      // 사용자 참가 알림
    })
    
    this.socket.on('user:left', (user) => {
      // 사용자 떠남 알림
    })
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.socket?.connect()
      }, 1000 * this.reconnectAttempts)
    }
  }
  
  emit(event: string, data?: any) {
    this.socket?.emit(event, data)
  }
  
  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }
}

export const wsManager = new WebSocketManager()
```

---

## 🎨 디자인 시스템

### 색상 팔레트 (Tailwind v4)
```css
/* 현재 구현된 색상 시스템 확장 */
:root {
  /* 기존 색상 유지 */
  --background: #1E1E1E;
  --surface-dark: #252525;
  --surface-elevated: #2D2D2D;
  --accent-green: #00FF88;
  
  /* 추가 색상 정의 */
  --accent-blue: #007AFF;
  --accent-purple: #5856D6;
  --accent-orange: #FF9500;
  
  /* 상태별 색상 */
  --success: #00FF88;
  --warning: #FFB800;
  --error: #FF3B30;
  --info: #007AFF;
  
  /* 그라데이션 */
  --gradient-primary: linear-gradient(135deg, #00FF88 0%, #00CC6F 100%);
  --gradient-secondary: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  
  /* 그림자 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.15);
  --shadow-glow: 0 4px 20px rgba(0, 255, 136, 0.3);
}
```

### 컴포넌트 스타일링
```css
/* 매직 버튼 스타일 확장 */
@layer components {
  .magic-button {
    @apply relative overflow-hidden rounded-lg border-none px-8 py-4 transition-all duration-300 ease-out;
    background: var(--gradient-primary);
    color: var(--background);
    font-weight: 600;
    box-shadow: var(--shadow-glow);
  }
  
  .magic-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 30px rgba(0, 255, 136, 0.4);
  }
  
  .magic-button--secondary {
    background: var(--surface-elevated);
    color: var(--foreground);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-md);
  }
  
  .magic-button--outline {
    background: transparent;
    color: var(--accent-green);
    border: 2px solid var(--accent-green);
    box-shadow: none;
  }
  
  .magic-button--sm {
    @apply px-4 py-2 text-sm;
  }
  
  .magic-button--lg {
    @apply px-10 py-5 text-lg;
  }
  
  /* 타임라인 스타일 */
  .timeline-container {
    background: var(--surface-dark);
    border: 1px solid var(--border);
  }
  
  .timeline-track {
    background: var(--surface-elevated);
    border-bottom: 1px solid var(--border);
  }
  
  .timeline-clip {
    background: var(--accent-green);
    color: var(--background);
    border-radius: 4px;
  }
  
  .timeline-marker {
    background: var(--accent-blue);
    border-radius: 50%;
  }
  
  /* AI 상태 모니터 */
  .ai-status-monitor {
    background: var(--surface-dark);
    border: 1px solid var(--border);
  }
  
  .usage-bar {
    background: var(--surface-elevated);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .usage-fill {
    background: var(--gradient-primary);
    height: 100%;
    transition: width 0.3s ease;
  }
}
```

---

## 📱 반응형 디자인

### 브레이크포인트 정의
```css
/* Tailwind v4 커스텀 브레이크포인트 */
@custom-media --mobile (width < 768px);
@custom-media --tablet (768px <= width < 1024px);
@custom-media --desktop (width >= 1024px);
@custom-media --large (width >= 1440px);
```

### 반응형 레이아웃
```typescript
// 반응형 레이아웃 컴포넌트
const ResponsiveLayout: React.FC = () => {
  const [isMobile] = useMediaQuery('(max-width: 768px)')
  const [isTablet] = useMediaQuery('(max-width: 1024px)')
  
  return (
    <div className={cn(
      "h-screen w-full bg-background flex",
      isMobile ? "flex-col" : "flex-row"
    )}>
      {/* 사이드바 - 모바일에서는 드로어로 */}
      {isMobile ? (
        <MobileSidebar />
      ) : (
        <Sidebar collapsed={isTablet} />
      )}
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col">
        <MainContent 
          layout={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
        />
        
        {/* 상태바 - 모바일에서는 생략 */}
        {!isMobile && <StatusBar />}
      </div>
    </div>
  )
}

// 모바일 사이드바 (드로어)
const MobileSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      {/* 햄버거 메뉴 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-surface-elevated rounded-md"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="font-semibold">팀_오비스트라</h1>
        <div className="w-10" /> {/* 균형 맞춤 */}
      </div>
      
      {/* 드로어 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 드로어 콘텐츠 */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 h-full w-80 bg-surface-dark z-50"
            >
              <Sidebar onClose={() => setIsOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
```

---

## ⚡ 성능 최적화

### 컴포넌트 최적화
```typescript
// React.memo를 활용한 렌더링 최적화
export const MagicButton = React.memo<MagicButtonProps>(({ 
  onClick, 
  disabled, 
  processing,
  complete 
}) => {
  // 컴포넌트 구현
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수
  return (
    prevProps.disabled === nextProps.disabled &&
    prevProps.processing === nextProps.processing &&
    prevProps.complete === nextProps.complete
  )
})

// useMemo를 활용한 계산 최적화
const TimelineVisualizer = React.memo<TimelineVisualizerProps>(({
  timeline,
  markers,
  currentTime,
  duration
}) => {
  // 무거운 계산 결과 캐싱
  const timelineData = useMemo(() => {
    return processTimelineData(timeline, markers)
  }, [timeline, markers])
  
  // 렌더링 함수 캐싱
  const renderTimeline = useCallback((ctx: CanvasRenderingContext2D) => {
    drawTimeline(ctx, timelineData, currentTime, duration)
  }, [timelineData, currentTime, duration])
  
  return (
    <canvas ref={canvasRef} />
  )
})

// useCallback을 활용한 이벤트 핸들러 최적화
const useOptimizedHandlers = () => {
  const handleAIStart = useCallback(async () => {
    // AI 시작 로직
  }, [])
  
  const handleMarkerAdd = useCallback((time: number, type: MarkerType) => {
    // 마커 추가 로직
  }, [])
  
  return { handleAIStart, handleMarkerAdd }
}
```

### 번들 최적화
```typescript
// 코드 스플리팅
const ProfileEditor = lazy(() => import('./components/ProfileEditor'))
const TimelineEditor = lazy(() => import('./components/TimelineEditor'))
const AIModelSelector = lazy(() => import('./components/AIModelSelector'))

// 동적 임포트를 활용한 조건부 로딩
const loadHeavyComponent = async () => {
  if (userHasPremium) {
    const { PremiumFeatures } = await import('./components/PremiumFeatures')
    return PremiumFeatures
  }
  return null
}

// 이미지 최적화
const OptimizedImage: React.FC<{
  src: string
  alt: string
  width?: number
  height?: number
}> = ({ src, alt, width, height }) => {
  return (
    <picture>
      <source 
        srcSet={`${src}?w=${width}&h=${height}&format=webp`} 
        type="image/webp" 
      />
      <img 
        src={`${src}?w=${width}&h=${height}`}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
    </picture>
  )
}
```

### 메모리 관리
```typescript
// WebSocket 연결 정리
useEffect(() => {
  const socket = wsManager.connect(authToken)
  
  return () => {
    socket.disconnect()
  }
}, [authToken])

// 타이머 정리
useEffect(() => {
  const interval = setInterval(() => {
    updateAIProgress()
  }, 1000)
  
  return () => {
    clearInterval(interval)
  }
}, [])

// 이벤트 리스너 정리
useEffect(() => {
  const handleResize = () => {
    updateCanvasSize()
  }
  
  window.addEventListener('resize', handleResize)
  
  return () => {
    window.removeEventListener('resize', handleResize)
  }
}, [])
```

---

## 🧪 테스트 전략

### 단위 테스트 (Vitest)
```typescript
// 매직 버튼 테스트
describe('MagicButton', () => {
  it('renders with default state', () => {
    render(<MagicButton onClick={vi.fn()} />)
    
    expect(screen.getByText('AI 편집 시작')).toBeInTheDocument()
    expect(screen.getByRole('button')).not.toBeDisabled()
  })
  
  it('shows processing state', () => {
    render(<MagicButton onClick={vi.fn()} processing={true} />)
    
    expect(screen.getByText('AI가 작업 중...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })
  
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<MagicButton onClick={handleClick} />)
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledOnce()
  })
})

// Zustand 스토어 테스트
describe('AppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentProject: null,
      aiStatus: 'idle',
      profiles: []
    })
  })
  
  it('loads project successfully', async () => {
    const mockProject = { id: '1', name: 'Test Project' }
    vi.mocked(api.projects.get).mockResolvedValue(mockProject)
    
    await useAppStore.getState().loadProject('1')
    
    expect(useAppStore.getState().currentProject).toEqual(mockProject)
  })
  
  it('handles AI edit flow', async () => {
    const { startAIEdit } = useAppStore.getState()
    
    // AI 편집 시작
    await startAIEdit()
    
    expect(useAppStore.getState().aiStatus).toBe('analyzing')
    
    // 진행 상황 업데이트 시뮬레이션
    act(() => {
      useAppStore.getState().updateAIProgress({ progress: 50, stage: '처리 중' })
    })
    
    expect(useAppStore.getState().aiProgress).toBe(50)
  })
})
```

### 통합 테스트
```typescript
// API 연동 테스트
describe('API Integration', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })
  
  it('creates project and starts AI edit', async () => {
    const mockProject = { id: '1', name: 'New Project' }
    const mockEditResponse = { taskId: 'task-1', status: 'processing' }
    
    fetchMock
      .mockResponseOnce(JSON.stringify(mockProject))
      .mockResponseOnce(JSON.stringify(mockEditResponse))
    
    // 프로젝트 생성
    const projectId = await api.projects.create({
      name: 'New Project',
      profileId: 'profile-1'
    })
    
    expect(projectId).toBe('1')
    
    // AI 편집 시작
    const result = await api.ai.startEdit({
      projectId,
      profileId: 'profile-1'
    })
    
    expect(result.status).toBe('processing')
  })
})

// WebSocket 테스트
describe('WebSocket Integration', () => {
  let mockSocket: any
  
  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn()
    }
    vi.mocked(io).mockReturnValue(mockSocket)
  })
  
  it('handles AI progress updates', () => {
    wsManager.connect('test-token')
    
    // 이벤트 핸들러 확인
    expect(mockSocket.on).toHaveBeenCalledWith('ai:progress', expect.any(Function))
    
    // 진행 상황 업데이트 시뮬레이션
    const progressHandler = mockSocket.on.mock.calls
      .find(call => call[0] === 'ai:progress')[1]
    
    act(() => {
      progressHandler({ progress: 75, stage: '색상 보정 중' })
    })
    
    expect(useAppStore.getState().aiProgress).toBe(75)
  })
})
```

### E2E 테스트 (Playwright)
```typescript
// E2E 테스트
test.describe('AI Edit Flow', () => {
  test('complete AI edit workflow', async ({ page }) => {
    // 로그인
    await page.goto('/login')
    await page.fill('[data-testid=email]', 'test@example.com')
    await page.fill('[data-testid=password]', 'password')
    await page.click('[data-testid=login-button]')
    
    // 프로젝트 생성
    await page.click('[data-testid=new-project]')
    await page.fill('[data-testid=project-name]', 'E2E Test Project')
    await page.click('[data-testid=create-project]')
    
    // 프로필 선택
    await page.click('[data-testid=profile-selector]')
    await page.click('[data-testid=profile-option-1]')
    
    // 파일 업로드
    await page.setInputFiles('[data-testid=file-input]', 'test-video.mp4')
    
    // AI 편집 시작
    await page.click('[data-testid=magic-button]')
    
    // 처리 상태 확인
    await expect(page.locator('[data-testid=ai-status]')).toContainText('AI가 작업 중')
    
    // 진행률 업데이트 대기
    await expect(page.locator('[data-testid=progress-bar]')).toHaveAttribute('value', '100', { timeout: 30000 })
    
    // 완료 상태 확인
    await expect(page.locator('[data-testid=ai-status]')).toContainText('편집 완료')
    
    // 결과 확인
    await page.click('[data-testid=view-result]')
    await expect(page.locator('[data-testid=timeline]')).toBeVisible()
  })
})
```

---

## 📦 빌드 및 배포

### Vite 설정
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  
  // 개발 서버 설정
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true
      }
    }
  },
  
  // 빌드 설정
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    
    // 청크 분할
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-avatar', '@radix-ui/react-dialog'],
          animation: ['framer-motion'],
          charts: ['recharts'],
          socket: ['socket.io-client']
        }
      }
    },
    
    // 압축 설정
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // 경로 별칭
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types')
    }
  },
  
  // 환경 변수
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
})
```

### Docker 설정
```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 프로덕션 이미지
FROM nginx:alpine

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 설정
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### CI/CD 파이프라인
```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
  
  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        REACT_APP_API_URL: ${{ secrets.API_URL }}
        REACT_APP_WS_URL: ${{ secrets.WS_URL }}
    
    - name: Build Docker image
      run: |
        docker build -t ovistra/frontend:${{ github.sha }} .
        docker tag ovistra/frontend:${{ github.sha }} ovistra/frontend:latest
    
    - name: Push to registry
      if: github.ref == 'refs/heads/main'
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push ovistra/frontend:${{ github.sha }}
        docker push ovistra/frontend:latest
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          docker pull ovistra/frontend:latest
          docker stop ovistra-frontend || true
          docker rm ovistra-frontend || true
          docker run -d --name ovistra-frontend -p 3000:80 ovistra/frontend:latest
```

---

## 🔧 개발 환경 설정

### VS Code 설정
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "\"([^\"]*)\""]
  ]
}

// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### ESLint 설정
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
}
```

### Prettier 설정
```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## 📊 성능 메트릭

### Core Web Vitals 목표
```typescript
interface PerformanceTargets {
  // Largest Contentful Paint
  LCP: '< 2.5초'
  
  // First Input Delay  
  FID: '< 100ms'
  
  // Cumulative Layout Shift
  CLS: '< 0.1'
  
  // First Contentful Paint
  FCP: '< 1.8초'
  
  // Time to Interactive
  TTI: '< 3.8초'
}
```

### 번들 사이즈 목표
```typescript
interface BundleTargets {
  main: '< 500KB' // 메인 청크
  vendor: '< 300KB' // 라이브러리 청크
  total: '< 1MB' // 전체 초기 로드
  
  // 지연 로딩 청크
  profileEditor: '< 100KB'
  timelineEditor: '< 200KB'
  aiModelSelector: '< 50KB'
}
```

### 모니터링 설정
```typescript
// 성능 모니터링
export const trackPerformance = () => {
  // Core Web Vitals 추적
  getCLS((metric) => {
    analytics.track('performance.cls', { value: metric.value })
  })
  
  getFID((metric) => {
    analytics.track('performance.fid', { value: metric.value })
  })
  
  getLCP((metric) => {
    analytics.track('performance.lcp', { value: metric.value })
  })
  
  // 커스텀 메트릭
  performance.mark('ai-edit-start')
  // AI 편집 완료 후
  performance.mark('ai-edit-end')
  performance.measure('ai-edit-duration', 'ai-edit-start', 'ai-edit-end')
}
```

---

## 🚀 배포 전략

### 환경별 설정
```typescript
// 개발 환경
const developmentConfig = {
  apiUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost:8000',
  debug: true,
  analytics: false
}

// 스테이징 환경
const stagingConfig = {
  apiUrl: 'https://api-staging.ovistra.com',
  wsUrl: 'wss://api-staging.ovistra.com',
  debug: true,
  analytics: true
}

// 프로덕션 환경
const productionConfig = {
  apiUrl: 'https://api.ovistra.com',
  wsUrl: 'wss://api.ovistra.com',
  debug: false,
  analytics: true,
  sentry: true
}
```

### 피처 플래그
```typescript
// 피처 플래그 관리
interface FeatureFlags {
  newTimelineEditor: boolean
  aiModelSwitching: boolean
  realtimeCollaboration: boolean
  premiumFeatures: boolean
}

export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const { user } = useAuth()
  const flags = getFeatureFlags(user.id, user.tier)
  
  return flags[flag] ?? false
}

// 사용 예시
const TimelineEditor = () => {
  const hasNewEditor = useFeatureFlag('newTimelineEditor')
  
  return hasNewEditor ? <NewTimelineEditor /> : <LegacyTimelineEditor />
}
```

---

## 📞 연락처 및 지원

### 개발팀 연락처
- **Frontend Lead**: frontend-lead@ovistra.com
- **UI/UX Designer**: design@ovistra.com  
- **QA Engineer**: qa@ovistra.com

### 문서 및 리소스
- **컴포넌트 스토리북**: https://storybook.ovistra.com
- **디자인 시스템**: https://design.ovistra.com
- **API 문서**: https://docs.ovistra.com

### 이슈 트래킹
- **GitHub Issues**: https://github.com/ovistra/frontend/issues
- **Figma 디자인**: https://figma.com/team/ovistra

---

**마지막 업데이트**: 2025-01-22  
**문서 버전**: v1.0.0  
**검토자**: CTO, Lead Frontend Engineer, UI/UX Lead

---

*이 PRD는 팀_오비스트라 프론트엔드 시스템의 완전한 구현 가이드입니다. 모든 프론트엔드 개발자는 이 문서를 기반으로 개발을 진행해주세요.*