import { NextRequest, NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── GET /api/admin/posts?page=1&limit=20 : 전체 게시글 목록 (삭제 포함) ──
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

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: boardPosts.id,
        authorId: boardPosts.authorId,
        authorNickname: boardPosts.authorNickname,
        category: boardPosts.category,
        title: boardPosts.title,
        viewCount: boardPosts.viewCount,
        likeCount: boardPosts.likeCount,
        commentCount: boardPosts.commentCount,
        isDeleted: boardPosts.isDeleted,
        hiddenByAdmin: boardPosts.hiddenByAdmin,
        createdAt: boardPosts.createdAt,
      })
      .from(boardPosts)
      .orderBy(desc(boardPosts.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(boardPosts),
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    authorId: r.authorId,
    authorNickname: r.authorNickname,
    category: r.category,
    title: r.title,
    viewCount: r.viewCount,
    likeCount: r.likeCount,
    commentCount: r.commentCount,
    isDeleted: r.isDeleted,
    hiddenByAdmin: r.hiddenByAdmin,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    data,
    total: Number(total ?? 0),
    page,
    limit,
  });
}
