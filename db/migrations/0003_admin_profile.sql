-- 0003: 관리자/프로필 기능을 위한 컬럼 추가
--
-- [users]
--   - deleted_at: 소프트 탈퇴 시각 (NULL이면 활성 계정)
--
-- [board_posts]
--   - hidden_by_admin: 관리자 숨김 처리 (is_deleted와 별개로, 노출만 차단)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE board_posts
  ADD COLUMN IF NOT EXISTS hidden_by_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_posts_hidden ON board_posts(hidden_by_admin);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at);
