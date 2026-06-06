# Design Briefs

Claude 디자인 도구(또는 Figma Make, v0 등)에 넘길 수 있는 화면별 디자인 명세서.

## 사용법

1. 각 MVP의 brief 파일을 통째로 복사
2. Claude.ai 또는 디자인 도구에 붙여넣기
3. "이 명세를 기반으로 React 컴포넌트/시안 만들어줘" 식으로 요청
4. 받은 결과를 본인 코드 컨벤션에 맞게 다듬어서 사용

## 컬러 팔레트 (전 MVP 공통)

- Primary: `#4B7BAD` (Soft Blue)
- Secondary: `#EEF3F8`
- Accent: `#FF7A6E` (Coral)
- Foreground: `#1F2A3A`
- Muted: `#DDE5EE`
- Destructive: `#E04848`
- Warning: `#F2A93B`
- Success: `#4CAF7C`

폰트: Pretendard Variable (한글) + Inter (영문)
스타일: shadcn/ui (New York), 모서리 radius 0.5rem

## 톤앤매너

- 의료 신뢰감 + 강아지 친근함
- 정보 위주, 과한 일러스트 지양
- 한국어 UX 라이팅 (반말 X, 친근한 존댓말)
- 이모지는 강아지 도메인이라 적당히 허용 (🐕 🍽 🚶 등)

## 파일 목록

- [mvp-0.md](mvp-0.md) — 기본 일상 트래커 (상세)
- mvp-1.md — 사진 업로드 + 약 복용 알림 (작성 예정, MVP 1 진입 시)
- mvp-2.md — 지병별 동적 모니터링 + 측정 도구 (작성 예정)
- mvp-3.md — AI 간식 분석 + 카메라 UI (작성 예정)
