import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fighters, fighterEditSuggestions } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";

const EDITABLE_FIELDS: Record<string, { label: string; column: keyof typeof fighters.$inferSelect }> = {
  fullNameKo: { label: "한글명", column: "fullNameKo" },
  nicknameKo: { label: "한글 별명", column: "nicknameKo" },
  nationalityKo: { label: "한글 국적", column: "nationalityKo" },
  nickname: { label: "영문 별명", column: "nickname" },
};

// POST /api/mma-fighters/[id]/suggestions — 수정 제안 생성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const fighterId = parseInt(id, 10);
  if (isNaN(fighterId)) {
    return NextResponse.json({ success: false, error: "잘못된 선수 ID" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const fieldName = typeof body.fieldName === "string" ? body.fieldName.trim() : "";
  const newValue = typeof body.newValue === "string" ? body.newValue.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!fieldName || !EDITABLE_FIELDS[fieldName]) {
    return NextResponse.json(
      { success: false, error: "수정 가능한 필드: " + Object.keys(EDITABLE_FIELDS).join(", ") },
      { status: 400 }
    );
  }

  if (!newValue || newValue.length > 200) {
    return NextResponse.json(
      { success: false, error: "수정 값은 1~200자 사이여야 합니다." },
      { status: 400 }
    );
  }

  const [fighter] = await db
    .select()
    .from(fighters)
    .where(eq(fighters.id, fighterId))
    .limit(1);

  if (!fighter) {
    return NextResponse.json({ success: false, error: "선수를 찾을 수 없습니다." }, { status: 404 });
  }

  const column = EDITABLE_FIELDS[fieldName].column;
  const oldValue = (fighter[column] as string | null) ?? null;

  if (oldValue === newValue) {
    return NextResponse.json(
      { success: false, error: "현재 값과 동일합니다." },
      { status: 400 }
    );
  }

  const [suggestion] = await db
    .insert(fighterEditSuggestions)
    .values({
      fighterId,
      userId: session!.sub,
      userNickname: session!.nickname,
      fieldName,
      oldValue,
      newValue,
      reason: reason || null,
    })
    .returning({ id: fighterEditSuggestions.id });

  return NextResponse.json({ success: true, data: { id: suggestion.id } }, { status: 201 });
}
