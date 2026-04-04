import { NextRequest, NextResponse } from "next/server";
import { getBoardPosts, addBoardPost } from "@/lib/board-store";

// ── GET /api/board?category= ──
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") || "전체";
  const posts = getBoardPosts(category);

  return NextResponse.json({
    success: true,
    data: posts,
  });
}

// ── POST /api/board ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, title, content, author } = body;

    // 유효성 검사
    const errors: string[] = [];

    if (!category || !["분석", "토론", "자유"].includes(category)) {
      errors.push("분류를 선택해주세요. (분석, 토론, 자유)");
    }
    if (!title || typeof title !== "string" || title.trim().length < 2 || title.trim().length > 100) {
      errors.push("제목은 2~100자로 입력해주세요.");
    }
    if (!content || typeof content !== "string" || content.trim().length < 2 || content.trim().length > 5000) {
      errors.push("내용은 2~5000자로 입력해주세요.");
    }
    if (!author || typeof author !== "string" || author.trim().length < 2 || author.trim().length > 20) {
      errors.push("글쓴이는 2~20자로 입력해주세요.");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(" ") },
        { status: 400 }
      );
    }

    const post = addBoardPost({
      category,
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
    });

    return NextResponse.json(
      { success: true, data: post },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }
}
