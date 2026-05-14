import type { MetadataRoute } from "next";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { fighters, mmaEvents, boardPosts } from "@/db/schema";
import { SITE_URL } from "@/lib/site";
import { publicFighterCondition } from "@/lib/fighter-visibility";

// 분할 sitemap — Google 단일 sitemap 50,000 URL 제한 회피.
// shard 0: 정적 + 이벤트 + 게시글
// shard 1..N: 선수 (CHUNK_SIZE 씩 분할)
const CHUNK_SIZE = 5_000;
const MAX_EVENTS = 5_000;
const MAX_POSTS = 5_000;

export const revalidate = 3600;

async function countPublicFighters(): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(fighters)
    .where(publicFighterCondition());
  return row?.c ?? 0;
}

export async function generateSitemaps(): Promise<{ id: number }[]> {
  const total = await countPublicFighters();
  const fighterShards = Math.max(1, Math.ceil(total / CHUNK_SIZE));
  // shard 0 = 정적/이벤트/게시글, 1..fighterShards = 선수 분할
  const ids = Array.from({ length: fighterShards + 1 }, (_, i) => ({ id: i }));
  return ids;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  if (id === 0) {
    const staticEntries: MetadataRoute.Sitemap = [
      { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
      { url: `${SITE_URL}/fighters`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${SITE_URL}/events`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
      { url: `${SITE_URL}/vote`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
      { url: `${SITE_URL}/board`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
    ];

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

    return [...staticEntries, ...eventEntries, ...postEntries];
  }

  // 선수 분할 (id 1부터 시작)
  const offset = (id - 1) * CHUNK_SIZE;
  const fighterRows = await db
    .select({
      id: fighters.id,
      updatedAt: fighters.updatedAt,
    })
    .from(fighters)
    .where(publicFighterCondition())
    .orderBy(desc(fighters.careerWins), fighters.id)
    .limit(CHUNK_SIZE)
    .offset(offset);

  return fighterRows.map((f) => ({
    url: `${SITE_URL}/fighters/${f.id}`,
    lastModified: f.updatedAt ?? now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
}
