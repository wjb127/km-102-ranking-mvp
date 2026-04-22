import { NextRequest, NextResponse } from "next/server";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { fighters, fighterOrgRecords, organizations, fights, mmaEvents } from "@/db/schema";

// ── GET /api/mma-fighters/[id] : 선수 상세 + 단체별 전적 + 최근 경기 ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const orgRows = await db
    .select({
      id: fighterOrgRecords.id,
      wins: fighterOrgRecords.wins,
      losses: fighterOrgRecords.losses,
      draws: fighterOrgRecords.draws,
      noContests: fighterOrgRecords.noContests,
      winsByKo: fighterOrgRecords.winsByKo,
      winsBySub: fighterOrgRecords.winsBySub,
      winsByDec: fighterOrgRecords.winsByDec,
      orgSlug: organizations.slug,
      orgName: organizations.name,
      orgNameKo: organizations.nameKo,
    })
    .from(fighterOrgRecords)
    .leftJoin(organizations, eq(fighterOrgRecords.organizationId, organizations.id))
    .where(eq(fighterOrgRecords.fighterId, fighterId));

  const recentFights = await db
    .select({
      id: fights.id,
      eventId: fights.eventId,
      eventName: mmaEvents.name,
      eventNameKo: mmaEvents.nameKo,
      eventDate: mmaEvents.eventDate,
      fighterAId: fights.fighterAId,
      fighterBId: fights.fighterBId,
      weightClass: fights.weightClass,
      isTitleFight: fights.isTitleFight,
      isMainEvent: fights.isMainEvent,
      winnerId: fights.winnerId,
      result: fights.result,
      method: fights.method,
      round: fights.round,
      time: fights.time,
    })
    .from(fights)
    .leftJoin(mmaEvents, eq(fights.eventId, mmaEvents.id))
    .where(or(eq(fights.fighterAId, fighterId), eq(fights.fighterBId, fighterId)))
    .orderBy(desc(mmaEvents.eventDate))
    .limit(20);

  return NextResponse.json({
    success: true,
    data: {
      fighter,
      orgRecords: orgRows,
      recentFights: recentFights.map((f) => ({
        ...f,
        eventDate: f.eventDate ? f.eventDate.toISOString() : null,
      })),
    },
  });
}
