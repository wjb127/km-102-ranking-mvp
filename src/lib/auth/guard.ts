import { NextResponse } from "next/server";
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
  return { session };
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
