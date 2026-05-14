import { NextRequest, NextResponse } from "next/server";
import { alias } from "drizzle-orm/pg-core";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mmaEvents, organizations, fighters, fights } from "@/db/schema";
import { parsePositiveIntParam } from "@/lib/parse-id";

// ── GET /api/mma-events/[id] : 이벤트 상세 + 파이트 카드 ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventId = parsePositiveIntParam(id);
  if (eventId === null) {
    return NextResponse.json({ success: false, error: "잘못된 id." }, { status: 400 });
  }

  const [event] = await db
    .select({
      id: mmaEvents.id,
      externalId: mmaEvents.externalId,
      name: mmaEvents.name,
      nameKo: mmaEvents.nameKo,
      eventDate: mmaEvents.eventDate,
      venue: mmaEvents.venue,
      venueKo: mmaEvents.venueKo,
      country: mmaEvents.country,
      imageUrl: mmaEvents.imageUrl,
      orgSlug: organizations.slug,
      orgName: organizations.name,
      orgNameKo: organizations.nameKo,
    })
    .from(mmaEvents)
    .leftJoin(organizations, eq(mmaEvents.organizationId, organizations.id))
    .where(eq(mmaEvents.id, eventId))
    .limit(1);

  if (!event) {
    return NextResponse.json({ success: false, error: "이벤트를 찾을 수 없습니다." }, { status: 404 });
  }

  const fighterA = alias(fighters, "fighter_a");
  const fighterB = alias(fighters, "fighter_b");

  const cardRows = await db
    .select({
      id: fights.id,
      weightClass: fights.weightClass,
      isTitleFight: fights.isTitleFight,
      isMainEvent: fights.isMainEvent,
      result: fights.result,
      method: fights.method,
      round: fights.round,
      time: fights.time,
      winnerId: fights.winnerId,
      fighterAId: fights.fighterAId,
      fighterAName: fighterA.fullName,
      fighterANameKo: fighterA.fullNameKo,
      fighterAImage: fighterA.imageUrl,
      fighterBId: fights.fighterBId,
      fighterBName: fighterB.fullName,
      fighterBNameKo: fighterB.fullNameKo,
      fighterBImage: fighterB.imageUrl,
    })
    .from(fights)
    .leftJoin(fighterA, eq(fights.fighterAId, fighterA.id))
    .leftJoin(fighterB, eq(fights.fighterBId, fighterB.id))
    .where(eq(fights.eventId, eventId))
    .orderBy(desc(fights.isMainEvent), desc(fights.isTitleFight), asc(fights.id));

  return NextResponse.json({
    success: true,
    data: {
      event: { ...event, eventDate: event.eventDate ? event.eventDate.toISOString() : null },
      card: cardRows,
    },
  });
}
