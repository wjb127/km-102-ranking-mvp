import { NextRequest, NextResponse } from "next/server";
import { and, desc, ilike, isNotNull, or } from "drizzle-orm";
import { db } from "@/db";
import { fighters, mmaEvents } from "@/db/schema";

const WEIGHT_CLASSES = [
  "Strawweight",
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
  "Openweight",
  "Catchweight",
] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "6", 10) || 6, 10);

  if (q.length < 1) {
    return NextResponse.json({
      success: true,
      data: { fighters: [], events: [], weights: [] },
    });
  }

  const pattern = `%${q}%`;

  const fighterRows = await db
    .select({
      id: fighters.id,
      name: fighters.fullName,
      nameKo: fighters.fullNameKo,
      nickname: fighters.nickname,
      nicknameKo: fighters.nicknameKo,
      weightClass: fighters.weightClass,
    })
    .from(fighters)
    .where(
      and(
        isNotNull(fighters.weightClass),
        or(
          ilike(fighters.fullName, pattern),
          ilike(fighters.fullNameKo, pattern),
          ilike(fighters.nickname, pattern),
          ilike(fighters.nicknameKo, pattern)
        )
      )
    )
    .orderBy(desc(fighters.careerWins))
    .limit(limit);

  const eventRows = await db
    .select({
      id: mmaEvents.id,
      name: mmaEvents.name,
      nameKo: mmaEvents.nameKo,
      eventDate: mmaEvents.eventDate,
      venue: mmaEvents.venue,
      venueKo: mmaEvents.venueKo,
    })
    .from(mmaEvents)
    .where(or(ilike(mmaEvents.name, pattern), ilike(mmaEvents.nameKo, pattern)))
    .orderBy(desc(mmaEvents.eventDate))
    .limit(limit);

  const lowerQ = q.toLowerCase();
  const weights = WEIGHT_CLASSES.filter((weight) =>
    weight.toLowerCase().includes(lowerQ)
  )
    .slice(0, limit)
    .map((weight) => ({ name: weight, href: `/fighters?weight=${encodeURIComponent(weight)}` }));

  return NextResponse.json({
    success: true,
    data: {
      fighters: fighterRows.map((fighter) => ({
        ...fighter,
        href: `/fighters/${fighter.id}`,
      })),
      events: eventRows.map((event) => ({
        ...event,
        eventDate: event.eventDate ? event.eventDate.toISOString() : null,
        href: `/events/${event.id}`,
      })),
      weights,
    },
  });
}
