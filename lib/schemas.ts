/* 요청 body 스키마 — 서버 2차 검증(AGENTS.md)의 단일 출처.

   zod object는 스키마에 없는 키를 잘라내므로, 파싱 결과를 Prisma에 그대로
   넘겨도 화이트리스트가 유지된다(mass assignment 방어).

   PATCH 계열은 필드를 전부 optional로 둔다 — 안 보낸 필드는 undefined가 되고
   Prisma update가 건드리지 않는다. */

import { z } from "zod";

// 빈 문자열은 "값 없음"으로 취급한다(폼이 빈칸을 보낼 수 있다).
const optionalText = z.string().trim().min(1).nullish();

export const dogCreate = z.object({
  name: z.string({ error: "이름을 입력해주세요." }).trim().min(1, "이름을 입력해주세요."),
  breed: optionalText,
  birthdate: optionalText,
  weight: z.number().nonnegative("체중은 0 이상이어야 합니다.").nullish(),
});

export const dogArchive = z.object({
  archived: z.boolean({ error: "archived(boolean)는 필수입니다." }),
});

// 기록의 수치 필드. 미기록(null)과 미전송(undefined)을 모두 허용한다.
const recordFields = {
  meal: z.number().nullish(),
  walkMin: z.number().nullish(),
  walkKm: z.number().nullish(),
  poop: z.number().nullish(),
  weight: z.number().nullish(),
  memo: z.string().nullish(),
};

export const recordCreate = z.object({
  date: z.string({ error: "날짜는 필수 입력 항목입니다." }).trim().min(1, "날짜는 필수 입력 항목입니다."),
  ...recordFields,
});

// 수정이라 date도 optional. 안 보내면 기존 값이 유지된다.
export const recordUpdate = z.object({
  date: z.string().trim().min(1).optional(),
  ...recordFields,
});

export const medicationCreate = z.object({
  name: z.string({ error: "약 이름은 필수입니다." }).trim().min(1, "약 이름은 필수입니다."),
  dosage: optionalText,
  times: z
    .array(z.string().regex(/^\d{2}:\d{2}$/, "복용 시간은 HH:MM 형식이어야 합니다."), {
      error: "복용 시간(HH:MM)을 한 개 이상 입력해주세요.",
    })
    .min(1, "복용 시간(HH:MM)을 한 개 이상 입력해주세요."),
  remainingCount: z.number().int().min(0).nullish(),
});

export const doseToggle = z.object({
  time: z.string({ error: "time이 필요합니다." }).regex(/^\d{2}:\d{2}$/, "time이 필요합니다."),
});

export const diseaseRegister = z.object({
  diseaseKey: z.string({ error: "유효한 지병이 아닙니다." }).trim().min(1, "유효한 지병이 아닙니다."),
});

export const measurementCreate = z.object({
  metricKey: z.string({ error: "metricKey가 필요합니다." }).trim().min(1, "metricKey가 필요합니다."),
  value: z.number({ error: "value는 숫자여야 합니다." }),
});

export const tokenCreate = z.object({
  name: z.string({ error: "토큰 이름은 필수입니다." }).trim().min(1, "토큰 이름은 필수입니다."),
});

export const signupCreate = z.object({
  email: z
    .string({ error: "올바른 이메일 형식이 아닙니다." })
    .includes("@", { error: "올바른 이메일 형식이 아닙니다." }),
  password: z
    .string({ error: "비밀번호는 6글자 이상이어야 합니다." })
    .min(6, "비밀번호는 6글자 이상이어야 합니다."),
  name: z.string().trim().min(1).nullish(),
});
