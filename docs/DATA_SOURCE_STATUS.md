# 데이터 소스 현황 (API 연동 vs Mock)

작성일: 2026-04-23
Phase 4 완료 시점 기준

---

## 요약

| 구분 | 페이지 / 엔드포인트 |
|---|---|
| DB 연동 완료 | 인증 / 쪽지 / 관리자 / 선수(MMA) / 이벤트(MMA) / GOAT 투표 / 게시판 / 댓글(MMA) / 번역 캐시 / Cloudinary 업로드 |
| Mock / 레거시 (미전환) | 홈 화면의 일부 위젯 (구 `/api/fighters`, `/api/events`) / 레거시 랭킹 MVP (`/category/[slug]`, `/api/categories`, `/api/vote`, `/api/comments`) |
| 외부 API 프록시 | `/api/raw-data` (balldontlie 원본) / `/api/translate` (DeepL) / `/api/upload` (Cloudinary 서명) |

---

## 페이지별 데이터 소스

### DB 연동 완료

- `/login`, `/register` → `/api/auth/login` · `/api/auth/register` · `/api/auth/me`
- `/messages` → `/api/messages`, `/api/messages/[id]`
- `/admin`, `/admin/fighters`, `/admin/fighters/[id]`, `/admin/overrides` → `/api/admin/*`
- `/fighters` → `/api/mma-fighters` (DB · SUM 집계로 통합 전적)
- `/fighters/[id]` → `/api/mma-fighters/[id]` (DB · 단체별 전적 + 최근 경기)
- `/events` → `/api/mma-events` (DB · 연도 필터 클라이언트)
- `/events/[id]` → `/api/mma-events/[id]` (DB · 파이트 카드 + 승자 표시)
- `/vote` → `/api/mma-vote` (DB · GOAT 투표, fingerprint 기반)
- `/board`, `/board/[id]` → `/api/board`, `/api/board/[id]`, `/api/board/[id]/like` (DB)
- 게시글/이벤트 댓글 → `/api/mma-comments` (DB · 익명 fingerprint)

### Mock / 레거시 (미전환)

- `/` (홈) — 일부 위젯이 아직 레거시 엔드포인트 참조:
  - 선수 TOP3 섹션: `/api/fighters` (balldontlie + FALLBACK mock)
  - 최근 이벤트 섹션: `/api/events?year=2026` (balldontlie + FALLBACK mock)
  - 최신글 섹션: `/api/board` (DB)
  - → 후속 작업 필요: `/api/mma-fighters`, `/api/mma-events`로 교체
- `/category/[slug]` (레거시 랭킹 MVP) — `/api/categories/[slug]`, `/api/vote`, `/api/comments` 모두 mock
- `/estimate` — 내부 견적서 정적 페이지 (데이터 소스 없음)

---

## 엔드포인트별 상태

### DB 기반 (Neon + Drizzle)

| 엔드포인트 | 용도 |
|---|---|
| `/api/auth/{login,logout,me,register}` | 세션 JWT + HTTP-only 쿠키 |
| `/api/messages`, `/api/messages/[id]` | 쪽지 받은/보낸함, 읽음/삭제 |
| `/api/messages/unread-count` | NavBar 뱃지용 경량 카운트 |
| `/api/admin/fighters`, `/api/admin/fighters/[id]` | 관리자 선수 검색 + 수정 (감사 로그) |
| `/api/admin/overrides` | 관리자 override 이력 조회 |
| `/api/mma-fighters`, `/api/mma-fighters/[id]` | 선수 목록/상세 (단체별 전적 집계) |
| `/api/mma-events`, `/api/mma-events/[id]` | 이벤트 목록/상세 + 파이트 카드 |
| `/api/mma-vote` | GOAT 카테고리별 투표 (fingerprint) |
| `/api/mma-comments` | 게시글/이벤트 폴리모픽 댓글 |
| `/api/board`, `/api/board/[id]`, `/api/board/[id]/like` | 게시판 |

### 외부 API 프록시

| 엔드포인트 | 외부 서비스 | Fallback |
|---|---|---|
| `/api/translate` | DeepL API | 환경변수 없으면 원문 echo (`translated_ok: false`) |
| `/api/upload` | Cloudinary 서명 생성 | 환경변수 없으면 501 |
| `/api/raw-data` | balldontlie MMA v1 | 진단용 원본 프록시 |

### 레거시 / Mock (삭제 후보)

| 엔드포인트 | 메모 |
|---|---|
| `/api/fighters`, `/api/fighters/[id]` | balldontlie 프록시 + FALLBACK mock. 홈에서만 사용 |
| `/api/events`, `/api/events/[id]` | 동일 패턴. 홈에서만 사용 |
| `/api/categories`, `/api/categories/[slug]` | 초기 랭킹 MVP 전용 mock |
| `/api/vote`, `/api/vote/status` | 랭킹 MVP mock-store |
| `/api/comments`, `/api/comments/report` | 랭킹 MVP mock-store |

→ `/category/[slug]` 페이지와 함께 후속 정리 대상 (MMA 스코프 외)

---

## DB 스키마 현황

### 활성 테이블

- `users` / `admin_overrides` — 인증·감사
- `messages` — 쪽지 (sender/receiver 소프트 삭제)
- `fighters` / `fighter_org_records` / `fights` / `mma_events` — MMA 코어 데이터
- `goat_votes` — GOAT 투표 (fingerprint + category)
- `board_posts` / `board_post_likes` — 게시판
- `mma_comments` — 폴리모픽 댓글 (target_type + target_id)
- `translations` — DeepL 캐시 (sha256 hash 키)

### 레거시 (코엑시스트)

- `categories`, `persons`, `votes`, `comments` — 초기 랭킹 MVP. `/category/[slug]` 경로에서만 참조. MMA 커뮤니티 스코프 완료 후 제거 검토.

---

## 후속 작업 우선순위

1. 홈 위젯 DB 전환 (`/api/fighters` → `/api/mma-fighters`, `/api/events` → `/api/mma-events`)
2. 레거시 랭킹 MVP 제거 여부 확정 (`/category`, `/api/categories|vote|comments`)
3. balldontlie 환경변수(BALLDONTLIE_API_KEY)는 `/api/raw-data`만 사용하므로 홈 전환 후 nullable
