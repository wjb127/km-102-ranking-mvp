// 사이트 메타 단일 진실값. metadata/sitemap/robots/OG에서 재사용.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://mma-ranking-community.vercel.app";

export const SITE_NAME = "MMA 분석 커뮤니티";
export const SITE_DESCRIPTION =
  "MMA 선수 GOAT 투표, 경기 일정, 분석 게시판 — 격투기 팬 커뮤니티";
