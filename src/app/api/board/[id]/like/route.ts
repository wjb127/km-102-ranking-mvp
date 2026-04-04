import { NextRequest, NextResponse } from "next/server";
import { toggleLike } from "@/lib/board-store";

// ── POST /api/board/[id]/like ──
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
    const { add } = body;

    if (typeof add !== "boolean") {
      return NextResponse.json(
        { success: false, error: "add 필드는 boolean이어야 합니다." },
        { status: 400 }
      );
    }

    const likes = toggleLike(postId, add);

    return NextResponse.json({
      success: true,
      data: { likes },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }
}
