import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fighters, fighterOrgRecords, adminOverrides } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── GET /api/admin/fighters/[id] : 선수 상세 + 단체별 전적 ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { id } = await params;
  const fighterId = parseInt(id, 10);
  if (isNaN(fighterId)) {
    return NextResponse.json({ success: false, error: "잘못된 id." }, { status: 400 });
  }

  const [fighter] = await db
    .select()
    .from(fighters)
    .where(eq(fighters.id, fighterId))
    .limit(1);

  if (!fighter) {
    return NextResponse.json({ success: false, error: "선수를 찾을 수 없습니다." }, { status: 404 });
  }

  const orgRecords = await db
    .select()
    .from(fighterOrgRecords)
    .where(eq(fighterOrgRecords.fighterId, fighterId));

  return NextResponse.json({
    success: true,
    data: {
      fighter,
      orgRecords,
    },
  });
}

// ── PATCH /api/admin/fighters/[id] : 선수 정보 수동 보정 ──
// body: { reason, patch: { fullNameKo?, nicknameKo?, weightClass?, nationalityKo?, bioKo?, imageUrl? } }
const ALLOWED_KEYS = [
  "fullNameKo",
  "nicknameKo",
  "weightClass",
  "nationalityKo",
  "bioKo",
  "imageUrl",
] as const;

type AllowedKey = (typeof ALLOWED_KEYS)[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const fighterId = parseInt(id, 10);
  if (isNaN(fighterId)) {
    return NextResponse.json({ success: false, error: "잘못된 id." }, { status: 400 });
  }

  const body = await req.json();
  const reason = String(body.reason ?? "").trim();
  const patchRaw = body.patch ?? {};

  if (!reason) {
    return NextResponse.json(
      { success: false, error: "보정 사유(reason)는 필수입니다." },
      { status: 400 }
    );
  }

  // 허용 키만 추출
  const patch: Partial<Record<AllowedKey, string | null>> = {};
  for (const k of ALLOWED_KEYS) {
    if (k in patchRaw) {
      const v = patchRaw[k];
      patch[k] = v == null || v === "" ? null : String(v);
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { success: false, error: "수정할 값이 없습니다." },
      { status: 400 }
    );
  }

  // before 스냅샷
  const [before] = await db
    .select()
    .from(fighters)
    .where(eq(fighters.id, fighterId))
    .limit(1);

  if (!before) {
    return NextResponse.json({ success: false, error: "선수를 찾을 수 없습니다." }, { status: 404 });
  }

  // 업데이트
  const [after] = await db
    .update(fighters)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(fighters.id, fighterId))
    .returning();

  // 감사 로그
  await db.insert(adminOverrides).values({
    adminId: session!.sub,
    targetType: "fighter",
    targetId: fighterId,
    reason,
    beforeData: before,
    afterData: after,
  });

  return NextResponse.json({ success: true, data: after });
}
