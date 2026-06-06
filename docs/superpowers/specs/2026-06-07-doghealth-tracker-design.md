# DogHealth Tracker — 설계 문서

**작성일:** 2026-06-07
**작성자:** jeongmin (백엔드 학습 프로젝트)
**프로젝트 코드명:** `dog-health-tracker`
**목표:** 프론트엔드 2년 2개월차 → Next.js 풀스택 개발자 이직을 위한 백엔드 학습 + 포트폴리오

---

## 1. 프로젝트 개요

**모든 강아지 보호자를 위한 헬스 트래커.** 건강한 강아지는 일반 모드(식사·산책·배변·체중)로 사용하고, 지병이 있거나 진단받게 된 강아지는 해당 지병에 맞춰 **추가 모니터링 지표가 자동으로 활성화**된다(예: 심장병 → 호흡수, 신장병 → 음수량).

또한 간식/사료 사진을 찍으면 AI가 영양 정보를 분석해 적합성을 판정한다. 지병이 있으면 그 지병 기준으로, 없으면 일반 강아지 영양 가이드 기준으로 평가한다.

핵심 차별화는 **"강아지 건강 상태에 따라 진화하는 적응형 트래커 + AI 식이 가드"**. 진입장벽은 낮고(누구나 쓸 수 있음), 가치는 강아지의 건강 상태가 바뀔수록 커진다.

### 사용자 시나리오

| 사용자 유형 | 사용 흐름 |
|------------|---------|
| 건강한 강아지 보호자 (대다수) | 일반 모드: 식사/산책/체중 트래킹 + AI 간식 분석(일반 기준) |
| 노령견 보호자 | 일반 모드 + 노령견 권장 지표(활력도 등) |
| 지병 진단받은 강아지 보호자 | 지병 등록 → 해당 지병 지표 자동 활성화 + AI 간식 분석(지병 기준) |
| 건강했다가 진단받게 된 경우 | 기존 데이터 유지 + 지병 추가만 하면 즉시 맞춤 모드로 전환 |

---

## 2. 왜 이 프로젝트인가 (학습/이직 관점)

### 학습 관점
- 점진적 난이도 곡선(MVP 0 → 4)이 백엔드 학습 단계와 1:1 매핑
- 백엔드 핵심 기술을 모두 다룸: CRUD, 인증, 파일 업로드, 스케줄링, 외부 API, 메타데이터 설계, 시계열, AI 통합, 컨테이너화, 배포
- 매주 동작하는 산출물 → 학습 동기 유지

### 이직 관점 (한국 풀스택 채용 시장 조사 결과 반영)
- **요구 스택 일치:** Next.js + NestJS + Prisma + PostgreSQL + Docker + AWS = 한국 스타트업/중소 IT 표준
- **AI 통합 경험:** 2026년 채용 시장 핵심 가산점 (삼양식품, 미리캔버스 등 명시)
- **차별화된 도메인 스토리:** "왜 만들었나요?" 질문에 강력한 답변 (단순 CRUD 가계부와 차별)

---

## 3. 핵심 기능 (Core Features)

### 3.1 기본 모드 (모든 강아지 공통)

지병 등록 여부와 무관하게 **모든 강아지가 사용**하는 기본 트래킹 지표.

- 식사량/식사 시간
- 산책 시간/거리/걸음수
- 배변 횟수/상태
- 체중 (주 1회 권장)
- 사진 일지 (자유 기록)
- 메모

→ 일반 강아지 보호자는 여기까지만으로도 충분히 가치 있는 서비스.

### 3.2 지병 확장 모드 (지병 등록 시 자동 활성화)

강아지에 지병을 등록하면 기본 모드 위에 **해당 지병의 필수 지표가 자동으로 추가**된다. 지병 등록은 언제든 가능 (건강하다가 진단받으면 그때 추가).

각 지표는 단순 숫자 입력이 아니라 **측정 도구(Measurement Tool)**를 통해 보호자 친화적으로 기록한다 (섹션 3.4 참고).

