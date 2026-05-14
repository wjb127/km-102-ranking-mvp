import { sql, type SQL } from "drizzle-orm";
import { fighters } from "@/db/schema";

/**
 * 공개 노출 가능한 선수 기준 — 모든 공개 경로 (목록/검색/상세/sitemap/메타데이터/OG)에서 공통 사용.
 *
 * 제외 대상:
 *  - 체급 미지정 선수 (placeholder/미정리 데이터)
 *  - 이름이 "Fighter 1234" 같은 placeholder 패턴
 *  - 전적 합계가 0 (실전 경험 없음)
 */
export function publicFighterCondition(): SQL {
  return sql`${fighters.weightClass} IS NOT NULL
    AND ${fighters.fullName} !~ '^Fighter [0-9]+$'
    AND (${fighters.careerWins} + ${fighters.careerLosses} + ${fighters.careerDraws}) > 0`;
}
