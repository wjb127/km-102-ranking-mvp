import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts } from "@/db/schema";
import { rowToDto, toSlug, type BoardCategoryKo } from "@/lib/board-mappers";

// ── GET /api/board?category=분석|토론|자유|전체&sort=all|best|trending&limit=N ──
// sort: all(기본) | best(추천 50+) | trending(최근 6시간)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") || "전체";
  const sort = searchParams.get("sort") || "all";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "200", 10) || 200, 500);

  const conditions: SQL[] = [eq(boardPosts.isDeleted, false), eq(boardPosts.hiddenByAdmin, false)];

  if (category !== "전체") {
    const slug = toSlug(category as BoardCategoryKo);
    if (!slug) return NextResponse.json({ success: true, data: [] });
    conditions.push(eq(boardPosts.category, slug));
  }

  if (sort === "best") {
    conditions.push(gte(boardPosts.likeCount, 50));
  } else if (sort === "trending") {
    const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
    conditions.push(gte(boardPosts.createdAt, cutoff));
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);
  const orderBy =
    sort === "best"
      ? [desc(boardPosts.likeCount), desc(boardPosts.createdAt)]
      : [desc(boardPosts.createdAt)];

  const rows = await db
    .select()
    .from(boardPosts)
    .where(where)
    .orderBy(...orderBy)
    .limit(limit);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(boardPosts)
    .where(where);

  const data = rows.map((r) =>
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

  return NextResponse.json({ success: true, data, total });
}

// ── POST /api/board ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, title, content, author, imageUrls } = body as {
      category: BoardCategoryKo;
      title: string;
      content: string;
      author: string;
      imageUrls?: string[];
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

    const safeImageUrls = Array.isArray(imageUrls)
      ? imageUrls.filter((u) => typeof u === "string" && u.startsWith("https://")).slice(0, 3)
      : [];

    const [inserted] = await db
      .insert(boardPosts)
      .values({
        category: slug,
        title: title.trim(),
        content: content.trim(),
        authorNickname: author.trim(),
        imageUrls: safeImageUrls.length > 0 ? safeImageUrls : null,
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
