import { ImageResponse } from "next/og";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { fighters } from "@/db/schema";
import { publicFighterCondition } from "@/lib/fighter-visibility";
import { parsePositiveIntParam } from "@/lib/parse-id";

export const runtime = "nodejs";
export const alt = "MMA 선수 프로필";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// OG 이미지는 자주 안 바뀌므로 1시간 캐시 (크롤러 재요청 부하 감소)
export const revalidate = 3600;

const FLAG: Record<string, string> = {
  USA: "🇺🇸",
  "United States": "🇺🇸",
  Ireland: "🇮🇪",
  Russia: "🇷🇺",
  Brazil: "🇧🇷",
  "New Zealand": "🇳🇿",
  Australia: "🇦🇺",
  Nigeria: "🇳🇬",
  China: "🇨🇳",
  Japan: "🇯🇵",
  "South Korea": "🇰🇷",
  Korea: "🇰🇷",
  Mexico: "🇲🇽",
  Canada: "🇨🇦",
  France: "🇫🇷",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Poland: "🇵🇱",
  Germany: "🇩🇪",
  Sweden: "🇸🇪",
  Netherlands: "🇳🇱",
  Spain: "🇪🇸",
  Italy: "🇮🇹",
  Dagestan: "🏳️",
  Georgia: "🇬🇪",
  Ukraine: "🇺🇦",
  Belarus: "🇧🇾",
  Kazakhstan: "🇰🇿",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
  const { id } = await params;
  const numericId = parsePositiveIntParam(id);
  if (numericId === null) return defaultImage();

  const [row] = await db
    .select({
      fullName: fighters.fullName,
      fullNameKo: fighters.fullNameKo,
      nickname: fighters.nickname,
      nicknameKo: fighters.nicknameKo,
      weightClass: fighters.weightClass,
      nationality: fighters.nationality,
      nationalityKo: fighters.nationalityKo,
      careerWins: fighters.careerWins,
      careerLosses: fighters.careerLosses,
      careerDraws: fighters.careerDraws,
      imageUrl: fighters.imageUrl,
    })
    .from(fighters)
    .where(and(eq(fighters.id, numericId), publicFighterCondition()))
    .limit(1);

  if (!row) return defaultImage();

  const displayPrimary = row.fullNameKo ?? row.fullName;
  const displaySecondary = row.fullNameKo ? row.fullName : null;
  const nicknamePart = row.nicknameKo ?? row.nickname;
  const flag = row.nationality ? FLAG[row.nationality] ?? "🌐" : "";
  const nationalityLabel = row.nationalityKo ?? row.nationality ?? "";
  const record = `${row.careerWins}승 ${row.careerLosses}패 ${row.careerDraws}무`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background:
            "linear-gradient(135deg, #0b0f1a 0%, #111827 45%, #1f2937 100%)",
          color: "#f9fafb",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 64,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 480,
            height: 480,
            background:
              "radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: "#9ca3af",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              MMA 분석 커뮤니티
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 84,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -2,
              }}
            >
              {displayPrimary}
            </div>
            {displaySecondary ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 36,
                  color: "#d1d5db",
                  fontWeight: 500,
                }}
              >
                {displaySecondary}
              </div>
            ) : null}
            {nicknamePart ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 32,
                  color: "#fbbf24",
                  fontStyle: "italic",
                  marginTop: 8,
                }}
              >
                “{nicknamePart}”
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "rgba(239,68,68,0.15)",
                border: "2px solid rgba(239,68,68,0.6)",
                borderRadius: 16,
                padding: "20px 32px",
              }}
            >
              <span style={{ fontSize: 22, color: "#fca5a5", marginBottom: 4 }}>
                전적
              </span>
              <span style={{ fontSize: 48, fontWeight: 700 }}>{record}</span>
            </div>
            {row.weightClass ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(59,130,246,0.15)",
                  border: "2px solid rgba(59,130,246,0.6)",
                  borderRadius: 16,
                  padding: "20px 32px",
                }}
              >
                <span
                  style={{ fontSize: 22, color: "#93c5fd", marginBottom: 4 }}
                >
                  체급
                </span>
                <span style={{ fontSize: 42, fontWeight: 700 }}>
                  {row.weightClass}
                </span>
              </div>
            ) : null}
            {nationalityLabel ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: "2px solid rgba(255,255,255,0.15)",
                  borderRadius: 16,
                  padding: "20px 28px",
                  fontSize: 36,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 48 }}>{flag}</span>
                <span>{nationalityLabel}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

function defaultImage() {
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
          fontSize: 80,
          fontWeight: 800,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        MMA 분석 커뮤니티
      </div>
    ),
    { ...size }
  );
}
