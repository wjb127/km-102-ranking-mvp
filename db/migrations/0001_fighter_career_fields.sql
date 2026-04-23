-- 선수 커리어 전적 + 활동 상태 컬럼 추가
-- balldontlie /fighters 엔드포인트의 record_* / active / weight_lbs / stance 필드를 1:1 매핑.
-- 기존 fighter_org_records 는 단체별 집계용으로 남겨두고, career_* 은 원본 스냅샷.

ALTER TABLE fighters
  ADD COLUMN IF NOT EXISTS career_wins INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS career_losses INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS career_draws INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS career_no_contests INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS weight_lbs INTEGER,
  ADD COLUMN IF NOT EXISTS stance VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_fighters_career_wins ON fighters(career_wins);
CREATE INDEX IF NOT EXISTS idx_fighters_active ON fighters(is_active);
