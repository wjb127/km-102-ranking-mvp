import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";
import {
  clearSessionCookie,
  setSessionCookie,
  signSession,
} from "@/lib/auth/session";

// ── GET /api/profile : 내 정보 조회 ──
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const [me] = await db
    .select({
      id: users.id,
      email: users.email,
      nickname: users.nickname,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session!.sub))
    .limit(1);

  if (!me) {
    return NextResponse.json(
      { success: false, error: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: me.id,
      email: me.email,
      nickname: me.nickname,
      role: me.role,
      createdAt: me.createdAt.toISOString(),
    },
  });
}

// ── PATCH /api/profile : 닉네임/비밀번호 변경 ──
// body: { nickname?, currentPassword?, newPassword? }
export async function PATCH(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : undefined;
  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : undefined;
  const newPassword =
    typeof body.newPassword === "string" ? body.newPassword : undefined;

  // 현재 사용자 조회 (비밀번호 해시 포함)
  const [me] = await db
    .select({
      id: users.id,
      email: users.email,
      nickname: users.nickname,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, session!.sub))
    .limit(1);

  if (!me) {
    return NextResponse.json(
      { success: false, error: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const update: { nickname?: string; passwordHash?: string; updatedAt?: Date } = {};

  // 닉네임 변경 처리
  if (nickname && nickname !== me.nickname) {
    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json(
        { success: false, error: "닉네임은 2~20자 사이여야 합니다." },
        { status: 400 }
      );
    }
    // 중복 체크 (본인 제외)
    const [dup] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.nickname, nickname), ne(users.id, me.id)))
      .limit(1);
    if (dup) {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 닉네임입니다." },
        { status: 409 }
      );
    }
    update.nickname = nickname;
  }

  // 비밀번호 변경 처리
  if (newPassword) {
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "새 비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }
    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "현재 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }
    if (!me.passwordHash) {
      return NextResponse.json(
        { success: false, error: "비밀번호가 설정되지 않은 계정입니다." },
        { status: 400 }
      );
    }
    const ok = await bcrypt.compare(currentPassword, me.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "현재 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }
    update.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { success: false, error: "변경할 값이 없습니다." },
      { status: 400 }
    );
  }
  update.updatedAt = new Date();

  const [updated] = await db
    .update(users)
    .set(update)
    .where(eq(users.id, me.id))
    .returning({
      id: users.id,
      email: users.email,
      nickname: users.nickname,
      role: users.role,
      createdAt: users.createdAt,
    });

  // 닉네임이 변경된 경우 세션 쿠키 재발급 (JWT 내 nickname 동기화)
  if (update.nickname) {
    const token = await signSession({
      sub: updated.id,
      email: updated.email,
      nickname: updated.nickname,
      role: updated.role as "user" | "admin",
    });
    await setSessionCookie(token);
  }

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      email: updated.email,
      nickname: updated.nickname,
      role: updated.role,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

// ── DELETE /api/profile : 소프트 탈퇴 ──
// 관리자 계정은 탈퇴 불가 (서비스 관리 권한 보존 + 잠금 사고 방지).
// 권한 해제가 필요하면 다른 admin이 /api/admin/users 에서 role 변경 후 처리.
export async function DELETE() {
  const { session, response } = await requireSession();
  if (response) return response;

  if (session!.role === "admin") {
    return NextResponse.json(
      {
        success: false,
        error: "관리자 계정은 탈퇴할 수 없습니다. 다른 관리자에게 권한 변경을 요청해주세요.",
      },
      { status: 403 }
    );
  }

  // TOCTOU 방지 — 세션 체크 직후 role 이 admin 으로 승격되면 위 가드를 통과한 뒤라도
  // UPDATE WHERE 절에서 role <> 'admin' 조건을 다시 걸어 원자적으로 차단.
  const deleted = await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(users.id, session!.sub), ne(users.role, "admin")))
    .returning({ id: users.id });

  if (deleted.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "관리자 계정은 탈퇴할 수 없습니다. 다른 관리자에게 권한 변경을 요청해주세요.",
      },
      { status: 403 }
    );
  }

  // 세션 쿠키 삭제
  await clearSessionCookie();

  return NextResponse.json({ success: true });
}
