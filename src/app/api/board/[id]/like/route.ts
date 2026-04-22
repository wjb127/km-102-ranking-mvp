import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts, postLikes } from "@/db/schema";

// ── POST /api/board/[id]/like ──
// body: { add: boolean, fingerprint: string }
export async function POST(
  req: NextRequest,
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

  try {
    const body = await req.json();
    const { add, fingerprint } = body as { add: boolean; fingerprint?: string };

    if (typeof add !== "boolean") {
      return NextResponse.json(
        { success: false, error: "add 필드는 boolean이어야 합니다." },
        { status: 400 }
      );
    }

    // fingerprint 기반 멱등성 처리
    if (fingerprint) {
      const existing = await db
        .select({ id: postLikes.id })
        .from(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.fingerprint, fingerprint)))
        .limit(1);

      const already = existing.length > 0;

      if (add && already) {
        // 이미 추천했으면 현재 카운트만 반환
        const [p] = await db
          .select({ likes: boardPosts.likeCount })
          .from(boardPosts)
          .where(eq(boardPosts.id, postId));
        return NextResponse.json({ success: true, data: { likes: p?.likes ?? 0 } });
      }
      if (!add && !already) {
        const [p] = await db
          .select({ likes: boardPosts.likeCount })
          .from(boardPosts)
          .where(eq(boardPosts.id, postId));
        return NextResponse.json({ success: true, data: { likes: p?.likes ?? 0 } });
      }

      if (add) {
        await db.insert(postLikes).values({ postId, fingerprint });
      } else {
        await db
          .delete(postLikes)
          .where(and(eq(postLikes.postId, postId), eq(postLikes.fingerprint, fingerprint)));
      }
    }

    // board_posts.like_count 증감 (음수 방지)
    const [updated] = await db
      .update(boardPosts)
      .set({
        likeCount: add
          ? sql`${boardPosts.likeCount} + 1`
          : sql`GREATEST(${boardPosts.likeCount} - 1, 0)`,
      })
      .where(eq(boardPosts.id, postId))
      .returning({ likes: boardPosts.likeCount });

    return NextResponse.json({ success: true, data: { likes: updated?.likes ?? 0 } });
  } catch (e) {
    console.error("[POST /api/board/:id/like]", e);
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
}
