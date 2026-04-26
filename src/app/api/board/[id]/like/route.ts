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
    if (typeof fingerprint !== "string" || !fingerprint.trim()) {
      return NextResponse.json(
        { success: false, error: "fingerprint가 필요합니다." },
        { status: 400 }
      );
    }

    const [post] = await db
      .select({ likes: boardPosts.likeCount })
      .from(boardPosts)
      .where(and(eq(boardPosts.id, postId), eq(boardPosts.isDeleted, false), eq(boardPosts.hiddenByAdmin, false)))
      .limit(1);
    if (!post) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // fingerprint 기반 멱등성 처리
    const safeFingerprint = fingerprint.trim();
    const existing = await db
      .select({ id: postLikes.id })
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.fingerprint, safeFingerprint)))
      .limit(1);

    const already = existing.length > 0;

    if (add && already) {
      return NextResponse.json({ success: true, data: { likes: post.likes } });
    }
    if (!add && !already) {
      return NextResponse.json({ success: true, data: { likes: post.likes } });
    }

    if (add) {
      await db.insert(postLikes).values({ postId, fingerprint: safeFingerprint });
    } else {
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.fingerprint, safeFingerprint)));
    }

    // board_posts.like_count 증감 (음수 방지)
    const [updated] = await db
      .update(boardPosts)
      .set({
        likeCount: add
          ? sql`${boardPosts.likeCount} + 1`
          : sql`GREATEST(${boardPosts.likeCount} - 1, 0)`,
      })
      .where(and(eq(boardPosts.id, postId), eq(boardPosts.isDeleted, false), eq(boardPosts.hiddenByAdmin, false)))
      .returning({ likes: boardPosts.likeCount });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { likes: updated.likes } });
  } catch (e) {
    console.error("[POST /api/board/:id/like]", e);
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
}
