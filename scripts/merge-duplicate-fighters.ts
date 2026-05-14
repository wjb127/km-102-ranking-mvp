/**
 * 검증 완료된 선수 중복 row 정리.
 *
 * 기본은 dry-run 이며 DB를 변경하지 않는다.
 * 실제 적용: pnpm merge:fighter-duplicates -- --apply
 */
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

loadEnv({ path: ".env.local" });
loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

const sql = postgres(databaseUrl, { prepare: false });
const args = process.argv.slice(2);
const shouldApply = args.includes("--apply");
const adminIdIndex = args.indexOf("--admin-id");
const adminIdArg = adminIdIndex >= 0 ? args[adminIdIndex + 1] : undefined;

const KOREAN_NAME_UPDATES = [
  {
    id: 41235,
    fullNameKo: "아론 필립스",
    reason: "동명이인 Aaron Phillips 확인 후 누락 한글명 보강",
  },
  {
    id: 41236,
    fullNameKo: "아론 로빈슨",
    reason: "동명이인 Aaron Robinson 확인 후 누락 한글명 보강",
  },
] as const;

const MERGE_PAIRS = [
  {
    keeperId: 14900,
    loserId: 14901,
    retiredExternalId: 32349,
    reason: "Bruno da Silva 대소문자 중복 row 정리",
  },
  {
    keeperId: 13935,
    loserId: 18757,
    retiredExternalId: 40425,
    reason: "Dustin West 대소문자 중복 row 정리",
  },
] as const;

type FighterRow = {
  id: number;
  external_id: number | null;
  full_name: string;
  full_name_ko: string | null;
};

function hasRefs(refCounts: Record<string, number>) {
  return Object.values(refCounts).some((count) => count > 0);
}

