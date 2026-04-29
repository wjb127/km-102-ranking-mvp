import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();
import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function run() {
  const q = process.argv[2] ?? "";
  const rows = await db.execute(sql`
    SELECT id, full_name, full_name_ko, nickname, nickname_ko, weight_class
    FROM fighters
    WHERE full_name ILIKE ${`%${q}%`} OR full_name_ko ILIKE ${`%${q}%`}
    LIMIT 30
  `);
  console.log((rows as unknown as { rows?: unknown[] }).rows ?? rows);
  process.exit(0);
}
run();
