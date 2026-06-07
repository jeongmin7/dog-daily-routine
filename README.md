# 🐕 DogHealth Tracker — 하루

> **우리 아이의 하루.** 강아지의 건강 상태에 따라 진화하는 적응형 헬스 트래커 + AI 식이 가드.

[![Live Demo](https://img.shields.io/badge/live-demo-success)](https://dog-daily-routine.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/)

[데모 보기](https://dog-daily-routine.vercel.app/) · [주요 기능](#-주요-기능) · [기술 스택](#-기술-스택) · [시작하기](#-시작하기) · [로드맵](#-로드맵)

---

## 📖 소개

**모든 강아지 보호자를 위한 헬스 트래커입니다.** 건강한 강아지는 일반 모드(식사·산책·배변·체중)로 가볍게 쓰고, 지병이 있거나 진단을 받게 된 강아지는 해당 지병에 맞춘 **추가 모니터링 지표가 자동으로 활성화**됩니다 (예: 심장병 → 호흡수, 신장병 → 음수량).

또한 간식·사료 사진을 찍으면 AI가 영양 정보를 분석해 적합성을 판정합니다. 지병이 있으면 그 지병 기준으로, 없으면 일반 강아지 영양 가이드 기준으로 평가합니다.

핵심 가치는 **"강아지 건강 상태에 따라 진화하는 적응형 트래커 + AI 식이 가드"** 입니다. 진입장벽은 낮고(누구나 쓸 수 있음), 가치는 강아지의 건강 상태가 바뀔수록 커집니다.

> ⚠️ 본 서비스는 **수의학적 진단을 대체하지 않으며**, 기록 보조 도구입니다. AI 분석 결과는 참고용이며 반드시 수의사와 상담하세요.

---

## ✨ 주요 기능

### 🐾 기본 모드 (모든 강아지 공통)
- 식사량·식사 시간, 산책 시간·거리, 배변 횟수·상태, 체중 트래킹
- 사진 일지 + 메모
- 주간/월간 통계 대시보드

### 🩺 지병별 동적 모니터링 (지병 등록 시 자동 활성화)
- 심장·신장·당뇨·관절·췌장·간·노령 등 지병별 필수 지표 자동 추가
- **보호자 친화적 측정 도구**
  - 탭 카운터 — 호흡수(60초), 심박수(15초×4)
  - 차이 입력 — 음수량(시작 ml − 종료 ml)
  - 점수 슬라이더(1–5) — 절뚝임·활력·식욕·통증
- 지표별 시계열 그래프 + 임계값 초과 시 경고

### 🤖 AI 간식·사료 적합성 분석
- 제품 사진 → GPT Vision으로 성분·영양정보 추출
- 규칙 엔진으로 판정 (지병 있음: 지병 기준 / 없음: 일반 영양 가이드)
- ✅ 추천 · ⚠️ 주의 · ❌ 위험 + 사유 설명, 동일 제품 캐싱

### 💊 보조 기능
- 약 복용 관리 (정시 알림, 누락 추적, 잔량 경고)
- 진료 기록, 멀티 강아지 + 가족 공유(예정)

---

## 🛠 기술 스택

| 분류 | 사용 기술 |
|------|----------|
| 프론트엔드 | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| 백엔드 (MVP 0–3) | Next.js Route Handlers + Server Actions |
| 백엔드 (MVP 4) | NestJS 11 (API 서버 분리) |
| ORM / DB | Prisma · PostgreSQL (Neon) |
| 인증 | NextAuth → JWT |
| 파일 스토리지 | Cloudinary |
| AI | OpenAI GPT-4o Vision |
| 알림 | node-cron + Telegram Bot / Resend |
| 배포 | Vercel (프론트) + Railway (API·DB) |

> 디자인 시스템: shadcn/ui (New York) + Tailwind, "하루" 디자인 토큰(Primary `#2E92D6` 스카이블루). 폰트: Pretendard + Inter.

---

## 🚀 시작하기

### 요구 사항
- Node.js 20 이상

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

### 빌드

```bash
npm run build
npm run start
```

---

## 🗺 로드맵

이 프로젝트는 백엔드 학습 곡선과 1:1로 매핑된 단계별 MVP로 개발됩니다.

| 단계 | 내용 | 상태 |
|------|------|------|
| **MVP 0** | 기본 일상 트래커 (인증, 강아지 등록, 일일 기록 CRUD, 주간 차트) | 🚧 진행 중 |
| **MVP 1** | 사진 업로드 + 약 복용 알림 (멀티 강아지, cron 알림) | 📋 예정 |
| **MVP 2** | 지병별 동적 모니터링 (측정 도구 3종, 시계열 그래프) ★ 핵심 차별화 | 📋 예정 |
| **MVP 3** | AI 간식·사료 분석 (GPT Vision + 규칙 엔진) ★ 차별화 완성 | 📋 예정 |
| **MVP 4** | 아키텍처 분리 + Docker + 배포 (NestJS, PostgreSQL, CI/CD) | 📋 예정 |

자세한 설계는 [`docs/superpowers/specs`](docs/superpowers/specs) 의 설계 문서를 참고하세요.

---

## 📁 프로젝트 구조

```
dog-health-tracker/
├── app/                 # Next.js App Router
├── docs/                # 설계 스펙 · 구현 플랜 · 디자인 핸드오프
│   └── superpowers/
└── public/              # 정적 자산
```

---

이 프로젝트는 프론트엔드 개발자의 **Next.js 풀스택 전환을 위한 학습 + 포트폴리오 프로젝트**입니다.
