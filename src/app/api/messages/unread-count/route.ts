import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";

// ── GET /api/messages/unread-count ──
// 로그인 사용자의 받은편지함 미읽음 건수만 반환 (NavBar 폴링용 경량 엔드포인트)
export async function GET() {
  const { session, response } = await requireSession();
  if (response) {
    return NextResponse.json({ success: true, data: { count: 0 } });
  }

  const [{ count = 0 } = { count: 0 }] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(messages)
    .where(
      and(
        eq(messages.receiverId, session.sub),
        eq(messages.isRead, false),
        eq(messages.isDeletedReceiver, false)
      )
    );

  return NextResponse.json({ success: true, data: { count: Number(count) } });
}