async function main() {
  console.log(shouldApply ? "실제 적용 모드" : "dry-run 모드");

  await sql.begin(async (tx) => {
    const db = tx as unknown as typeof sql;

    async function findAdminId() {
      if (adminIdArg) return adminIdArg;

      const [admin] = (await db`
        SELECT id
        FROM users
        WHERE role = 'admin'
          AND deleted_at IS NULL
        ORDER BY created_at
        LIMIT 1;
      `) as { id: string }[];

      if (!admin) {
        throw new Error("관리자 계정을 찾지 못했습니다. --admin-id <uuid>를 지정하세요.");
      }

      return admin.id;
    }

    async function getFighter(id: number) {
      const [row] = (await db`
        SELECT id, external_id, full_name, full_name_ko
        FROM fighters
        WHERE id = ${id};
      `) as FighterRow[];
      return row;
    }

    async function getRefCounts(id: number) {
      const [row] = await db`
        SELECT
          (SELECT count(*)::int FROM fighter_org_records r WHERE r.fighter_id = ${id}) AS org_records,
          (SELECT count(*)::int FROM fights m WHERE m.fighter_a_id = ${id} OR m.fighter_b_id = ${id} OR m.winner_id = ${id}) AS fights,
          (SELECT count(*)::int FROM goat_votes v WHERE v.fighter_id = ${id}) AS goat_votes,
          (SELECT count(*)::int FROM mma_comments c WHERE c.target_type = 'fighter' AND c.target_id = ${id}) AS comments,
          (SELECT count(*)::int FROM admin_overrides o WHERE o.target_type = 'fighter' AND o.target_id = ${id}) AS overrides;
      `;
      return row as Record<string, number>;
    }

    const adminId = await findAdminId();

    for (const item of KOREAN_NAME_UPDATES) {
      const before = await getFighter(item.id);
      if (!before) throw new Error(`fighter id=${item.id} 없음`);

      if (before.full_name_ko === item.fullNameKo) {
        console.log(`[ko] id=${item.id} ${before.full_name}: already ${item.fullNameKo}`);
        continue;
      }

      console.log(`[ko] id=${item.id} ${before.full_name}: ${before.full_name_ko ?? "NULL"} -> ${item.fullNameKo}`);

      if (shouldApply) {
        const [after] = await db`
          UPDATE fighters
          SET full_name_ko = ${item.fullNameKo},
              updated_at = now()
          WHERE id = ${item.id}
            AND full_name_ko IS NULL
          RETURNING id, external_id, full_name, full_name_ko;
        `;

        await db`
          INSERT INTO admin_overrides (admin_id, target_type, target_id, reason, before_data, after_data)
          VALUES (
            ${adminId},
            'fighter',
            ${item.id},
            ${item.reason},
            ${db.json(before)},
            ${db.json(after ?? before)}
          );
        `;
      }
    }

    for (const pair of MERGE_PAIRS) {
      const keeper = await getFighter(pair.keeperId);
      const loser = await getFighter(pair.loserId);
      if (!keeper) throw new Error(`keeper id=${pair.keeperId} 없음`);
      if (!loser) {
        console.log(`[merge] keeper=${pair.keeperId} loser=${pair.loserId}: already removed`);
        continue;
      }
      if (loser.external_id !== pair.retiredExternalId) {
        throw new Error(`loser id=${pair.loserId} external_id 불일치: ${loser.external_id}`);
      }

      const refs = await getRefCounts(pair.loserId);
      console.log(
        `[merge] keeper=${pair.keeperId}(${keeper.full_name}) loser=${pair.loserId}(${loser.full_name}) refs=${JSON.stringify(refs)}`
      );
      if (hasRefs(refs)) {
        throw new Error(`loser id=${pair.loserId} 참조가 남아 있어 중단`);
      }

      if (shouldApply) {
        const [after] = await db`
          UPDATE fighters AS keeper
          SET
            full_name_ko = coalesce(keeper.full_name_ko, loser.full_name_ko),
            nickname = coalesce(keeper.nickname, loser.nickname),
            nickname_ko = coalesce(keeper.nickname_ko, loser.nickname_ko),
            nationality = coalesce(keeper.nationality, loser.nationality),
            nationality_ko = coalesce(keeper.nationality_ko, loser.nationality_ko),
            weight_class = coalesce(keeper.weight_class, loser.weight_class),
            birth_date = coalesce(keeper.birth_date, loser.birth_date),
            height_cm = coalesce(keeper.height_cm, loser.height_cm),
            reach_cm = coalesce(keeper.reach_cm, loser.reach_cm),
            image_url = coalesce(keeper.image_url, loser.image_url),
            bio = coalesce(keeper.bio, loser.bio),
            bio_ko = coalesce(keeper.bio_ko, loser.bio_ko),
            weight_lbs = coalesce(keeper.weight_lbs, loser.weight_lbs),
            stance = coalesce(keeper.stance, loser.stance),
            birth_place = coalesce(keeper.birth_place, loser.birth_place),
            gender = coalesce(keeper.gender, loser.gender),
            weight_class_abbr = coalesce(keeper.weight_class_abbr, loser.weight_class_abbr),
            weight_limit_lbs = coalesce(keeper.weight_limit_lbs, loser.weight_limit_lbs),
            updated_at = now()
          FROM fighters AS loser
          WHERE keeper.id = ${pair.keeperId}
            AND loser.id = ${pair.loserId}
          RETURNING keeper.id, keeper.external_id, keeper.full_name, keeper.full_name_ko;
        `;

        await db`
          INSERT INTO admin_overrides (admin_id, target_type, target_id, reason, before_data, after_data)
          VALUES (
            ${adminId},
            'fighter',
            ${pair.keeperId},
            ${pair.reason},
            ${db.json({ keeper, loser, retiredExternalId: pair.retiredExternalId, loserRefs: refs })},
            ${db.json(after)}
          );
        `;

        await db`DELETE FROM fighters WHERE id = ${pair.loserId};`;
      }
    }

    if (!shouldApply) {
      console.log("dry-run 완료. 실제 적용하려면 --apply를 붙여 실행하세요.");
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
