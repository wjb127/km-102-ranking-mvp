import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";

// ── GET /api/profile/posts?limit=20&offset=0 : 내가 쓴 게시글 목록 ──
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    100
  );
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

  const where = and(
    eq(boardPosts.authorId, session!.sub),
    eq(boardPosts.isDeleted, false)
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: boardPosts.id,
        category: boardPosts.category,
        title: boardPosts.title,
        viewCount: boardPosts.viewCount,
        likeCount: boardPosts.likeCount,
        commentCount: boardPosts.commentCount,
        createdAt: boardPosts.createdAt,
      })
      .from(boardPosts)
      .where(where)
      .orderBy(desc(boardPosts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(boardPosts)
      .where(where),
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    viewCount: r.viewCount,
    likeCount: r.likeCount,
    commentCount: r.commentCount,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    data,
    total: Number(total ?? 0),
  });
}
