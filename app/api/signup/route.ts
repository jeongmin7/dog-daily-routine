import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request){
  const {email, password, name} = await req.json()
  if(!email?.includes("@")){
    return NextResponse.json({error: "올바른 이메일 형식이 아닙니다."},{status:400})
  }
  if(!password || password.length < 6){
    return NextResponse.json({error:"비밀번호는 6글자 이상이어야 합니다."},{status:400})
  }
  const existingUser = await prisma.user.findUnique({
    where: {email}
  })
  if(existingUser){
    return NextResponse.json({error:"이미 가입된 이메일입니다."},{status:409})
  }
  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data:{
      email,
      name: name||null,
      password: hashedPassword
    },
    select:{
      id: true,
      email: true,
      name: true,
      createdAt: true
    }
  })
  return NextResponse.json({user},{status:201})
}