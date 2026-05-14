import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mmaEvents } from "@/db/schema";
import { SITE_URL } from "@/lib/site";
import { parsePositiveIntParam } from "@/lib/parse-id";
import EventDetailClient from "./event-detail-client";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = parsePositiveIntParam(id);
  if (numericId === null) return { robots: { index: false, follow: false } };

  const [row] = await db
    .select({
      name: mmaEvents.name,
      nameKo: mmaEvents.nameKo,
      eventDate: mmaEvents.eventDate,
      venue: mmaEvents.venue,
    })
    .from(mmaEvents)
    .where(eq(mmaEvents.id, numericId))
    .limit(1);

  if (!row) return {};

  const displayName = row.nameKo ?? row.name;
  const dateStr = row.eventDate
    ? new Date(row.eventDate).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const description = [dateStr, row.venue].filter(Boolean).join(" · ") || displayName;

  return {
    title: displayName,
    description,
    alternates: { canonical: `/events/${numericId}` },
    openGraph: {
      title: displayName,
      description,
      url: `${SITE_URL}/events/${numericId}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: displayName,
      description,
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params;
  return <EventDetailClient id={id} />;
}
