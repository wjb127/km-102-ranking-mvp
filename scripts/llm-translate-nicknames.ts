/**
 * LLM 일괄 별명 음차 — fighters.nickname_ko 채우기.
 * 실행: pnpm tsx scripts/llm-translate-nicknames.ts [--dry] [--limit N] [--batch N]
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { eq, isNull, or, and, sql, isNotNull, ne } from "drizzle-orm";
import { db } from "../src/db";
import { fighters } from "../src/db/schema";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry");

function argNumber(flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  const v = Number(args[i + 1]);
  return Number.isFinite(v) ? v : fallback;
}

const LIMIT = argNumber("--limit", Infinity);
const BATCH_SIZE = argNumber("--batch", 50);
const MODEL = "claude-haiku-4-5-20251001";

const API_KEY = process.env.ANTHROPIC_API_KEY?.trim();
if (!API_KEY) {
  console.error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const SYSTEM_PROMPT = `너는 MMA 격투기 선수 별명을 한국어로 변환하는 전문가다.
입력으로 영문 별명 배열이 들어오면, 한국 MMA 팬 통용 표기로 변환한다.

규칙:
- 의미 있는 단어/구절은 의역 또는 직역 (예: "The Notorious" → "악명", "The Spider" → "스파이더", "Bones" → "본즈", "The Eagle" → "이글", "The Diamond" → "다이아몬드")
- 한국 팬덤에서 영문 그대로 더 많이 쓰는 별명은 음차 (예: "Suga" → "슈가", "Showtime" → "쇼타임", "Rocky" → "라키")
- 너무 긴 영어 문장형 별명은 핵심 단어만 음차/의역
- 결과는 반드시 입력 순서를 유지하는 JSON 배열만 출력. 설명 금지.

출력 형식:
입력: ["The Notorious","The Eagle","Suga"]
출력: ["악명","이글","슈가"]`;

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  usage?: { input_tokens: number; output_tokens: number };
}

async function translateBatch(items: string[]): Promise<string[]> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `다음 별명들을 한국어로 변환해서 JSON 배열로 반환:\n${JSON.stringify(items)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  const textBlock = data.content.find((c) => c.type === "text")?.text ?? "";

  const jsonMatch = textBlock.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`JSON 파싱 실패: ${textBlock.slice(0, 200)}`);
  const parsed = JSON.parse(jsonMatch[0]) as unknown;
  if (!Array.isArray(parsed)) throw new Error("배열 아님");
  if (parsed.length !== items.length) {
    throw new Error(`크기 불일치: 입력 ${items.length} vs 출력 ${parsed.length}`);
  }

  console.log(`  [api] in=${data.usage?.input_tokens} out=${data.usage?.output_tokens}`);
  return parsed as string[];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  console.log(`닉네임 LLM 음차 (model=${MODEL}, batch=${BATCH_SIZE}, dry=${DRY_RUN})`);

  const targets = await db
    .select({ id: fighters.id, nickname: fighters.nickname })
    .from(fighters)
    .where(
      and(
        isNotNull(fighters.nickname),
        ne(fighters.nickname, ""),
        or(isNull(fighters.nicknameKo), eq(fighters.nicknameKo, ""))
      )
    )
    .orderBy(sql`${fighters.careerWins} + ${fighters.careerLosses} DESC NULLS LAST`);

  const sliced = LIMIT === Infinity ? targets : targets.slice(0, LIMIT);
  console.log(`대상: ${sliced.length}명 (전체 미번역 ${targets.length}명)`);

  const batches = chunk(sliced, BATCH_SIZE);
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n[${i + 1}/${batches.length}] ${batch.length}건 처리...`);

    const items = batch.map((b) => b.nickname ?? "");
    let translations: string[];
    try {
      translations = await translateBatch(items);
    } catch (error) {
      console.error(`  배치 실패: ${error instanceof Error ? error.message : String(error)}`);
      failed += batch.length;
      continue;
    }

    for (let j = 0; j < batch.length; j++) {
      const fighter = batch[j];
      const ko = translations[j].trim();
      if (!ko) continue;

      console.log(`    ${fighter.nickname} → ${ko}`);
      if (!DRY_RUN) {
        await db
          .update(fighters)
          .set({ nicknameKo: ko, updatedAt: new Date() })
          .where(eq(fighters.id, fighter.id));
      }
      updated++;
    }
  }

  console.log(`\n=== 완료 ===\n  업데이트: ${updated}\n  실패: ${failed}\n  dry=${DRY_RUN}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("스크립트 오류:", err);
  process.exit(1);
});
