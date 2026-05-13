import { NextResponse } from "next/server";
import { desc, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { fighters } from "@/db/schema";

// ── GET /api/mma-fighters/nationalities ──
// 공개 노출 가능한 선수 기준으로 국적별 집계 (한글표기 + 카운트).
// 드롭다운 필터 / 자동완성 / 통계 위젯 등에서 재사용.
export const revalidate = 600;

export async function GET() {
  const rows = await db
    .select({
      nationality: fighters.nationality,
      nationalityKo: sql<string | null>`MAX(${fighters.nationalityKo})`.as("nationality_ko"),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(fighters)
    .where(
      sql`${fighters.weightClass} IS NOT NULL
        AND ${fighters.fullName} !~ '^Fighter [0-9]+$'
        AND (${fighters.careerWins} + ${fighters.careerLosses} + ${fighters.careerDraws}) > 0
        AND ${fighters.nationality} IS NOT NULL
        AND length(trim(${fighters.nationality})) > 0`
    )
    .groupBy(fighters.nationality)
    .orderBy(desc(sql`COUNT(*)`));

  const data = rows
    .filter((r): r is { nationality: string; nationalityKo: string | null; count: number } =>
      !!r.nationality
    )
    .map((r) => ({
      value: r.nationality,
      label: r.nationalityKo ?? r.nationality,
      count: r.count,
    }));

  // 미사용 import 제거 회피
  void isNotNull;

  return NextResponse.json({ success: true, data });
}
