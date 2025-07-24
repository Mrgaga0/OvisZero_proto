# 팀_오비스트라 (Team_Ovistra) - 백엔드 PRD

## 📋 **프로젝트 개요**

### **비전**
"One Vision, Intelligent Strategy" - 하나의 비전으로 지능적인 전략을 구현하는 AI 비디오 편집 오케스트라

### **핵심 개념**
원 버튼으로 완성되는 전문 비디오 편집 - AI가 반복 작업을 처리하고 편집자의 창의성은 보존

### **설계 철학**
Premiere Pro의 전문성 + AI의 스마트함

---

## 🏗️ **시스템 아키텍처**

### **전체 아키텍처**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Premiere Pro │────│   CEP Panel     │────│   Backend API   │
│   (CEP API)     │    │   (Frontend)    │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Training Data  │    │   AI Models     │
                       │   Management    │    │   (External)    │
                       └─────────────────┘    └─────────────────┘
```

### **핵심 컴포넌트**
1. **Channel Management System**: 채널별 편집 스타일 관리
2. **Learning Engine**: AI 모델 학습 및 패턴 분석
3. **Training Data Manager**: 학습 데이터 생성, 수정, 삭제
4. **Security Layer**: 3단계 삭제 확인 및 데이터 보호
5. **Project Analysis**: Premiere Pro 시퀀스 분석

---

## 📊 **데이터 모델**

### **채널 (Channel)**
```typescript
interface Channel {
  id: string;                    // UUID
  name: string;                  // 채널 이름
  type: ChannelType;            // 플랫폼 타입
  description?: string;          // 설명
  style: string;                // 편집 스타일
  isLearned: boolean;           // 학습 완료 여부
  confidenceScore?: number;      // 신뢰도 점수 (0-100)
  createdAt: DateTime;          // 생성일
  updatedAt: DateTime;          // 수정일
  editingRules: EditingRule[];  // 편집 규칙
  learningHistory: LearningSession[]; // 학습 히스토리
  userId: string;               // 사용자 ID
}

enum ChannelType {
  YOUTUBE = 'youtube',
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  PODCAST = 'podcast',
  CUSTOM = 'custom'
}
```

### **학습 세션 (LearningSession)**
```typescript
interface LearningSession {
  id: string;                    // UUID
  channelId: string;            // 채널 ID
  projectName: string;          // 프로젝트 이름
  date: DateTime;               // 학습 날짜
  duration: number;             // 처리 시간 (ms)
  patternsLearned: number;      // 학습된 패턴 수
  confidenceImprovement: number; // 신뢰도 개선 수치
  sequenceData: SequenceData;   // 시퀀스 분석 데이터
  learningResults: LearningResult; // 학습 결과
  status: LearningStatus;       // 학습 상태
  createdAt: DateTime;          // 생성일
  updatedAt: DateTime;          // 수정일
}

