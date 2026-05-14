/**
 * 이벤트 external_id alias 등록/업데이트.
 *
 * DROP/DELETE 없이 alias 테이블에 INSERT/UPDATE만 수행한다.
 *
 * dry-run:
 *   pnpm alias:event -- --retired 80621 --keeper 91283 --reason "중복 일정"
 *
 * 적용:
 *   pnpm alias:event -- --retired 80621 --keeper 91283 --reason "중복 일정" --apply
 */
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

loadEnv({ path: ".env.local" });
loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set.");

const sql = postgres(databaseUrl, { prepare: false });
const args = process.argv.slice(2);

function readArg(name: string) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

function readNumberArg(name: string) {
  const value = readArg(name);
  if (!value) return null;
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : null;
}

const retiredExternalId = readNumberArg("--retired");
const keeperExternalId = readNumberArg("--keeper");
const reason = readArg("--reason");
const shouldApply = args.includes("--apply");

if (!retiredExternalId || !keeperExternalId || !reason) {
  throw new Error(
    "사용법: pnpm alias:event -- --retired <external_id> --keeper <external_id> --reason <reason> [--apply]"
  );
}

if (retiredExternalId === keeperExternalId) {
  throw new Error("--retired 와 --keeper 는 달라야 합니다.");
}

async function main() {
  const [retired] = await sql`
    SELECT id, external_id, name, name_ko, event_date, venue
    FROM events
    WHERE external_id = ${retiredExternalId}
    LIMIT 1;
  `;
  const [keeper] = await sql`
    SELECT id, external_id, name, name_ko, event_date, venue
    FROM events
    WHERE external_id = ${keeperExternalId}
    LIMIT 1;
  `;

  if (!keeper) throw new Error(`keeper event external_id=${keeperExternalId}를 찾지 못했습니다.`);

  const refs = retired
    ? await sql`
        SELECT
          (SELECT count(*)::int FROM fights WHERE event_id = ${retired.id}) AS fights,
          (SELECT count(*)::int FROM mma_comments WHERE target_type = 'event' AND target_id = ${retired.id}) AS comments,
          (SELECT count(*)::int FROM admin_overrides WHERE target_type = 'event' AND target_id = ${retired.id}) AS overrides;
      `.then(([row]) => row)
    : { fights: null, comments: null, overrides: null, note: "retired event row 없음" };

  console.log(shouldApply ? "실제 적용 모드" : "dry-run 모드");
  console.log("\n[retired]");
  console.table([retired ?? { external_id: retiredExternalId, note: "events row 없음" }]);
  console.log("[keeper]");
  console.table([keeper]);
  console.log("[retired 참조 수]");
  console.table([refs]);

  if (!shouldApply) {
    console.log("\ndry-run 완료. 실제 적용하려면 --apply를 붙여 실행하세요.");
    return;
  }

  await sql`
    INSERT INTO event_external_id_aliases (retired_external_id, keeper_external_id, reason)
    VALUES (${retiredExternalId}, ${keeperExternalId}, ${reason})
    ON CONFLICT (retired_external_id) DO UPDATE
    SET
      keeper_external_id = EXCLUDED.keeper_external_id,
      reason = EXCLUDED.reason,
      updated_at = NOW();
  `;

  const rows = await sql`
    SELECT retired_external_id, keeper_external_id, reason, updated_at
    FROM event_external_id_aliases
    WHERE retired_external_id = ${retiredExternalId};
  `;
  console.log("\n[alias 적용 결과]");
  console.table(rows);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
