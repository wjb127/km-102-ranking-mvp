import { NextRequest, NextResponse } from "next/server";
import { and, desc, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { fighters } from "@/db/schema";
import { publicFighterCondition } from "@/lib/fighter-visibility";

// ── GET /api/mma-fighters/nationalities?active=1 ──
// 공개 노출 가능한 선수 기준으로 국적별 집계 (한글표기 + 카운트).
// active=1 일 때만 현역(is_active=true) 필터 적용 — 목록 페이지 토글 상태와 count 일치.
// 드롭다운 필터 / 자동완성 / 통계 위젯 등에서 재사용.
//
// 응답 캐시는 dynamic = 'force-dynamic' 대신 짧은 revalidate로 유지하되
// active 파라미터별로 별도 캐시 키가 잡히도록 NextRequest 시그니처 사용.
export const revalidate = 600;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "1";

  const conditions: SQL[] = [
    publicFighterCondition(),
    sql`${fighters.nationality} IS NOT NULL
      AND length(trim(${fighters.nationality})) > 0`,
  ];
  if (activeOnly) {
    conditions.push(sql`${fighters.isActive} = true`);
  }

  const rows = await db
    .select({
      nationality: fighters.nationality,
      nationalityKo: sql<string | null>`MAX(${fighters.nationalityKo})`.as("nationality_ko"),
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(fighters)
    .where(and(...conditions))
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

  return NextResponse.json({ success: true, data });
}
