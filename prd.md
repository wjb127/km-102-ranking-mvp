# 인기투표 랭킹 서비스 — MVP PRD

## 서비스 개요

카테고리별 인물 인기 투표를 진행하고, 투표 수 기준 TOP10 랭킹을 보여주는 웹서비스.
로그인 없이 모든 기능 사용 가능하며, 카테고리/인물 등록은 관리자 승인제로 운영.

## 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS | SSR/SSG 혼합, App Router, 빠른 개발 |
| 상태관리 | SWR (실시간 폴링) | 1초 간격 refreshInterval로 실시간 랭킹 갱신 |
| 차트 | Recharts | 바 그래프 랭킹 시각화, React 네이티브 |
| Backend | Next.js Route Handlers | 별도 서버 불필요, Vercel Edge 최적화 |
| 인증 | JWT + 미들웨어 | 관리자 전용, 심플한 구조 |
| Database | Supabase PostgreSQL + Drizzle ORM | Pro 플랜($25/월), 8GB, 타입세이프 ORM |
| Storage | Supabase Storage | 이미지 업로드, CDN 기본 제공 |
| Hosting | Vercel | 자동 배포, 글로벌 CDN, 무료 플랜 |
| 투표 식별 | FingerprintJS (오픈소스) | 비로그인 사용자 식별, 중복 투표 방지 |
| 반응형 | 모바일 퍼스트 | 모바일 → md: 태블릿 → lg: 데스크탑 |

---

## 페이지 구조

### 1. 메인 페이지 (`/`)

| 기능 | 설명 |
|------|------|
| 검색 | 카테고리명 / 인물명 통합 검색 |
| 인기 카테고리 TOP3 | 총 투표수 기준 상위 3개 카테고리 카드 |
| 전체 카테고리 목록 | 총 투표수 기준 인기순 정렬, 무한스크롤 or 페이지네이션 |
| 카테고리 생성 신청 | 모달/폼으로 카테고리명 + 설명 입력 → 관리자 승인 대기 |

### 2. 카테고리 상세 페이지 (`/category/[slug]`)

| 기능 | 설명 |
|------|------|
| TOP10 랭킹 | 투표수 기준 상위 10명 바 그래프 표시 (Recharts), 동점 시 공동순위 |
| 실시간 갱신 | SWR 1초 폴링으로 자동 갱신 |
| 인물 투표 | 인물 카드에서 투표/취소 버튼, 즉시 반영 |
| 인물 검색 | 해당 카테고리 내 인물 검색 |
| 인물 생성 신청 | 이름, 사진, 국적, 간단 설명 입력 → 관리자 승인 대기 |
| 카테고리 댓글 | 카테고리 단위 댓글 작성/신고 |

### 3. 관리자 페이지 (`/admin`)

| 기능 | 설명 |
|------|------|
| 관리자 로그인 | JWT 기반 인증, 미들웨어 보호 |
| 카테고리 관리 | 생성 신청 승인/거절, 삭제 |
| 인물 관리 | 등록 신청 승인/거절, 수정, 삭제, 중복 정리 |
| 댓글 관리 | 신고된 댓글 확인, 삭제 |

---

## 핵심 기능 상세

### 투표 시스템

- **규칙**: 한 카테고리 내에서 여러 인물에게 각각 1표씩 투표 가능
- **중복 제한**: 같은 인물에게 중복 투표 불가 (person_id + voter_fingerprint unique)
- **취소**: 투표 취소 가능
- **반영**: 투표 즉시 반영, vote_count 비정규화 컬럼 ±1 업데이트
- **비로그인 투표 식별**: FingerprintJS로 브라우저 fingerprint 생성

```
예시 — 카테고리: 축구
손흥민 → 투표 가능 (1표) O
이강인 → 투표 가능 (1표) O
김민재 → 투표 가능 (1표) O
손흥민 → 중복 투표 X
```

### TOP10 랭킹

- 총 투표수 기준 상위 10명만 표시
- SWR 1초 폴링으로 자동 갱신 (WebSocket은 MVP에서 오버엔지니어링)
- 11위가 10위를 넘으면 자동 진입 (실시간 순위 변동)
- 동점 시 공동순위 처리
- Recharts 바 그래프로 시각화

### 카테고리 댓글

- 인물 단위가 아닌 **카테고리 단위** 댓글
- 댓글 작성 (닉네임 + 내용), writer_fingerprint 저장
- 댓글 신고 기능 (별도 reports 테이블, 사유 입력)
- report_count 일정 수 이상 시 자동 숨김 (is_hidden)
- 관리자 삭제

### 승인 시스템

