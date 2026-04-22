import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { mmaComments, mmaCommentReports } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth/session";

// ── POST /api/mma-comments/report ──
// body: { commentId, reason, fingerprint? }
// 동일 fingerprint + commentId 중복 신고 차단. 3회 이상 신고 시 자동 숨김.
const AUTO_HIDE_THRESHOLD = 3;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const commentId = Number(body.commentId);
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const fingerprint =
      typeof body.fingerprint === "string" ? body.fingerprint.trim() : "";

    if (!commentId || !reason) {
      return NextResponse.json(
        { success: false, error: "commentId와 reason이 필요합니다." },
        { status: 400 }
      );
    }

    // 댓글 존재 확인
    const [target] = await db
      .select({ id: mmaComments.id, isDeleted: mmaComments.isDeleted })
      .from(mmaComments)
      .where(eq(mmaComments.id, commentId))
      .limit(1);
    if (!target) {
      return NextResponse.json(
        { success: false, error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const session = await getCurrentSession();

    // 중복 신고 방지 (로그인 유저는 userId, 비로그인은 fingerprint 기준)
    if (session) {
      const [dup] = await db
        .select({ id: mmaCommentReports.id })
        .from(mmaCommentReports)
        .where(
          and(
            eq(mmaCommentReports.commentId, commentId),
            eq(mmaCommentReports.reporterId, session.sub)
          )
        )
        .limit(1);
      if (dup) {
        return NextResponse.json(
          { success: false, error: "이미 신고한 댓글입니다." },
          { status: 409 }
        );
      }
    } else if (fingerprint) {
      const [dup] = await db
        .select({ id: mmaCommentReports.id })
        .from(mmaCommentReports)
        .where(
          and(
            eq(mmaCommentReports.commentId, commentId),
            eq(mmaCommentReports.reporterFingerprint, fingerprint)
          )
        )
        .limit(1);
      if (dup) {
        return NextResponse.json(
          { success: false, error: "이미 신고한 댓글입니다." },
          { status: 409 }
        );
      }
    }

    await db.insert(mmaCommentReports).values({
      commentId,
      reporterId: session?.sub ?? null,
      reporterFingerprint: fingerprint || null,
      reason,
    });

    // 임계값 도달 시 자동 숨김
    const [{ count = 0 } = { count: 0 }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(mmaCommentReports)
      .where(eq(mmaCommentReports.commentId, commentId));

    let hidden = false;
    if (Number(count) >= AUTO_HIDE_THRESHOLD && !target.isDeleted) {
      await db
        .update(mmaComments)
        .set({ isDeleted: true })
        .where(eq(mmaComments.id, commentId));
      hidden = true;
    }

    return NextResponse.json({ success: true, data: { hidden } });
  } catch (e) {
    console.error("[POST /api/mma-comments/report]", e);
    return NextResponse.json(
      { success: false, error: "신고 처리에 실패했습니다." },
      { status: 500 }
    );
  }
}
