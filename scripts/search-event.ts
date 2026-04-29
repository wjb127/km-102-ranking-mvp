import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();
import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function run() {
  const q = process.argv[2] ?? "";
  // search events
  const ev = await db.execute(sql`
    SELECT id, name, name_ko, event_date, venue, venue_ko, country
    FROM events
    WHERE name ILIKE ${`%${q}%`} OR name_ko ILIKE ${`%${q}%`}
    LIMIT 20
  `);
  console.log("EVENTS:", (ev as unknown as { rows?: unknown[] }).rows ?? ev);

  // also search fights around Della Maddalena
  const fights = await db.execute(sql`
    SELECT f.id, f.event_id, e.name AS event_name, e.name_ko AS event_name_ko,
           fa.full_name AS a, fa.full_name_ko AS a_ko, fb.full_name AS b, fb.full_name_ko AS b_ko
    FROM fights f
    LEFT JOIN events e ON e.id = f.event_id
    LEFT JOIN fighters fa ON fa.id = f.fighter_a_id
    LEFT JOIN fighters fb ON fb.id = f.fighter_b_id
    WHERE fa.full_name ILIKE ${`%${q}%`} OR fb.full_name ILIKE ${`%${q}%`}
       OR fa.full_name_ko ILIKE ${`%${q}%`} OR fb.full_name_ko ILIKE ${`%${q}%`}
    LIMIT 20
  `);
  console.log("FIGHTS:", (fights as unknown as { rows?: unknown[] }).rows ?? fights);

  process.exit(0);
}
run();
