/**
 * balldontlie MMA API → Neon DB 동기화 스크립트
 *
 * 실행:
 *   pnpm sync:mma
 *   pnpm sync:mma -- --fighters --events --fights
 *
 * 기본 동작:
 *   - 별도 타깃 플래그가 없으면 fighters + events 만 동기화
 *   - fights 는 유료 플랜 전용이라 --fights 로 명시했을 때만 실행
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../src/db";
import {
  fighterOrgRecords,
  fighters,
  fights,
  mmaEvents,
  organizations,
} from "../src/db/schema";

const BASE_URL = "https://api.balldontlie.io/mma/v1";
const API_KEY = process.env.BALLDONTLIE_API_KEY ?? "";
const RATE_LIMIT_MS = 13_000;

const args = process.argv.slice(2);
const explicitTargets = new Set<"fighters" | "events" | "fights">();
if (args.includes("--fighters")) explicitTargets.add("fighters");
if (args.includes("--events")) explicitTargets.add("events");
if (args.includes("--fights")) explicitTargets.add("fights");

const hasExplicitTargets = explicitTargets.size > 0;
const runFighters = hasExplicitTargets ? explicitTargets.has("fighters") : true;
const runEvents = hasExplicitTargets ? explicitTargets.has("events") : true;
const runFights = hasExplicitTargets ? explicitTargets.has("fights") : false;

function argNumber(flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  const v = Number(args[i + 1]);
  return Number.isFinite(v) ? v : fallback;
}

const PAGE_LIMIT = argNumber("--limit", Infinity);
const PER_PAGE = argNumber("--per-page", 100);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type BDLMeta = { next_cursor?: number | string | null; per_page: number };
type BDLResponse<T> = { data: T[]; meta: BDLMeta };

interface BDLWeightClass {
  id: number;
  name: string;
  abbreviation: string | null;
  weight_limit_lbs: number | null;
  gender: string | null;
}

interface BDLLeague {
  id: number;
  name: string;
  abbreviation: string;
}

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
  record_wins: number | null;
  record_losses: number | null;
  record_draws: number | null;
  record_no_contests: number | null;
  active: boolean;
  weight_class?: BDLWeightClass | null;
}

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
  league: BDLLeague | null;
}

interface BDLFight {
  id: number;
  event: BDLEvent | null;
  fighter1: BDLFighter;
  fighter2: BDLFighter;
  winner: BDLFighter | null;
  weight_class: BDLWeightClass | null;
  is_main_event: boolean;
  is_title_fight: boolean;
  card_segment: string | null;
  fight_order: number | null;
  scheduled_rounds: number;
  result_method: string | null;
  result_method_detail: string | null;
  result_round: number | null;
  result_time: string | null;
  status: string | null;
}

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
      console.warn(`  [429] 레이트리밋 - ${wait / 1000}초 대기 후 재시도 (${attempt}/5)`);
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

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildFighterValues(fighter: BDLFighter) {
  const birthDate = fighter.date_of_birth ? fighter.date_of_birth.slice(0, 10) : null;
  const fullName =
    fighter.name ||
    `${fighter.first_name ?? ""} ${fighter.last_name ?? ""}`.trim() ||
    `fighter-${fighter.id}`;

  return {
    externalId: fighter.id,
    fullName,
    nickname: fighter.nickname,
    weightClass: fighter.weight_class?.name ?? null,
    nationality: fighter.nationality,
    birthDate,
    heightCm: inchToCm(fighter.height_inches),
    reachCm: inchToCm(fighter.reach_inches),
    careerWins: fighter.record_wins ?? 0,
    careerLosses: fighter.record_losses ?? 0,
    careerDraws: fighter.record_draws ?? 0,
    careerNoContests: fighter.record_no_contests ?? 0,
    isActive: fighter.active ?? true,
    weightLbs: fighter.weight_lbs ?? null,
    stance: fighter.stance ?? null,
    birthPlace: fighter.birth_place ?? null,
    gender: fighter.weight_class?.gender ?? null,
    weightClassAbbr: fighter.weight_class?.abbreviation ?? null,
    weightLimitLbs: fighter.weight_class?.weight_limit_lbs ?? null,
  };
}

function buildEventValues(event: BDLEvent, organizationId: number | null) {
  const venue =
    [event.venue_name, event.venue_city, event.venue_state].filter(Boolean).join(", ") || null;

  return {
    externalId: event.id,
    organizationId,
    name: event.name,
    shortName: event.short_name,
    eventDate: event.date ? new Date(event.date) : null,
    status: event.status,
    mainCardStart: event.main_card_start_time ? new Date(event.main_card_start_time) : null,
    prelimsStart: event.prelims_start_time ? new Date(event.prelims_start_time) : null,
    earlyPrelimsStart: event.early_prelims_start_time
      ? new Date(event.early_prelims_start_time)
      : null,
    venue,
    venueName: event.venue_name,
    venueCity: event.venue_city,
    venueState: event.venue_state,
    country: event.venue_country,
  };
}

const organizationCache = new Map<number, number>();
const fighterCache = new Map<number, number>();
const eventCache = new Map<number, { id: number; organizationId: number | null }>();

async function upsertOrganization(league: BDLLeague): Promise<number> {
  if (organizationCache.has(league.id)) return organizationCache.get(league.id)!;

  const slug = league.abbreviation.toLowerCase();
  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (existing) {
    organizationCache.set(league.id, existing.id);
    return existing.id;
  }

  const [inserted] = await db
    .insert(organizations)
    .values({ slug, name: league.name })
    .returning({ id: organizations.id });

  organizationCache.set(league.id, inserted.id);
  return inserted.id;
}

async function upsertFighter(fighter: BDLFighter): Promise<number> {
  if (fighterCache.has(fighter.id)) return fighterCache.get(fighter.id)!;

  const values = buildFighterValues(fighter);
  const updatePayload = {
    externalId: values.externalId,
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
  };

  const [existing] = await db
    .select({ id: fighters.id })
    .from(fighters)
    .where(eq(fighters.externalId, fighter.id))
    .limit(1);

  let row: { id: number };
  if (existing) {
    [row] = await db
      .update(fighters)
      .set(updatePayload)
      .where(eq(fighters.id, existing.id))
      .returning({ id: fighters.id });
  } else {
    const normalized = normalizeName(values.fullName);
    const [mergeCandidate] = await db
      .select({ id: fighters.id })
      .from(fighters)
      .where(
        and(
          isNull(fighters.externalId),
          sql`lower(${fighters.fullName}) = ${normalized}`
        )
      )
      .limit(1);

    if (mergeCandidate) {
      [row] = await db
        .update(fighters)
        .set(updatePayload)
        .where(eq(fighters.id, mergeCandidate.id))
        .returning({ id: fighters.id });
    } else {
      [row] = await db
        .insert(fighters)
        .values(values)
        .returning({ id: fighters.id });
    }
  }

  fighterCache.set(fighter.id, row.id);
  return row.id;
}

async function upsertEvent(event: BDLEvent): Promise<{ id: number; organizationId: number | null }> {
  if (eventCache.has(event.id)) return eventCache.get(event.id)!;

  const organizationId = event.league ? await upsertOrganization(event.league) : null;
  const values = buildEventValues(event, organizationId);
  const [row] = await db
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
    })
    .returning({ id: mmaEvents.id });

  const payload = { id: row.id, organizationId };
  eventCache.set(event.id, payload);
  return payload;
}

function classifyFight(fight: BDLFight): { result: string | null; isVoid: boolean } {
  const text = `${fight.status ?? ""} ${fight.result_method ?? ""} ${fight.result_method_detail ?? ""}`
    .toLowerCase()
    .trim();

  if (
    text.includes("cancel") ||
    text.includes("postpon") ||
    text.includes("scheduled") ||
    text.includes("upcoming")
  ) {
    return { result: null, isVoid: true };
  }

  if (text.includes("no contest") || text === "nc") {
    return { result: "NC", isVoid: false };
  }

  if (text.includes("draw")) {
    return { result: "DRAW", isVoid: false };
  }

  if (fight.winner) {
    return { result: "COMPLETED", isVoid: false };
  }

  return { result: null, isVoid: true };
}

function detectWinMethodBucket(method: string | null): "ko" | "sub" | "dec" | null {
  const text = (method ?? "").toLowerCase();
  if (!text) return null;
  if (text.includes("ko") || text.includes("tko") || text.includes("technical knockout")) {
    return "ko";
  }
  if (text.includes("submission") || text.includes("sub")) {
    return "sub";
  }
  if (text.includes("decision")) {
    return "dec";
  }
  return null;
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

    for (const fighter of res.data) {
      await upsertFighter(fighter);
      total++;
    }

    console.log(`  -> ${res.data.length}명 처리 (누적 ${total}명)`);
    cursor = res.meta.next_cursor;
    if (cursor == null) break;
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`=== 선수 동기화 완료: 총 ${total}명 ===`);
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

    for (const event of res.data) {
      await upsertEvent(event);
      total++;
    }

    console.log(`  -> ${res.data.length}개 처리 (누적 ${total}개)`);
    cursor = res.meta.next_cursor;
    if (cursor == null) break;
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`=== 이벤트 동기화 완료: 총 ${total}개 ===`);
}

async function rebuildFighterRecordsFromFights() {
  console.log("\n=== 선수 전적 재계산 시작 ===");

  const rows = await db.select().from(fights);
  const orgRecordMap = new Map<string, {
    fighterId: number;
    organizationId: number;
    wins: number;
    losses: number;
    draws: number;
    noContests: number;
    winsByKo: number;
    winsBySub: number;
    winsByDec: number;
  }>();

  const fighterTotals = new Map<number, {
    wins: number;
    losses: number;
    draws: number;
    noContests: number;
  }>();

  for (const fight of rows) {
    let applied = false;

    if (fight.organizationId && !fight.isVoid) {
      const ensureRecord = (fighterId: number, organizationId: number) => {
        const key = `${fighterId}:${organizationId}`;
        if (!orgRecordMap.has(key)) {
          orgRecordMap.set(key, {
            fighterId,
            organizationId,
            wins: 0,
            losses: 0,
            draws: 0,
            noContests: 0,
            winsByKo: 0,
            winsBySub: 0,
            winsByDec: 0,
          });
        }
        if (!fighterTotals.has(fighterId)) {
          fighterTotals.set(fighterId, {
            wins: 0,
            losses: 0,
            draws: 0,
            noContests: 0,
          });
        }
        return {
          org: orgRecordMap.get(key)!,
          total: fighterTotals.get(fighterId)!,
        };
      };

      const fighterA = ensureRecord(fight.fighterAId, fight.organizationId);
      const fighterB = ensureRecord(fight.fighterBId, fight.organizationId);

      if (fight.result === "DRAW") {
        fighterA.org.draws++;
        fighterB.org.draws++;
        fighterA.total.draws++;
        fighterB.total.draws++;
        applied = true;
      } else if (fight.result === "NC") {
        fighterA.org.noContests++;
        fighterB.org.noContests++;
        fighterA.total.noContests++;
        fighterB.total.noContests++;
        applied = true;
      } else if (fight.winnerId && (fight.winnerId === fight.fighterAId || fight.winnerId === fight.fighterBId)) {
        const winner = fight.winnerId === fight.fighterAId ? fighterA : fighterB;
        const loser = fight.winnerId === fight.fighterAId ? fighterB : fighterA;
        winner.org.wins++;
        loser.org.losses++;
        winner.total.wins++;
        loser.total.losses++;
        applied = true;

        const methodBucket = detectWinMethodBucket(fight.method);
        if (methodBucket === "ko") winner.org.winsByKo++;
        if (methodBucket === "sub") winner.org.winsBySub++;
        if (methodBucket === "dec") winner.org.winsByDec++;
      }
    }

    if (fight.isAppliedToRecord !== applied) {
      await db
        .update(fights)
        .set({ isAppliedToRecord: applied, updatedAt: new Date() })
        .where(eq(fights.id, fight.id));
    }
  }

  const orgRecordValues = [...orgRecordMap.values()];
  await db.transaction(async (tx) => {
    await tx.delete(fighterOrgRecords);

    if (orgRecordValues.length > 0) {
      await tx.insert(fighterOrgRecords).values(orgRecordValues);
    }

    for (const [fighterId, totals] of fighterTotals.entries()) {
      await tx
        .update(fighters)
        .set({
          careerWins: totals.wins,
          careerLosses: totals.losses,
          careerDraws: totals.draws,
          careerNoContests: totals.noContests,
          updatedAt: new Date(),
        })
        .where(eq(fighters.id, fighterId));
    }
  });

  console.log(
    `=== 선수 전적 재계산 완료: 전적 ${orgRecordValues.length}건 / 선수 ${fighterTotals.size}명 ===`
  );
}

async function syncFights() {
  console.log("\n=== 파이트 동기화 시작 ===");
  let cursor: string | number | null | undefined = undefined;
  let page = 0;
  let total = 0;

  while (page < PAGE_LIMIT) {
    page++;
    const params: Record<string, string> = { per_page: String(PER_PAGE) };
    if (cursor != null) params.cursor = String(cursor);

    console.log(`[fights] 페이지 ${page} 요청${cursor != null ? ` (cursor=${cursor})` : ""}`);
    const res = await fetchPage<BDLFight>("/fights", params);

    for (const fight of res.data) {
      if (!fight.event) continue;

      const event = await upsertEvent(fight.event);
      const fighterAId = await upsertFighter(fight.fighter1);
      const fighterBId = await upsertFighter(fight.fighter2);
      const winnerId = fight.winner ? await upsertFighter(fight.winner) : null;
      const classification = classifyFight(fight);

      await db
        .insert(fights)
        .values({
          externalId: fight.id,
          eventId: event.id,
          organizationId: event.organizationId,
          fighterAId,
          fighterBId,
          weightClass: fight.weight_class?.name ?? null,
          isTitleFight: fight.is_title_fight,
          isMainEvent: fight.is_main_event,
          winnerId,
          result: classification.result,
          method: fight.result_method_detail || fight.result_method,
          round: fight.result_round,
          time: fight.result_time,
          isVoid: classification.isVoid,
          isAppliedToRecord: false,
        })
        .onConflictDoUpdate({
          target: fights.externalId,
          set: {
            eventId: event.id,
            organizationId: event.organizationId,
            fighterAId,
            fighterBId,
            weightClass: fight.weight_class?.name ?? null,
            isTitleFight: fight.is_title_fight,
            isMainEvent: fight.is_main_event,
            winnerId,
            result: classification.result,
            method: fight.result_method_detail || fight.result_method,
            round: fight.result_round,
            time: fight.result_time,
            isVoid: classification.isVoid,
            updatedAt: new Date(),
          },
        });

      total++;
    }

    console.log(`  -> ${res.data.length}개 처리 (누적 ${total}개)`);
    cursor = res.meta.next_cursor;
    if (cursor == null) break;
    await sleep(RATE_LIMIT_MS);
  }

  console.log(`=== 파이트 동기화 완료: 총 ${total}개 ===`);
  await rebuildFighterRecordsFromFights();
}

async function main() {
  if (!API_KEY) {
    console.error("BALLDONTLIE_API_KEY 환경변수가 설정되지 않았습니다.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
    process.exit(1);
  }

  console.log("balldontlie -> Neon 동기화 시작");
  console.log(
    `  실행 대상: ${[
      runFighters && "fighters",
      runEvents && "events",
      runFights && "fights",
    ]
      .filter(Boolean)
      .join(", ")}`
  );
  console.log(`  per_page=${PER_PAGE}  page_limit=${PAGE_LIMIT === Infinity ? "∞" : PAGE_LIMIT}`);

  if (runFights && PAGE_LIMIT !== Infinity) {
    console.error("--fights 실행 시에는 --limit 을 사용할 수 없습니다. 부분 동기화로 전적 재계산이 깨질 수 있습니다.");
    process.exit(1);
  }

  const startedAt = Date.now();

  try {
    if (runFighters) await syncFighters();
    if (runEvents) {
      if (runFighters) await sleep(RATE_LIMIT_MS);
      await syncEvents();
    }
    if (runFights) {
      if (runFighters || runEvents) await sleep(RATE_LIMIT_MS);
      await syncFights();
    }
  } catch (error) {
    console.error("\n동기화 실패:", error);
    process.exit(1);
  }

  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\n완료 (소요 ${elapsed}초)`);
  process.exit(0);
}

main();
