/**
 * ufcstats.com → Neon DB 1회성 크롤링 스크립트
 *
 * 계약서 제2조 ② "선수 프로필 / 전적 (초기): ufcstats.com 1회성 크롤링" 이행용.
 * 알파벳 a~z 페이지를 순회하면서 선수 기본 정보(이름, 닉네임, 신체 정보, W/L/D)를 가져온다.
 * 이후 누적 갱신은 sync-balldontlie.ts가 담당한다.
 *
 * 실행:
 *   pnpm crawl:ufcstats               # 전체 a~z
 *   pnpm crawl:ufcstats -- --letters abc  # 특정 알파벳만
 *   pnpm crawl:ufcstats -- --dry-run  # DB 쓰기 없이 파싱만
 *
 * 동작:
 *   - 동일 fullName(대소문자 무시) 이미 있으면 SKIP (balldontlie 데이터 우선)
 *   - 새 선수만 insert. externalId는 null (balldontlie 정수 ID 충돌 방지)
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { fighters } from "../src/db/schema";

// ── 설정 ──
const BASE = "http://www.ufcstats.com/statistics/fighters";
const UA = "Mozilla/5.0 (compatible; mma-community-bot/1.0)";
const DELAY_MS = 1500; // 페이지 사이 1.5초 대기 (가벼운 부하)

// ── CLI ──
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const lettersArg = (() => {
  const i = args.indexOf("--letters");
  if (i === -1) return null;
  return args[i + 1] ?? null;
})();
const LETTERS = (lettersArg ?? "abcdefghijklmnopqrstuvwxyz").toLowerCase().split("");

// ── 유틸 ──
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function clean(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

// 키 정규화: 소문자 + 공백 압축 (중복 판별용)
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

// 키/몸무게/리치 변환
function feetInchesToCm(s: string): string | null {
  const m = s.match(/(\d+)'\s*(\d+)?/);
  if (!m) return null;
  const ft = parseInt(m[1], 10);
  const inch = m[2] ? parseInt(m[2], 10) : 0;
  return ((ft * 12 + inch) * 2.54).toFixed(2);
}

function inchesToCm(s: string): string | null {
  const m = s.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return (parseFloat(m[1]) * 2.54).toFixed(2);
}

function lbsToInt(s: string): number | null {
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function intOrZero(s: string): number {
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// ── 파싱 ──
interface ParsedFighter {
  firstName: string;
  lastName: string;
  fullName: string;
  nickname: string | null;
  heightCm: string | null;
  weightLbs: number | null;
  reachCm: string | null;
  stance: string | null;
  wins: number;
  losses: number;
  draws: number;
}

function parseLetterPage(html: string): ParsedFighter[] {
  const rows = html.match(/<tr class="b-statistics__table-row">[\s\S]*?<\/tr>/g) ?? [];
  const out: ParsedFighter[] = [];

  for (const row of rows) {
    // 헤더 행이나 빈 행 스킵
    if (row.includes("<th ")) continue;
    const cols = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
    if (!cols || cols.length < 10) continue;

    const cells = cols.map((c) => clean(c.replace(/<\/?td[^>]*>/g, "")));
    const [first, last, nick, ht, wt, reach, stance, w, l, d] = cells;

    const firstName = first;
    const lastName = last;
    const full = `${firstName} ${lastName}`.trim();
    if (!full) continue;

    out.push({
      firstName,
      lastName,
      fullName: full,
      nickname: nick && nick !== "" ? nick : null,
      heightCm: ht && ht !== "--" ? feetInchesToCm(ht) : null,
      weightLbs: wt && wt !== "--" ? lbsToInt(wt) : null,
      reachCm: reach && reach !== "--" ? inchesToCm(reach) : null,
      stance: stance && stance !== "" ? stance : null,
      wins: intOrZero(w),
      losses: intOrZero(l),
      draws: intOrZero(d),
    });
  }
  return out;
}

async function fetchLetter(letter: string): Promise<string> {
  const url = `${BASE}?char=${letter}&page=all`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return await res.text();
    if (res.status >= 500 || res.status === 429) {
      console.warn(`  [${res.status}] ${letter} 재시도 (${attempt}/3)`);
      await sleep(3000 * attempt);
      continue;
    }
    throw new Error(`${letter} 실패: ${res.status} ${res.statusText}`);
  }
  throw new Error(`${letter} 재시도 소진`);
}

// ── 기존 fullName 캐시 ──
async function loadExistingNames(): Promise<Set<string>> {
  const rows = await db.select({ fullName: fighters.fullName }).from(fighters);
  const set = new Set<string>();
  for (const r of rows) set.add(normalizeName(r.fullName));
  return set;
}

async function main() {
  if (!process.env.DATABASE_URL && !dryRun) {
    console.error("❌ DATABASE_URL 환경변수 없음 (--dry-run 으로 파싱만 가능)");
    process.exit(1);
  }

  console.log("ufcstats.com → Neon 1회성 크롤링 시작");
  console.log(`  letters=${LETTERS.join("")}  dryRun=${dryRun}`);

  const existing = dryRun ? new Set<string>() : await loadExistingNames();
  console.log(`  기존 선수 ${existing.size}명 (중복 SKIP 기준)`);

  const started = Date.now();
  let totalParsed = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const letter of LETTERS) {
    console.log(`\n[${letter}] 페이지 요청`);
    const html = await fetchLetter(letter);
    const parsed = parseLetterPage(html);
    console.log(`  → 파싱 ${parsed.length}명`);
    totalParsed += parsed.length;

    if (dryRun) {
      if (parsed[0]) console.log(`  샘플: ${JSON.stringify(parsed[0])}`);
      await sleep(DELAY_MS);
      continue;
    }

    let inserted = 0;
    let skipped = 0;
    for (const f of parsed) {
      const key = normalizeName(f.fullName);
      if (existing.has(key)) {
        skipped++;
        continue;
      }
      await db.insert(fighters).values({
        externalId: null,
        fullName: f.fullName,
        nickname: f.nickname,
        weightClass: null,
        nationality: null,
        birthDate: null,
        heightCm: f.heightCm,
        reachCm: f.reachCm,
        weightLbs: f.weightLbs,
        stance: f.stance,
        careerWins: f.wins,
        careerLosses: f.losses,
        careerDraws: f.draws,
        careerNoContests: 0,
        isActive: true,
      });
      existing.add(key);
      inserted++;
    }

    totalInserted += inserted;
    totalSkipped += skipped;
    console.log(`  → 신규 ${inserted}명 / SKIP ${skipped}명`);

    await sleep(DELAY_MS);
  }

  // 최종 카운트
  if (!dryRun) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(fighters);
    console.log(`\n=== fighters 총 ${count}명 ===`);
  }

  const elapsed = Math.round((Date.now() - started) / 1000);
  console.log(
    `\n✅ 완료: 파싱 ${totalParsed} / 신규 ${totalInserted} / SKIP ${totalSkipped} (${elapsed}초)`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ 크롤링 실패:", err);
  process.exit(1);
});
