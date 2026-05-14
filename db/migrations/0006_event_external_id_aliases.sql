-- 외부 API가 같은 실물 이벤트를 서로 다른 external_id로 내려주는 케이스 보정.
-- DROP/DELETE 없이 재실행 안전한 추가/업데이트만 수행한다.

CREATE TABLE IF NOT EXISTS event_external_id_aliases (
  id SERIAL PRIMARY KEY,
  retired_external_id INTEGER NOT NULL UNIQUE,
  keeper_external_id INTEGER NOT NULL REFERENCES events(external_id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (retired_external_id <> keeper_external_id)
);

CREATE INDEX IF NOT EXISTS idx_event_external_id_aliases_keeper
  ON event_external_id_aliases(keeper_external_id);

INSERT INTO event_external_id_aliases (retired_external_id, keeper_external_id, reason)
VALUES
  (80621, 91283, 'Rousey vs. Carano 중복 일정: MVP MMA 이벤트로 매핑')
ON CONFLICT (retired_external_id) DO UPDATE
SET
  keeper_external_id = EXCLUDED.keeper_external_id,
  reason = EXCLUDED.reason,
  updated_at = NOW();
