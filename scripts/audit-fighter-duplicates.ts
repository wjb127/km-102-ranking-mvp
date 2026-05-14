/**
 * 선수 중복/음차 충돌 감사 스크립트.
 *
 * 읽기 전용이다. 실제 병합/삭제는 아래 출력의 참조 수를 확인한 뒤 별도 SQL로 처리한다.
 * 실행: pnpm tsx scripts/audit-fighter-duplicates.ts
 */
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

loadEnv({ path: ".env.local" });
loadEnv();

type QueryRow = Record<string, unknown>;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const sql = postgres(databaseUrl, { prepare: false });

async function printQuery(label: string, query: string) {
  const rows = (await sql.unsafe(query)) as QueryRow[];
  console.log(`\n=== ${label} (${rows.length}) ===`);
  if (rows.length === 0) {
    console.log("없음");
    return rows;
  }
  console.table(rows);
  return rows;
}

async function main() {
  await printQuery(
    "정찬성/Chan 계열 확인",
    `
      SELECT
        id,
        external_id,
        full_name,
        full_name_ko,
        nickname,
        career_wins || '-' || career_losses || '-' || career_draws AS record
      FROM fighters
      WHERE full_name_ko = '정찬성'
         OR full_name ILIKE 'Chan %'
      ORDER BY full_name;
    `
  );

  await printQuery(
    "검증된 영문 동명이인",
    `
      SELECT
        id,
        external_id,
        full_name,
        full_name_ko,
        nationality,
        weight_class,
        birth_date,
        career_wins || '-' || career_losses || '-' || career_draws AS record
      FROM fighters
      WHERE external_id IN (9584, 15168, 17625, 34938)
      ORDER BY lower(full_name), id;
    `
  );

  await printQuery(
    "영문명 완전 중복",
    `
      SELECT
        lower(full_name) AS normalized_name,
        count(*)::int AS duplicate_count,
        array_agg(id ORDER BY id)::text AS ids,
        array_agg(external_id ORDER BY id)::text AS external_ids,
        array_agg(coalesce(full_name_ko, 'NULL') ORDER BY id)::text AS korean_names,
        array_agg(career_wins || '-' || career_losses || '-' || career_draws ORDER BY id)::text AS records
      FROM fighters
      WHERE lower(full_name) NOT IN ('aaron phillips', 'aaron robinson')
      GROUP BY lower(full_name)
      HAVING count(*) > 1
      ORDER BY duplicate_count DESC, normalized_name;
    `
  );

  await printQuery(
    "영문명 완전 중복 row 참조 수",
    `
      WITH duplicate_names AS (
        SELECT lower(full_name) AS normalized_name
        FROM fighters
        GROUP BY lower(full_name)
        HAVING count(*) > 1
      )
      SELECT
        f.id,
        f.external_id,
        f.full_name,
        f.full_name_ko,
        f.career_wins || '-' || f.career_losses || '-' || f.career_draws AS record,
        (SELECT count(*)::int FROM fighter_org_records r WHERE r.fighter_id = f.id) AS org_records,
        (SELECT count(*)::int FROM fights m WHERE m.fighter_a_id = f.id OR m.fighter_b_id = f.id OR m.winner_id = f.id) AS fights,
        (SELECT count(*)::int FROM goat_votes v WHERE v.fighter_id = f.id) AS goat_votes,
        (SELECT count(*)::int FROM mma_comments c WHERE c.target_type = 'fighter' AND c.target_id = f.id) AS comments,
        (SELECT count(*)::int FROM admin_overrides o WHERE o.target_type = 'fighter' AND o.target_id = f.id) AS overrides
      FROM fighters f
      JOIN duplicate_names d ON d.normalized_name = lower(f.full_name)
      WHERE lower(f.full_name) NOT IN ('aaron phillips', 'aaron robinson')
      ORDER BY lower(f.full_name), f.id;
    `
  );

  await printQuery(
    "한글명 중복 상위 80",
    `
      SELECT
        full_name_ko,
        count(*)::int AS duplicate_count,
        array_agg(id ORDER BY career_wins DESC, id)::text AS ids,
        array_agg(full_name ORDER BY career_wins DESC, id)::text AS english_names,
        array_agg(career_wins || '-' || career_losses || '-' || career_draws ORDER BY career_wins DESC, id)::text AS records
      FROM fighters
      WHERE full_name_ko IS NOT NULL
        AND full_name_ko <> ''
      GROUP BY full_name_ko
      HAVING count(*) > 1
      ORDER BY duplicate_count DESC, max(career_wins) DESC, full_name_ko
      LIMIT 80;
    `
  );

  await printQuery(
    "Pereira/Ferreira 한글 충돌",
    `
      SELECT
        full_name_ko,
        count(*)::int AS duplicate_count,
        array_agg(id ORDER BY full_name)::text AS ids,
        array_agg(full_name ORDER BY full_name)::text AS english_names
      FROM fighters
      WHERE full_name ~* '(Pereira|Ferreira)'
        AND full_name_ko IS NOT NULL
        AND full_name_ko <> ''
      GROUP BY full_name_ko
      HAVING bool_or(full_name ILIKE '%Pereira%')
         AND bool_or(full_name ILIKE '%Ferreira%')
      ORDER BY duplicate_count DESC, full_name_ko;
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
