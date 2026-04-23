-- balldontlie API에서 내려오지만 저장 안 하던 필드 추가
--
-- [fighters]
--   - birth_place: 출생지 (도시/주)
--   - gender: weight_class.gender (Male/Female)
--   - weight_class_abbr: weight_class.abbreviation (FW, BW, LW 등)
--   - weight_limit_lbs: weight_class.weight_limit_lbs (체급 상한 lb)
--
-- [events]
--   - short_name: 짧은 이름 ("UFC 330" 등, null 가능)
--   - status: scheduled / completed / cancelled / postponed
--   - main_card_start / prelims_start / early_prelims_start: 각 시작 시각 (null 가능)
--   - venue_name / venue_city / venue_state: 장소 분해 (기존 venue 문자열은 표시용으로 유지)

ALTER TABLE fighters
  ADD COLUMN IF NOT EXISTS birth_place TEXT,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
  ADD COLUMN IF NOT EXISTS weight_class_abbr VARCHAR(10),
  ADD COLUMN IF NOT EXISTS weight_limit_lbs INTEGER;

CREATE INDEX IF NOT EXISTS idx_fighters_gender ON fighters(gender);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS short_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS main_card_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS prelims_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS early_prelims_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS venue_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS venue_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS venue_state VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
