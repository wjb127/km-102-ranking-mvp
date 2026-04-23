import { NextRequest, NextResponse } from "next/server";
import { desc, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, boardPosts, mmaComments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── GET /api/admin/users?page=1&limit=20 : 사용자 목록 ──
export async function GET(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    100
  );
  const offset = (page - 1) * limit;

  // 각 사용자의 게시글 수, 댓글 수 서브쿼리
  const postCountSub = db
    .select({
      authorId: boardPosts.authorId,
      cnt: sql<number>`count(*)::int`.as("post_cnt"),
    })
    .from(boardPosts)
    .groupBy(boardPosts.authorId)
    .as("pc");

  const commentCountSub = db
    .select({
      authorId: mmaComments.authorId,
      cnt: sql<number>`count(*)::int`.as("cmt_cnt"),
    })
    .from(mmaComments)
    .groupBy(mmaComments.authorId)
    .as("cc");

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        nickname: users.nickname,
        role: users.role,
        isBanned: users.isBanned,
        createdAt: users.createdAt,
        postCount: postCountSub.cnt,
        commentCount: commentCountSub.cnt,
      })
      .from(users)
      .leftJoin(postCountSub, sql`${postCountSub.authorId} = ${users.id}`)
      .leftJoin(commentCountSub, sql`${commentCountSub.authorId} = ${users.id}`)
      .where(isNull(users.deletedAt))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(users)
      .where(isNull(users.deletedAt)),
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    email: r.email,
    nickname: r.nickname,
    role: r.role,
    isBanned: r.isBanned,
    createdAt: r.createdAt.toISOString(),
    postCount: Number(r.postCount ?? 0),
    commentCount: Number(r.commentCount ?? 0),
  }));

  return NextResponse.json({
    success: true,
    data,
    total: Number(total ?? 0),
    page,
    limit,
  });
}
