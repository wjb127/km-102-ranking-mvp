import { NextRequest, NextResponse } from "next/server";
import { getComments, addComment } from "@/lib/mock-store";
import { mockCategories } from "@/lib/mock-data";

/** GET — 카테고리별 댓글 목록 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryId = Number(searchParams.get("categoryId"));

  if (!categoryId) {
    return NextResponse.json(
      { success: false, error: "categoryId가 필요합니다." },
      { status: 400 }
    );
  }

  const comments = getComments(categoryId);
  return NextResponse.json({ success: true, data: comments });
}

/** POST — 댓글 작성 */
export async function POST(req: NextRequest) {
  const { categoryId, nickname, content, fingerprint } = await req.json();

  if (!categoryId || !nickname || !content || !fingerprint) {
    return NextResponse.json(
      {
        success: false,
        error: "categoryId, nickname, content, fingerprint가 필요합니다.",
      },
      { status: 400 }
    );
  }

  // 닉네임 길이 제한
  if (nickname.length > 20) {
    return NextResponse.json(
      { success: false, error: "닉네임은 20자 이내로 입력해주세요." },
      { status: 400 }
    );
  }

  // 내용 길이 제한
  if (content.length > 300) {
    return NextResponse.json(
      { success: false, error: "댓글은 300자 이내로 입력해주세요." },
      { status: 400 }
    );
  }

  // 카테고리 존재 확인
  const category = mockCategories.find((c) => c.id === categoryId);
  if (!category) {
    return NextResponse.json(
      { success: false, error: "카테고리를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const comment = addComment(categoryId, nickname, content, fingerprint);
  return NextResponse.json({ success: true, data: comment });
}
