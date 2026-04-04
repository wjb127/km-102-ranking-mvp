import { NextRequest, NextResponse } from "next/server";
import { getBoardPostById, incrementViews } from "@/lib/board-store";

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

  const post = getBoardPostById(postId);

  if (!post) {
    return NextResponse.json(
      { success: false, error: "게시글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 조회수 증가
  incrementViews(postId);

  return NextResponse.json({
    success: true,
    data: post,
  });
}
