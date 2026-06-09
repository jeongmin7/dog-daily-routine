import { handlers } from "@/lib/auth";

// NextAuth가 만든 GET/POST 처리기를 /api/auth/* 라우트로 노출
export const { GET, POST } = handlers;
