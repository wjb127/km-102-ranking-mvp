import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mmaEvents } from "@/db/schema";
import { parsePositiveIntParam } from "@/lib/parse-id";

export const runtime = "nodejs";
export const alt = "MMA 이벤트";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// OG 이미지는 자주 안 바뀌므로 1시간 캐시
export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
  const { id } = await params;
  const numericId = parsePositiveIntParam(id);
  if (numericId === null) return fallback();

  const [row] = await db
    .select({
      name: mmaEvents.name,
      nameKo: mmaEvents.nameKo,
      eventDate: mmaEvents.eventDate,
      venue: mmaEvents.venue,
      venueKo: mmaEvents.venueKo,
    })
    .from(mmaEvents)
    .where(eq(mmaEvents.id, numericId))
    .limit(1);

  if (!row) return fallback();

  const title = row.nameKo ?? row.name;
  const sub = row.nameKo ? row.name : null;
  const dateStr = row.eventDate
    ? new Date(row.eventDate).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
  const venueStr = row.venueKo ?? row.venue ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background:
            "linear-gradient(135deg, #0b0f1a 0%, #1f2937 50%, #312e81 100%)",
          color: "#f9fafb",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#a5b4fc",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            EVENT · MMA 분석 커뮤니티
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1.5,
            }}
          >
            {title}
          </div>
          {sub ? (
            <div style={{ display: "flex", fontSize: 32, color: "#d1d5db" }}>
              {sub}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dateStr ? (
            <div style={{ display: "flex", fontSize: 40, fontWeight: 600 }}>
              📅 {dateStr}
            </div>
          ) : null}
          {venueStr ? (
            <div style={{ display: "flex", fontSize: 30, color: "#cbd5e1" }}>
              📍 {venueStr}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}

function fallback() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f1a",
          color: "#f9fafb",
          fontSize: 72,
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        MMA 이벤트
      </div>
    ),
    { ...size }
  );
}
