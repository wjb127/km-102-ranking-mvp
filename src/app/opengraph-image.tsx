import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "MMA 분석 커뮤니티";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 80,
          textAlign: "center",
          background:
            "linear-gradient(135deg, #0b0f1a 0%, #111827 50%, #1f2937 100%)",
          color: "#f9fafb",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at top, rgba(239,68,68,0.18) 0%, transparent 60%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#9ca3af",
            letterSpacing: 4,
            marginBottom: 16,
            zIndex: 1,
          }}
        >
          GOAT · 랭킹 · 분석
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: -3,
            lineHeight: 1,
            zIndex: 1,
          }}
        >
          MMA 분석 커뮤니티
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 36,
            color: "#d1d5db",
            marginTop: 24,
            zIndex: 1,
          }}
        >
          격투기 팬을 위한 GOAT 투표 · 일정 · 분석 게시판
        </div>
      </div>
    ),
    { ...size }
  );
}
