import { create } from 'zustand'

// 타입 정의
export interface Project {
  id: string
  name: string
  description?: string
  status: 'draft' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export interface Timeline {
  tracks: Track[]
  duration: number
  frameRate: number
  resolution: { width: number, height: number }
  markers?: Marker[]
}

export interface Track {
  id: string
  type: 'video' | 'audio' | 'subtitle' | 'effect'
  clips: Clip[]
  height: number
  visible: boolean
  locked: boolean
}

export interface Clip {
  id: string
  startTime: number
  endTime: number
  name: string
  source: string
}

export interface Marker {
  id: string
  time: number
  type: 'cut' | 'highlight' | 'note' | 'ai_suggestion'
  label: string
  color: string
  confidence?: number
}

export interface Profile {
  id: string
  name: string
  userId: string
  channelId?: string
  editingStyle: Record<string, any>
  colorGrading: Record<string, any>
  audioMixing: Record<string, any>
  platformOptimization: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface StoreChannel {
  id: string
  platform: 'youtube' | 'instagram' | 'tiktok'
  name: string
  status: '연결됨' | '미연결'
  color: string
  icon: string
}

export interface AIUsageData {
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

export interface SystemStatus {
  connected: boolean
  latency: number
  serverStatus: 'healthy' | 'warning' | 'error'
}

// 상태 인터페이스
interface AppState {
  // 프로젝트 상태
  currentProject: Project | null
  timeline: Timeline | null
  projectHistory: Project[]
  
  // AI 처리 상태
  aiStatus: 'idle' | 'analyzing' | 'processing' | 'complete' | 'error'
  aiProgress: number
  aiStage: string
  aiError: string | null
  
  // 프로필 관리
  activeProfile: Profile | null
  profiles: Profile[]
  
  // 채널 연동
  connectedChannels: StoreChannel[]
  
  // UI 상태
  sidebarCollapsed: boolean
  timelineZoom: number
  selectedMarkers: string[]
  uploadingFiles: boolean
  
  // 실시간 데이터
  aiUsage: AIUsageData
  systemStatus: SystemStatus
}

// 액션 인터페이스
interface AppActions {
  // 프로젝트 액션
  setCurrentProject: (project: Project | null) => void
  createProject: (data: Partial<Project>) => Promise<string>
  updateProject: (updates: Partial<Project>) => void
  
  // AI 처리 액션
  startAIEdit: () => Promise<void>
  updateAIProgress: (progress: number, stage: string) => void
  completeAIEdit: (timeline: Timeline) => void
  setAIError: (error: string | null) => void
  resetAI: () => void
  
  // 프로필 액션
  setActiveProfile: (profile: Profile | null) => void
  addProfile: (profile: Profile) => void
  updateProfile: (profileId: string, updates: Partial<Profile>) => void
  removeProfile: (profileId: string) => void
  
  // 타임라인 액션
  updateTimeline: (timeline: Timeline) => void
  addMarker: (marker: Marker) => void
  removeMarker: (markerId: string) => void
  seekTo: (time: number) => void
  
  // UI 액션
  toggleSidebar: () => void
  setTimelineZoom: (zoom: number) => void
  selectMarkers: (markerIds: string[]) => void
  setUploadingFiles: (uploading: boolean) => void
  
