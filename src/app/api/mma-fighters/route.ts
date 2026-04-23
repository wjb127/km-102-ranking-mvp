import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { fighters, fighterOrgRecords } from "@/db/schema";

// ── GET /api/mma-fighters?search=...&weight=...&sort=...&active=... ──
// career_wins 등은 balldontlie 원본을 그대로 저장. fighter_org_records 는
// 향후 /fights 유료 sync 대비 보조 집계용.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("search") ?? "").trim();
  const weight = (searchParams.get("weight") ?? "").trim();
  const sort = (searchParams.get("sort") ?? "name").trim();
  const activeOnly = searchParams.get("active") === "1";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1000);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

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
  if (activeOnly) conditions.push(eq(fighters.isActive, true));

  const whereExpr = conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : and(...conditions);

  // 정렬 기준
  const totalFights = sql<number>`(${fighters.careerWins} + ${fighters.careerLosses} + ${fighters.careerDraws})`;
  const winRate = sql<number>`CASE WHEN ${totalFights} = 0 THEN 0 ELSE (${fighters.careerWins}::float / ${totalFights}) END`;

  const orderBy: SQL[] = (() => {
    switch (sort) {
      case "wins":
        return [desc(fighters.careerWins), desc(winRate), asc(fighters.fullName)];
      case "winrate":
        return [desc(winRate), desc(fighters.careerWins), asc(fighters.fullName)];
      case "fights":
        return [desc(totalFights), desc(fighters.careerWins), asc(fighters.fullName)];
      case "name":
      default:
        return [asc(fighters.fullName)];
    }
  })();

  // 선수별 단체 전적 합계 (있을 경우만 채워짐)
  const totals = db
    .select({
      fighterId: fighterOrgRecords.fighterId,
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
      isActive: fighters.isActive,
      wins: fighters.careerWins,
      losses: fighters.careerLosses,
      draws: fighters.careerDraws,
      noContests: fighters.careerNoContests,
      winsByKo: totals.winsByKo,
      winsBySub: totals.winsBySub,
      winsByDec: totals.winsByDec,
    })
    .from(fighters)
    .leftJoin(totals, eq(totals.fighterId, fighters.id))
    .where(whereExpr)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  // 전체 건수 (페이지네이션용)
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int`.as("total") })
    .from(fighters)
    .where(whereExpr);

  const data = rows.map((r) => ({
    ...r,
    winsByKo: r.winsByKo ?? 0,
    winsBySub: r.winsBySub ?? 0,
    winsByDec: r.winsByDec ?? 0,
  }));

  return NextResponse.json({ success: true, data, total, limit, offset });
}
