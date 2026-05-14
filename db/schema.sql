-- =====================================================
-- MMA 분석 커뮤니티 DB 스키마 (Neon PostgreSQL)
-- 사용법: Neon 콘솔 SQL Editor에 전체 붙여넣고 Run
-- 재실행 안전: IF NOT EXISTS / ON CONFLICT 사용
-- =====================================================

-- UUID 생성 함수 활성화
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. 사용자 (Auth.js 호환 + 자체 이메일/비번 로그인)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  nickname VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT,                              -- bcrypt 해시 (자체 로그인용)
  email_verified TIMESTAMPTZ,
  image TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user',        -- user | admin
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- Auth.js OAuth 계정 연결 (카카오/구글 등 추가 시 사용)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- =====================================================
-- 2. MMA 단체 (UFC / ONE / Bellator / PFL / RIZIN ...)
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_ko VARCHAR(100)
);

-- =====================================================
-- 3. 선수
-- =====================================================
CREATE TABLE IF NOT EXISTS fighters (
  id SERIAL PRIMARY KEY,
  external_id INTEGER UNIQUE,                      -- balldontlie fighter id
  full_name VARCHAR(200) NOT NULL,
  full_name_ko VARCHAR(200),                       -- 번역본
  nickname VARCHAR(100),
  nickname_ko VARCHAR(100),
  weight_class VARCHAR(50),
  nationality VARCHAR(100),
  nationality_ko VARCHAR(100),
  birth_date DATE,
  height_cm NUMERIC(5,2),
  reach_cm NUMERIC(5,2),
  image_url TEXT,
  bio TEXT,
  bio_ko TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fighters_full_name ON fighters(full_name);
CREATE INDEX IF NOT EXISTS idx_fighters_weight_class ON fighters(weight_class);
CREATE INDEX IF NOT EXISTS idx_fighters_external ON fighters(external_id);

-- =====================================================
-- 4. 단체별 전적 (이적 시 단체별로 분리 누적)
--    한 선수가 UFC → ONE 이적하면 행 2개
-- =====================================================
CREATE TABLE IF NOT EXISTS fighter_org_records (
  id SERIAL PRIMARY KEY,
  fighter_id INTEGER NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  no_contests INTEGER NOT NULL DEFAULT 0,
  wins_by_ko INTEGER NOT NULL DEFAULT 0,
  wins_by_sub INTEGER NOT NULL DEFAULT 0,
  wins_by_dec INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fighter_id, organization_id)
);

-- =====================================================
-- 5. 경기 이벤트
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  external_id INTEGER UNIQUE,
  organization_id INTEGER REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  name_ko VARCHAR(255),
  event_date TIMESTAMPTZ,
  venue VARCHAR(255),
  venue_ko VARCHAR(255),
  country VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date DESC);

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

-- =====================================================
-- 6. 개별 경기 (fights)
--    is_void: 무효/번복 시 TRUE
--    is_applied_to_record: 해당 경기 결과가 fighter_org_records 에 반영되었는지
-- =====================================================
CREATE TABLE IF NOT EXISTS fights (
  id SERIAL PRIMARY KEY,
  external_id INTEGER UNIQUE,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organization_id INTEGER REFERENCES organizations(id),
  fighter_a_id INTEGER NOT NULL REFERENCES fighters(id),
  fighter_b_id INTEGER NOT NULL REFERENCES fighters(id),
  weight_class VARCHAR(50),
  is_title_fight BOOLEAN NOT NULL DEFAULT FALSE,
  is_main_event BOOLEAN NOT NULL DEFAULT FALSE,
  winner_id INTEGER REFERENCES fighters(id),
  result VARCHAR(20),                              -- 'ko'|'tko'|'submission'|'decision'|'draw'|'nc'
  method TEXT,
  round INTEGER,
  time VARCHAR(10),
  is_void BOOLEAN NOT NULL DEFAULT FALSE,
  is_applied_to_record BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fights_event ON fights(event_id);
CREATE INDEX IF NOT EXISTS idx_fights_fighters ON fights(fighter_a_id, fighter_b_id);

-- =====================================================
-- 7. 관리자 수동 보정 로그 (2차 안전장치)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_overrides (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES users(id),
  target_type VARCHAR(50) NOT NULL,                -- 'fight' | 'fighter' | 'fighter_org_record'
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_overrides_target ON admin_overrides(target_type, target_id);

-- =====================================================
-- 8. GOAT 투표
--    (user_id | fingerprint) + category 조합으로 1인 1투표 보장
-- =====================================================
CREATE TABLE IF NOT EXISTS goat_votes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fingerprint VARCHAR(100),
  category VARCHAR(30) NOT NULL,                   -- p4p | heavyweight | lightweight | knockout | submission
  fighter_id INTEGER NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category),
  UNIQUE (fingerprint, category)
);
CREATE INDEX IF NOT EXISTS idx_votes_fighter_cat ON goat_votes(fighter_id, category);

-- =====================================================
-- 9. 게시판
-- =====================================================
CREATE TABLE IF NOT EXISTS board_posts (
  id SERIAL PRIMARY KEY,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_nickname VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL,                   -- analysis | discussion | free
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_category ON board_posts(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created ON board_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hot ON board_posts(like_count DESC, created_at DESC);

-- =====================================================
-- 10. 게시글 추천
-- =====================================================
CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fingerprint VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id),
  UNIQUE (post_id, fingerprint)
);

-- =====================================================
-- 11. 댓글 (폴리모픽: 게시글/선수/경기 모두 연결)
-- =====================================================
-- 주의: 기존 프로젝트에 구(舊) 랭킹용 `comments` 테이블이 있을 수 있어
-- MMA 커뮤니티용 댓글은 mma_comments 로 분리 관리
CREATE TABLE IF NOT EXISTS mma_comments (
  id SERIAL PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL,                -- post | fighter | event | fight
  target_id INTEGER NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_nickname VARCHAR(50) NOT NULL,
  parent_id INTEGER REFERENCES mma_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mma_comments_target ON mma_comments(target_type, target_id, created_at);

-- =====================================================
-- 12. 댓글 신고
-- =====================================================
CREATE TABLE IF NOT EXISTS mma_comment_reports (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES mma_comments(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_fingerprint VARCHAR(100),
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',   -- pending | reviewed | dismissed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 13. 쪽지 (유저 ↔ 유저 1:1)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted_sender BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted_receiver BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_msg_receiver ON messages(receiver_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_msg_sender ON messages(sender_id, created_at DESC);

-- =====================================================
-- 14. 번역 캐시 (영→한 번역 API 호출 결과 캐싱)
-- =====================================================
CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  source_hash CHAR(64) NOT NULL,                   -- sha256(source_text)
  source_lang VARCHAR(5) NOT NULL DEFAULT 'en',
  target_lang VARCHAR(5) NOT NULL DEFAULT 'ko',
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_hash, source_lang, target_lang)
);

-- =====================================================
-- 초기 데이터 — 단체 목록
-- =====================================================
INSERT INTO organizations (slug, name, name_ko) VALUES
  ('ufc',      'UFC',              'UFC'),
  ('one',      'ONE Championship', '원 챔피언십'),
  ('bellator', 'Bellator MMA',     '벨라토르'),
  ('pfl',      'PFL',              'PFL'),
  ('rizin',    'RIZIN',            '라이진')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 유지보수용 트리거: updated_at 자동 갱신
-- =====================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'users','fighters','fighter_org_records','fights','board_posts','mma_comments'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;
