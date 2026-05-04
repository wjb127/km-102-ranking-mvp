# /goal 프롬프트 — MMA 팬덤 웹 벤치마킹 기반 기능 구현 루프

Codex CLI `/goal` 또는 Claude Code `/loop`에 그대로 붙여넣어 사용.

---

## 사용법

```bash
# Codex
/goal <아래 OBJECTIVE 블록 전체 붙여넣기>

# Claude Code
/loop <아래 OBJECTIVE 블록 전체 붙여넣기>
```

---

## OBJECTIVE (붙여넣기 본문)

```
프로젝트: km-102-ranking-mvp (Next.js 16 App Router + TS + Tailwind 4 + Drizzle/Neon + SWR + pnpm)
워킹디렉토리: /Users/seungbeenwi/Project/km-102-ranking-mvp/.claude/worktrees/contract-audit-fix

목표: docs/IMPLEMENTATION_TODO.md + docs/BENCHMARK_RESEARCH_4.md + docs/IDEA_BRAINSTORM_BENCHMARK.md 기준으로
"한국 MMA 팬덤 1번" 핵심 5축(Sherdog 데이터 + Tapology 게임화 + Transfermarkt 1클릭 투표 + Letterboxd 다이어리/소셜 + FMKorea/r/MMA 메가스레드)을 충족하도록
Phase 1~3 항목을 우선순위대로 구현하고 자체 검증한다.

레퍼런스 사이트 → 기능 매핑(이 매핑이 단일 진실. 구현마다 어느 레퍼런스를 모방한 것인지 PR 본문에 명시):

[A. 데이터/표시]
- Sherdog Fight Finder → 전적 표 6필드(상대/날짜/방식/라운드/시간/이벤트). 상대 클릭→프로필 이동
- ESPN Fightcenter → 라이브 라운드 점수 위젯, 메인/프렐림 토글
- Transfermarkt → 1클릭 투표 위젯(비로그인 read-only)
- Wikipedia → 인포박스 컴포넌트(키-값 sticky)
- BoxRec → 권위 있는 데이터 인용 + 출처 1개 이상 의무
- BJJ Heroes → 계보/사제관계 그래프(체육관/스승/제자)

[B. 게임화/락인]
- Tapology → 픽엠(정답 50점, 방식/라운드 보너스), 흰띠→검은띠 사용자 등급
- Letterboxd → 경기 후 즉시 평점 1-5 + 한줄평, 다이어리/리스트
- RYM → 평점 분포 시각화, 리스트 큐레이션
- IMDb → 사용자 평점 가중 평균 + 평점수 표시

[C. 커뮤니티]
- FMKorea/Theqoo → 메가스레드, 댓글 트리(깊이 1)
- Naver Cafe → 등급제, 출석 보상
- r/MMA → 업/다운 투표, 정렬(Hot/New/Top)
- Reddit AMA → 정기 AMA 인터뷰

[D. 미디어/콘텐츠]
- MMA Fighting → 장문 + 팟캐스트 임베드, 정기 시리즈
- MMA Junkie → 데일리 정기 코너(요일 픽스)
- FotMob → 모바일 퍼스트, 라이브 푸시 알림
- The Athletic → 프리미엄 구독 콘텐츠

[E. 검색/네비]
- Letterboxd cmd+K → 인스턴트 통합 검색(선수/이벤트/체급)

------------------------------------------------------------
구현 큐 (우선순위, 완료 시 다음으로 자동 이동)
------------------------------------------------------------

[즉시 후속 — 30분~1h 단위]
S1. /fighters 리스트에 ResultChip/MethodChip 적용 (지금은 상세만)
S2. /events/[id] 파이트 결과에도 동일 칩 적용
S3. ThemeToggle 위치를 헤더 안으로 이동 (모바일 컨텐츠 가림 해소)
S4. 칩 size="md" 변형을 선수 상세 헤더 메인 전적에 사용

[Phase 1 — 와우 부스트]
P1-1. 스파크라인 폼 그래프(최근 5경기 W/L 미니 차트) — 레퍼런스: Letterboxd 별점 분포
P1-2. 선수 비교 모드(2명 선택→사이드바이사이드 스탯) — 레퍼런스: Transfermarkt
P1-3. GOAT 보팅 결과 막대그래프 % — 레퍼런스: RYM 분포
P1-6. cmd+K 인스턴트 검색 팔레트 — 레퍼런스: Letterboxd
P1-7. Sherdog 6필드 전적 표 정렬/필터 강화

[Phase 2 — 락인 엔진]
P2-1. 선수/이벤트 즐겨찾기 — 레퍼런스: Letterboxd
P2-2. 즐겨찾기 선수 D-7/D-1 알림(web push 또는 ntfy) — 레퍼런스: FotMob
P2-3. 댓글 좋아요/대댓글 깊이 1 — 레퍼런스: Theqoo
P2-4. 주간 P4P 변동 추이 히스토리
P2-5. 경기 후 즉시 평점 1-5 + 한줄평 — 레퍼런스: RYM/Letterboxd

[Phase 3 — 수익화]
P3-1. 베팅 픽 공유 + 적중률 리더보드 — 레퍼런스: Tapology
P3-2. Pro 구독(광고 제거 + 고급 스탯) — 레퍼런스: The Athletic
P3-3. 광고 슬롯(게시판 5번째, 상세 본문 중간) — 레퍼런스: ESPN
P3-4. PPV/굿즈 어필리에이트
P3-5. 정확 픽 스트릭 뱃지

[기술 부채]
TD-1. SWR 키 컨벤션 통일
TD-2. Drizzle ↔ TS 타입 자동 동기화
TD-3. next/image + AVIF 적용
TD-4. Playwright 골든패스 5종
TD-5. sitemap.ts/robots.ts SEO 정비

------------------------------------------------------------
턴 루프 규칙 (매 턴마다 따른다)
------------------------------------------------------------

1. 큐 최상단 1개 항목 선택
2. 사전 검증: pwd + git remote -v 로 올바른 워크트리 확인
3. 구현 — 요청 범위만, 과잉 엔지니어링 금지
4. 자체 검증 (반드시 모두 통과해야 다음 항목 진행):
   a) pnpm build 그린
   b) TypeScript 에러 0
   c) 변경 라우트 dev 서버 + Playwright MCP로 시각 확인 (모바일 375 + 데스크탑 1280 둘 다)
   d) 콘솔 에러/경고 0
5. 한글 커밋 — 메시지 형식: "feat(<scope>): <기능> (ref: <레퍼런스사이트>)"
6. 사용자 승인 후 푸시 (절대 무단 푸시 금지). 승인 대기 동안 다음 항목 사전 조사 가능
7. 푸시 완료 후 ntfy 알림 1회 (CLAUDE.md 규칙 따름)
8. 다음 큐 항목으로 이동

------------------------------------------------------------
완료 기준
------------------------------------------------------------
- 즉시 후속 S1~S4 + Phase 1 전 항목 머지
- 각 PR/커밋 본문에 레퍼런스 사이트 명시 + 비포/애프터 스크린샷
- docs/IMPLEMENTATION_TODO.md 체크박스 갱신
- 클라이언트 데모 시나리오 3분 영상 시연 가능 상태

------------------------------------------------------------
중단 조건
------------------------------------------------------------
- pnpm build 2회 연속 실패 → 일시정지하고 사용자 보고
- DROP TABLE / DELETE FROM 등 파괴적 SQL 필요 → 즉시 정지하고 사용자에게 SQL 제시
- 외부 API 키/유료 서비스 신규 가입 필요 → 정지하고 사용자 확인
- 디자인 회귀 의심 (히어로 사이즈/레이아웃 그리드 변경) → 정지하고 비포 스크린샷 첨부 후 확인

------------------------------------------------------------
지켜야 할 글로벌 규칙 (CLAUDE.md 발췌)
------------------------------------------------------------
- pnpm 전용 (npm 금지)
- 코드 주석 한국어, 커밋 메시지 한국어
- service_role 키는 API Route에서만
- 수평 스크롤 레이아웃 금지
- ConsultBar/FloatingCTA z-50+
- 환경변수 null 체크 필수
- 프로젝트 컨텍스트 검증(pwd + git remote -v) 필수
- 무단 푸시 금지, 빌드 통과 후에만 커밋
```

---

## 검증 체크리스트 (각 항목 머지 직전)

| 항목 | 통과 기준 |
|------|----------|
| 빌드 | `pnpm build` 그린, warning 0 |
| 타입 | `tsc --noEmit` 0 에러 |
| 레퍼런스 일치 | 구현이 매핑한 레퍼런스 사이트의 핵심 UX 패턴을 실제 따라했는지 비포/애프터 비교 |
| 모바일 | 375px 뷰포트에서 깨짐 없음 |
| 다크/라이트 | 두 테마 모두 색상칩/대비 정상 |
| 콘솔 | 브라우저 콘솔 에러/경고 0 |
| 접근성 | aria-label, 키보드 포커스 가능 |
| 성능 | Lighthouse Mobile Performance 85+ |

---

## 메모

- Codex `/goal`은 0.128.0에서 `goals` 플래그 활성 필요 (`codex features enable goals`)
- 토큰 버짓 충분히 잡고 시작 권장 (Phase 1 전체 ~50k 추정)
- 중간 일시정지: `/goal pause` / 재개: `/goal resume` / 종료: `/goal clear`
