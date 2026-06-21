"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand";
import { Btn, Field, TextInput } from "@/components/ui";
import axios from "axios";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<{ email?: string; pw?: string }>({});
  const [banner, setBanner] = useState("");
  const [busy, setBusy] = useState(false);

 async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof err={}
    if(!email.trim()){
      next.email="이메일을 입력해주세요"
    }
    else if(!email.includes("@")){
      next.email="올바른 이메일 형식이 아니에요"
    }
    else if(!pw){
      next.pw="비밀번호를 입력해주세요"
    }   
  else if(pw.length<6){
    next.pw="비밀번호는 6자 이상이어야 해요"
  }
    setErr(next);
    setBanner("");
    if(Object.keys(next).length) return;
 setBusy(true);
 try{
  await axios.post("/api/signup",{
email:email.trim(),
password:pw,
name:name.trim()||null
  })
  router.push(`/login?signup=success&email=${encodeURIComponent(email.trim())}`)
 } catch(err:any){
  const msg= axios.isAxiosError(err)
        ? err.response?.data?.error ?? "가입에 실패했어요."
        : "네트워크 오류가 발생했어요.";
      setBanner(msg);
      setBusy(false);
 }   
 
    
  }

  return (
    <div className="auth-screen">
      <div className="auth-inner">
        <BrandLogo size="lg" />
        <div className="auth-title" style={{ marginTop: 30, maxWidth: 280 }}>
          함께 시작해요
        </div>
        <div className="auth-sub">우리 아이의 하루 건강을 기록해보세요</div>

        <form onSubmit={submit} noValidate style={{ marginTop: 30 }}>
          {banner && <div className="alert alert-error mb-4">{banner}</div>}
          <Field label="이메일" error={err.email} htmlFor="su-email">
            <TextInput id="su-email" type="email" inputMode="email" autoComplete="email" filled placeholder="haru@example.com" value={email} invalid={!!err.email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="비밀번호" error={err.pw} htmlFor="su-pw">
            <TextInput id="su-pw" type="password" autoComplete="new-password" filled placeholder="6자 이상" value={pw} invalid={!!err.pw} onChange={(e) => setPw(e.target.value)} />
          </Field>
          <Field label="이름" optional htmlFor="su-name">
            <TextInput id="su-name" filled placeholder="보호자 이름" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Btn type="submit" block className="btn-lg" loading={busy} loadingText="가입 중…">
            가입하기
          </Btn>
        </form>

        <div className="auth-footer" style={{ marginTop: 22 }}>
          이미 계정이 있나요?{" "}
          <button className="link" onClick={() => router.push("/login")}>
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}
