import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts } from "@/db/schema";
import { rowToDto } from "@/lib/board-mappers";

// ── GET /api/board/[id] ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return NextResponse.json(
      { success: false, error: "잘못된 게시글 ID입니다." },
      { status: 400 }
    );
  }

  // 조회수 증가와 함께 단일 쿼리로 조회
  const rows = await db
    .update(boardPosts)
    .set({ viewCount: sql`${boardPosts.viewCount} + 1` })
    .where(eq(boardPosts.id, postId))
    .returning();

  if (rows.length === 0 || rows[0].isDeleted) {
    return NextResponse.json(
      { success: false, error: "게시글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const row = rows[0];
  const dto = rowToDto({
    id: row.id,
    category: row.category,
    title: row.title,
    content: row.content,
    authorNickname: row.authorNickname,
    imageUrls: row.imageUrls,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    createdAt: row.createdAt,
  });

  return NextResponse.json({ success: true, data: dto });
}
