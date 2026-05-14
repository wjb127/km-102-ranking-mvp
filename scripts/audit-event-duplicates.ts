/**
 * 이벤트/경기 일정 중복 후보 감사 스크립트.
 *
 * 읽기 전용이다. 같은 일정이 외부 API에서 다른 external_id로 내려오는 케이스를 찾는다.
 * 실행: pnpm audit:event-duplicates
 */
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

loadEnv({ path: ".env.local" });
loadEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const sql = postgres(databaseUrl, { prepare: false });

async function printQuery(label: string, query: string) {
  const rows = await sql.unsafe(query);
  console.log(`\n=== ${label} (${rows.length}) ===`);
  if (rows.length === 0) {
    console.log("없음");
    return;
  }
  console.table(rows);
}

async function main() {
  await printQuery(
    "이름+날짜 완전 동일",
    `
      SELECT
        lower(name) AS normalized_name,
        event_date,
        count(*)::int AS duplicate_count,
        array_agg(id ORDER BY id)::text AS ids,
        array_agg(external_id ORDER BY id)::text AS external_ids,
        array_agg(name_ko ORDER BY id)::text AS names_ko
      FROM events
      WHERE event_date IS NOT NULL
      GROUP BY lower(name), event_date
      HAVING count(*) > 1
      ORDER BY duplicate_count DESC, event_date DESC
      LIMIT 50;
    `
  );

  await printQuery(
    "동일 날짜+장소 다중 이벤트",
    `
      SELECT
        event_date::date AS day,
        venue,
        count(*)::int AS event_count,
        array_agg(id ORDER BY event_date, id)::text AS ids,
        array_agg(external_id ORDER BY event_date, id)::text AS external_ids,
        array_agg(name ORDER BY event_date, id)::text AS names
      FROM events
      WHERE event_date IS NOT NULL
        AND venue IS NOT NULL
        AND event_date >= now() - interval '2 years'
      GROUP BY event_date::date, venue
      HAVING count(*) > 1
      ORDER BY day DESC
      LIMIT 50;
    `
  );

  await printQuery(
    "6시간 이내 같은 장소+유사 제목",
    `
      WITH normalized_events AS (
        SELECT
          id,
          external_id,
          name,
          name_ko,
          event_date,
          venue,
          regexp_replace(
            lower(name),
            '^(ufc|mvp mma|bellator|pfl|strikeforce|one|invicta)[ :.-]+',
            ''
          ) AS normalized_title
        FROM events
        WHERE event_date IS NOT NULL
          AND event_date >= now() - interval '2 years'
      )
      SELECT
        a.id AS id_a,
        b.id AS id_b,
        a.external_id AS external_id_a,
        b.external_id AS external_id_b,
        a.name AS name_a,
        b.name AS name_b,
        a.name_ko AS name_ko_a,
        b.name_ko AS name_ko_b,
        a.event_date AS event_date_a,
        b.event_date AS event_date_b,
        a.venue
      FROM normalized_events a
      JOIN normalized_events b
        ON a.id < b.id
       AND coalesce(a.venue, '') = coalesce(b.venue, '')
       AND abs(extract(epoch FROM (a.event_date - b.event_date))) <= 21600
       AND (
          a.normalized_title = b.normalized_title
          OR position(a.normalized_title IN b.normalized_title) > 0
          OR position(b.normalized_title IN a.normalized_title) > 0
       )
      ORDER BY greatest(a.event_date, b.event_date) DESC
      LIMIT 50;
    `
  );

  await printQuery(
    "다가오는 일정 스냅샷",
    `
      SELECT
        id,
        external_id,
        name,
        name_ko,
        event_date,
        venue
      FROM events
      WHERE event_date >= now()
      ORDER BY event_date, id
      LIMIT 50;
    `
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