| 지병 | 자동 추가되는 모니터링 지표 | 측정 도구 |
|------|-------------------------|---------|
| 심장병 | 분당 호흡수 (정상 10-30, 40+ 경고) | **탭 카운터 (60초)** |
| 심장병 | 분당 심박수 (정상 60-160) | **탭 카운터 (15초 × 4)** |
| 심장병 | 기침 횟수, 잇몸 색 | 카운트, 사진(MVP 3) |
| 신장병 | 음수량 (ml) | **차이 입력 (시작-종료 ml)** |
| 신장병 | 배뇨 횟수, 식욕 | 카운트, 슬라이더 |
| 당뇨 | 혈당 수치 | 수치 직접 입력 |
| 당뇨 | 인슐린 주사 (시간/용량) | 시간 + 수치 |
| 당뇨 | 음수량 (다음증 모니터링) | **차이 입력** |
| 관절염 | 다리 절뚝임 정도 | **점수 슬라이더 (1-5)** |
| 관절염 | 통증 신호, 약 복용 | 체크리스트, 시간 |
| 췌장염 | 구토/설사 횟수, 복부 통증 | 카운트, 체크리스트 |
| 간질환 | 황달 체크, 신경 증상 | 사진(MVP 3), 체크리스트 |
| 간질/발작 | 발작 발생, 지속 시간 | 원터치 + **타이머 (Post-MVP)** |
| 노령견 (지병 없지만 7세+ 자동 추천) | 일반 활력도, 인지 기능 변화 | **점수 슬라이더 (1-5)** |

각 지표는 시계열로 저장되어 트렌드 그래프 제공. 임계값(`alertMin/alertMax`) 초과 시 경고.

### 3.3 AI 간식/사료 적합성 분석 (모든 강아지 사용 가능)

```
[사진 업로드: 간식/사료 패키지]
   ↓
[GPT Vision API: 제품명·성분·영양정보 추출]
   ↓
[규칙 엔진]
   ├── 강아지 지병 있음 → 지병별 기준으로 판정
   └── 강아지 지병 없음 → 일반 강아지 영양 가이드 기준으로 판정
                          (예: 나트륨/당분 과다 여부, 자일리톨 등 독성 성분)
   ↓
[판정 결과 표시]
   ✅ 추천 / ⚠️ 주의 / ❌ 위험 + 사유 설명
   ↓
[캐싱: 같은 제품 재분석 방지]
```

### 3.4 측정 도구 (Measurement Tools)

지표를 보호자가 **혼자 쉽게 측정**할 수 있게 도와주는 UI 컴포넌트 패턴. 백엔드 데이터 모델(`MeasurementSession`)은 통일되어 있어 새 지표 추가 시 재사용 가능.

| 패턴 | 동작 방식 | MVP 단계 | 주 사용처 |
|-----|---------|---------|---------|
| **A. 탭 카운터 (시간 제한)** | 화면 큰 버튼 → 첫 탭 시 타이머 시작 → 호흡 한 번당 한 번 탭 → N초 후 자동 종료 → 카운트 결과 표시 | **MVP 2** | 호흡수(60초), 심박수(15초→×4) |
| **B. 차이 입력** | 시작값(예: 그릇에 채운 ml) + 종료값(남은 ml) → 자동 차이 계산 → 저장 | **MVP 2** | 음수량, 식사량 |
| **C. 점수 슬라이더 (1-5)** | 슬라이더 + 각 단계 설명(이모지/텍스트) | **MVP 2** | 절뚝임, 활력도, 식욕, 통증, 인지 기능 |
| D. 사진 + AI 판정 | 카메라 → GPT Vision 판정 (잇몸 색, 황달, 변 상태) | MVP 3 | 잇몸 색, 황달, 변 상태 |
| E. 체크리스트 | 증상 다중 선택 (구토/설사/실신 등) | MVP 3 | 췌장염/간질환 증상 |
| F. 타이머 기록 | 시작/정지 버튼 → 지속 시간 측정 | Post-MVP | 발작 지속, 회복 시간 |
| G. 수치 직접 입력 | 숫자 키패드 + 단위 | MVP 2 (보조) | 혈당, 체온, 체중 |

