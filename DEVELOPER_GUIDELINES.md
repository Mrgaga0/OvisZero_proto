# 팀_오비스트라 (Team_Ovistra) 개발자 가이드라인

> **"One Vision, Intelligent Strategy"** - 하나의 비전으로 지능적인 전략을 구현하는 AI 영상 편집 오케스트라

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [디자인 시스템](#디자인-시스템)
3. [프로젝트 구조](#프로젝트-구조)
4. [개발 규칙](#개발-규칙)
5. [컴포넌트 가이드](#컴포넌트-가이드)
6. [색상 시스템](#색상-시스템)
7. [애니메이션 가이드](#애니메이션-가이드)
8. [성능 최적화](#성능-최적화)
9. [트러블슈팅](#트러블슈팅)
10. [배포 가이드](#배포-가이드)

---

## 🎯 프로젝트 개요

### 비전
**"버튼 하나로 완성되는 프로페셔널 영상 편집"**

### 미션
영상 편집자의 창의성은 살리고, 반복 작업은 AI가 처리하는 차세대 편집 플랫폼 구축

### 핵심 가치
- **극단적 단순함**: 복잡한 기술을 단순한 인터페이스로
- **지능적 자동화**: AI가 편집 의도를 이해하고 실행
- **한국형 최적화**: 한국 콘텐츠 문화에 특화된 AI 통합

### 기술 스택
```
Frontend: React 18 + TypeScript
Styling: Tailwind CSS v4
UI Library: ShadCN/UI
Icons: Lucide React
Animation: CSS Transitions + Custom Effects
State Management: React Hooks
```

---

## 🎨 디자인 시스템

### 디자인 철학
**"프리미어 프로의 전문성 + AI의 스마트함"**

프로페셔널한 비디오 편집 도구의 익숙함과 AI의 혁신적 경험을 조화롭게 결합

### 색상 팔레트

#### 기본 색상
```css
/* 배경 색상 */
--background: #1E1E1E;          /* 메인 배경 (프리미어 다크모드) */
--surface-dark: #252525;        /* 패널 배경 */
--surface-elevated: #2D2D2D;    /* 상승된 표면 */

/* 텍스트 색상 */
--foreground: #FFFFFF;          /* 주요 텍스트 */
--muted-foreground: #B3B3B3;    /* 보조 텍스트 */
--text-disabled: #666666;       /* 비활성 텍스트 */
```

#### 액센트 색상 (브랜드 아이덴티티)
```css
/* 메인 액센트 - 채도 높은 녹색 */
--accent-green: #00FF88;        /* 기본 상태 */
--accent-green-hover: #00CC6F;  /* 호버 상태 */
--accent-green-active: #00AA5C; /* 클릭 상태 */
```

#### 상태 색상
```css
--status-success: #00FF88;      /* 성공 (액센트와 동일) */
--status-warning: #FFB800;      /* 경고 */
--status-error: #FF3B30;        /* 오류 */
--status-info: #007AFF;         /* 정보 */
```

### 타이포그래피

#### 폰트 패밀리
```css
/* 기본 폰트 */
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;

/* 모노스페이스 폰트 (코드용) */
font-family: 'JetBrains Mono', 'Consolas', monospace;
```

#### 폰트 크기 시스템
```css
/* 기본 14px 기준 */
h1: 24px (1.71em)
h2: 20px (1.43em)
h3: 16px (1.14em)
h4: 14px (1em)
p:  14px (1em)
```

#### 폰트 웨이트
```css
font-regular: 400;
font-medium: 500;
font-semibold: 600;
font-bold: 700;
```

### 스페이싱 시스템
Tailwind의 기본 스페이싱을 따르되, 주요 간격은 다음과 같습니다:
```
xs: 4px   (gap-1)
sm: 8px   (gap-2)
md: 12px  (gap-3)
lg: 16px  (gap-4)
xl: 24px  (gap-6)
2xl: 32px (gap-8)
```

### 보더 래디우스
```css
--radius: 0.5rem;              /* 기본 8px */
--radius-sm: 0.25rem;          /* 4px */
--radius-lg: 0.75rem;          /* 12px */
--radius-xl: 1rem;             /* 16px */
```

---

## 📁 프로젝트 구조

```
팀_오비스트라/
├── App.tsx                    # 메인 애플리케이션 진입점
├── components/                # 컴포넌트 디렉토리
│   ├── MagicButton.tsx       # 핵심 AI 실행 버튼
│   ├── Sidebar.tsx           # 좌측 사이드바
│   ├── MainContent.tsx       # 메인 콘텐츠 영역
│   ├── StatusBar.tsx         # 하단 상태바
│   ├── figma/                # Figma 연동 컴포넌트
│   │   └── ImageWithFallback.tsx
│   └── ui/                   # ShadCN UI 컴포넌트
│       ├── button.tsx
│       ├── card.tsx
│       ├── progress.tsx
│       └── ...
├── styles/                   # 스타일 파일
│   └── globals.css          # 전역 스타일 + Tailwind 설정
├── guidelines/              # 가이드라인 문서
│   └── Guidelines.md
└── DEVELOPER_GUIDELINES.md  # 개발자 가이드라인
```

### 파일 네이밍 컨벤션

#### 컴포넌트 파일
- **PascalCase** 사용: `MagicButton.tsx`, `MainContent.tsx`
- 기능을 명확히 나타내는 이름 사용
- 한 파일당 하나의 메인 컴포넌트 export

#### 유틸리티 파일
- **camelCase** 사용: `useFileUpload.ts`, `formatters.ts`

#### 디렉토리
- **camelCase** 사용: `components`, `utils`, `hooks`

---

## 🔧 개발 규칙

### 1. TypeScript 규칙

#### 인터페이스 정의
```typescript
// ✅ 좋은 예
interface MagicButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
  isComplete?: boolean;
}

// ❌ 나쁜 예 - any 사용
interface BadProps {
  data: any;
  callback: any;
}
```

#### Props 타입 정의
```typescript
// ✅ 선택적 props는 물음표 사용
interface ComponentProps {
  required: string;
  optional?: number;
}

// ✅ 기본값이 있는 경우 destructuring에서 설정
export function Component({ 
  required, 
  optional = 10,
  disabled = false 
}: ComponentProps) {
  // ...
}
```

### 2. React 컴포넌트 규칙

#### 컴포넌트 구조
```typescript
// ✅ 권장 구조
import React, { useState, useEffect } from 'react';
import { ExternalLibrary } from 'external-library';
import { LocalComponent } from './LocalComponent';
import { ShadCNComponent } from './ui/component';

interface ComponentProps {
  // Props 정의
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // 1. State 정의
  const [state, setState] = useState();
  
  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 3. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 4. Render 함수들
  const renderSection = () => {
    // Render logic
  };
  
  // 5. Main return
  return (
    <div className="component-wrapper">
      {/* JSX */}
    </div>
  );
}
```

#### Hooks 사용 규칙
```typescript
// ✅ Custom hooks는 use로 시작
export function useVideoUpload() {
  const [uploading, setUploading] = useState(false);
  
  const upload = useCallback((file: File) => {
    // Upload logic
  }, []);
  
  return { uploading, upload };
}

// ✅ Effect cleanup
useEffect(() => {
  const interval = setInterval(() => {
    // Interval logic
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

### 3. CSS/Tailwind 규칙

#### 클래스명 순서
```tsx
// ✅ 권장 순서: 레이아웃 → 스페이싱 → 시각적 스타일 → 상태
<div className="flex flex-col w-full h-screen p-4 bg-background border border-border hover:bg-surface-elevated transition-colors">
```

#### 커스텀 CSS 클래스
```css
/* ✅ 컴포넌트별 클래스는 @layer components에 정의 */
@layer components {
  .magic-button {
    @apply relative overflow-hidden rounded-lg border-none px-8 py-4;
    /* 커스텀 CSS는 Tailwind 다음에 */
    background: linear-gradient(135deg, #00FF88 0%, #00CC6F 100%);
  }
}
```

#### 반응형 디자인
```tsx
// ✅ 모바일 퍼스트 접근
<div className="
  grid grid-cols-1 gap-4
  md:grid-cols-2 md:gap-6
  lg:grid-cols-3 lg:gap-8
">
```

---

## 🧩 컴포넌트 가이드

### 1. MagicButton 컴포넌트

#### 사용법
```typescript
import { MagicButton } from './components/MagicButton';

// 기본 사용
<MagicButton onClick={handleAIStart} />

// 상태별 사용
<MagicButton 
  onClick={handleAIStart}
  isProcessing={isLoading}
  isComplete={isFinished}
  disabled={!hasFile}
/>
```

#### 상태 관리
- `idle`: 기본 상태 (Sparkles 아이콘 + "AI 편집 시작")
- `processing`: 처리 중 (Loader2 아이콘 + "AI가 분석 중입니다...")
- `complete`: 완료 상태 (Check 아이콘 + "편집 완료!")

### 2. 레이아웃 컴포넌트

#### App.tsx 구조
```typescript
// 고정된 레이아웃 구조 - 변경 금지
<div className="h-screen w-full bg-background flex flex-col">
  <div className="flex-1 flex">
    <Sidebar />     {/* 264px 고정 너비 */}
    <MainContent /> {/* 나머지 영역 */}
  </div>
  <StatusBar />     {/* 48px 고정 높이 */}
</div>
```

#### Sidebar 구조
```typescript
// 3개 섹션으로 구성
1. 헤더 (로고 + 제목)
2. 메인 콘텐츠 (채널 연결 + 최근 프로젝트)
3. 푸터 (프로필 + 설정)
```

### 3. 상태 표시 컴포넌트

#### Progress 컴포넌트 사용
```typescript
import { Progress } from './ui/progress';

// AI 처리 진행률 표시
<Progress value={progress} className="w-full" />

// 사용량 표시 (StatusBar)
<Progress value={usagePercentage} className="w-20 h-2" />
```

---

## 🎨 색상 시스템

### 1. 색상 사용 가이드

#### 액센트 컬러 (#00FF88) 사용 시나리오
```typescript
// ✅ 주요 액션 버튼
className="bg-accent-green text-black"

// ✅ 성공 상태 표시
className="text-accent-green"

// ✅ 포커스/활성 상태
className="border-accent-green"

// ✅ 글로우 이펙트
box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
```

#### 배경 색상 계층
```typescript
// 1단계: 메인 배경
className="bg-background"           // #1E1E1E

// 2단계: 패널 배경  
className="bg-surface-dark"         // #252525

// 3단계: 상승된 요소
className="bg-surface-elevated"     // #2D2D2D
```

#### 텍스트 색상 우선순위
```typescript
// 1순위: 주요 텍스트
className="text-foreground"         // #FFFFFF

// 2순위: 보조 텍스트
className="text-muted-foreground"   // #B3B3B3

// 3순위: 비활성 텍스트
className="text-text-disabled"      // #666666
```

### 2. 색상 조합 예시

#### 카드 컴포넌트
```typescript
<Card className="bg-surface-dark border-border hover:bg-surface-elevated">
  <h3 className="text-foreground">제목</h3>
  <p className="text-muted-foreground">설명</p>
</Card>
```

#### 버튼 상태
```typescript
// 기본 버튼
className="bg-surface-elevated text-foreground hover:bg-surface-dark"

// 액센트 버튼 (매직 버튼)
className="bg-accent-green text-black hover:bg-accent-green-hover"

// 위험 버튼
className="bg-status-error text-white hover:bg-red-600"
```

---

## ✨ 애니메이션 가이드

### 1. 기본 트랜지션

#### 표준 트랜지션
```css
/* 기본 - 모든 hover 효과에 사용 */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* 빠른 트랜지션 - 클릭 피드백용 */
transition: all 0.2s ease-out;

/* 느린 트랜지션 - 레이아웃 변경용 */
transition: all 0.5s ease-in-out;
```

#### Tailwind 클래스
```typescript
// ✅ 기본 트랜지션
className="transition-colors duration-300"

// ✅ 트랜스폼 트랜지션
className="transition-transform duration-300 hover:scale-105"

// ✅ 복합 트랜지션
className="transition-all duration-300 ease-out"
```

### 2. 매직 버튼 애니메이션

#### 호버 효과
```css
.magic-button:hover {
  transform: translateY(-2px);           /* 위로 2px 이동 */
  box-shadow: 0 6px 30px rgba(0, 255, 136, 0.4); /* 글로우 증가 */
}
```

#### 클릭 효과
```css
.magic-button:active {
  transform: translateY(0px);            /* 원래 위치로 */
}

.magic-button:active .magic-glow {
  opacity: 1;                           /* 글로우 이펙트 활성화 */
}
```

### 3. 로딩 애니메이션

#### 진행률 애니메이션
```typescript
// Progress 컴포넌트의 자연스러운 증가
const interval = setInterval(() => {
  setProgress(prev => {
    if (prev >= 100) {
      clearInterval(interval);
      return 100;
    }
    return prev + 10; // 10%씩 증가
  });
}, 500); // 0.5초마다
```

#### 펄스 애니메이션
```typescript
// 연결 상태 표시
<div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />

// 로딩 아이콘
<FileVideo className="w-12 h-12 text-accent-green animate-pulse" />
```

### 4. 상태 전환 애니메이션

#### 페이드 인/아웃
```typescript
// 조건부 렌더링 시 부드러운 전환
<div className={`transition-opacity duration-500 ${
  isVisible ? 'opacity-100' : 'opacity-0'
}`}>
```

#### 슬라이드 애니메이션
```typescript
// 사이드바 토글 등에 사용
className="transform transition-transform duration-300 translate-x-0"
```

---

## ⚡ 성능 최적화

### 1. React 최적화

#### useMemo/useCallback 사용
```typescript
// ✅ 무거운 계산 캐싱
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ 이벤트 핸들러 캐싱
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);
```

#### 컴포넌트 분할
```typescript
// ✅ 큰 컴포넌트를 작은 단위로 분할
// MainContent.tsx → UploadSection.tsx + ProcessingSection.tsx + ResultSection.tsx
```

### 2. 이미지 최적화

#### ImageWithFallback 사용
```typescript
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// ✅ 이미지 최적화와 폴백 제공
<ImageWithFallback 
  src="https://images.unsplash.com/..."
  alt="설명"
  className="w-full h-auto"
/>
```

### 3. 번들 최적화

#### 동적 임포트
```typescript
// ✅ 큰 라이브러리의 지연 로딩
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<div>로딩중...</div>}>
  <HeavyComponent />
</Suspense>
```

#### Tree Shaking
```typescript
// ✅ 필요한 함수만 임포트
import { debounce } from 'lodash/debounce';

// ❌ 전체 라이브러리 임포트
import _ from 'lodash';
```

---

## 🔍 트러블슈팅

### 1. 일반적인 오류

#### Tailwind 클래스 인식 안됨
```bash
# 해결: Tailwind 컴파일 확인
npm run build

# CSS 캐시 클리어
rm -rf .next/static
```

#### 커스텀 색상 적용 안됨
```css
/* globals.css에서 @theme inline 확인 */
@theme inline {
  --color-accent-green: var(--accent-green);
}
```

#### 애니메이션 버벅임
```css
/* GPU 가속 활성화 */
.smooth-animation {
  transform: translateZ(0);
  will-change: transform;
}
```

### 2. TypeScript 오류

#### Props 타입 불일치
```typescript
// ✅ 인터페이스 확장 사용
interface ExtendedProps extends BaseProps {
  additionalProp: string;
}
```

#### 이벤트 핸들러 타입
```typescript
// ✅ 올바른 이벤트 타입
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // Handler logic
};
```

### 3. 성능 이슈

#### 렌더링 최적화
```typescript
// ✅ React.memo 사용
export const OptimizedComponent = React.memo(({ prop1, prop2 }) => {
  // Component logic
});

// ✅ 조건부 렌더링 최적화
{isVisible && <ExpensiveComponent />}
```

---

## 🚀 배포 가이드

### 1. 빌드 전 체크리스트

```bash
# 1. 타입 체크
npx tsc --noEmit

# 2. 린트 검사
npm run lint

# 3. 테스트 실행 (있다면)
npm run test

# 4. 빌드 테스트
npm run build
```

### 2. 환경별 설정

#### 개발 환경
```typescript
// 개발용 API 엔드포인트
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001'
  : 'https://api.ovistra.com';
```

#### 프로덕션 최적화
```typescript
// 프로덕션에서 console.log 제거
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
}
```

---

## 📚 추가 리소스

### 참고 문서
- [Tailwind CSS v4 문서](https://tailwindcss.com/docs)
- [ShadCN/UI 컴포넌트](https://ui.shadcn.com/)
- [Lucide React 아이콘](https://lucide.dev/)
- [React TypeScript 가이드](https://react-typescript-cheatsheet.netlify.app/)

### 유용한 VS Code 확장
```
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Prettier - Code formatter
- TypeScript Hero
```

### 디버깅 도구
```
- React Developer Tools
- Tailwind CSS 디버거
- TypeScript Error Lens
```

---

## 🤝 기여 가이드

### 1. 브랜치 전략
```
main        - 프로덕션 브랜치
develop     - 개발 브랜치
feature/*   - 기능 개발 브랜치
hotfix/*    - 긴급 수정 브랜치
```

### 2. 커밋 메시지 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락, 코드 변경이 없는 경우
refactor: 코드 리팩토링
perf: 성능 개선
test: 테스트 추가
chore: 빌드 업무 수정, 패키지 매니저 수정
```

### 3. Pull Request 템플릿
```markdown
## 변경 사항
- [ ] 새로운 기능 추가
- [ ] 버그 수정
- [ ] 문서 업데이트
- [ ] 성능 개선

## 테스트
- [ ] 새로운 테스트 추가
- [ ] 기존 테스트 통과
- [ ] 수동 테스트 완료

## 스크린샷
(변경 사항이 UI에 영향을 주는 경우)
```

---

## ⚠️ 주의사항

### 절대 변경하면 안 되는 것들
1. **디자인 시스템 색상**: `--accent-green` 등 브랜드 색상
2. **레이아웃 구조**: App.tsx의 기본 구조
3. **매직 버튼**: 핵심 UX 요소이므로 신중하게 수정
4. **ShadCN 컴포넌트**: 직접 수정하지 말고 래핑하여 사용

### 성능에 민감한 부분
1. **애니메이션**: 60fps 유지 필수
2. **이미지 로딩**: 항상 최적화된 크기 사용
3. **상태 업데이트**: 불필요한 리렌더링 방지

### 접근성 고려사항
1. **키보드 네비게이션**: 모든 인터랙티브 요소
2. **색상 대비**: WCAG 2.1 AA 기준 준수
3. **스크린 리더**: 적절한 aria-label 사용

---

## 📞 연락처

프로젝트 관련 질문이나 제안 사항이 있으시면 언제든 연락주세요.

**팀_오비스트라 개발팀**  
Email: dev@ovistra.com  
Slack: #team-ovistra  

---

*이 문서는 팀_오비스트라 프로젝트의 품질과 일관성을 보장하기 위해 작성되었습니다. 새로운 개발자는 이 가이드라인을 꼼꼼히 읽고 따라주시기 바랍니다.*

**마지막 업데이트**: 2025년 1월

---

**💡 팁**: 이 문서는 프로젝트와 함께 계속 업데이트됩니다. 북마크해두고 정기적으로 확인해주세요!