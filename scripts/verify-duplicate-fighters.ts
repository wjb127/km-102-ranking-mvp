/**
 * 영문 완전 중복 선수의 balldontlie 원본 비교.
 *
 * 읽기 전용이다. 병합/삭제 전에 외부 원본의 체급, 국적, 생년월일, 전적을 비교한다.
 * 실행: pnpm verify:fighter-duplicates
 */
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

loadEnv({ path: ".env.local" });
loadEnv();

const BASE_URL = "https://api.balldontlie.io/mma/v1";
const RATE_LIMIT_MS = 13_000;

const databaseUrl = process.env.DATABASE_URL;
const apiKey = process.env.BALLDONTLIE_API_KEY?.trim();

if (!databaseUrl) throw new Error("DATABASE_URL is not set.");
if (!apiKey) throw new Error("BALLDONTLIE_API_KEY is not set.");

const sql = postgres(databaseUrl, { prepare: false });

const TARGETS = [
  { name: "Aaron Phillips", ids: [117, 41235], externalIds: [9584, 15168] },
  { name: "Aaron Robinson", ids: [127, 41236], externalIds: [17625, 34938] },
  { name: "Bruno da Silva", ids: [14900, 14901], externalIds: [40832, 32349] },
  { name: "Dustin West", ids: [13935, 18757], externalIds: [41709, 40425] },
] as const;

type ApiFighter = {
  id: number;
  name: string;
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
  active: boolean | null;
  weight_class?: { name: string | null; abbreviation: string | null; gender: string | null } | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFighter(externalId: number): Promise<ApiFighter | null> {
  const res = await fetch(`${BASE_URL}/fighters/${externalId}`, {
    headers: { Authorization: apiKey! },
  });

  if (!res.ok) {
    console.error(`[external_id=${externalId}] API 실패: ${res.status} ${res.statusText}`);
    return null;
  }

  const json = (await res.json()) as { data?: ApiFighter };
  return json.data ?? null;
}

async function main() {
  for (const target of TARGETS) {
    const dbRows = await sql`
      SELECT
        id,
        external_id,
        full_name,
        full_name_ko,
        nationality,
        weight_class,
        birth_date,
        height_cm,
        reach_cm,
        career_wins || '-' || career_losses || '-' || career_draws AS record
      FROM fighters
      WHERE id = ANY(${target.ids})
      ORDER BY id;
    `;

    console.log(`\n=== ${target.name} ===`);
    console.log("[DB]");
    console.table(dbRows);

    const apiRows = [];
    for (const externalId of target.externalIds) {
      const fighter = await fetchFighter(externalId);
      if (fighter) {
        apiRows.push({
          external_id: fighter.id,
          name: fighter.name,
          nickname: fighter.nickname,
          nationality: fighter.nationality,
          birth_place: fighter.birth_place,
          date_of_birth: fighter.date_of_birth,
          weight_class: fighter.weight_class?.name ?? null,
          height_inches: fighter.height_inches,
          reach_inches: fighter.reach_inches,
          weight_lbs: fighter.weight_lbs,
          stance: fighter.stance,
          record: `${fighter.record_wins ?? 0}-${fighter.record_losses ?? 0}-${fighter.record_draws ?? 0}`,
          active: fighter.active,
        });
      }
      await sleep(RATE_LIMIT_MS);
    }

    console.log("[balldontlie]");
    console.table(apiRows);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
