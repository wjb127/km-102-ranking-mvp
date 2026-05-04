# MMA 분석 커뮤니티

Next.js 16 + TypeScript + Tailwind CSS + Drizzle ORM + Neon PostgreSQL.
선수/이벤트/경기 자동 동기화, 한국어 음차, 검색, GOAT 투표, 게시판, 댓글, 신고, 관리자 보정 기능 포함.

## 빠른 시작

```bash
pnpm install
cp .env.local.example .env.local   # Neon, Cloudinary, balldontlie 키 입력
pnpm dev                           # http://localhost:3000
```

빌드 검증:
```bash
pnpm build
```

## 주요 디렉토리

```
src/app/            # Next.js App Router 라우트
src/app/admin/      # 관리자 페이지 (회원/선수/경기/신고 보정)
src/app/api/        # REST 엔드포인트 + 인증/CRON/관리자 API
src/lib/mma-sync.ts # balldontlie API 페이지네이션 동기화
src/db/schema.ts    # Drizzle 스키마 (Neon Postgres)
db/migrations/      # 수동 SQL 마이그레이션
scripts/            # 일괄 번역·수동 sync 스크립트
docs/HANDOVER.md    # 운영 인수 자료 (배포 URL, 외부 서비스, 관리자 가이드)
```

## 운영 인수

`docs/HANDOVER.md` 참고 — 계약서 제5조 ① 산출물 일체 (배포 URL, 외부 계정 인수 절차, 환경변수, 관리자 사용 가이드, Vercel Cron, 마이그레이션, 인수 체크리스트).

## 기술 스택

- Next.js 16 App Router (Turbopack)
- TypeScript / Tailwind CSS 4 / Lucide / Framer Motion
- Drizzle ORM + Neon Postgres (Pooled)
- 인증: 자체 JWT 세션 (`src/lib/auth/`)
- 이미지: Cloudinary (서명 업로드)
- 외부 데이터: balldontlie MMA API
- 번역: Anthropic Claude Haiku 4.5 (음차 일괄), DeepL (보조)
- 배포: Vercel (Cron 포함)
