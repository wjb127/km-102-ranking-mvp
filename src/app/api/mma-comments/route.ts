import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts, fighters, fights, mmaComments, mmaEvents } from "@/db/schema";

const VALID_TARGETS = ["post", "fighter", "event", "fight"] as const;
type TargetType = (typeof VALID_TARGETS)[number];

function isValidTarget(v: unknown): v is TargetType {
  return typeof v === "string" && (VALID_TARGETS as readonly string[]).includes(v);
}

async function targetExists(targetType: TargetType, targetId: number): Promise<boolean> {
  if (targetType === "post") {
    const [row] = await db
      .select({ id: boardPosts.id })
      .from(boardPosts)
      .where(and(eq(boardPosts.id, targetId), eq(boardPosts.isDeleted, false), eq(boardPosts.hiddenByAdmin, false)))
      .limit(1);
    return Boolean(row);
  }
  if (targetType === "fighter") {
    const [row] = await db.select({ id: fighters.id }).from(fighters).where(eq(fighters.id, targetId)).limit(1);
    return Boolean(row);
  }
  if (targetType === "event") {
    const [row] = await db.select({ id: mmaEvents.id }).from(mmaEvents).where(eq(mmaEvents.id, targetId)).limit(1);
    return Boolean(row);
  }
  const [row] = await db.select({ id: fights.id }).from(fights).where(eq(fights.id, targetId)).limit(1);
  return Boolean(row);
}

// ── GET /api/mma-comments?targetType=post&targetId=130 ──
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType");
  const targetIdStr = searchParams.get("targetId");

  if (!isValidTarget(targetType) || !targetIdStr) {
    return NextResponse.json(
      { success: false, error: "targetType(post|fighter|event|fight)과 targetId가 필요합니다." },
      { status: 400 }
    );
  }
  const targetId = parseInt(targetIdStr, 10);
  if (isNaN(targetId)) {
    return NextResponse.json({ success: false, error: "targetId가 올바르지 않습니다." }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(mmaComments)
    .where(
      and(
        eq(mmaComments.targetType, targetType),
        eq(mmaComments.targetId, targetId),
        eq(mmaComments.isDeleted, false)
      )
    )
    .orderBy(asc(mmaComments.createdAt));

  const data = rows.map((r) => ({
    id: r.id,
    parentId: r.parentId,
    nickname: r.authorNickname,
    content: r.content,
    likeCount: r.likeCount,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ success: true, data });
}

// ── POST /api/mma-comments ──
// body: { targetType, targetId, nickname, content, fingerprint?, parentId? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetType, targetId, nickname, content, parentId } = body as {
      targetType: string;
      targetId: number;
      nickname: string;
      content: string;
      parentId?: number;
    };

    if (!isValidTarget(targetType) || !targetId || !nickname || !content) {
      return NextResponse.json(
        { success: false, error: "targetType, targetId, nickname, content 필수." },
        { status: 400 }
      );
    }

    if (nickname.length > 20) {
      return NextResponse.json(
        { success: false, error: "닉네임은 20자 이내." },
        { status: 400 }
      );
    }
    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: "댓글은 500자 이내." },
        { status: 400 }
      );
    }

    const numericTargetId = Number(targetId);
    if (!Number.isInteger(numericTargetId) || numericTargetId <= 0) {
      return NextResponse.json(
        { success: false, error: "targetId가 올바르지 않습니다." },
        { status: 400 }
      );
    }
    if (!(await targetExists(targetType, numericTargetId))) {
      return NextResponse.json(
        { success: false, error: "댓글 대상을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    if (parentId != null) {
      const [parent] = await db
        .select({ id: mmaComments.id })
        .from(mmaComments)
        .where(
          and(
            eq(mmaComments.id, Number(parentId)),
            eq(mmaComments.targetType, targetType),
            eq(mmaComments.targetId, numericTargetId),
            eq(mmaComments.isDeleted, false)
          )
        )
        .limit(1);
      if (!parent) {
        return NextResponse.json(
          { success: false, error: "부모 댓글을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
    }

    const [inserted] = await db
      .insert(mmaComments)
      .values({
        targetType,
        targetId: numericTargetId,
        authorNickname: nickname.trim(),
        content: content.trim(),
        parentId: parentId == null ? null : Number(parentId),
      })
      .returning();

    // 게시글 댓글 수 갱신 (post 대상일 때만)
    if (targetType === "post") {
      await db
        .update(boardPosts)
        .set({ commentCount: sql`${boardPosts.commentCount} + 1` })
        .where(eq(boardPosts.id, numericTargetId));
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: inserted.id,
          parentId: inserted.parentId,
          nickname: inserted.authorNickname,
          content: inserted.content,
          likeCount: inserted.likeCount,
          createdAt: inserted.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/mma-comments]", e);
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
}
