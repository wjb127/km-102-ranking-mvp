import { NextRequest, NextResponse } from "next/server";
import { alias } from "drizzle-orm/pg-core";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { fighters, fighterOrgRecords, organizations, fights, mmaEvents } from "@/db/schema";
import { publicFighterCondition } from "@/lib/fighter-visibility";

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

  const [fighterRow] = await db
    .select()
    .from(fighters)
    .where(and(eq(fighters.id, fighterId), publicFighterCondition()))
    .limit(1);

  if (!fighterRow) {
    return NextResponse.json({ success: false, error: "선수를 찾을 수 없습니다." }, { status: 404 });
  }

  const fighter = {
    id: fighterRow.id,
    externalId: fighterRow.externalId,
    fullName: fighterRow.fullName,
    fullNameKo: fighterRow.fullNameKo,
    nickname: fighterRow.nickname,
    nicknameKo: fighterRow.nicknameKo,
    weightClass: fighterRow.weightClass,
    nationality: fighterRow.nationality,
    nationalityKo: fighterRow.nationalityKo,
    imageUrl: fighterRow.imageUrl,
    isActive: fighterRow.isActive,
    heightCm: fighterRow.heightCm,
    reachCm: fighterRow.reachCm,
    bio: fighterRow.bio,
    bioKo: fighterRow.bioKo,
    birthDate: fighterRow.birthDate,
    wins: fighterRow.careerWins,
    losses: fighterRow.careerLosses,
    draws: fighterRow.careerDraws,
    noContests: fighterRow.careerNoContests,
    winsByKo: 0,
    winsBySub: 0,
    winsByDec: 0,
  };

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

  const fighterA = alias(fighters, "fighter_a");
  const fighterB = alias(fighters, "fighter_b");

  const recentFights = await db
    .select({
      id: fights.id,
      eventId: fights.eventId,
      eventName: mmaEvents.name,
      eventNameKo: mmaEvents.nameKo,
      eventDate: mmaEvents.eventDate,
      fighterAId: fights.fighterAId,
      fighterBId: fights.fighterBId,
      fighterAName: fighterA.fullName,
      fighterANameKo: fighterA.fullNameKo,
      fighterBName: fighterB.fullName,
      fighterBNameKo: fighterB.fullNameKo,
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
    .leftJoin(fighterA, eq(fights.fighterAId, fighterA.id))
    .leftJoin(fighterB, eq(fights.fighterBId, fighterB.id))
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
        opponentId: f.fighterAId === fighterId ? f.fighterBId : f.fighterAId,
        opponentName: f.fighterAId === fighterId ? f.fighterBName : f.fighterAName,
        opponentNameKo: f.fighterAId === fighterId ? f.fighterBNameKo : f.fighterANameKo,
        eventDate: f.eventDate ? f.eventDate.toISOString() : null,
      })),
    },
  });
}
