# 운영 인수 자료 (계약서 제5조 ① 산출물)

본 문서는 MMA 분석 커뮤니티 웹사이트 계약 산출물의 운영 인수용 종합 가이드다.
배포 URL, 외부 서비스 인수 절차, 환경 변수 명세, 관리자 페이지 사용법을 한 곳에 모았다.

---

## 1. 배포 URL · 저장소

| 항목 | 주소 |
| --- | --- |
| Production | https://km-102-ranking-mvp.vercel.app (Vercel 기본 도메인. 인수 시 클라이언트 커스텀 도메인 연결) |
| 최신 배포 | https://km-102-ranking-h9sp8pswp-seungbeen-wis-projects.vercel.app |
| Preview | Vercel PR 자동 빌드 |
| Git 저장소 | https://github.com/wjb127/km-102-ranking-mvp (master 브랜치) |
| Vercel 프로젝트 | seungbeen-wis-projects/km-102-ranking-mvp (`prj_eH4ojoyzp2rc7j5VLVgEMBZBrdsV`) |
| 스테이징 | 별도 환경 미사용 (Preview = 스테이징) |

배포 명령: `git push origin master` → Vercel 자동 배포.
수동 배포: Vercel 대시보드 → Deployments → Redeploy.

---

## 2. 외부 서비스 인수 절차

다음 계정/키를 클라이언트 명의로 이전 후 환경변수만 교체하면 동일하게 동작한다.

### 2-1. Neon (PostgreSQL)
- 콘솔: https://console.neon.tech
- 인수: 클라이언트 이메일을 프로젝트 멤버로 추가 → Owner 권한 이전 → 기존 계정 제거
- 백업: Branching 기능으로 매일 스냅샷 자동 생성. 추가 백업은 `pg_dump $DATABASE_URL > backup.sql`
- 환경변수: `DATABASE_URL` (Pooled connection 문자열 복사)

### 2-2. Vercel (배포)
- 콘솔: https://vercel.com
- 인수: 팀 또는 Hobby 계정 이전 (팀 권장). 도메인은 Vercel → Project → Domains에서 연결
- 환경변수 설정: Project → Settings → Environment Variables (Production / Preview / Development 각각)

### 2-3. Cloudinary (이미지 업로드)
- 콘솔: https://cloudinary.com/console
- 인수: 콘솔 → Settings → Account → Change owner email
- 환경변수: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 2-4. balldontlie MMA API (외부 데이터 소스)
- 콘솔: https://www.balldontlie.io/account
- 요금제: ALL-STAR 이상 (MMA 엔드포인트 접근). 결제 카드 클라이언트 명의로 변경
- 환경변수: `BALLDONTLIE_API_KEY`

### 2-5. Anthropic API (LLM 한국어 음차)
- 콘솔: https://console.anthropic.com
- 사용처: `scripts/llm-translate-*.ts` 일괄 번역 스크립트. 운영 중 직접 호출은 없음 (필요 시 수동 실행)
- 환경변수: `ANTHROPIC_API_KEY`

### 2-6. DeepL API (대체 번역)
- 콘솔: https://www.deepl.com/pro-api (무료 티어 50만자/월)
- 사용처: `scripts/translate-batch.ts`
- 환경변수: `DEEPL_API_KEY`

---

## 3. 환경 변수 명세

| 키 | 필수 | 설명 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon Pooled connection |
| `BALLDONTLIE_API_KEY` | ✅ | MMA API 키 |
| `CRON_SECRET` | ✅ | Vercel Cron 호출 인증용 (임의 32자 문자열) |
| `JWT_SECRET` | ✅ | 세션 토큰 서명 키 |
| `CLOUDINARY_CLOUD_NAME` | ✅ | 이미지 업로드 (게시글) |
| `CLOUDINARY_API_KEY` | ✅ | 〃 |
| `CLOUDINARY_API_SECRET` | ✅ | 〃 |
| `ANTHROPIC_API_KEY` | ⚠ | 일괄 번역 스크립트 (운영 필수 아님) |
| `DEEPL_API_KEY` | ⚠ | 〃 |
| `NEXT_PUBLIC_SITE_URL` | ⚠ | OG 메타·사이트맵 |

