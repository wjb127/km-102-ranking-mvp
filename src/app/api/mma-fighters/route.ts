import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { fighters, fighterOrgRecords } from "@/db/schema";

// ── GET /api/mma-fighters?search=...&weight=...&sort=...&active=...&verified=...&minWins=... ──
// career_wins 등은 balldontlie 원본을 그대로 저장. fighter_org_records 는
// 향후 /fights 유료 sync 대비 보조 집계용.
// includeOrgTotals=1 일 때만 fighter_org_records 집계 쿼리 실행 (기본 skip).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("search") ?? "").trim();
  const weight = (searchParams.get("weight") ?? "").trim();
  const sort = (searchParams.get("sort") ?? "name").trim();
  const activeOnly = searchParams.get("active") === "1";
  const verifiedOnly = searchParams.get("verified") === "1";
  const minWinsRaw = Number(searchParams.get("minWins") ?? NaN);
  const minWins = Number.isFinite(minWinsRaw) && minWinsRaw >= 0 ? minWinsRaw : null;
  const includeOrgTotals = searchParams.get("includeOrgTotals") === "1";
  // 외부 API 결측치(체급 없음) 행 공개 노출 차단. 관리자/admin은 includeIncomplete=1로 우회
  const includeIncomplete = searchParams.get("includeIncomplete") === "1";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1000);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

  const conditions: SQL[] = [];
  if (!includeIncomplete) conditions.push(isNotNull(fighters.weightClass));
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
  if (verifiedOnly) conditions.push(isNotNull(fighters.externalId));
  if (minWins !== null) conditions.push(gte(fighters.careerWins, minWins));

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

  // fighter_org_records 집계는 includeOrgTotals=1 옵트인일 때만 수행.
  // 매 요청 exists probe도 제거 — 호출자가 명시할 때만 비용 발생.
  type OrgTotals = {
    fighterId: number;
    winsByKo: number | null;
    winsBySub: number | null;
    winsByDec: number | null;
  };

  const baseRows = await db
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
    })
    .from(fighters)
    .where(whereExpr)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  let orgTotalsByFighter: Map<number, OrgTotals> = new Map();
  if (includeOrgTotals && baseRows.length > 0) {
    const ids = baseRows.map((r) => r.id);
    const totals = await db
      .select({
        fighterId: fighterOrgRecords.fighterId,
        winsByKo: sql<number>`SUM(${fighterOrgRecords.winsByKo})::int`.as("wins_by_ko"),
        winsBySub: sql<number>`SUM(${fighterOrgRecords.winsBySub})::int`.as("wins_by_sub"),
        winsByDec: sql<number>`SUM(${fighterOrgRecords.winsByDec})::int`.as("wins_by_dec"),
      })
      .from(fighterOrgRecords)
      .where(inArray(fighterOrgRecords.fighterId, ids))
      .groupBy(fighterOrgRecords.fighterId);
    orgTotalsByFighter = new Map(totals.map((t) => [t.fighterId, t]));
  }

  // 전체 건수 (페이지네이션용)
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int`.as("total") })
    .from(fighters)
    .where(whereExpr);

  const data = baseRows.map((r) => {
    const t = orgTotalsByFighter.get(r.id);
    return {
      ...r,
      winsByKo: t?.winsByKo ?? 0,
      winsBySub: t?.winsBySub ?? 0,
      winsByDec: t?.winsByDec ?? 0,
    };
  });

  return NextResponse.json({ success: true, data, total, limit, offset });
}
