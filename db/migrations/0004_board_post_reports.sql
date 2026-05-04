-- 게시글 신고 테이블
-- 댓글 신고와 동일한 패턴으로 사용자가 게시글을 신고할 수 있게 한다.
-- 임계값(기본 5회) 이상 누적 시 hidden_by_admin=true 자동 처리.

CREATE TABLE IF NOT EXISTS board_post_reports (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_fingerprint VARCHAR(100),
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_board_post_reports_post ON board_post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_board_post_reports_status ON board_post_reports(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_board_post_reports_user
  ON board_post_reports(post_id, reporter_id)
  WHERE reporter_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_board_post_reports_fp
  ON board_post_reports(post_id, reporter_fingerprint)
  WHERE reporter_fingerprint IS NOT NULL;
