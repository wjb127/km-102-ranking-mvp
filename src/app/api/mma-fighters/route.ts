import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { fighters, fighterOrgRecords } from "@/db/schema";

// ── GET /api/mma-fighters?search=...&weight=... ──
// DB 기반 선수 목록. 관리자 보정값(한글명/이미지/소개) + 단체 전적 합산 포함.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("search") ?? "").trim();
  const weight = (searchParams.get("weight") ?? "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);

  const conditions: SQL[] = [];
  if (q) {
    const searchCond = or(
      ilike(fighters.fullName, `%${q}%`),
      ilike(fighters.fullNameKo, `%${q}%`),
      ilike(fighters.nickname, `%${q}%`),
      ilike(fighters.nicknameKo, `%${q}%`)
    );
    if (searchCond) conditions.push(searchCond);
  }
  if (weight) conditions.push(eq(fighters.weightClass, weight));

  const whereExpr = conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : and(...conditions);

  // fighter_org_records 를 fighter_id 별로 SUM
  const totals = db
    .select({
      fighterId: fighterOrgRecords.fighterId,
      wins: sql<number>`SUM(${fighterOrgRecords.wins})::int`.as("wins"),
      losses: sql<number>`SUM(${fighterOrgRecords.losses})::int`.as("losses"),
      draws: sql<number>`SUM(${fighterOrgRecords.draws})::int`.as("draws"),
      noContests: sql<number>`SUM(${fighterOrgRecords.noContests})::int`.as("no_contests"),
      winsByKo: sql<number>`SUM(${fighterOrgRecords.winsByKo})::int`.as("wins_by_ko"),
      winsBySub: sql<number>`SUM(${fighterOrgRecords.winsBySub})::int`.as("wins_by_sub"),
      winsByDec: sql<number>`SUM(${fighterOrgRecords.winsByDec})::int`.as("wins_by_dec"),
    })
    .from(fighterOrgRecords)
    .groupBy(fighterOrgRecords.fighterId)
    .as("totals");

  const rows = await db
    .select({
      id: fighters.id,
      externalId: fighters.externalId,
      fullName: fighters.fullName,
      fullNameKo: fighters.fullNameKo,
      nickname: fighters.nickname,
      nicknameKo: fighters.nicknameKo,
      weightClass: fighters.weightClass,
      nationality: fighters.nationality,
      nationalityKo: fighters.nationalityKo,
      imageUrl: fighters.imageUrl,
      wins: totals.wins,
      losses: totals.losses,
      draws: totals.draws,
      noContests: totals.noContests,
      winsByKo: totals.winsByKo,
      winsBySub: totals.winsBySub,
      winsByDec: totals.winsByDec,
    })
    .from(fighters)
    .leftJoin(totals, eq(totals.fighterId, fighters.id))
    .where(whereExpr)
    .orderBy(asc(fighters.fullName))
    .limit(limit);

  const data = rows.map((r) => ({
    ...r,
    wins: r.wins ?? 0,
    losses: r.losses ?? 0,
    draws: r.draws ?? 0,
    noContests: r.noContests ?? 0,
    winsByKo: r.winsByKo ?? 0,
    winsBySub: r.winsBySub ?? 0,
    winsByDec: r.winsByDec ?? 0,
  }));

  return NextResponse.json({ success: true, data });
}
