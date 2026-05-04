import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { sql, desc } from "drizzle-orm";
import { db } from "../src/db";
import { fighters } from "../src/db/schema";

async function main() {
  const rows = await db
    .select({
      id: fighters.id,
      name: fighters.fullName,
      wins: fighters.careerWins,
      losses: fighters.careerLosses,
      nationality: fighters.nationality,
    })
    .from(fighters)
    .where(sql`${fighters.fullNameKo} IS NULL OR ${fighters.fullNameKo} = ''`)
    .orderBy(desc(sql`${fighters.careerWins} + ${fighters.careerLosses}`))
    .limit(200);

  for (const r of rows) {
    const total = (r.wins ?? 0) + (r.losses ?? 0);
    console.log(`${r.name}\t${total}전\t${r.nationality ?? "-"}`);
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
