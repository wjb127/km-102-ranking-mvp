import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── PATCH /api/admin/posts/[id] : 숨김 토글 ──
// body: { hidden: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { id } = await params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) {
    return NextResponse.json(
      { success: false, error: "잘못된 id." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  if (typeof body.hidden !== "boolean") {
    return NextResponse.json(
      { success: false, error: "hidden(boolean)이 필요합니다." },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(boardPosts)
    .set({ hiddenByAdmin: body.hidden, updatedAt: new Date() })
    .where(eq(boardPosts.id, postId))
    .returning({
      id: boardPosts.id,
      hiddenByAdmin: boardPosts.hiddenByAdmin,
    });

  if (!updated) {
    return NextResponse.json(
      { success: false, error: "게시글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}

// ── DELETE /api/admin/posts/[id] : 소프트 삭제 ──
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { id } = await params;
  const postId = parseInt(id, 10);
  if (isNaN(postId)) {
    return NextResponse.json(
      { success: false, error: "잘못된 id." },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(boardPosts)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(boardPosts.id, postId))
    .returning({ id: boardPosts.id });

  if (!updated) {
    return NextResponse.json(
      { success: false, error: "게시글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
