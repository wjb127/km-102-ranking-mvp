import { NextResponse } from "next/server";
import { sql, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  fighters,
  mmaEvents,
  boardPosts,
  mmaComments,
  users,
  mmaCommentReports,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── GET /api/admin/stats : 관리자 대시보드 통계 ──
export async function GET() {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  // 각 테이블의 카운트를 병렬 조회
  const [
    [{ count: fighterCount }],
    [{ count: eventCount }],
    [{ count: postCount }],
    [{ count: commentCount }],
    [{ count: userCount }],
    [{ count: pendingReportCount }],
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(fighters),
    db.select({ count: sql<number>`count(*)::int` }).from(mmaEvents),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(boardPosts)
      .where(eq(boardPosts.isDeleted, false)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(mmaComments)
      .where(eq(mmaComments.isDeleted, false)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(isNull(users.deletedAt)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(mmaCommentReports)
      .where(eq(mmaCommentReports.status, "pending")),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      fighters: Number(fighterCount ?? 0),
      events: Number(eventCount ?? 0),
      posts: Number(postCount ?? 0),
      comments: Number(commentCount ?? 0),
      users: Number(userCount ?? 0),
      pendingReports: Number(pendingReportCount ?? 0),
    },
  });
}
