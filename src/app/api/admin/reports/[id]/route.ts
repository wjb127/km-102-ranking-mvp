import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mmaCommentReports, mmaComments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── PATCH /api/admin/reports/[id] : 신고 처리 ──
// body: { action: 'resolve_hide' | 'dismiss' }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { id } = await params;
  const reportId = parseInt(id, 10);
  if (isNaN(reportId)) {
    return NextResponse.json(
      { success: false, error: "잘못된 id." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "").trim();

  if (action !== "resolve_hide" && action !== "dismiss") {
    return NextResponse.json(
      { success: false, error: "action은 resolve_hide 또는 dismiss 여야 합니다." },
      { status: 400 }
    );
  }

  // 신고 레코드 조회
  const [report] = await db
    .select()
    .from(mmaCommentReports)
    .where(eq(mmaCommentReports.id, reportId))
    .limit(1);

  if (!report) {
    return NextResponse.json(
      { success: false, error: "신고를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (action === "resolve_hide") {
    // 신고 상태 resolved + 댓글 소프트 삭제
    await db
      .update(mmaCommentReports)
      .set({ status: "resolved" })
      .where(eq(mmaCommentReports.id, reportId));

    await db
      .update(mmaComments)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(mmaComments.id, report.commentId));
  } else {
    // 단순 무시
    await db
      .update(mmaCommentReports)
      .set({ status: "dismissed" })
      .where(eq(mmaCommentReports.id, reportId));
  }

  return NextResponse.json({ success: true });
}
