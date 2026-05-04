import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { fights, fighters, mmaEvents, adminOverrides } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// 허용 결과 값
const ALLOWED_RESULTS = ["win", "loss", "draw", "no_contest"] as const;
type AllowedResult = (typeof ALLOWED_RESULTS)[number];

// ── GET /api/admin/fights/[id] : 경기 상세 ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { id } = await params;
  const fightId = parseInt(id, 10);
  if (isNaN(fightId)) {
    return NextResponse.json({ success: false, error: "잘못된 id." }, { status: 400 });
  }

  const fA = alias(fighters, "f_a");
  const fB = alias(fighters, "f_b");

  const [row] = await db
    .select({
      id: fights.id,
      eventId: fights.eventId,
      eventName: mmaEvents.name,
      eventNameKo: mmaEvents.nameKo,
      eventDate: mmaEvents.eventDate,
      weightClass: fights.weightClass,
      isTitleFight: fights.isTitleFight,
      isMainEvent: fights.isMainEvent,
      isVoid: fights.isVoid,
      isAppliedToRecord: fights.isAppliedToRecord,
      result: fights.result,
      method: fights.method,
      round: fights.round,
      time: fights.time,
      winnerId: fights.winnerId,
      fighterAId: fights.fighterAId,
      fighterBId: fights.fighterBId,
      fighterA: { id: fA.id, name: fA.fullName, nameKo: fA.fullNameKo },
      fighterB: { id: fB.id, name: fB.fullName, nameKo: fB.fullNameKo },
    })
    .from(fights)
    .leftJoin(mmaEvents, eq(fights.eventId, mmaEvents.id))
    .leftJoin(fA, eq(fights.fighterAId, fA.id))
    .leftJoin(fB, eq(fights.fighterBId, fB.id))
    .where(eq(fights.id, fightId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ success: false, error: "경기를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: row });
}

// ── PATCH /api/admin/fights/[id] : 경기 결과 수동 보정 ──
// body: { reason, patch: { winnerId?, result?, method?, round?, time?, isVoid? } }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const fightId = parseInt(id, 10);
  if (isNaN(fightId)) {
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

  const [before] = await db.select().from(fights).where(eq(fights.id, fightId)).limit(1);
  if (!before) {
    return NextResponse.json({ success: false, error: "경기를 찾을 수 없습니다." }, { status: 404 });
  }

  const update: Partial<typeof fights.$inferInsert> = {};

  if ("winnerId" in patchRaw) {
    const v = patchRaw.winnerId;
    if (v === null || v === "") {
      update.winnerId = null;
    } else {
      const wid = Number(v);
      if (!Number.isFinite(wid)) {
        return NextResponse.json(
          { success: false, error: "winnerId 형식 오류." },
          { status: 400 }
        );
      }
      if (wid !== before.fighterAId && wid !== before.fighterBId) {
        return NextResponse.json(
          { success: false, error: "winnerId는 경기 참가 선수 중 한 명이어야 합니다." },
          { status: 400 }
        );
      }
      update.winnerId = wid;
    }
  }

  if ("result" in patchRaw) {
    const v = patchRaw.result;
    if (v === null || v === "") {
      update.result = null;
    } else if (!ALLOWED_RESULTS.includes(String(v) as AllowedResult)) {
      return NextResponse.json(
        { success: false, error: `result는 ${ALLOWED_RESULTS.join("/")} 중 하나.` },
        { status: 400 }
      );
    } else {
      update.result = String(v);
    }
  }

  if ("method" in patchRaw) {
    const v = patchRaw.method;
    update.method = v == null || v === "" ? null : String(v);
  }

  if ("round" in patchRaw) {
    const v = patchRaw.round;
    if (v === null || v === "") {
      update.round = null;
    } else {
      const r = Number(v);
      if (!Number.isFinite(r) || r < 0) {
        return NextResponse.json(
          { success: false, error: "round는 0 이상의 정수." },
          { status: 400 }
        );
      }
      update.round = Math.floor(r);
    }
  }

  if ("time" in patchRaw) {
    const v = patchRaw.time;
    update.time = v == null || v === "" ? null : String(v).slice(0, 10);
  }

  if ("isVoid" in patchRaw) {
    update.isVoid = Boolean(patchRaw.isVoid);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { success: false, error: "수정할 값이 없습니다." },
      { status: 400 }
    );
  }

  update.updatedAt = new Date();

  const [after] = await db
    .update(fights)
    .set(update)
    .where(eq(fights.id, fightId))
    .returning();

  await db.insert(adminOverrides).values({
    adminId: session!.sub,
    targetType: "fight",
    targetId: fightId,
    reason,
    beforeData: before,
    afterData: after,
  });

  return NextResponse.json({ success: true, data: after });
}
