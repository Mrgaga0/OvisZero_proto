# Version Management Guide

## 버전 관리 시스템

Team Ovistra 프로젝트는 Semantic Versioning (SemVer)을 따릅니다.

### 버전 형식
`MAJOR.MINOR.PATCH` (예: 1.2.3)

- **MAJOR**: 하위 호환되지 않는 API 변경
- **MINOR**: 하위 호환되는 기능 추가
- **PATCH**: 하위 호환되는 버그 수정

### 자동 버전 관리 명령어

```bash
# 패치 버전 증가 (0.1.0 → 0.1.1)
npm run version:patch "버그 수정 메시지"

# 마이너 버전 증가 (0.1.1 → 0.2.0)
npm run version:minor "새 기능 추가 메시지"

# 메이저 버전 증가 (0.2.0 → 1.0.0)
npm run version:major "주요 변경사항 메시지"
```

### 자동화 내용

1. `package.json` 버전 업데이트
2. `CLAUDE.md` 버전 섹션 업데이트
3. Git 커밋 생성
4. Git 태그 생성 (v0.1.1 형식)

### 릴리즈 후 작업

```bash
# GitHub에 푸시
git push origin main --tags
```

### 버전 히스토리 확인

```bash
# 모든 태그 보기
git tag

# 특정 버전 체크아웃
git checkout v0.1.0
```

### 롤백 방법

```bash
# 이전 버전으로 되돌리기
git checkout v0.1.0
git checkout -b hotfix-from-0.1.0
```

## 버전 정책

### 언제 PATCH 버전을 올릴까?
- 버그 수정
- 성능 개선
- 문서 업데이트
- 의존성 보안 패치

### 언제 MINOR 버전을 올릴까?
- 새로운 기능 추가
- 기존 기능 개선
- 새로운 API 엔드포인트 추가
- UI 컴포넌트 추가

### 언제 MAJOR 버전을 올릴까?
- API 변경으로 인한 하위 호환성 깨짐
- 주요 아키텍처 변경
- 데이터베이스 스키마 주요 변경
- 프레임워크 주요 버전 업그레이드

## 릴리즈 노트 작성

각 버전 릴리즈 시 CHANGELOG.md에 다음 내용 포함:
- 추가된 기능 (Added)
- 변경된 기능 (Changed)
- 사용 중단 예정 (Deprecated)
- 제거된 기능 (Removed)
- 수정된 버그 (Fixed)
- 보안 패치 (Security)