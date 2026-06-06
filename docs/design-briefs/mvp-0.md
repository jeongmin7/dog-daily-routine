# MVP 0 — Design Brief

이 문서를 통째로 Claude 디자인 도구나 v0/Figma Make에 붙여넣고 시안/컴포넌트를 생성하세요.

---

## 프로젝트 개요

**DogHealth Tracker** — 강아지 보호자를 위한 일일 헬스 트래커. MVP 0은 기본 트래커 (회원가입/강아지 등록/일일 기록/주간 통계).

- **타겟:** 20~40대 강아지 보호자 (특히 첫 강아지 키우는 사람도 부담 없이)
- **디바이스 우선순위:** 모바일 우선, 태블릿/데스크톱 적응
- **사용 시나리오:** 주로 저녁에 그날의 식사/산책/배변/체중을 짧게 입력. 가끔 주간 추이 확인.

---

## 디자인 시스템 (전 화면 공통)

### 컬러 토큰
| 토큰 | Light | 용도 |
|-----|-------|------|
| `primary` | `#4B7BAD` | 메인 CTA, 링크 |
| `secondary` | `#EEF3F8` | 보조 배경, 구분선 |
| `accent` | `#FF7A6E` | 강조, 알림 뱃지 |
| `foreground` | `#1F2A3A` | 본문 텍스트 |
| `muted` | `#DDE5EE` | 비활성, 플레이스홀더 |
| `destructive` | `#E04848` | 삭제, 위험 |
| `warning` | `#F2A93B` | 주의 |
| `success` | `#4CAF7C` | 정상 표시 |

다크모드 지원.

### 타이포그래피
- 폰트: Pretendard Variable (한글 메인), Inter (영문 보조)
- 제목: 600 weight, text-2xl
- 본문: 400 weight, text-base
- 캡션: 400 weight, text-sm, muted-foreground

### 컴포넌트
- 베이스: shadcn/ui (New York style)
- 모서리 radius: 0.5rem
- 그림자: 미니멀 (shadow-sm)
- 간격: 4의 배수 (space-1=4px, space-4=16px, space-6=24px)

### 톤앤매너
- 의료 신뢰감 + 강아지 친근함
- 친근한 존댓말 ("등록해주세요" / "오늘 기록을 작성해보세요")
- 이모지 적절히 (🐕 🍽 🚶 💩 ⚖)
- 정보 밀도 적당히, 과한 일러스트 지양

### 레이아웃 규칙
- 모바일: `max-w-md` 중앙 정렬, 좌우 패딩 16px
- 데스크톱: `max-w-2xl` 중앙 정렬 (대시보드/상세)
- 헤더 높이: 56px (모바일/데스크톱 동일)

---

## 화면 목록 (총 8개)

### 1. 회원가입 (`/signup`)

**목적:** 신규 사용자가 이메일/비밀번호로 가입.

**레이아웃:**
- 전체 화면 중앙 정렬, `secondary` 배경
- 카드 형태 (`max-w-sm`, border, shadow-sm)
- 타이틀 "DogHealth 회원가입" + 서브 "이메일로 가입하세요"

**컴포넌트:**
- Input: 이메일, 비밀번호(type=password), 이름 (선택)
- Button: "가입하기" (primary, full-width)
- 하단 링크: "이미 계정이 있나요? **로그인**"

**상태:**
- 빈 입력 → 필드 아래 에러 메시지 (destructive 색)
- 가입 중 → 버튼 disabled + "가입 중..."
- 이메일 중복 → 폼 위 에러 메시지
- 성공 → `/login?signup=success`로 리다이렉트

---

### 2. 로그인 (`/login`)

**목적:** 기존 사용자 로그인.

**레이아웃:** 회원가입과 동일한 카드 패턴.

**컴포넌트:**
- 가입 성공 알림 (조건부, query param `signup=success`일 때): success 색 박스
- Input: 이메일, 비밀번호
- Button: "로그인" (primary, full-width)
- 하단 링크: "계정이 없나요? **가입하기**"

**상태:**
- 잘못된 자격증명 → "이메일 또는 비밀번호가 올바르지 않습니다"
- 로그인 중 → 버튼 disabled
- 성공 → `/` 리다이렉트

---

### 3. 대시보드 (`/`)

**목적:** 로그인 직후 첫 화면. 강아지 빠른 접근 + 최근 기록.

**레이아웃:**
- 헤더: 로고 "🐕 DogHealth" (좌) + 로그아웃 버튼 (우, ghost variant)
- 본문 `max-w-2xl mx-auto py-8`

**비어있는 상태 (강아지 없음):**
- 점선 박스 안에:
  - 큰 이모지 🐕
  - "아직 등록된 강아지가 없어요"
  - 서브 텍스트
  - 큰 primary 버튼: "강아지 등록하기"

**채워진 상태:**
- 인사말 "안녕하세요 🐕" (text-2xl)
- 우상단 "강아지 추가" 버튼 (outline, sm)
- 강아지 카드 리스트 (각 카드: 이름 + "오늘 기록" 버튼 + "상세 보기 →" 링크)
- "최근 기록 (전체)" 섹션: 날짜 + 간단 정보 줄(🍽 100g 🚶 30분 등)

---

### 4. 강아지 등록 (`/dogs/new`)

**목적:** 강아지 기본 정보 입력.

**레이아웃:** `max-w-md mx-auto py-8`, 폼 카드 없이 그냥 페이지에 직접.

