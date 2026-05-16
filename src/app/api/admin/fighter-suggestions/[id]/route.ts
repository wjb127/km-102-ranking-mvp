import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fighters, fighterEditSuggestions, adminOverrides } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

type FighterUpdateKey = "fullNameKo" | "nicknameKo" | "nationalityKo" | "nickname";

const VALID_FIELDS: Set<string> = new Set(["fullNameKo", "nicknameKo", "nationalityKo", "nickname"]);

// PATCH /api/admin/fighter-suggestions/[id] — 승인 또는 거절
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const suggestionId = parseInt(id, 10);
  if (isNaN(suggestionId)) {
    return NextResponse.json({ success: false, error: "잘못된 ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const rejectReason = typeof body.rejectReason === "string" ? body.rejectReason.trim() : null;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { success: false, error: "action은 approve 또는 reject" },
      { status: 400 }
    );
  }

  const [suggestion] = await db
    .select()
    .from(fighterEditSuggestions)
    .where(eq(fighterEditSuggestions.id, suggestionId))
    .limit(1);

  if (!suggestion) {
    return NextResponse.json({ success: false, error: "제안을 찾을 수 없습니다." }, { status: 404 });
  }

  if (suggestion.status !== "pending") {
    return NextResponse.json(
      { success: false, error: "이미 처리된 제안입니다." },
      { status: 409 }
    );
  }

  if (action === "reject") {
    await db
      .update(fighterEditSuggestions)
      .set({
        status: "rejected",
        reviewedBy: session!.sub,
        reviewedAt: new Date(),
        rejectReason,
      })
      .where(eq(fighterEditSuggestions.id, suggestionId));

    return NextResponse.json({ success: true, status: "rejected" });
  }

  // 승인: fighters 테이블 업데이트
  if (!VALID_FIELDS.has(suggestion.fieldName)) {
    return NextResponse.json({ success: false, error: "알 수 없는 필드" }, { status: 400 });
  }

  const fieldKey = suggestion.fieldName as FighterUpdateKey;

  const [currentFighter] = await db
    .select()
    .from(fighters)
    .where(eq(fighters.id, suggestion.fighterId))
    .limit(1);

  if (!currentFighter) {
    return NextResponse.json({ success: false, error: "선수를 찾을 수 없습니다." }, { status: 404 });
  }

  const beforeData = {
    [suggestion.fieldName]: suggestion.oldValue,
  };
  const afterData = {
    [suggestion.fieldName]: suggestion.newValue,
  };

  await db.transaction(async (tx) => {
    await tx
      .update(fighters)
      .set({
        [fieldKey]: suggestion.newValue,
        updatedAt: new Date(),
      })
      .where(eq(fighters.id, suggestion.fighterId));

    await tx
      .update(fighterEditSuggestions)
      .set({
        status: "approved",
        reviewedBy: session!.sub,
        reviewedAt: new Date(),
      })
      .where(eq(fighterEditSuggestions.id, suggestionId));

    await tx.insert(adminOverrides).values({
      adminId: session!.sub,
      targetType: "fighter",
      targetId: suggestion.fighterId,
      reason: `유저 수정 제안 승인 (#${suggestionId}, ${suggestion.userNickname}): ${suggestion.fieldName} 변경`,
      beforeData,
      afterData,
    });
  });

  return NextResponse.json({ success: true, status: "approved" });
}
