/**
 * balldontlie MMA API → Neon DB 동기화 CLI
 *
 * 실행:
 *   pnpm sync:mma                           # 기본: fighters + events 전체
 *   pnpm sync:mma -- --fighters --events    # 특정 타깃만
 *   pnpm sync:mma -- --fights                # 파이트(전체 페이지 강제)
 *   pnpm sync:mma -- --limit 5               # 최대 5페이지
 *
 * 코어 로직은 src/lib/mma-sync.ts 에서 import.
 * Vercel Cron(/api/cron/sync-mma)도 같은 함수 사용.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { runMmaSync } from "../src/lib/mma-sync";

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

async function main() {
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

  try {
    const summary = await runMmaSync({
      fighters: runFighters,
      events: runEvents,
      fights: runFights,
      maxPages: PAGE_LIMIT,
      perPage: PER_PAGE,
      log: (msg) => console.log(msg),
    });

    const elapsed = Math.round(summary.elapsedMs / 1000);
    console.log(
      `\n완료 (소요 ${elapsed}초) - fighters=${summary.fightersCount} events=${summary.eventsCount} fights=${summary.fightsCount}`
    );
    process.exit(0);
  } catch (error) {
    console.error("\n동기화 실패:", error);
    process.exit(1);
  }
}

main();
