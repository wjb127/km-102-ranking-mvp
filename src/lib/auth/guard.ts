import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentSession, type SessionPayload } from "./session";

/** 로그인 필수 가드. 세션이 없으면 401 응답을 던진다. */
export async function requireSession(): Promise<
  { session: SessionPayload; response?: undefined } | { session?: undefined; response: NextResponse }
> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      response: NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      ),
    };
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      nickname: users.nickname,
      role: users.role,
      isBanned: users.isBanned,
    })
    .from(users)
    .where(and(eq(users.id, session.sub), isNull(users.deletedAt)))
    .limit(1);

  if (!user || user.isBanned) {
    return {
      response: NextResponse.json(
        { success: false, error: "사용할 수 없는 계정입니다." },
        { status: 403 }
      ),
    };
  }

  return {
    session: {
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role as "user" | "admin",
    },
  };
}

/** 관리자 필수 가드. user role이면 403. */
export async function requireAdmin(): Promise<
  { session: SessionPayload; response?: undefined } | { session?: undefined; response: NextResponse }
> {
  const { session, response } = await requireSession();
  if (response) return { response };
  if (session!.role !== "admin") {
    return {
      response: NextResponse.json(
        { success: false, error: "관리자 권한이 필요합니다." },
        { status: 403 }
      ),
    };
  }
  return { session: session! };
}