#### A. 탭 카운터 동작 상세 (대표 예시)

```
[화면: 큰 원형 버튼 "강아지가 숨쉴 때마다 탭하세요"]
     ↓
[첫 탭] → 타이머 60초 카운트다운 시작 + 화면에 "00:59" 표시
     ↓
[강아지 호흡할 때마다 탭] → 화면 중앙에 카운트 숫자 실시간 표시
     ↓
[60초 경과] → 자동 종료 + "분당 호흡수: 32회"
     ↓
[저장 버튼] → 백엔드 POST /api/measurements
   {
     dogId, metricKey: "respiratory_rate",
     measurementType: "tap_counter",
     rawCount: 32, durationSec: 60,
     calculatedValue: 32
   }
     ↓
[백엔드: 임계값 체크] → 40+ 면 경고 응답 + 알림
     ↓
[결과 화면] → "정상 범위입니다" 또는 "⚠️ 평소보다 높음, 다시 측정 권유"
```

핵심 가치: **타이머 보면서 동시에 호흡 카운트하는 어려움 제거**.

### 3.5 보조 기능 (지원 기능)

- 약 복용 관리 (종류/용량/시간, 정시 알림, 누락 추적, 잔량 알림)
- 사진 일지 (성장/증상 기록)
- 진료 기록 (병원, 처방, 진료비)
- 통계 대시보드 (주간/월간 차트)
- 멀티 강아지 + 가족 공유 (post-MVP)

---

## 4. MVP 단계별 계획

각 MVP는 **그 자체로 동작 가능한 단위**이며 학습 단계와 매핑된다.

### MVP 0 — 기본 일상 트래커 (1주차, 난이도 ⭐)

> **이 단계까지만 해도 모든 강아지 보호자(건강한 강아지 포함)가 충분히 활용 가능한 서비스가 된다.**

**범위:**
- 회원가입/로그인 (NextAuth credentials)
- 강아지 1마리 등록 (이름, 종, 나이, 체중) — 지병 입력 없음
- 일반 일일 기록 CRUD (식사, 산책, 배변, 메모)
- 일일 기록 목록 + 단순 통계 (주간 차트)

**학습 포인트:**
- Next.js App Router + Route Handlers
- Prisma + SQLite 기초
- 단순 인증 + 세션
- React Hook Form + zod 검증

**기술 스택:** Next.js, Prisma, SQLite, NextAuth, Tailwind, Recharts

**성공 기준:** 본인이 직접 회원가입 → 강아지 등록 → 매일 기록 가능

---

### MVP 1 — 사진 업로드 + 약 복용 알림 (2-3주차, 난이도 ⭐⭐)

**범위:**
- 멀티 강아지 지원 (1:N user→dog)
- 사진 일지 (Cloudinary 또는 로컬 업로드)
- 약 등록 + 복용 시간 설정
- cron 기반 정시 알림 (이메일 또는 텔레그램 봇)
- 누락된 복용 추적 + 잔량 경고

**학습 포인트:**
- 파일 업로드 처리 (multipart/form-data)
- 외부 스토리지 연동 (Cloudinary SDK)
- node-cron 스케줄링
- 이메일 발송 (Resend) 또는 텔레그램 봇 API

**성공 기준:** 약 시간에 실제 알림 받기

---

### MVP 2 — 지병별 동적 모니터링 (4-5주차, 난이도 ⭐⭐⭐) ★ 핵심 차별화 시작

> **지병 등록은 선택사항.** 건강한 강아지 사용자는 MVP 0-1 기능만으로 계속 쓰면 되고, 지병이 있는 강아지만 추가 기능이 자동 활성화된다.