enum LearningStatus {
  PREPARING = 'preparing',
  READING_SEQUENCE = 'reading-sequence',
  LEARNING = 'learning',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

### **시퀀스 데이터 (SequenceData)**
```typescript
interface SequenceData {
  name: string;                 // 시퀀스 이름
  duration: string;             // 길이 (HH:MM:SS)
  resolution: string;           // 해상도
  frameRate: number;            // 프레임률
  trackCount: number;           // 트랙 수
  clipCount: number;            // 클립 수
  subtitleCount?: number;       // 자막 수
  colorProfile?: string;        // 색상 프로파일
  hasAudio: boolean;           // 오디오 포함 여부
  hasVideo: boolean;           // 비디오 포함 여부
  analysisMetadata: AnalysisMetadata; // 분석 메타데이터
}

interface AnalysisMetadata {
  averageCutLength: number;     // 평균 컷 길이
  transitionTypes: string[];    // 전환 효과 타입
  audioLevels: AudioLevel[];    // 오디오 레벨
  colorGrading: ColorGrading;   // 색상 보정 데이터
  subtitleTiming: SubtitleTiming[]; // 자막 타이밍
}
```

### **편집 규칙 (EditingRule)**
```typescript
interface EditingRule {
  id: string;                   // UUID
  type: RuleType;              // 규칙 타입
  name: string;                // 규칙 이름
  description: string;         // 설명
  parameters: RuleParameters;   // 규칙 파라미터
  confidence: number;          // 신뢰도 (0-1)
  learningSessionId: string;   // 학습 세션 ID
}

enum RuleType {
  CUT_TIMING = 'cut_timing',
  SUBTITLE_STYLE = 'subtitle_style',
  AUDIO_LEVEL = 'audio_level',
  TRANSITION = 'transition',
  COLOR_GRADING = 'color_grading'
}
```

### **프로젝트 상태 (ProjectStatus)**
```typescript
interface ProjectStatus {
  projectName: string;          // 프로젝트 이름
  projectPath: string;          // 프로젝트 경로
  hasSubtitles: boolean;       // 자막 존재 여부
  timeline: {
    detected: boolean;         // 타임라인 감지 여부
    duration: string;          // 길이
    sequenceCount: number;     // 시퀀스 수
  };
  isReady: boolean;           // 편집 준비 완료 여부
  lastAnalyzed: DateTime;     // 마지막 분석 시간
}
```

---

## 🔌 **API 엔드포인트**

### **채널 관리 API**

#### **채널 목록 조회**
```http
GET /api/channels
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "ch_123",
        "name": "Gaming Review",
        "type": "youtube",
        "description": "게임 리뷰 채널",
        "style": "다이나믹 컷 + 강조 자막",
        "isLearned": true,
        "confidenceScore": 87.5,
        "createdAt": "2024-01-15T00:00:00Z",
        "learningHistory": [...],
        "editingRules": [...]
      }
    ],
    "total": 3
  }
}
```

#### **채널 생성**
```http
POST /api/channels
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Tech Tips",
  "type": "youtube",
  "description": "기술 팁 채널"
}
```

#### **채널 상세 조회**
```http
GET /api/channels/{channelId}
Authorization: Bearer {token}
```

#### **채널 수정**
```http
PUT /api/channels/{channelId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Channel Name",
  "description": "Updated description"
}
```

#### **채널 삭제 (3단계 확인)**
```http
DELETE /api/channels/{channelId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "confirmationStep": 1,  // 1, 2, 3
  "confirmationToken": "delete_token_123"
}
```

**응답 (1, 2단계):**
```json
{
  "success": false,
  "requiresConfirmation": true,
  "currentStep": 1,
  "nextStep": 2,
  "confirmationToken": "delete_token_456",
  "warning": "이 작업은 되돌릴 수 없습니다.",
  "affectedData": {
    "learningSessionsCount": 5,
    "editingRulesCount": 12
  }
}
```

**응답 (3단계 - 최종 삭제):**
```json
{
  "success": true,
  "message": "채널이 성공적으로 삭제되었습니다.",
  "deletedData": {
    "channelId": "ch_123",
    "learningSessionsDeleted": 5,
    "editingRulesDeleted": 12
  }
}
```

### **학습 관리 API**

#### **학습 시작**
```http
POST /api/channels/{channelId}/learning
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectName": "게임리뷰_에피소드15",
  "sequenceData": {
    "name": "메인 시퀀스",
    "duration": "8:34",
    "resolution": "1920x1080",
    "frameRate": 29.97,
    "trackCount": 5,
    "clipCount": 23,
    "subtitleCount": 45
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "learningSessionId": "ls_789",
    "status": "preparing",
    "estimatedDuration": 180000
  }
}
```

#### **학습 상태 조회**
```http
GET /api/learning-sessions/{sessionId}
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "ls_789",
    "status": "learning",
    "progress": {
      "currentStep": 2,
      "totalSteps": 4,
      "percentage": 45,
      "currentTask": "패턴 감지"
    },
    "elapsedTime": 67000,
    "estimatedRemaining": 113000
  }
}
```

#### **학습 결과 조회**
```http
GET /api/learning-sessions/{sessionId}/results
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "learningResults": {
      "learnedPatterns": [
        "빠른 컷 패턴 (평균 2.3초)",
        "강조 자막 위치 및 타이밍",
        "배경음악 볼륨 조절 패턴"
      ],
      "improvementAreas": [
        "무음 구간 제거 최적화",
        "자막 가독성 개선"
      ],
      "confidenceScore": 87.5,
      "processingTime": 180000
    }
  }
}
```

### **훈련 데이터 관리 API**

#### **훈련 데이터 목록 조회**
```http
GET /api/channels/{channelId}/training-data
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "learningSessions": [
      {
        "id": "ls_123",
        "projectName": "신작 RPG 리뷰",
        "date": "2024-01-15",
        "duration": "4:23",
        "patternsLearned": 12,
        "confidenceImprovement": 23.5,
        "status": "completed"
      }
    ],
    "statistics": {
      "totalSessions": 3,
      "totalPatterns": 35,
      "averageConfidenceImprovement": 17.8,
      "totalProcessingTime": 720000
    }
  }
}
```

#### **훈련 데이터 수정**
```http
PUT /api/learning-sessions/{sessionId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectName": "Updated Project Name",
  "date": "2024-01-20"
}
```

#### **훈련 데이터 삭제 (2단계 확인)**
```http
DELETE /api/learning-sessions/{sessionId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "confirmationStep": 1,  // 1, 2
  "confirmationToken": "delete_session_token_123"
}
```

### **프로젝트 분석 API**

#### **프로젝트 상태 감지**
```http
POST /api/premiere/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
  "projectPath": "/Users/editor/Projects/GameReview15.prproj"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "projectName": "게임리뷰_에피소드15",
    "projectPath": "/Users/editor/Projects/GameReview15.prproj",
    "hasSubtitles": true,
    "timeline": {
      "detected": true,
      "duration": "8:34",
      "sequenceCount": 1
    },
    "sequences": [
      {
        "name": "메인 시퀀스",
        "duration": "8:34",
        "resolution": "1920x1080",
        "frameRate": 29.97,
        "trackCount": 5,
        "clipCount": 23,
        "subtitleCount": 45
      }
    ],
    "isReady": true
  }
}
```

### **AI 편집 실행 API**

#### **편집 시작**
```http
POST /api/editing/start
Authorization: Bearer {token}
Content-Type: application/json

{
  "channelId": "ch_123",
  "projectPath": "/Users/editor/Projects/GameReview15.prproj",
  "sequenceName": "메인 시퀀스"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "editingJobId": "job_456",
    "status": "processing",
    "estimatedDuration": 120000,
    "appliedRules": [
      {
        "type": "cut_timing",
        "name": "빠른 컷 패턴",
        "confidence": 0.875
      }
    ]
  }
}
```

#### **편집 상태 조회**
```http
GET /api/editing/jobs/{jobId}
Authorization: Bearer {token}
```

#### **편집 결과 적용**
```http
POST /api/editing/jobs/{jobId}/apply
Authorization: Bearer {token}
```

---

## 🔒 **보안 요구사항**

### **인증 및 권한**
- **JWT 기반 인증**: 모든 API 호출에 Bearer 토큰 필요
- **역할 기반 접근 제어**: Admin, Editor, Viewer 역할
- **API 키 관리**: 외부 AI 모델 API 키 암호화 저장

### **데이터 보호**
- **3단계 삭제 확인**: 중요 데이터 삭제 시 단계별 확인
- **삭제 토큰**: 삭제 요청마다 고유 토큰 생성 및 검증
- **소프트 삭제**: 즉시 삭제 대신 deleted_at 플래그 사용
- **데이터 암호화**: 민감 정보 AES-256 암호화

### **감사 로그**
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;              // 'channel_create', 'channel_delete', 'learning_start'
  resourceType: string;        // 'channel', 'learning_session'
  resourceId: string;
  details: object;            // 추가 컨텍스트
  ipAddress: string;
  userAgent: string;
  timestamp: DateTime;
}
```

### **레이트 리미팅**
- **학습 API**: 사용자당 시간당 5회 제한
- **편집 API**: 사용자당 시간당 10회 제한
- **일반 API**: 사용자당 분당 60회 제한

---

## 🎯 **성능 요구사항**

### **응답 시간**
- **채널 조회**: < 200ms
- **학습 시작**: < 500ms
- **프로젝트 분석**: < 1000ms
- **편집 시작**: < 1000ms

### **처리 용량**
- **동시 학습 세션**: 최대 5개
- **동시 편집 작업**: 최대 10개
- **파일 업로드**: 최대 500MB

### **확장성**
- **수평 확장**: 로드 밸런서를 통한 다중 인스턴스
- **데이터베이스**: 읽기 전용 복제본 활용
- **캐싱**: Redis를 통한 세션 및 결과 캐싱

---

## 📚 **외부 연동**

### **AI 모델 API**
```typescript
interface AIModelConfig {
  main: {
    provider: 'openai' | 'anthropic' | 'qwen';
    model: string;
    endpoint: string;
    apiKey: string;
  };
  korean: {
    provider: 'naver' | 'kakao' | 'hyperclova';
    model: string;
    endpoint: string;
    apiKey: string;
  };
  backup: {
    provider: 'openai';
    model: 'gpt-4';
    endpoint: string;
    apiKey: string;
  };
}
```

### **Premiere Pro CEP API**
- **프로젝트 정보 조회**: 현재 열린 프로젝트 메타데이터
- **시퀀스 분석**: 타임라인 구조, 클립 정보, 자막 데이터
- **편집 적용**: 컷 포인트, 자막 스타일, 오디오 레벨 조정

---

## 🧪 **테스트 전략**

### **단위 테스트**
- **모델 검증**: 데이터 모델 유효성 검사
- **비즈니스 로직**: 채널 관리, 학습 플로우, 삭제 확인
- **API 엔드포인트**: 각 API의 입출력 검증

### **통합 테스트**
- **AI 모델 연동**: 외부 API 호출 및 응답 처리
- **데이터베이스**: CRUD 작업 및 트랜잭션
- **CEP API**: Premiere Pro와의 연동

### **성능 테스트**
- **로드 테스트**: 동시 사용자 100명 기준
- **스트레스 테스트**: 최대 처리 용량 측정
- **내구성 테스트**: 24시간 연속 운영

---

## 🚀 **배포 및 운영**

### **배포 전략**
- **블루-그린 배포**: 무중단 서비스 업데이트
- **단계별 배포**: 개발 → 스테이징 → 프로덕션
- **롤백 계획**: 배포 실패 시 즉시 이전 버전 복구

### **모니터링**
- **애플리케이션 메트릭**: 응답 시간, 에러율, 처리량
- **인프라 메트릭**: CPU, 메모리, 디스크, 네트워크
- **비즈니스 메트릭**: 일일 활성 사용자, 학습 세션 수

### **로깅**
```typescript
interface LogEntry {
  timestamp: DateTime;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  userId?: string;
  requestId: string;
  message: string;
  metadata: object;
}
```

---

## 📋 **개발 우선순위**

### **Phase 1: 핵심 기능 (4주)**
1. 채널 관리 API (CRUD)
2. 프로젝트 분석 API
3. 기본 학습 플로우
4. 3단계 삭제 확인 시스템

### **Phase 2: 고급 기능 (4주)**
1. 훈련 데이터 관리 시스템
2. 학습 히스토리 추적
3. AI 편집 실행 엔진
4. 성능 최적화

### **Phase 3: 운영 안정성 (2주)**
1. 모니터링 및 로깅
2. 보안 강화
3. 테스트 자동화
4. 배포 파이프라인

---

## 🛠️ **기술 스택**

### **백엔드 프레임워크**
- **Node.js 18+**: 런타임 환경
- **Express.js**: 웹 프레임워크
- **TypeScript**: 타입 안전성

### **데이터베이스**
- **PostgreSQL 15+**: 주 데이터베이스
- **Redis 7+**: 캐싱 및 세션 저장소
- **Prisma**: ORM

### **인프라**
- **Docker**: 컨테이너화
- **AWS/GCP**: 클라우드 인프라
- **Nginx**: 리버스 프록시
- **PM2**: 프로세스 관리

### **모니터링**
- **Winston**: 로깅 라이브러리
- **Prometheus**: 메트릭 수집
- **Grafana**: 대시보드
- **Sentry**: 에러 추적

---

## 📄 **API 문서화**

### **OpenAPI 3.0 사양**
- **자동 문서 생성**: Swagger를 통한 인터랙티브 API 문서
- **스키마 검증**: 요청/응답 스키마 자동 검증
- **Mock 서버**: 개발 단계에서 사용할 Mock API

### **API 버저닝**
- **URI 버저닝**: `/api/v1/channels`
- **하위 호환성**: 기존 API 버전 최소 6개월 지원
- **Deprecation 정책**: 3개월 사전 공지

---

이 PRD는 현재 프론트엔드의 변경사항을 완전히 반영하여 채널 중심의 학습 시스템, 3단계 삭제 보안, 훈련 데이터 관리 등의 새로운 요구사항을 포함하고 있습니다.