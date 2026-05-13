import type { MetadataRoute } from "next";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { fighters, mmaEvents, boardPosts } from "@/db/schema";
import { SITE_URL } from "@/lib/site";

// 동적 페이지 합본 — 대용량 대비 상한 (Google sitemap 50,000 룰 + 응답시간).
const MAX_FIGHTERS = 5_000;
const MAX_EVENTS = 2_000;
const MAX_POSTS = 2_000;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/fighters`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/vote`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/board`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
  ];

  // 공개 노출되는 선수만 (placeholder + 0-0-0 제외, 체급 있는 행)
  const fighterRows = await db
    .select({
      id: fighters.id,
      updatedAt: fighters.updatedAt,
    })
    .from(fighters)
    .where(
      sql`${fighters.weightClass} IS NOT NULL
        AND ${fighters.fullName} !~ '^Fighter [0-9]+$'
        AND (${fighters.careerWins} + ${fighters.careerLosses} + ${fighters.careerDraws}) > 0`
    )
    .orderBy(desc(fighters.careerWins))
    .limit(MAX_FIGHTERS);

  const fighterEntries: MetadataRoute.Sitemap = fighterRows.map((f) => ({
    url: `${SITE_URL}/fighters/${f.id}`,
    lastModified: f.updatedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const eventRows = await db
    .select({ id: mmaEvents.id, createdAt: mmaEvents.createdAt })
    .from(mmaEvents)
    .orderBy(desc(mmaEvents.eventDate))
    .limit(MAX_EVENTS);

  const eventEntries: MetadataRoute.Sitemap = eventRows.map((e) => ({
    url: `${SITE_URL}/events/${e.id}`,
    lastModified: e.createdAt ?? now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const postRows = await db
    .select({ id: boardPosts.id, updatedAt: boardPosts.updatedAt })
    .from(boardPosts)
    .where(and(eq(boardPosts.isDeleted, false), eq(boardPosts.hiddenByAdmin, false)))
    .orderBy(desc(boardPosts.createdAt))
    .limit(MAX_POSTS);

  const postEntries: MetadataRoute.Sitemap = postRows.map((p) => ({
    url: `${SITE_URL}/board/${p.id}`,
    lastModified: p.updatedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticEntries, ...fighterEntries, ...eventEntries, ...postEntries];
}