**범위:**
- 지병 마스터 데이터 시드 (심장/신장/당뇨/관절/췌장/간/노령 7종)
- 각 지병에 매핑된 모니터링 지표(`DiseaseMetric`) 정의
- 강아지 상세 페이지에서 **지병 등록/해제** (선택)
- 일일 기록 폼이 등록된 지병의 지표를 동적으로 표시 (지병 없으면 기존 기본 폼 그대로)
- **측정 도구 3종 구현 (섹션 3.4 참고):**
  - 패턴 A — **탭 카운터** (호흡수 60초, 심박수 15초→×4)
  - 패턴 B — **차이 입력** (음수량 시작-종료 ml)
  - 패턴 C — **점수 슬라이더 1-5** (절뚝임, 활력, 식욕, 통증)
- 측정 세션 백엔드 저장 (`MeasurementSession`) + 검증 + 임계값 응답
- 지표별 시계열 그래프 (Recharts line chart)
- 이상치 감지 (예: 호흡수 > 40회/분 → 경고)
- 7세 이상 강아지에게는 "노령견 모드 추천" 배너 표시 (선택)

**학습 포인트:**
- **메타데이터 기반 설계 (가장 중요한 학습 구간)**
- 시계열 데이터 모델링
- 동적 폼 렌더링 (조건부 필드)
- 통계 쿼리 (집계, 윈도우 함수)
- 클라이언트(타이머/탭) ↔ 서버(검증/저장) 데이터 흐름
- 측정 세션 메타데이터 저장 패턴 (재사용 가능한 일반화 설계)

**성공 기준:** 강아지에 "심장병" 등록 → 일일 기록에서 **탭 카운터로 호흡수 측정** → 60초 후 자동 저장 → 그래프로 추이 확인 + 임계값 초과 시 경고

---

### MVP 3 — AI 간식/사료 분석 (6-7주차, 난이도 ⭐⭐⭐) ★ 차별화 완성

> 지병 유무 모두 사용 가능. 지병이 없으면 일반 강아지 영양 가이드 기준으로 판정한다.

**범위:**
- 사진 업로드 → GPT-4o Vision API 호출
- 추출된 성분/영양정보 파싱 (JSON 구조화 응답)
- 규칙 엔진 (두 가지 모드):
  - **지병 없음:** 일반 강아지 기준 (자일리톨/초콜릿 등 독성 ❌, 나트륨/당분 과다 ⚠️)
  - **지병 있음:** 지병별 기준 (예: 신장병 → 인 > 0.5% ⚠️, 당뇨 → 당분 > 10% ❌)
- 판정 결과 표시 + 사유 설명
- 같은 제품(제품명 기준) 재분석 방지 위한 캐싱
- "내 강아지의 안전 간식 목록" 자동 생성

**학습 포인트:**
- LLM API 통합 (구조화 출력)
- 프롬프트 엔지니어링
- 규칙 엔진 설계 (DiseaseRule 테이블)
- Redis 또는 DB 기반 캐싱

**성공 기준:** 간식 패키지 사진 → 5초 내 적합성 판정 결과 표시

---

### MVP 4 — 아키텍처 분리 + Docker + 배포 (8-9주차, 난이도 ⭐⭐⭐⭐)

**범위:**
- API 서버 분리: Next.js (프론트) + NestJS (백엔드 API)
- 인증 토큰 기반(JWT) 통신
- PostgreSQL로 마이그레이션 (SQLite → Neon)
- Docker Compose로 로컬 개발 환경
- Vercel(프론트) + Railway(NestJS API + PostgreSQL) 배포
- Swagger 자동 문서화
- README + 데모 시드 데이터

**학습 포인트:**
- 분리 아키텍처 설계 (CORS, 인증 흐름)
- NestJS 기본기 (Module/Controller/Service/DI)
- Docker 컨테이너화
- 환경변수 분리 + CI/CD 기초
- API 문서화

**성공 기준:** 채용 담당자에게 공개 URL 전달 가능

---

## 5. 데이터 모델 (Prisma Schema 초안)

