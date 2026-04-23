/**
 * balldontlie MMA API → Neon DB 동기화 스크립트
 *
 * 실행: pnpm sync:mma [--fighters] [--events] [--limit N]
 *
 * 옵션:
 *   --fighters         선수만 동기화
 *   --events           이벤트만 동기화
 *   --limit N          최대 N페이지까지만 가져옴 (디버그용)
 *   --per-page N       페이지당 레코드 (기본 100)
 *
 * 제한:
 *   - /fights 엔드포인트는 유료 구독 필요 (현재 키: 무료) → 스킵
 *   - 무료 티어 5 req/min → 요청 사이 13초 대기
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv(); // fallback .env

import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { fighters, mmaEvents, organizations } from "../src/db/schema";

// ── 설정 ──
const BASE_URL = "https://api.balldontlie.io/mma/v1";
const API_KEY = process.env.BALLDONTLIE_API_KEY ?? "";
const RATE_LIMIT_MS = 13_000; // 무료 5 req/min (13초 간격)

// ── CLI 인자 파싱 ──
const args = process.argv.slice(2);
const onlyFighters = args.includes("--fighters");
const onlyEvents = args.includes("--events");
const runFighters = !onlyEvents; // 기본: 둘 다
const runEvents = !onlyFighters;

function argNumber(flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  const v = Number(args[i + 1]);
  return Number.isFinite(v) ? v : fallback;
}

const PAGE_LIMIT = argNumber("--limit", Infinity);
const PER_PAGE = argNumber("--per-page", 100);

// ── 유틸 ──
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type BDLMeta = { next_cursor?: number | string | null; per_page: number };
type BDLResponse<T> = { data: T[]; meta: BDLMeta };

async function fetchPage<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<BDLResponse<T>> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url.toString(), {
      headers: { Authorization: API_KEY },
    });
    if (res.ok) return (await res.json()) as BDLResponse<T>;
    if (res.status === 429) {
      const wait = RATE_LIMIT_MS * attempt;
      console.warn(`  [429] 레이트리밋 — ${wait / 1000}초 대기 후 재시도 (${attempt}/5)`);
      await sleep(wait);
      continue;
    }
    throw new Error(`${endpoint} 실패: ${res.status} ${res.statusText}`);
  }
  throw new Error(`${endpoint} 레이트리밋 재시도 소진`);
}

function inchToCm(inches: number | null | undefined): string | null {
  if (inches == null) return null;
  return (inches * 2.54).toFixed(2);
}

// ── 조직 캐시 (league.id → organizations.id) ──
const orgCache = new Map<number, number>();

async function upsertOrganization(league: {
  id: number;
  name: string;
  abbreviation: string;
}): Promise<number> {
  if (orgCache.has(league.id)) return orgCache.get(league.id)!;

  const slug = league.abbreviation.toLowerCase();
  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (existing[0]) {
    orgCache.set(league.id, existing[0].id);
    return existing[0].id;
  }

  const [inserted] = await db
    .insert(organizations)
    .values({ slug, name: league.name })
    .returning({ id: organizations.id });
  orgCache.set(league.id, inserted.id);
  return inserted.id;
}

// ── 선수 타입 ──
interface BDLFighter {
  id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  date_of_birth: string | null;
  birth_place: string | null;
  nationality: string | null;
  height_inches: number | null;
  reach_inches: number | null;
  weight_lbs: number | null;
  stance: string | null;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  record_no_contests: number;
  active: boolean;
  weight_class?: {
    id: number;
    name: string;
    abbreviation: string;
    weight_limit_lbs: number | null;
    gender: string | null;
  };
}

async function syncFighters() {
  console.log("\n=== 선수 동기화 시작 ===");
  let cursor: string | number | null | undefined = undefined;
  let page = 0;
  let total = 0;

  while (page < PAGE_LIMIT) {
    page++;
    const params: Record<string, string> = { per_page: String(PER_PAGE) };
    if (cursor != null) params.cursor = String(cursor);

    console.log(`[fighters] 페이지 ${page} 요청${cursor != null ? ` (cursor=${cursor})` : ""}`);
    const res = await fetchPage<BDLFighter>("/fighters", params);

    for (const f of res.data) {
      const birthDate = f.date_of_birth ? f.date_of_birth.slice(0, 10) : null;
      const fullName =
        f.name || `${f.first_name ?? ""} ${f.last_name ?? ""}`.trim() || `fighter-${f.id}`;
      const values = {
        externalId: f.id,
        fullName,
        nickname: f.nickname,
        weightClass: f.weight_class?.name ?? null,
        nationality: f.nationality,
        birthDate,
        heightCm: inchToCm(f.height_inches),
        reachCm: inchToCm(f.reach_inches),
        careerWins: f.record_wins ?? 0,
        careerLosses: f.record_losses ?? 0,
        careerDraws: f.record_draws ?? 0,
        careerNoContests: f.record_no_contests ?? 0,
        isActive: f.active ?? true,
        weightLbs: f.weight_lbs ?? null,
        stance: f.stance ?? null,
        birthPlace: f.birth_place ?? null,
        gender: f.weight_class?.gender ?? null,
        weightClassAbbr: f.weight_class?.abbreviation ?? null,
        weightLimitLbs: f.weight_class?.weight_limit_lbs ?? null,
      };
      await db
        .insert(fighters)
        .values(values)
        .onConflictDoUpdate({
          target: fighters.externalId,
          set: {
            fullName: values.fullName,
            nickname: values.nickname,
            weightClass: values.weightClass,
            nationality: values.nationality,
            birthDate: values.birthDate,
            heightCm: values.heightCm,
            reachCm: values.reachCm,
            careerWins: values.careerWins,
            careerLosses: values.careerLosses,
            careerDraws: values.careerDraws,
            careerNoContests: values.careerNoContests,
            isActive: values.isActive,
            weightLbs: values.weightLbs,
            stance: values.stance,
            birthPlace: values.birthPlace,
            gender: values.gender,
            weightClassAbbr: values.weightClassAbbr,
            weightLimitLbs: values.weightLimitLbs,
            updatedAt: new Date(),
          },
        });
      total++;
    }

    console.log(`  → ${res.data.length}명 처리 (누적 ${total}명)`);

    cursor = res.meta.next_cursor;
    if (cursor == null) {
      console.log("  마지막 페이지");
      break;
    }
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`=== 선수 동기화 완료: 총 ${total}명 ===`);
}

// ── 이벤트 타입 ──
interface BDLEvent {
  id: number;
  name: string;
  short_name: string | null;
  date: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  venue_country: string | null;
  status: string | null;
  main_card_start_time: string | null;
  prelims_start_time: string | null;
  early_prelims_start_time: string | null;
  league: { id: number; name: string; abbreviation: string };
}

async function syncEvents() {
  console.log("\n=== 이벤트 동기화 시작 ===");
  let cursor: string | number | null | undefined = undefined;
  let page = 0;
  let total = 0;

  while (page < PAGE_LIMIT) {
    page++;
    const params: Record<string, string> = { per_page: String(PER_PAGE) };
    if (cursor != null) params.cursor = String(cursor);

    console.log(`[events] 페이지 ${page} 요청${cursor != null ? ` (cursor=${cursor})` : ""}`);
    const res = await fetchPage<BDLEvent>("/events", params);

    for (const e of res.data) {
      const orgId = e.league ? await upsertOrganization(e.league) : null;
      const venue = [e.venue_name, e.venue_city, e.venue_state].filter(Boolean).join(", ") || null;

      const values = {
        externalId: e.id,
        organizationId: orgId,
        name: e.name,
        shortName: e.short_name,
        eventDate: e.date ? new Date(e.date) : null,
        status: e.status,
        mainCardStart: e.main_card_start_time ? new Date(e.main_card_start_time) : null,
        prelimsStart: e.prelims_start_time ? new Date(e.prelims_start_time) : null,
        earlyPrelimsStart: e.early_prelims_start_time ? new Date(e.early_prelims_start_time) : null,
        venue,
        venueName: e.venue_name,
        venueCity: e.venue_city,
        venueState: e.venue_state,
        country: e.venue_country,
      };

      await db
        .insert(mmaEvents)
        .values(values)
        .onConflictDoUpdate({
          target: mmaEvents.externalId,
          set: {
            organizationId: values.organizationId,
            name: values.name,
            shortName: values.shortName,
            eventDate: values.eventDate,
            status: values.status,
            mainCardStart: values.mainCardStart,
            prelimsStart: values.prelimsStart,
            earlyPrelimsStart: values.earlyPrelimsStart,
            venue: values.venue,
            venueName: values.venueName,
            venueCity: values.venueCity,
            venueState: values.venueState,
            country: values.country,
          },
        });
      total++;
    }

    console.log(`  → ${res.data.length}개 처리 (누적 ${total}개)`);

    cursor = res.meta.next_cursor;
    if (cursor == null) {
      console.log("  마지막 페이지");
      break;
    }
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`=== 이벤트 동기화 완료: 총 ${total}개 ===`);
}

// ── 실행 ──
async function main() {
  if (!API_KEY) {
    console.error("❌ BALLDONTLIE_API_KEY 환경변수가 설정되지 않았습니다.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL 환경변수가 설정되지 않았습니다.");
    process.exit(1);
  }

  console.log("balldontlie → Neon 동기화 시작");
  console.log(`  per_page=${PER_PAGE}  page_limit=${PAGE_LIMIT === Infinity ? "∞" : PAGE_LIMIT}`);
  console.log(`  실행 대상: ${[runFighters && "fighters", runEvents && "events"].filter(Boolean).join(", ")}`);

  const started = Date.now();

  try {
    if (runFighters) await syncFighters();
    if (runEvents) {
      if (runFighters) await sleep(RATE_LIMIT_MS);
      await syncEvents();
    }
  } catch (err) {
    console.error("\n❌ 동기화 실패:", err);
    process.exit(1);
  }

  const elapsed = Math.round((Date.now() - started) / 1000);
  console.log(`\n✅ 완료 (소요 ${elapsed}초)`);
  process.exit(0);
}

main();
