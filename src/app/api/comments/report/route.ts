import { NextRequest, NextResponse } from "next/server";
import { addReport } from "@/lib/mock-store";

/** POST — 댓글 신고 */
export async function POST(req: NextRequest) {
  const { commentId, reason, fingerprint } = await req.json();

  if (!commentId || !reason || !fingerprint) {
    return NextResponse.json(
      { success: false, error: "commentId, reason, fingerprint가 필요합니다." },
      { status: 400 }
    );
  }

  const result = addReport(commentId, reason, fingerprint);

  if (result.alreadyReported) {
    return NextResponse.json(
      { success: false, error: "이미 신고한 댓글입니다." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { hidden: result.hidden },
  });
}