```prisma
// 사용자
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  dogs      Dog[]
  createdAt DateTime @default(now())
}

// 강아지
model Dog {
  id         String       @id @default(cuid())
  userId     String
  user       User         @relation(fields: [userId], references: [id])
  name       String
  breed      String?
  birthDate  DateTime?
  weight     Float?       // kg
  photoUrl   String?
  diseases   DogDisease[] // 다중 지병 가능
  records    DailyRecord[]
  medications Medication[]
  snackAnalyses SnackAnalysis[]
  measurementSessions MeasurementSession[]
  createdAt  DateTime     @default(now())
}

// 지병 마스터
model Disease {
  id          String          @id @default(cuid())
  name        String          @unique  // "심장병", "신장병" 등
  description String
  metrics     DiseaseMetric[] // 이 지병에 필요한 모니터링 지표들
  rules       DiseaseRule[]   // 식이 판정 규칙
  dogs        DogDisease[]
}

// 지병 ↔ 강아지 (N:M)
model DogDisease {
  id        String   @id @default(cuid())
  dogId     String
  diseaseId String
  diagnosedAt DateTime?
  severity  String?  // mild/moderate/severe
  dog       Dog      @relation(fields: [dogId], references: [id])
  disease   Disease  @relation(fields: [diseaseId], references: [id])
  @@unique([dogId, diseaseId])
}

// 지병별 모니터링 지표 정의
model DiseaseMetric {
  id          String   @id @default(cuid())
  diseaseId   String
  disease     Disease  @relation(fields: [diseaseId], references: [id])
  key         String   // "respiratory_rate", "water_intake_ml" 등
  label       String   // "분당 호흡수", "음수량(ml)"
  unit        String?  // "회/분", "ml"
  normalMin   Float?
  normalMax   Float?
  alertMin    Float?   // 이 미만이면 경고
  alertMax    Float?   // 이 초과면 경고
  inputType   String   // "number" | "select" | "boolean" | "photo"
}

// 일일 기록
model DailyRecord {
  id        String           @id @default(cuid())
  dogId     String
  dog       Dog              @relation(fields: [dogId], references: [id])
  recordedAt DateTime        @default(now())
  generalData Json           // 식사/산책/배변 등 일반 데이터
  metricValues MetricValue[] // 지병별 지표 값
  notes     String?
  photos    String[]         // 사진 URL 배열
}

// 지표 측정값 (시계열)
model MetricValue {
  id            String       @id @default(cuid())
  dailyRecordId String
  dailyRecord   DailyRecord  @relation(fields: [dailyRecordId], references: [id])
  metricId      String       // DiseaseMetric.id 참조
  valueNumber   Float?
  valueText     String?
  isAlert       Boolean      @default(false)  // 임계값 초과 여부
  // 어떻게 측정했는지 추적 (Optional - 측정 도구로 입력한 경우만)
  measurementSessionId String?
  measurementSession   MeasurementSession? @relation(fields: [measurementSessionId], references: [id])
  @@index([metricId, dailyRecordId])
}

// 측정 세션 — 어떻게 측정했는지 메타데이터까지 저장
model MeasurementSession {
  id              String   @id @default(cuid())
  dogId           String
  dog             Dog      @relation(fields: [dogId], references: [id])
  metricKey       String   // "respiratory_rate", "water_intake_ml" 등
  measurementType String   // "tap_counter" | "diff_input" | "slider" | "photo_ai" | "checklist" | "timer" | "manual"
  // 탭 카운터용
  rawCount        Int?     // 탭 횟수
  durationSec     Int?     // 측정 시간 (60초 등)
  // 차이 입력용
  startValue      Float?   // 시작값 (예: 그릇에 채운 ml)
  endValue        Float?   // 종료값 (남은 ml)
  // 공통
  calculatedValue Float    // 최종 측정값 (MetricValue.valueNumber로도 저장)
  measuredAt      DateTime @default(now())
  notes           String?
  metricValues    MetricValue[]  // 이 세션이 생성한 MetricValue들
  @@index([dogId, metricKey, measuredAt])
}

// 약 복용 관리
model Medication {
  id          String   @id @default(cuid())
  dogId       String
  dog         Dog      @relation(fields: [dogId], references: [id])
  name        String
  dosage      String   // "5mg", "1정"
  times       String[] // ["08:00", "20:00"]
  totalCount  Int?     // 잔량 추적
  remainingCount Int?
  doses       MedicationDose[]
}

// 약 복용 기록
model MedicationDose {
  id           String     @id @default(cuid())
  medicationId String
  medication   Medication @relation(fields: [medicationId], references: [id])
  scheduledAt  DateTime
  takenAt      DateTime?  // null = 누락
  notified     Boolean    @default(false)
}

// 식이 판정 규칙
model DiseaseRule {
  id          String   @id @default(cuid())
  diseaseId   String
  disease     Disease  @relation(fields: [diseaseId], references: [id])
  nutrient    String   // "sodium", "phosphorus", "sugar"
  operator    String   // ">", "<", ">=", "<="
  threshold   Float
  unit        String   // "mg/100g", "%"
  verdict     String   // "danger" | "caution"
  message     String   // "신장병 강아지에게 인 함량이 높습니다"
}

// 간식 분석 캐시 + 기록
model SnackAnalysis {
  id           String   @id @default(cuid())
  dogId        String
  dog          Dog      @relation(fields: [dogId], references: [id])
  productName  String?  // 같은 제품 재분석 방지용 키
  imageUrl     String
  extractedData Json    // GPT Vision이 추출한 성분/영양정보
  verdict      String   // "recommended" | "caution" | "danger"
  reasons      String[] // 판정 이유들
  analyzedAt   DateTime @default(now())
  @@index([productName])
}
```

