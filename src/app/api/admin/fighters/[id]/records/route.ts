import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fighterOrgRecords, fighters, adminOverrides } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── PATCH /api/admin/fighters/[id]/records ──
// 단체별 전적(fighter_org_records)을 관리자가 수동 보정.
// body: {
//   reason: string,
//   records: [{ id, wins, losses, draws, noContests, winsByKo, winsBySub, winsByDec }]
// }
// 모든 변경은 admin_overrides 감사 로그에 기록.
// fighters.career_* 합계도 모든 org records 합으로 재계산.

interface RecordPatch {
  id: number;
  wins: number;
  losses: number;
  draws: number;
  noContests: number;
  winsByKo: number;
  winsBySub: number;
  winsByDec: number;
}

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

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
  const recordsRaw = Array.isArray(body.records) ? body.records : [];

  if (!reason) {
    return NextResponse.json(
      { success: false, error: "보정 사유(reason)는 필수입니다." },
      { status: 400 }
    );
  }
  if (recordsRaw.length === 0) {
    return NextResponse.json(
      { success: false, error: "수정할 전적이 없습니다." },
      { status: 400 }
    );
  }

  // before snapshot
  const beforeRecords = await db
    .select()
    .from(fighterOrgRecords)
    .where(eq(fighterOrgRecords.fighterId, fighterId));

  const beforeMap = new Map(beforeRecords.map((r) => [r.id, r]));

  const sanitized: RecordPatch[] = [];
  for (const r of recordsRaw) {
    const recId = Number(r.id);
    if (!beforeMap.has(recId)) {
      return NextResponse.json(
        { success: false, error: `해당 선수의 record id=${recId} 가 아닙니다.` },
        { status: 400 }
      );
    }
    sanitized.push({
      id: recId,
      wins: safeNum(r.wins),
      losses: safeNum(r.losses),
      draws: safeNum(r.draws),
      noContests: safeNum(r.noContests),
      winsByKo: safeNum(r.winsByKo),
      winsBySub: safeNum(r.winsBySub),
      winsByDec: safeNum(r.winsByDec),
    });
  }

  await db.transaction(async (tx) => {
    for (const r of sanitized) {
      await tx
        .update(fighterOrgRecords)
        .set({
          wins: r.wins,
          losses: r.losses,
          draws: r.draws,
          noContests: r.noContests,
          winsByKo: r.winsByKo,
          winsBySub: r.winsBySub,
          winsByDec: r.winsByDec,
        })
        .where(eq(fighterOrgRecords.id, r.id));
    }

    // 합계 재계산
    const all = await tx
      .select()
      .from(fighterOrgRecords)
      .where(eq(fighterOrgRecords.fighterId, fighterId));

    const totals = all.reduce(
      (acc, r) => ({
        wins: acc.wins + r.wins,
        losses: acc.losses + r.losses,
        draws: acc.draws + r.draws,
        noContests: acc.noContests + r.noContests,
      }),
      { wins: 0, losses: 0, draws: 0, noContests: 0 }
    );

    await tx
      .update(fighters)
      .set({
        careerWins: totals.wins,
        careerLosses: totals.losses,
        careerDraws: totals.draws,
        careerNoContests: totals.noContests,
        updatedAt: new Date(),
      })
      .where(eq(fighters.id, fighterId));
  });

  const afterRecords = await db
    .select()
    .from(fighterOrgRecords)
    .where(eq(fighterOrgRecords.fighterId, fighterId));

  await db.insert(adminOverrides).values({
    adminId: session!.sub,
    targetType: "fighter_records",
    targetId: fighterId,
    reason,
    beforeData: beforeRecords,
    afterData: afterRecords,
  });

  return NextResponse.json({ success: true, data: { records: afterRecords } });
}