`.env.local.example` 파일을 복사해 `.env.local`로 사용. Vercel에는 대시보드에서 동일 키 등록.

---

## 4. Vercel Cron (자동 동기화)

`vercel.json` 정의:
- 매일 18:00 UTC: `/api/cron/sync-mma` (선수·이벤트 최신 5페이지)
- 매주 일요일 19:00 UTC: `/api/cron/sync-fights` (경기 결과 최신 5페이지 + 전적 재계산)

수동 트리거 (관리자):
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
     "https://<domain>/api/cron/sync-mma"
```

전체 풀 sync (수개월 1회 권장):
```bash
# 로컬에서 직접 실행
pnpm exec tsx scripts/sync-mma-full.ts
```

---

## 5. 관리자 페이지 사용법

`/admin` 경로 접근 (role=admin 사용자만). 사이드바 메뉴:

| 메뉴 | 경로 | 기능 |
| --- | --- | --- |
| 대시보드 | `/admin` | 가입자 수, 게시글, 신고 통계 |
| 회원 관리 | `/admin/users` | 회원 검색/밴/role 변경 |
| 선수 수정 | `/admin/fighters` | 선수 한국어 표기·체급·키·국적 보정 |
| 선수 전적 | `/admin/fighters/[id]` | 단체별 W/L/D/NC 합계 직접 보정 (감사 로그) |
| 경기 보정 | `/admin/fights` | 승자·결과·방법·라운드·시간·무효 보정 (감사 로그) |
| 게시글 관리 | `/admin/posts` | 신고 누적 게시글 숨김/복구 |
| 신고 처리 | `/admin/reports` | 댓글 신고 검토 → 삭제 또는 무시 |
| 보정 이력 | `/admin/overrides` | `admin_overrides` 테이블 전체 감사 로그 |

### 관리자 권한 부여
처음 1명은 SQL로 직접 부여:
```sql
UPDATE users SET role = 'admin' WHERE email = '<관리자_이메일>';
```
이후 `/admin/users`에서 다른 사용자에게 부여 가능.

### 신고 자동 숨김 임계값
- 댓글: 3회 신고 → `is_deleted = true`
- 게시글: 5회 신고 → `hidden_by_admin = true`

관리자가 `/admin/reports`에서 사실 확인 후 영구 처리 또는 복구.

---

## 6. 데이터베이스 마이그레이션

신규 컬럼/테이블 추가 시 `db/migrations/` 디렉토리에 SQL 파일 추가 후
```bash
psql "$DATABASE_URL" -f db/migrations/000X_xxx.sql
```

현재 마이그레이션:
- `0001_fighter_career_fields.sql`
- `0002_add_missing_api_fields.sql`
- `0003_admin_profile.sql`
- `0004_board_post_reports.sql`

---

## 7. 로컬 개발

```bash
pnpm install
cp .env.local.example .env.local   # 키 채우기
pnpm dev   # http://localhost:3000
```

빌드 검증:
```bash
pnpm build
```

---

## 8. 문의 / 인수인계 체크리스트

- [ ] Vercel 프로젝트 클라이언트 팀으로 이전
- [ ] Neon 프로젝트 Owner 변경
- [ ] Cloudinary 계정 이메일 변경
- [ ] balldontlie 결제 카드 변경
- [ ] GitHub 저장소 권한 부여 (admin)
- [ ] 도메인 DNS 변경 + SSL 자동 발급 확인
- [ ] 관리자 계정 생성 후 로그인 시연
- [ ] Cron 1회 수동 트리거 후 동작 확인
