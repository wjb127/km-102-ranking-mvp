import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signSession, setSessionCookie } from "@/lib/auth/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const nickname = String(body.nickname ?? "").trim();
    const name = String(body.name ?? nickname).trim();
    const password = String(body.password ?? "");

    const errors: string[] = [];
    if (!EMAIL_RE.test(email)) errors.push("이메일 형식이 올바르지 않습니다.");
    if (nickname.length < 2 || nickname.length > 20) errors.push("닉네임은 2~20자.");
    if (password.length < 8) errors.push("비밀번호는 8자 이상.");
    if (errors.length) {
      return NextResponse.json({ success: false, error: errors.join(" ") }, { status: 400 });
    }

    // 중복 체크
    const existing = await db
      .select({ id: users.id, email: users.email, nickname: users.nickname })
      .from(users)
      .where(or(eq(users.email, email), eq(users.nickname, nickname)))
      .limit(1);
    if (existing.length) {
      const dup = existing[0].email === email ? "이메일" : "닉네임";
      return NextResponse.json({ success: false, error: `이미 사용 중인 ${dup}입니다.` }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [inserted] = await db
      .insert(users)
      .values({ email, name, nickname, passwordHash })
      .returning({ id: users.id, email: users.email, nickname: users.nickname, role: users.role });

    const token = await signSession({
      sub: inserted.id,
      email: inserted.email,
      nickname: inserted.nickname,
      role: inserted.role as "user" | "admin",
    });
    await setSessionCookie(token);

    return NextResponse.json({ success: true, data: inserted }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/auth/register]", e);
    return NextResponse.json({ success: false, error: "회원가입 실패." }, { status: 500 });
  }
}
