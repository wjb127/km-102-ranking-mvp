import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mmaCommentReports, mmaComments } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── GET /api/admin/reports?status=pending|resolved|dismissed ──
export async function GET(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { searchParams } = new URL(req.url);
  const statusRaw = (searchParams.get("status") ?? "pending").trim();
  const allowedStatus = ["pending", "resolved", "dismissed"] as const;
  const status = (allowedStatus as readonly string[]).includes(statusRaw)
    ? (statusRaw as (typeof allowedStatus)[number])
    : "pending";

  const rows = await db
    .select({
      id: mmaCommentReports.id,
      commentId: mmaCommentReports.commentId,
      reason: mmaCommentReports.reason,
      status: mmaCommentReports.status,
      createdAt: mmaCommentReports.createdAt,
      commentContent: mmaComments.content,
      commentAuthorNickname: mmaComments.authorNickname,
      commentIsDeleted: mmaComments.isDeleted,
      commentTargetType: mmaComments.targetType,
      commentTargetId: mmaComments.targetId,
    })
    .from(mmaCommentReports)
    .leftJoin(mmaComments, eq(mmaCommentReports.commentId, mmaComments.id))
    .where(eq(mmaCommentReports.status, status))
    .orderBy(desc(mmaCommentReports.createdAt))
    .limit(200);

  const data = rows.map((r) => ({
    id: r.id,
    commentId: r.commentId,
    reason: r.reason ?? "",
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    comment: {
      id: r.commentId,
      content: r.commentContent ?? "",
      authorNickname: r.commentAuthorNickname ?? "",
      isDeleted: Boolean(r.commentIsDeleted),
      targetType: r.commentTargetType ?? "",
      targetId: r.commentTargetId ?? 0,
    },
  }));

  return NextResponse.json({ success: true, data });
}
