/**
 * 시드 더미 정리 후 단독 5명 hydrate.
 * balldontlie GET /fighters/{id}로 최신 데이터 받아 UPSERT.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "../src/db";
import { fighters } from "../src/db/schema";
import { eq } from "drizzle-orm";

const API_KEY = process.env.BALLDONTLIE_API_KEY!;
const BASE = "https://api.balldontlie.io/mma/v1";

// 시드 → 진짜 external_id 매핑 (이미 DB에 적용됨, 여기서는 fetch만)
const TARGETS = [
  { id: 6, externalId: 9509, name: "Dricus Du Plessis" },
  { id: 9, externalId: 2, name: "Merab Dvalishvili" },
];

function inchToCm(inches: number | null | undefined): string | null {
  if (inches == null) return null;
  return (inches * 2.54).toFixed(2);
}

async function main() {
  for (const t of TARGETS) {
    const res = await fetch(`${BASE}/fighters/${t.externalId}`, {
      headers: { Authorization: API_KEY },
    });
    if (!res.ok) {
      console.error(`[${t.name}] fetch 실패: ${res.status}`);
      continue;
    }
    const json = await res.json();
    const f = json.data;
    if (!f) {
      console.error(`[${t.name}] 응답에 data 없음`);
      continue;
    }

    await db
      .update(fighters)
      .set({
        weightClass: f.weight_class?.name ?? null,
        nationality: f.nationality,
        birthDate: f.date_of_birth ? f.date_of_birth.slice(0, 10) : null,
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
      })
      .where(eq(fighters.id, t.id));

    console.log(`[${t.name}] hydrate 완료: ${f.record_wins}W ${f.record_losses}L`);
    await new Promise((r) => setTimeout(r, 13000)); // 무료 플랜 rate limit
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
