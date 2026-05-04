import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { fighters, mmaEvents } from "../src/db/schema";

async function main() {
  const total = await db.select({ c: sql<number>`COUNT(*)::int` }).from(fighters);
  const missingKo = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(fighters)
    .where(sql`${fighters.fullNameKo} IS NULL OR ${fighters.fullNameKo} = ''`);
  const missingNickKo = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(fighters)
    .where(sql`(${fighters.nickname} IS NOT NULL AND ${fighters.nickname} <> '') AND (${fighters.nicknameKo} IS NULL OR ${fighters.nicknameKo} = '')`);
  const missing5plus = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(fighters)
    .where(sql`(${fighters.fullNameKo} IS NULL OR ${fighters.fullNameKo} = '') AND (${fighters.careerWins} + ${fighters.careerLosses}) >= 5`);
  const missing10plus = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(fighters)
    .where(sql`(${fighters.fullNameKo} IS NULL OR ${fighters.fullNameKo} = '') AND (${fighters.careerWins} + ${fighters.careerLosses}) >= 10`);

  const totalEv = await db.select({ c: sql<number>`COUNT(*)::int` }).from(mmaEvents);
  const missingEvKo = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(mmaEvents)
    .where(sql`${mmaEvents.nameKo} IS NULL OR ${mmaEvents.nameKo} = ''`);
  const missingVenueKo = await db
    .select({ c: sql<number>`COUNT(*)::int` })
    .from(mmaEvents)
    .where(sql`(${mmaEvents.venue} IS NOT NULL AND ${mmaEvents.venue} <> '') AND (${mmaEvents.venueKo} IS NULL OR ${mmaEvents.venueKo} = '')`);

  console.log("=== Fighters ===");
  console.log(`전체:            ${total[0].c}`);
  console.log(`fullNameKo 누락: ${missingKo[0].c}  (${((missingKo[0].c / total[0].c) * 100).toFixed(1)}%)`);
  console.log(`  └ 5경기+:      ${missing5plus[0].c}`);
  console.log(`  └ 10경기+:     ${missing10plus[0].c}`);
  console.log(`nicknameKo 누락: ${missingNickKo[0].c}`);
  console.log("");
  console.log("=== Events ===");
  console.log(`전체:            ${totalEv[0].c}`);
  console.log(`nameKo 누락:     ${missingEvKo[0].c}  (${((missingEvKo[0].c / totalEv[0].c) * 100).toFixed(1)}%)`);
  console.log(`venueKo 누락:    ${missingVenueKo[0].c}`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
