/* 도메인 타입 — UI와 데이터 계층이 공유.
   백엔드(Prisma) 연결 시 Prisma 생성 타입으로 대체하거나 매핑한다. */

export type User = {
  email: string;
  name?: string;
};

export type Dog = {
  id: string;
  name: string;
  breed?: string;
  birthdate?: string; // ISO yyyy-mm-dd
  weight?: number; // kg
};

export type DogRecord = {
  id: string;
  dogId: string;
  date: string; // ISO yyyy-mm-dd
  meal?: number; // g
  walkMin?: number; // 분
  walkKm?: number; // km
  poop?: number; // 회
  weight?: number; // kg
  memo?: string;
};

export type Store = {
  user: User;
  dogs: Dog[];
  records: DogRecord[];
};

export type RecordInput = Omit<DogRecord, "id" | "dogId">;
export type DogInput = Omit<Dog, "id">;