- 카테고리 생성 → status: pending → 관리자 승인 후 approved
- 인물 등록 → status: pending → 관리자 승인 후 approved
- 승인 대기 상태 표시

---

## DB 스키마 (Supabase PostgreSQL + Drizzle ORM)

### categories

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| name | varchar(100) | 카테고리명 |
| slug | varchar(100) (unique) | URL용 슬러그 |
| description | text | 카테고리 설명 |
| thumbnail_url | varchar(500) | 카테고리 썸네일 이미지 |
| status | enum | `pending` / `approved` |
| total_votes | integer | 총 투표수 (비정규화 캐시) |
| created_at | timestamp | |

### persons

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| category_id | uuid (FK) | 소속 카테고리 |
| name | varchar(100) | 이름 |
| photo_url | varchar(500) | 사진 URL (Supabase Storage) |
| nationality | varchar(50) | 국적 |
| description | text | 간단 설명 |
| status | enum | `pending` / `approved` |
| vote_count | integer | 투표수 (비정규화 캐시) |
| created_at | timestamp | |

### votes

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| person_id | uuid (FK) | 투표 대상 인물 |
| voter_fingerprint | varchar(64) | FingerprintJS 브라우저 식별자 |
| created_at | timestamp | |
| **unique** | | (person_id, voter_fingerprint) |

### comments

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| category_id | uuid (FK) | 카테고리 |
| nickname | varchar(30) | 작성자 닉네임 |
| content | text | 댓글 내용 |
| report_count | integer | 신고 횟수 |
| is_hidden | boolean | 숨김 여부 |
| writer_fingerprint | varchar(64) | 작성자 fingerprint |
| created_at | timestamp | |

### reports

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| comment_id | uuid (FK) | 신고 대상 댓글 |
| reason | varchar(200) | 신고 사유 |
| reporter_fingerprint | varchar(64) | 신고자 fingerprint |
| created_at | timestamp | |

### admins

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| username | varchar(50) | 관리자 아이디 |
| password_hash | varchar(255) | 비밀번호 해시 (bcrypt) |
| created_at | timestamp | |

---

## 서비스 흐름

```
메인 페이지
├── 카테고리 검색 / 인기 TOP3
├── 카테고리 선택 → 카테고리 페이지
└── 카테고리 생성 신청 → 관리자 승인 대기

카테고리 페이지
├── TOP10 랭킹 (실시간 갱신)
├── 인물 목록
├── 투표 / 댓글 / 인물 등록
└── 즉시 반영, 1초 갱신

서버 처리
├── 중복 체크 (fingerprint)
├── 집계 갱신 (vote_count ±1)
└── 랭킹 반영 (실시간 업데이트, 동점 공동순위)
```

---

## 비로그인 사용자 처리

| 방식 | 설명 |
|------|------|
| **투표 식별** | FingerprintJS (오픈소스)로 브라우저 fingerprint 생성 → `voter_fingerprint`로 사용 |
| **장점** | IP 기반보다 정확 (공유 네트워크 문제 없음), 쿠키보다 삭제 어려움 |
| **한계** | 다른 브라우저/기기에서 중복 투표 가능 (MVP에서는 허용) |
| **향후 개선** | IP + fingerprint 조합, 또는 간편 로그인 도입 |

---

## 주요 기술 의사결정

| 의사결정 | 선택 | 대안 | 이유 |
|----------|------|------|------|
| 실시간 랭킹 | SWR 1초 폴링 | WebSocket / SSE | MVP에서 WebSocket은 오버엔지니어링. 폴링으로 충분하고 구현 간단 |
| 비로그인 투표 식별 | FingerprintJS | IP 기반 / 쿠키 | IP는 공유 네트워크 문제, 쿠키는 삭제 가능. Fingerprint가 가장 정확 |
| 이미지 저장 | Supabase Storage | Cloudinary / S3 | DB와 같은 플랫폼, 무료 1GB, 추가 설정 불필요 |
| 투표 수 집계 | 비정규화 (vote_count 컬럼) | 매번 COUNT 쿼리 | 1초 갱신에 COUNT(*)은 부하 큼. 투표 시 vote_count ±1 업데이트 |

---

## MVP 범위

### 포함

- [x] 메인 페이지 (검색, TOP3, 카테고리 목록)
- [x] 카테고리 상세 페이지 (TOP10 랭킹, 투표, 댓글)
- [x] 투표 시스템 (1인 1표, 취소, 즉시 반영, FingerprintJS)
- [x] 실시간 랭킹 갱신 (SWR 1초 폴링 + Recharts 바 그래프)
- [x] 카테고리/인물 생성 신청 + 관리자 승인
- [x] 관리자 페이지 (JWT 인증, 승인/거절, 댓글 관리)
- [x] 모바일 퍼스트 반응형
- [x] 이미지 업로드 (Supabase Storage)