**컴포넌트:**
- 타이틀 "강아지 등록" + 서브 "기본 정보를 입력해주세요"
- Input: 이름 (필수), 견종, 생년월일 (type=date), 체중 kg (number, step=0.1)
- 모두 선택사항 표시 (이름 제외)
- Button: "등록하기" (primary, full-width)

**상태:**
- 이름 빈 칸 → "이름은 필수입니다"
- 미래 생년월일 → "생년월일은 미래일 수 없습니다"
- 음수 체중 → "체중은 양수여야 합니다"
- 등록 중 → 버튼 disabled

---

### 5. 강아지 상세 (`/dogs/[id]`)

**목적:** 강아지 정보 + 주간 통계 + 최근 기록 목록.

**레이아웃:** `max-w-2xl mx-auto py-8 space-y-6`

**섹션 1: 강아지 카드 (DogCard)**
- Card: 이름(CardTitle) + 견종/나이/체중 (text-sm grid)
- 나이는 "X년 Y개월" 형식

**섹션 2: 액션 버튼**
- "오늘 기록 작성" (primary, 좌측 정렬)

**섹션 3: 주간 통계**
- 제목 "주간 통계" (text-lg semibold)
- 차트 3개 grid (수직 배치):
  - 식사량 (g) — `#4B7BAD` Line chart
  - 산책 시간 (분) — `#FF7A6E` Line chart
  - 체중 (kg) — `#4CAF7C` Line chart
- 각 차트: 200px 높이, X축 날짜(월/일), Y축 값, dot 표시

**섹션 4: 최근 기록 목록**
- 제목 "최근 기록"
- RecordCard 리스트:
  - 날짜 (muted, ex: "6월 7일 토")
  - 인라인 정보: 🍽100g 🚶30분 📏1.5km 💩2회 ⚖4.6kg (있는 것만)
  - 메모 (있으면, 2줄 line-clamp)
  - hover 시 shadow-md
  - 클릭 시 기록 상세로 이동

**빈 상태:**
- "아직 기록이 없어요. 첫 기록을 작성해보세요!" (muted)

---

### 6. 일일 기록 입력 (`/dogs/[id]/records/new`)

**목적:** 오늘(또는 지정 날짜) 기록 입력. 모든 필드 선택.

**레이아웃:** `max-w-md mx-auto py-8`

**컴포넌트:**
- 타이틀 "오늘 기록" + 서브 "기록할 항목만 입력하세요 (모두 선택)"
- 날짜 (type=date, 오늘 default)
- 식사량 (g, number)
- 산책 분 + 산책 km (2칸 grid)
- 배변 횟수 + 체중 kg (2칸 grid)
- 메모 (Textarea, rows=3, placeholder="컨디션, 특이사항 등")
- Button: "저장" (primary, full-width)

**UX 디테일:**
- 모든 필드 placeholder 회색
- 숫자 필드는 빈 값 허용 (Number 변환 시 undefined)
- 저장 후 강아지 상세로 리다이렉트

---

### 7. 일일 기록 수정/삭제 (`/dogs/[id]/records/[recordId]`)

**목적:** 기존 기록 수정 또는 삭제.

**레이아웃:** `max-w-md mx-auto py-8`

**컴포넌트:**
- 타이틀 "기록 수정"
- 입력 폼 (기존 값 채워진 상태) — 6번 화면과 동일한 필드
- Button: "저장" (primary, full-width)
- 하단 우측: "삭제" 버튼 (destructive variant)

**삭제 흐름:**
- 클릭 → 브라우저 confirm("이 기록을 삭제할까요?")
- 확인 → DELETE 요청 → 강아지 상세로 리다이렉트
- 실패 → alert

---

### 8. 공통 헤더 (모든 (app) 레이아웃)

**레이아웃:**
- 높이 56px, border-bottom
- `container mx-auto h-14 flex items-center justify-between px-4`
- 좌: 로고 "🐕 DogHealth" (text-primary font-semibold)
- 우: 로그아웃 버튼 (ghost, sm) — 표시 텍스트 "로그아웃 (user@email.com)"

---

## 공통 상태 패턴

### 로딩 (loading.tsx)
- Skeleton 3개:
  - 제목 자리 (8 height, 1/3 width)
  - 카드 자리 (32 height, full width) × 2

### 에러 (error.tsx)
- 중앙 정렬, text-xl 제목 "문제가 발생했어요"
- error.message (muted)
- "다시 시도" 버튼 (primary)

### Not Found (not-found.tsx)
- 중앙 정렬, "찾을 수 없는 페이지입니다"
- "대시보드로" 버튼 (primary)

---

## 인터랙션 디테일

- **폼 제출 중:** 모든 버튼 disabled + 텍스트 "...중"
- **링크 강조:** `text-primary underline` (보조 액션)
- **destructive 액션:** 항상 confirm 후 진행
- **빈 상태:** 친절한 안내 + 다음 액션 버튼

---

## 디자인 도구에 요청할 때 사용할 프롬프트 예시

> 이 design brief를 기반으로 다음 화면들의 React + Tailwind + shadcn/ui 컴포넌트를 만들어줘:
> 
> 1. 회원가입 (/signup)
> 2. 로그인 (/login)
> 3. 대시보드 (/)
> 4. 강아지 등록 폼
> 5. 강아지 상세 (차트 3개 포함)
> 6. 일일 기록 입력 폼
> 7. 일일 기록 수정 폼 (삭제 버튼 포함)
> 
> 컬러 토큰은 design system 섹션 그대로 사용, 한국어 UX 라이팅 적용, 모바일 우선 반응형.
