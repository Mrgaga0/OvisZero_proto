# Team Ovistra - AI-Powered Video Editing Plugin for Adobe Premiere Pro

팀 오비스트라는 Adobe Premiere Pro용 AI 기반 비디오 편집 플러그인입니다. 전문 편집자의 패턴을 학습하여 반복적인 작업을 자동화하면서도 창의적인 제어권을 유지합니다.

## 🚀 Features

- **Magic Button**: 원클릭 AI 편집 실행
- **Channel System**: YouTube, Instagram, TikTok 등 플랫폼별 편집 스타일 관리
- **AI Learning**: 기존 프로젝트에서 편집 패턴 학습
- **Training Data Manager**: 학습 데이터셋 관리
- **Real-time Status**: AI 처리 상태 실시간 모니터링

## 📋 Prerequisites

- Adobe Premiere Pro 2022 이상
- Node.js 18+ 및 npm
- Windows 10/11 또는 macOS 10.15+

## 🛠️ Installation

### 1. 의존성 설치
```bash
npm install
```

### 2. CEP 디버그 모드 활성화
```bash
npm run cep:debug
```

### 3. 플러그인 설치
```bash
npm run cep:install
```

### 4. Premiere Pro 재시작
Premiere Pro를 재시작하고 Window > Extensions > Team Ovistra를 선택합니다.

## 💻 Development

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속하여 개발 모드에서 테스트할 수 있습니다.

### 빌드
```bash
npm run build
```

### 플러그인 패키징
```bash
npm run cep:package
```

## 🐛 Debugging

1. Chrome 브라우저에서 `http://localhost:7777` 접속
2. Team Ovistra 패널 선택
3. Chrome DevTools로 디버깅

## 📁 Project Structure

```
OvisZero_proto/
├── CSXS/                    # CEP 플러그인 설정
│   └── manifest.xml         # 플러그인 메타데이터
├── host/                    # ExtendScript 파일
│   └── index.jsx           # Premiere Pro API 접근
├── components/              # React 컴포넌트
│   ├── ui/                 # UI 컴포넌트 (shadcn/ui)
│   ├── MagicButton.tsx     # 메인 실행 버튼
│   ├── LearningInterface.tsx # AI 학습 인터페이스
│   └── TrainingDataManager.tsx # 데이터 관리
├── stores/                  # 상태 관리
│   └── useAppStore.ts      # Zustand store
├── types/                   # TypeScript 타입 정의
├── js/                      # CEP 통합 스크립트
│   ├── cep-bridge.js       # CEP-React 브리지
│   └── main.js             # CEP 진입점
└── App.tsx                  # 메인 애플리케이션

```

## 🎨 Tech Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **UI Framework**: Radix UI (shadcn/ui)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Build Tool**: Vite
- **CEP Integration**: Adobe CEP SDK

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

내부 개발팀만 기여할 수 있습니다. 기여 가이드라인은 `DEVELOPER_GUIDELINES.md`를 참조하세요.

## 📞 Support

문제가 발생하면 내부 개발팀에 문의하세요.