---

## 6. 아키텍처

### MVP 0~3 단계 (Next.js 모놀리스)

```
[Browser]
    ↓
[Next.js App Router]
    ├── React Components (UI)
    ├── Route Handlers (/api/*)
    ├── Server Actions
    └── NextAuth
         ↓
    [Prisma ORM]
         ↓
    [SQLite] (개발) / [PostgreSQL] (이후)

[외부 서비스]
    - Cloudinary (이미지 스토리지)
    - OpenAI GPT-4o Vision (간식 분석)
    - Telegram Bot API (알림)
    - Resend (이메일 알림)
```

### MVP 4 단계 (분리 아키텍처)

```
[Browser]
    ↓
[Vercel: Next.js Frontend]  ← JWT 토큰 ──→  [Railway: NestJS API]
    └── BFF (간단한 프록시)                      ├── Auth Module
                                                  ├── Dog Module
                                                  ├── Disease Module
                                                  ├── Record Module
                                                  ├── Medication Module
                                                  ├── Snack Analysis Module
                                                  └── Notification Module (cron)
                                                       ↓
                                                  [Neon PostgreSQL]
                                                       ↑
                                                  [Cloudinary / OpenAI / Telegram]
```

---

## 7. 기술 스택 확정

| 분류 | 도구 | 채택 이유 |
|------|------|---------|
| 프론트엔드 | Next.js 16 (App Router), TypeScript, Tailwind, Recharts | 시장 표준, 본인 익숙 |
| 백엔드 (MVP 0-3) | Next.js Route Handlers + Server Actions | 학습 곡선 완만 |
| 백엔드 (MVP 4) | NestJS 11 + TypeScript | 한국 채용 시장 핵심 스택 |
| ORM | Prisma | 타입 안정성, 마이그레이션 편의 |
| DB | SQLite → PostgreSQL (Neon) | 학습→배포 단계 마이그레이션 경험 |
| 인증 | NextAuth (MVP 0-3) → JWT (MVP 4) | 단계적 학습 |
| 파일 스토리지 | Cloudinary | 무료 티어 + 이미지 변환 |
| AI | OpenAI GPT-4o Vision | 비전 분석 + 구조화 출력 |
| 알림 | node-cron + Telegram Bot / Resend | YouTube 프로젝트와 동일 패턴 |
| 컨테이너 | Docker, Docker Compose | MVP 4 필수 |
| 배포 | Vercel + Railway | 무료 티어 + 한 번 클릭 배포 |
| 테스트 | Vitest + Supertest | NestJS와 호환 |

