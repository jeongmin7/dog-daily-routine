# 사진 일지 (강아지별 사진 갤러리) 설계 — MVP 1a

> 2026-06-21 · 브랜치 `feat/dog-photos`

## 목적
강아지마다 사진을 업로드해 타임라인 갤러리로 보는 "사진 일지". MVP 1의 사진 부분.
학습 포인트: multipart/form-data 파일 업로드 + 외부 스토리지(Vercel Blob) 연동.

## 결정 사항
- 사진은 **강아지에 종속된 독립 모델**(기록에 붙이지 않음).
- 스토리지: **Vercel Blob**, **서버 업로드**(API 라우트에서 `put`). 클라 직접 업로드는 YAGNI(후속 가능).

## 데이터 모델
```prisma
model Photo {
  id String @id @default(cuid())
  dogId String
  dog Dog @relation(fields: [dogId], references: [id], onDelete: Cascade)
  url String
  caption String?
  createdAt DateTime @default(now())
}
```
Dog에 `photos Photo[]` 추가. 마이그레이션 `add_photo`.

## 스토리지
- `@vercel/blob` (`put`, `del`). `BLOB_READ_WRITE_TOKEN` 환경변수(로컬 `.env` + Vercel 프로젝트에 Blob 스토어 연결 시 자동). `.env.example`에 추가.
- 경로: `dogs/<dogId>/<filename>`, `access: "public"`, `addRandomSuffix: true`(이름 충돌 방지).

## API (세션·Bearer 통합 `getUserId`, 강아지 소유확인)
- `GET /api/dogs/[id]/photos` → 그 강아지 사진 목록(최신순).
- `POST /api/dogs/[id]/photos` → **multipart/form-data**: `file`(필수), `caption`(선택).
  - 검증: 소유확인 404 / file 없으면 400 / image/* 아니면 400 / 크기 > 4MB면 400(서버리스 body 한계).
  - `put` 업로드 → `Photo.create({ dogId, url, caption })` → 201.
- `DELETE /api/dogs/[id]/photos/[photoId]` → 3단계 소유확인(강아지→사진) 후 `del(url)` + 행 삭제, 200.

## react-query (`lib/queries.ts`)
- `qk.photos(dogId)`. `usePhotos(dogId)` / `useUploadPhoto(dogId)`(FormData) / `useDeletePhoto(dogId)`. 성공 시 `qk.photos` invalidate.

## UI — 강아지 상세 `/dogs/[id]`
- "사진 일지" 섹션(주간 통계 위 또는 아래): 썸네일 그리드 + 업로드 버튼(파일 선택 → 미리보기 → 캡션 옵션 → 업로드). 각 사진 삭제(작은 버튼/길게).
- 빈 상태 안내. 업로드 중 busy/실패 alert.

## 테스트
- `POST`: 소유 아니면 404 / file 없으면 400 / 비이미지 400 / 성공 시 put 호출 + Photo.create 단언(`@vercel/blob` 모킹).
- `DELETE`: 남의 사진 404 / 성공 시 del + delete 단언.
- `GET`: 소유 스코프.

## 비목표 (YAGNI)
- 클라 직접 업로드/리사이즈/EXIF 회전 없음.
- 이미지 변환(썸네일 생성)은 `<img>` 크기 조절로 대체.
- 기록(record)에 사진 연결 안 함.
