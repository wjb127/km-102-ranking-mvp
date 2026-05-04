import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { fights, fighters, mmaEvents, organizations } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── GET /api/admin/fights : 경기 목록 + 검색/필터 ──
// query: q (선수 이름) | eventId | fighterId | page | limit
export async function GET(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const eventId = parseInt(searchParams.get("eventId") ?? "", 10);
  const fighterId = parseInt(searchParams.get("fighterId") ?? "", 10);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10) || 30, 100);
  const offset = (page - 1) * limit;

  const fA = alias(fighters, "f_a");
  const fB = alias(fighters, "f_b");

  const conds: SQL[] = [];
  if (Number.isFinite(eventId)) conds.push(eq(fights.eventId, eventId));
  if (Number.isFinite(fighterId)) {
    conds.push(or(eq(fights.fighterAId, fighterId), eq(fights.fighterBId, fighterId))!);
  }
  if (q) {
    conds.push(
      or(
        ilike(fA.fullName, `%${q}%`),
        ilike(fA.fullNameKo, `%${q}%`),
        ilike(fB.fullName, `%${q}%`),
        ilike(fB.fullNameKo, `%${q}%`),
        ilike(mmaEvents.name, `%${q}%`),
        ilike(mmaEvents.nameKo, `%${q}%`)
      )!
    );
  }
  const whereExpr = conds.length > 0 ? and(...conds) : undefined;

  const baseQuery = db
    .select({
      id: fights.id,
      eventId: fights.eventId,
      eventName: mmaEvents.name,
      eventNameKo: mmaEvents.nameKo,
      eventDate: mmaEvents.eventDate,
      orgSlug: organizations.slug,
      weightClass: fights.weightClass,
      isTitleFight: fights.isTitleFight,
      isMainEvent: fights.isMainEvent,
      isVoid: fights.isVoid,
      result: fights.result,
      method: fights.method,
      round: fights.round,
      time: fights.time,
      winnerId: fights.winnerId,
      fighterA: { id: fA.id, name: fA.fullName, nameKo: fA.fullNameKo },
      fighterB: { id: fB.id, name: fB.fullName, nameKo: fB.fullNameKo },
    })
    .from(fights)
    .leftJoin(mmaEvents, eq(fights.eventId, mmaEvents.id))
    .leftJoin(organizations, eq(fights.organizationId, organizations.id))
    .leftJoin(fA, eq(fights.fighterAId, fA.id))
    .leftJoin(fB, eq(fights.fighterBId, fB.id));

  const rows = await (whereExpr
    ? baseQuery
        .where(whereExpr)
        .orderBy(desc(mmaEvents.eventDate), desc(fights.id))
        .limit(limit)
        .offset(offset)
    : baseQuery
        .orderBy(desc(mmaEvents.eventDate), desc(fights.id))
        .limit(limit)
        .offset(offset));

  // 총 개수 (간단히 별도 카운트 쿼리)
  const countQuery = db
    .select({ n: sql<number>`count(*)::int` })
    .from(fights)
    .leftJoin(mmaEvents, eq(fights.eventId, mmaEvents.id))
    .leftJoin(fA, eq(fights.fighterAId, fA.id))
    .leftJoin(fB, eq(fights.fighterBId, fB.id));
  const [{ n: total }] = await (whereExpr ? countQuery.where(whereExpr) : countQuery);

  return NextResponse.json({ success: true, data: rows, total, page, limit });
}
