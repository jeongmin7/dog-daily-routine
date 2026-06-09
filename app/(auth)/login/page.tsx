"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { BrandLogo } from "@/components/brand";
import { Btn, Field, TextInput } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const showSuccess = params.get("signup") === "success";
  const [email, setEmail] = useState(params.get("email") || "");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<{ email?: string; pw?: string }>({});
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof err = {};
    if (!email.trim()) next.email = "이메일을 입력해주세요";
    if (!pw) next.pw = "비밀번호를 입력해주세요";
    setErr(next);
    setBanner("");
    if (Object.keys(next).length) return;
    setBusy(true);
    // NextAuth Credentials authorize 실행 (서버에서 이메일 조회 + verifyPassword)
    const res = await signIn("credentials", {
      email: email.trim(),
      password: pw,
      redirect: false,
    });
    if (res?.error) {
      setBusy(false);
      setBanner("이메일 또는 비밀번호가 올바르지 않습니다");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="auth-screen">
      <div className="auth-inner">
        <BrandLogo size="lg" />
        <div className="auth-title" style={{ marginTop: 30, maxWidth: 280 }}>
          다시 만나서 반가워요
        </div>
        <div className="auth-sub">하루 계정으로 로그인하세요</div>

        <form onSubmit={submit} noValidate style={{ marginTop: 30 }}>
          {showSuccess && <div className="alert alert-success mb-4">✓ 가입이 완료됐어요. 로그인해주세요.</div>}
          {banner && <div className="alert alert-error mb-4">{banner}</div>}
          <Field label="이메일" error={err.email} htmlFor="li-email">
            <TextInput id="li-email" type="email" inputMode="email" autoComplete="email" filled placeholder="haru@example.com" value={email} invalid={!!err.email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="비밀번호" error={err.pw} htmlFor="li-pw">
            <TextInput id="li-pw" type="password" autoComplete="current-password" filled placeholder="비밀번호" value={pw} invalid={!!err.pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Btn type="submit" block className="btn-lg" loading={busy} loadingText="로그인 중…">
            로그인
          </Btn>
        </form>

        <div className="auth-footer" style={{ marginTop: 22 }}>
          계정이 없나요?{" "}
          <button className="link" onClick={() => router.push("/signup")}>
            가입하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