  // 실시간 데이터 액션
  updateAIUsage: (usage: Partial<AIUsageData>) => void
  updateSystemStatus: (status: Partial<SystemStatus>) => void
}

// 초기 상태
const initialState: AppState = {
  currentProject: null,
  timeline: null,
  projectHistory: [],
  
  aiStatus: 'idle',
  aiProgress: 0,
  aiStage: '',
  aiError: null,
  
  activeProfile: {
    id: 'default',
    name: '기본 프로필',
    userId: 'user-1',
    editingStyle: {},
    colorGrading: {},
    audioMixing: {},
    platformOptimization: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  profiles: [
    {
      id: 'default',
      name: '기본 프로필',
      userId: 'user-1',
      editingStyle: {},
      colorGrading: {},
      audioMixing: {},
      platformOptimization: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  connectedChannels: [
    { id: '1', platform: 'youtube', name: 'YouTube 채널', status: '연결됨', color: '#FF0000', icon: 'Youtube' },
    { id: '2', platform: 'instagram', name: 'Instagram', status: '연결됨', color: '#E4405F', icon: 'Instagram' },
    { id: '3', platform: 'tiktok', name: 'Twitch', status: '미연결', color: '#9146FF', icon: 'Twitch' },
  ],
  
  sidebarCollapsed: false,
  timelineZoom: 1,
  selectedMarkers: [],
  uploadingFiles: false,
  
  aiUsage: {
    models: {
      'GPT-4': { tokens: 1234, cost: 0.25, requests: 15, avgResponseTime: 1200 },
      'HyperCLOVA': { tokens: 856, cost: 0.12, requests: 8, avgResponseTime: 800 },
      'Exaone': { tokens: 445, cost: 0.08, requests: 5, avgResponseTime: 600 }
    },
    totalCost: 0.45,
    totalTokens: 2535,
    currentQuota: 2535,
    quotaLimit: 5000
  },
  
  systemStatus: {
    connected: true,
    latency: 45,
    serverStatus: 'healthy'
  }
}

// 전역 변수로 활성 시뮬레이션 추적
let activeSimulation: NodeJS.Timeout | null = null

// Zustand 스토어 생성
export const useAppStore = create<AppState & AppActions>()((set, get) => ({
  ...initialState,
  
  // 프로젝트 액션
  setCurrentProject: (project) => {
    set({ currentProject: project })
  },
  
  createProject: async (data) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: data.name || '새 프로젝트',
      description: data.description,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    set({
      currentProject: newProject,
      projectHistory: [newProject, ...get().projectHistory]
    })
    
    return newProject.id
  },
  
  updateProject: (updates) => {
    const { currentProject } = get()
    if (!currentProject) return
    
    const updatedProject = {
      ...currentProject,
      ...updates,
      updatedAt: new Date()
    }
    
    set({
      currentProject: updatedProject,
      projectHistory: get().projectHistory.map(p => 
        p.id === updatedProject.id ? updatedProject : p
      )
    })
  },
  
  // AI 처리 액션 (단순화)
  startAIEdit: async () => {
    const { activeProfile, currentProject } = get()
    if (!activeProfile || !currentProject) return
    
    // 기존 시뮬레이션 정리
    if (activeSimulation) {
      clearInterval(activeSimulation)
      activeSimulation = null
    }
    
    set({
      aiStatus: 'analyzing',
      aiProgress: 0,
      aiStage: '영상 분석 중...',
      aiError: null
    })
    
    // 단순한 진행률 시뮬레이션
    let progress = 0
    activeSimulation = setInterval(() => {
      progress += Math.random() * 10
      
      if (progress >= 100) {
        // 완료 처리
        if (activeSimulation) {
          clearInterval(activeSimulation)
          activeSimulation = null
        }
        
        const mockTimeline: Timeline = {
          tracks: [
            {
              id: 'video-track-1',
              type: 'video',
              clips: [
                {
                  id: 'clip-1',
                  startTime: 0,
                  endTime: 60,
                  name: '메인 영상',
                  source: 'video1.mp4'
                }
              ],
              height: 80,
              visible: true,
              locked: false
            }
          ],
          duration: 60,
          frameRate: 30,
          resolution: { width: 1920, height: 1080 },
          markers: [
            {
              id: 'marker-1',
              time: 30,
              type: 'cut',
              label: 'AI 추천 컷',
              color: '#00FF88',
              confidence: 0.95
            }
          ]
        }
        
        set({
          aiStatus: 'complete',
          aiProgress: 100,
          aiStage: '완료',
          timeline: mockTimeline
        })
      } else {
        let stage = '영상 분석 중...'
        if (progress > 25) {
          set({ aiStatus: 'processing' })
          stage = '오디오 처리 중...'
        }
        if (progress > 50) stage = '색상 보정 적용 중...'
        if (progress > 75) stage = '최종 렌더링...'
        
        set({
          aiProgress: Math.min(progress, 100),
          aiStage: stage
        })
      }
    }, 500)
  },
  
  updateAIProgress: (progress, stage) => {
    set({ aiProgress: progress, aiStage: stage })
  },
  
  completeAIEdit: (timeline) => {
    if (activeSimulation) {
      clearInterval(activeSimulation)
      activeSimulation = null
    }
    set({
      aiStatus: 'complete',
      aiProgress: 100,
      aiStage: '완료',
      timeline: timeline
    })
  },
  
  setAIError: (error) => {
    if (activeSimulation) {
      clearInterval(activeSimulation)
      activeSimulation = null
    }
    set({ aiStatus: 'error', aiError: error })
  },
  
  resetAI: () => {
    if (activeSimulation) {
      clearInterval(activeSimulation)
      activeSimulation = null
    }
    set({
      aiStatus: 'idle',
      aiProgress: 0,
      aiStage: '',
      aiError: null
    })
  },
  
  // 프로필 액션
  setActiveProfile: (profile) => {
    set({ activeProfile: profile })
  },
  
  addProfile: (profile) => {
    set({ profiles: [...get().profiles, profile] })
  },
  
  updateProfile: (profileId, updates) => {
    const { profiles, activeProfile } = get()
    set({
      profiles: profiles.map(p =>
        p.id === profileId ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
      activeProfile: activeProfile?.id === profileId
        ? { ...activeProfile, ...updates, updatedAt: new Date() }
        : activeProfile
    })
  },
  
  removeProfile: (profileId) => {
    const { profiles, activeProfile } = get()
    set({
      profiles: profiles.filter(p => p.id !== profileId),
      activeProfile: activeProfile?.id === profileId ? null : activeProfile
    })
  },
  
  // 타임라인 액션
  updateTimeline: (timeline) => {
    set({ timeline })
  },
  
  addMarker: (marker) => {
    const { timeline } = get()
    if (!timeline) return
    
    const updatedTimeline = {
      ...timeline,
      markers: [...(timeline.markers || []), marker]
    }
    
    set({ timeline: updatedTimeline })
  },
  
  removeMarker: (markerId) => {
    const { timeline } = get()
    if (!timeline) return
    
    const updatedTimeline = {
      ...timeline,
      markers: timeline.markers?.filter(m => m.id !== markerId) || []
    }
    
    set({ timeline: updatedTimeline })
  },
  
  seekTo: (time) => {
    console.log('Seeking to:', time)
  },
  
  // UI 액션
  toggleSidebar: () => {
    set({ sidebarCollapsed: !get().sidebarCollapsed })
  },
  
  setTimelineZoom: (zoom) => {
    const clampedZoom = Math.max(0.1, Math.min(10, zoom))
    set({ timelineZoom: clampedZoom })
  },
  
  selectMarkers: (markerIds) => {
    set({ selectedMarkers: markerIds })
  },
  
  setUploadingFiles: (uploading) => {
    set({ uploadingFiles: uploading })
  },
  
  // 실시간 데이터 액션
  updateAIUsage: (usage) => {
    const { aiUsage } = get()
    set({
      aiUsage: {
        ...aiUsage,
        ...usage,
        totalCost: usage.models 
          ? Object.values(usage.models).reduce((sum, model) => sum + model.cost, 0)
          : aiUsage.totalCost,
        totalTokens: usage.models
          ? Object.values(usage.models).reduce((sum, model) => sum + model.tokens, 0)
          : aiUsage.totalTokens
      }
    })
  },
  
  updateSystemStatus: (status) => {
    set({
      systemStatus: { ...get().systemStatus, ...status }
    })
  }
}))

// 편리한 셀렉터 훅들
export const useProject = () => useAppStore((state) => ({
  currentProject: state.currentProject,
  timeline: state.timeline,
  setCurrentProject: state.setCurrentProject,
  createProject: state.createProject,
  updateProject: state.updateProject
}))

export const useAI = () => useAppStore((state) => ({
  aiStatus: state.aiStatus,
  aiProgress: state.aiProgress,
  aiStage: state.aiStage,
  aiError: state.aiError,
  startAIEdit: state.startAIEdit,
  resetAI: state.resetAI
}))

export const useProfiles = () => useAppStore((state) => ({
  activeProfile: state.activeProfile,
  profiles: state.profiles,
  setActiveProfile: state.setActiveProfile,
  addProfile: state.addProfile,
  updateProfile: state.updateProfile,
  removeProfile: state.removeProfile
}))

export const useChannels = () => useAppStore((state) => ({
  connectedChannels: state.connectedChannels
}))

export const useAIUsage = () => useAppStore((state) => ({
  aiUsage: state.aiUsage,
  updateAIUsage: state.updateAIUsage
}))