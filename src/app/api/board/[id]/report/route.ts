import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts, boardPostReports } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth/session";

// 임계값(누적 신고 수) 도달 시 hidden_by_admin=true 자동 처리.
const AUTO_HIDE_THRESHOLD = 5;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);
    if (!Number.isFinite(postId) || postId <= 0) {
      return NextResponse.json(
        { success: false, error: "잘못된 postId." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const fingerprint =
      typeof body.fingerprint === "string" ? body.fingerprint.trim() : "";

    if (!reason) {
      return NextResponse.json(
        { success: false, error: "reason이 필요합니다." },
        { status: 400 }
      );
    }

    const [target] = await db
      .select({
        id: boardPosts.id,
        isDeleted: boardPosts.isDeleted,
        hiddenByAdmin: boardPosts.hiddenByAdmin,
      })
      .from(boardPosts)
      .where(eq(boardPosts.id, postId))
      .limit(1);

    if (!target) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    if (target.isDeleted || target.hiddenByAdmin) {
      return NextResponse.json(
        { success: false, error: "이미 숨김 처리된 게시글입니다." },
        { status: 409 }
      );
    }

    const session = await getCurrentSession();
    if (!session && !fingerprint) {
      return NextResponse.json(
        { success: false, error: "fingerprint가 필요합니다." },
        { status: 400 }
      );
    }

    if (session) {
      const [dup] = await db
        .select({ id: boardPostReports.id })
        .from(boardPostReports)
        .where(
          and(
            eq(boardPostReports.postId, postId),
            eq(boardPostReports.reporterId, session.sub)
          )
        )
        .limit(1);
      if (dup) {
        return NextResponse.json(
          { success: false, error: "이미 신고한 게시글입니다." },
          { status: 409 }
        );
      }
    } else {
      const [dup] = await db
        .select({ id: boardPostReports.id })
        .from(boardPostReports)
        .where(
          and(
            eq(boardPostReports.postId, postId),
            eq(boardPostReports.reporterFingerprint, fingerprint)
          )
        )
        .limit(1);
      if (dup) {
        return NextResponse.json(
          { success: false, error: "이미 신고한 게시글입니다." },
          { status: 409 }
        );
      }
    }

    await db.insert(boardPostReports).values({
      postId,
      reporterId: session?.sub ?? null,
      reporterFingerprint: fingerprint || null,
      reason,
    });

    const [{ count = 0 } = { count: 0 }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(boardPostReports)
      .where(eq(boardPostReports.postId, postId));

    let hidden = false;
    if (Number(count) >= AUTO_HIDE_THRESHOLD) {
      await db
        .update(boardPosts)
        .set({ hiddenByAdmin: true })
        .where(eq(boardPosts.id, postId));
      hidden = true;
    }

    return NextResponse.json({ success: true, data: { hidden, count } });
  } catch (e) {
    console.error("[POST /api/board/[id]/report]", e);
    return NextResponse.json(
      { success: false, error: "신고 처리에 실패했습니다." },
      { status: 500 }
    );
  }
}