### 미포함 (추후 확장)

- [ ] 소셜 로그인
- [ ] 어뷰징 방지 고도화 (IP + fingerprint 조합)
- [ ] 인물 상세 프로필 페이지
- [ ] 카테고리/인물 수정 신청
- [ ] 알림 시스템
- [ ] SEO 최적화 (sitemap, OG 태그 등)
- [ ] 공유 기능 (카카오, 트위터 등)
- [ ] 통계 대시보드

---

## API 엔드포인트 (Route Handlers)

### 카테고리

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/categories` | 전체 카테고리 목록 (approved만, 인기순) |
| GET | `/api/categories/[slug]` | 카테고리 상세 |
| POST | `/api/categories` | 카테고리 생성 신청 |

### 인물

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/categories/[slug]/persons` | 카테고리 내 인물 목록 (approved, 투표순) |
| POST | `/api/persons` | 인물 등록 신청 (이미지 업로드 포함) |

### 투표

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/votes` | 투표 (fingerprint 중복 체크) |
| DELETE | `/api/votes` | 투표 취소 |
| GET | `/api/votes/check` | 투표 여부 확인 (fingerprint 기반) |

### 댓글

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/categories/[slug]/comments` | 댓글 목록 (페이지네이션) |
| POST | `/api/comments` | 댓글 작성 |
| POST | `/api/comments/[id]/report` | 댓글 신고 (사유 입력) |

### 검색

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/search?q=` | 카테고리/인물 통합 검색 |

### 관리자

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/admin/login` | 관리자 로그인 (JWT 발급) |
| GET | `/api/admin/pending` | 승인 대기 목록 |
| PATCH | `/api/admin/categories/[id]` | 카테고리 승인/거절/삭제 |
| PATCH | `/api/admin/persons/[id]` | 인물 승인/거절/수정/삭제 |
| DELETE | `/api/admin/comments/[id]` | 댓글 삭제 |

---

## 개발 일정 (3주)

### WEEK 1 — 기반 구축 + 핵심 기능

- 프로젝트 초기 세팅 (Next.js 15, Drizzle ORM, Supabase)
- DB 스키마 설계 + 마이그레이션
- 카테고리 CRUD API
- 인물 CRUD API + 이미지 업로드
- 메인 페이지 UI
- 카테고리 페이지 UI

### WEEK 2 — 투표 + 랭킹 + 댓글

- 투표 API (중복 방지 로직)
- FingerprintJS 연동
- 실시간 TOP10 랭킹 (SWR 폴링)
- 랭킹 바 그래프 (Recharts)
- 댓글 시스템 (작성/신고)
- 검색 기능 구현

### WEEK 3 — 관리자 + QA + 배포

- 관리자 인증 (JWT)
- 관리자 대시보드 (승인/삭제)
- 신고 관리 + 댓글 삭제
- 반응형 디자인 최적화
- 전체 QA + 버그 수정
- Vercel 배포 + 도메인 연결

---

## 상세 견적 내역

| 항목 | 세부 내용 | 공수 | 금액 |
|------|----------|------|------|
| FE 메인 페이지 | 카테고리 목록, TOP3, 검색, 생성 폼 | 1일 | 15만원 |
| FE 카테고리 페이지 | 랭킹 그래프, 인물 목록, 투표 UI, 댓글 | 2일 | 25만원 |
| FE 관리자 페이지 | 로그인, 대시보드, 승인/삭제 관리 | 1일 | 15만원 |
| BE API 개발 | 카테고리/인물/투표/댓글/관리 API | 2일 | 30만원 |
| BE 인증 + 보안 | JWT, 미들웨어, Rate Limiting, Fingerprint | 1일 | 15만원 |
| DB 설계 + 세팅 | 스키마, 마이그레이션, 인덱스 최적화 | 1일 | 15만원 |
| 인프라 배포 + QA | Vercel 배포, 도메인, 반응형 QA, 버그 수정 | 2일 | 35만원 |
| **합계** | | **15일 (3주)** | **150만원** |

> *별도 비용: 도메인 구매비(연 1~2만원), 디자인 시안(기본 Tailwind UI 사용 시 무료). VAT 별도.*

---

## 운영 비용

| 항목 | 비용 |
|------|------|
| Supabase Pro | $25/월 (약 3.5만원) |
| Vercel | Free 플랜 (트래픽 증가 시 Pro $20/월 추가) |
| 도메인 | 연 1~2만원 |