---

## 7.5 디자인 시스템

shadcn/ui + Tailwind 기반. 컬러 팔레트는 "Soft Blue + Coral" — 의료 신뢰감(블루) + 친근함(코랄).

| 토큰 | Light Hex | 용도 |
|-----|----------|------|
| `--primary` | `#4B7BAD` | 메인 액션 버튼, 링크, 포커스 |
| `--secondary` | `#EEF3F8` | 보조 배경, 구분선 |
| `--accent` | `#FF7A6E` | 강조 포인트, 알림 뱃지 |
| `--foreground` | `#1F2A3A` | 본문 텍스트 |
| `--muted` | `#DDE5EE` | 비활성 배경, 플레이스홀더 |
| `--destructive` | `#E04848` | 삭제, 위험(호흡수 임계값 초과 등) |
| `--warning` | `#F2A93B` | 주의 (간식 분석 "주의" 등) |
| `--success` | `#4CAF7C` | 정상 범위 표시 |

다크모드 변형은 MVP 0 globals.css 작성 시 확정. 폰트: Pretendard(한글) + Inter(영문).

## 8. 보안 / 법적 고려사항

⚠️ **매우 중요:** 이 서비스는 **의료 진단 도구가 아닌 기록 보조 도구**다.

- UI 모든 페이지에 "본 서비스는 수의학적 진단을 대체하지 않습니다" 명시
- AI 간식 분석 결과에 "참고용이며 반드시 수의사와 상담하세요" 고지
- 비밀번호는 bcrypt 해싱, 환경변수는 `.env.local` (gitignore)
- 사진은 본인 강아지 사진만 — 타인 강아지 사진 무단 업로드 방지 안내
- 의료 데이터는 민감정보 → HTTPS 필수, 본인 외 접근 차단

---

## 9. Post-MVP 확장 (이력서 가산점용)

- **측정 도구 확장 (패턴 D/E/F/G):**
  - D. 사진 + AI 판정 → 잇몸 색, 황달, 변 상태 (MVP 3에서 일부)
  - E. 체크리스트 → 췌장염/간질환 증상 다중 선택
  - F. 타이머 → 발작 지속 시간, 일어나는 시간
  - G. 수치 직접 입력 → 혈당, 체온 (MVP 2에 보조로 가능)
- **가족 공유:** 한 강아지를 여러 보호자가 공동 기록
- **수의사 공유 리포트:** 진료 시 데이터를 PDF/QR로 수의사에게 공유
- **RAG 챗봇:** 강아지 데이터 + 질병별 가이드 기반 GPT 챗봇 ("우리 강아지 요즘 어때?")
- **모바일 앱:** React Native로 확장 (사진 업로드/알림 UX 개선)
- **유실견 알림 네트워크:** 위치기반 푸시 (PostGIS)
- **측정 정확도 분석:** 같은 지표 최근 N개 평균 vs 오늘 측정값 비교, 이상치 시 재측정 권유

---

## 10. 학습 방법론

- **AI 사용 원칙:** 코드 생성 요청 ❌ / 개념 설명, 코드 리뷰, 디버깅 힌트 ⭕
- **이론 1 : 실습 3** — 강의/문서 1시간 보면 3시간은 직접 코딩
- **매 MVP마다 회고:** 무엇을 배웠는지 README의 LEARNING.md에 기록 (면접 자료)
- **막힐 때:** Claude에게 정답이 아닌 **방향**만 묻기

---

## 11. 다음 단계

1. 본 spec 문서 사용자 리뷰
2. 승인 시 → `writing-plans` skill로 MVP 0 상세 구현 플랜 작성
3. MVP 0 구현 시작 (1주차)
