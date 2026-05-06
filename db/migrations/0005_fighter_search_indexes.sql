-- =====================================================
-- 0005_fighter_search_indexes.sql
-- 선수 목록 조회 가속용 인덱스.
-- 적용일: 2026-05-06 (Neon 직접 적용 후 신규 환경 복구용으로 기록)
-- =====================================================

-- ILIKE %q% 가속용 trigram 검색 인덱스 (이름/닉네임 4종)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_fighters_fullname_trgm
  ON fighters USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fighters_fullname_ko_trgm
  ON fighters USING gin (full_name_ko gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fighters_nickname_trgm
  ON fighters USING gin (nickname gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fighters_nickname_ko_trgm
  ON fighters USING gin (nickname_ko gin_trgm_ops);

-- 정렬+필터 복합 인덱스
-- /api/mma-fighters?sort=wins&active=1 또는 weight 필터에서 사용.
-- 기본 sort=name 에서는 사용되지 않지만 메인 TOP3 쿼리에는 필수.
CREATE INDEX IF NOT EXISTS idx_fighters_active_wins
  ON fighters(is_active, career_wins DESC);

CREATE INDEX IF NOT EXISTS idx_fighters_weight_wins
  ON fighters(weight_class, career_wins DESC);

ANALYZE fighters;
