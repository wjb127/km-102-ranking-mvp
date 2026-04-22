import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts } from "@/db/schema";
import { rowToDto, toSlug, type BoardCategoryKo } from "@/lib/board-mappers";

// ── GET /api/board?category=분석|토론|자유|전체 ──
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") || "전체";

  const rows =
    category === "전체"
      ? await db
          .select()
          .from(boardPosts)
          .where(eq(boardPosts.isDeleted, false))
          .orderBy(desc(boardPosts.createdAt))
      : await (async () => {
          const slug = toSlug(category);
          if (!slug) return [];
          return db
            .select()
            .from(boardPosts)
            .where(eq(boardPosts.category, slug))
            .orderBy(desc(boardPosts.createdAt));
        })();

  const data = rows
    .filter((r) => !r.isDeleted)
    .map((r) =>
      rowToDto({
        id: r.id,
        category: r.category,
        title: r.title,
        content: r.content,
        authorNickname: r.authorNickname,
        imageUrls: r.imageUrls,
        viewCount: r.viewCount,
        likeCount: r.likeCount,
        commentCount: r.commentCount,
        createdAt: r.createdAt,
      })
    );

  return NextResponse.json({ success: true, data });
}

// ── POST /api/board ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, title, content, author } = body as {
      category: BoardCategoryKo;
      title: string;
      content: string;
      author: string;
    };

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
      return NextResponse.json({ success: false, error: errors.join(" ") }, { status: 400 });
    }

    const slug = toSlug(category);
    if (!slug) {
      return NextResponse.json({ success: false, error: "잘못된 카테고리." }, { status: 400 });
    }

    const [inserted] = await db
      .insert(boardPosts)
      .values({
        category: slug,
        title: title.trim(),
        content: content.trim(),
        authorNickname: author.trim(),
      })
      .returning();

    const dto = rowToDto({
      id: inserted.id,
      category: inserted.category,
      title: inserted.title,
      content: inserted.content,
      authorNickname: inserted.authorNickname,
      imageUrls: inserted.imageUrls,
      viewCount: inserted.viewCount,
      likeCount: inserted.likeCount,
      commentCount: inserted.commentCount,
      createdAt: inserted.createdAt,
    });

    return NextResponse.json({ success: true, data: dto }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/board]", e);
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
}
