import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { mmaEvents, organizations } from "@/db/schema";

// ── GET /api/mma-events?org=ufc&upcoming=true ──
// 이벤트 목록. org/upcoming/past 필터. 기본은 최근순.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orgSlug = (searchParams.get("org") ?? "").trim();
  const upcoming = searchParams.get("upcoming") === "true";
  const past = searchParams.get("past") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);

  let orgId: number | null = null;
  if (orgSlug) {
    const [org] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);
    if (!org) {
      return NextResponse.json({ success: true, data: [] });
    }
    orgId = org.id;
  }

  const now = new Date();
  const conditions: SQL[] = [];
  if (orgId != null) conditions.push(eq(mmaEvents.organizationId, orgId));
  if (upcoming) conditions.push(gte(mmaEvents.eventDate, now));
  if (past) conditions.push(lte(mmaEvents.eventDate, now));

  const whereExpr = conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : and(...conditions);

  const orderCol = upcoming ? asc(mmaEvents.eventDate) : desc(mmaEvents.eventDate);

  const rows = await db
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
    .where(whereExpr)
    .orderBy(orderCol)
    .limit(limit);

  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      ...r,
      eventDate: r.eventDate ? r.eventDate.toISOString() : null,
    })),
  });
}
