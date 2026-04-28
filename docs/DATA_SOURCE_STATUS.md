# 데이터 소스 현황 (API 연동 vs Mock)

최종 갱신: 2026-04-23
Phase 4 + 레거시 정리 완료 시점 기준

---

## 요약

| 구분 | 내용 |
|---|---|
| DB 연동 완료 | 전 페이지 / 전 엔드포인트 |
| 외부 API 프록시 | `/api/raw-data` (balldontlie) · `/api/translate` (DeepL) · `/api/upload` (Cloudinary) |
| 자동 동기화 | `pnpm sync:mma` → fighters/events, `pnpm sync:mma:fights` → fights + 전적 재계산 |
| Mock / 레거시 | 없음 — 전부 제거 완료 |

---

## 페이지별 데이터 소스

| 페이지 | 엔드포인트 |
|---|---|
| `/` (홈) | `/api/mma-fighters` · `/api/mma-events` · `/api/board` |
| `/fighters` | `/api/mma-fighters` |
| `/fighters/[id]` | `/api/mma-fighters/[id]` · `/api/mma-comments` (targetType=fighter) |
| `/events` | `/api/mma-events` |
| `/events/[id]` | `/api/mma-events/[id]` · `/api/mma-comments` (targetType=event) |
| `/vote` | `/api/mma-vote` |
| `/board`, `/board/[id]` | `/api/board`, `/api/board/[id]`, `/api/board/[id]/like` · `/api/mma-comments` (targetType=post) |
| `/messages` | `/api/messages`, `/api/messages/[id]` |
| `/login`, `/register` | `/api/auth/*` |
| `/admin/*` | `/api/admin/*` |
| `/raw-data` | `/api/raw-data` (balldontlie 원본 디버그) |
| `/estimate` | 정적 견적서 페이지 (데이터 소스 없음) |

---

## 엔드포인트별 상태

### DB 기반 (Neon + Drizzle)

| 엔드포인트 | 용도 |
|---|---|
| `/api/auth/{login,logout,me,register}` | JWT 세션 + HTTP-only 쿠키 |
| `/api/messages`, `/api/messages/[id]`, `/api/messages/unread-count` | 쪽지 + NavBar 뱃지 카운트 |
| `/api/admin/fighters`, `/api/admin/fighters/[id]`, `/api/admin/overrides` | 관리자 선수 수정 + 감사 로그 |
| `/api/mma-fighters`, `/api/mma-fighters/[id]` | 선수 목록/상세 (단체별 전적 집계 + fights 재계산 반영) |
| `/api/mma-events`, `/api/mma-events/[id]` | 이벤트 목록/상세 + 파이트 카드 |
| `/api/mma-vote` | GOAT 카테고리별 투표 (fingerprint, DB 기반 후보) |
| `/api/mma-comments`, `/api/mma-comments/report` | 폴리모픽 댓글 (post/fighter/event/fight) + 신고 |
| `/api/board`, `/api/board/[id]`, `/api/board/[id]/like` | 게시판 (익명 글 작성 + 이미지 업로드 가능) |

### 외부 API 프록시

| 엔드포인트 | 외부 서비스 | Fallback |
|---|---|---|
| `/api/translate` | DeepL API | 환경변수 없으면 원문 echo (`translated_ok: false`) |
| `/api/upload` | Cloudinary 서명 생성 | 환경변수 없으면 501 |
| `/api/raw-data` | balldontlie MMA v1 | 진단/디버그 전용 프록시 |

---

## DB 스키마 (활성 테이블)

- `users` / `admin_overrides` — 인증 · 감사
- `messages` — 쪽지 (sender/receiver 소프트 삭제)
- `fighters` / `fighter_org_records` / `fights` / `mma_events` — MMA 코어 데이터 + 전적 재계산 기준
- `goat_votes` — GOAT 투표 (fingerprint + category)
- `board_posts` / `board_post_likes` — 게시판
- `mma_comments` / `mma_comment_reports` — 폴리모픽 댓글 + 신고 (3회 시 자동 숨김)
- `translations` — DeepL 캐시 (sha256 hash 키)

### 삭제 완료 (레거시)

- 초기 랭킹 MVP 테이블 (`categories`, `persons`, `votes`, `comments`): DB에는 아직 남아있으나 참조 없음. 다음 정리 작업에서 `DROP TABLE IF EXISTS` 예정.
- 삭제된 코드:
  - `/src/app/category/` · `/src/components/category-detail.tsx`
  - `/src/app/api/{fighters,events,categories,vote,comments}/`
  - `/src/lib/api/mma.ts` · `/src/lib/mock-data.ts` · `/src/lib/mock-store.ts`

---

## 자동 동기화 스크립트

`scripts/sync-balldontlie.ts`

- 실행: `pnpm sync:mma` (기본: fighters + events)
- fights 전용: `pnpm sync:mma:fights` 또는 `pnpm sync:mma -- --fights`
- 옵션: `--fighters`, `--events`, `--fights`, `--limit N` (최대 페이지 수), `--per-page N`
- 무료 티어 제한 준수: 요청 사이 13초 간격 (5 req/min)
- 업서트 키: `external_id`
- `/fights`는 balldontlie 유료 플랜 전용. 키가 열려 있으면 fights 동기화 + `fighter_org_records`/커리어 전적 재계산 수행
- 이벤트의 `league.abbreviation` 기준으로 `organizations` 자동 upsert

## 남은 과제

1. 레거시 DB 테이블 (`categories`, `persons`, `votes`, `comments`) DROP 마이그레이션 작성/적용
2. 전체 fighters/events/fights 실데이터 동기화 운영 스케줄 확정
3. 번역 (`full_name_ko`, `name_ko` 등) 배치 채우기 — DeepL 프록시 활용
