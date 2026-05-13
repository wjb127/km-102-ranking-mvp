-- =====================================================
-- 0006_fighter_bookmarks.sql
-- 선수 즐겨찾기/북마크 테이블.
-- 로그인 사용자가 선수를 저장해서 프로필에서 모아 보는 용도.
-- =====================================================

CREATE TABLE IF NOT EXISTS fighter_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fighter_id INTEGER NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS fighter_bookmarks_user_fighter_unique
  ON fighter_bookmarks(user_id, fighter_id);

CREATE INDEX IF NOT EXISTS idx_fighter_bookmarks_user
  ON fighter_bookmarks(user_id, created_at DESC);
