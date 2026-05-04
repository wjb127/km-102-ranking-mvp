/**
 * LLM 일괄 이름 음차 — Anthropic Haiku 4.5로 fighters.full_name_ko 채우기.
 * 실행: pnpm tsx scripts/llm-translate-fighters.ts
 *
 * 옵션:
 *   --dry         DB 업데이트 없이 결과만 출력
 *   --limit N     최대 N명만 처리 (테스트용)
 *   --batch N     배치 크기 (기본 50)
 *   --model NAME  모델 (기본 claude-haiku-4-5-20251001)
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { eq, isNull, or, sql } from "drizzle-orm";
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

function argString(flag: string, fallback: string): string {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
}

const LIMIT = argNumber("--limit", Infinity);
const BATCH_SIZE = argNumber("--batch", 50);
const MODEL = argString("--model", "claude-haiku-4-5-20251001");

const API_KEY = process.env.ANTHROPIC_API_KEY?.trim();
if (!API_KEY) {
  console.error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const SYSTEM_PROMPT = `너는 MMA 격투기 선수 이름을 한국어로 음차하는 전문가다.
입력으로 영문 선수 이름 배열이 들어오면, 한국 MMA 팬들이 통상적으로 부르는 한국어 표기로 변환한다.

규칙:
- 한국 팬 커뮤니티(레딧/유튜브/네이버 카페)에서 통용되는 표기 우선
- 발음 기반 음차. 영어식이 아니라 출신국 발음 우선 (예: 브라질=포르투갈어, 러시아=러시아어)
- "Conor McGregor" → "코너 맥그리거", "Khabib Nurmagomedov" → "하빕 누르마고메도프", "Charles Oliveira" → "찰스 올리베이라"
- 외래어 표기법(국립국어원)은 무시. 팬 통용 표기 우선
- 이미 한국식 이름이면 그대로 (예: "Chan Sung Jung" → "정찬성")
- 일본 선수는 한자 발음 (예: "Yushin Okami" → "오카미 유신", "Kazushi Sakuraba" → "카즈시 사쿠라바")
- 결과는 반드시 입력 순서를 유지하는 JSON 배열만 출력. 설명 금지.

출력 형식 (예시):
입력: ["Conor McGregor","Jon Jones"]
출력: ["코너 맥그리거","존 존스"]`;

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  usage?: { input_tokens: number; output_tokens: number };
}

async function translateBatch(names: string[]): Promise<string[]> {
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
          content: `다음 선수 이름들을 한국어 음차로 변환해서 JSON 배열로 반환:\n${JSON.stringify(names)}`,
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
  if (!jsonMatch) {
    throw new Error(`JSON 배열 파싱 실패: ${textBlock.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`배열 아님: ${typeof parsed}`);
  }
  if (parsed.length !== names.length) {
    throw new Error(`크기 불일치: 입력 ${names.length} vs 출력 ${parsed.length}`);
  }
  if (!parsed.every((v) => typeof v === "string")) {
    throw new Error("문자열 아닌 항목 포함");
  }

  console.log(
    `  [api] in=${data.usage?.input_tokens} out=${data.usage?.output_tokens}`
  );

  return parsed as string[];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function main() {
  console.log(`LLM 음차 시작 (model=${MODEL}, batch=${BATCH_SIZE}, dry=${DRY_RUN})`);

  const targets = await db
    .select({ id: fighters.id, fullName: fighters.fullName })
    .from(fighters)
    .where(or(isNull(fighters.fullNameKo), eq(fighters.fullNameKo, "")))
    .orderBy(sql`${fighters.careerWins} + ${fighters.careerLosses} DESC NULLS LAST`);

  const sliced = LIMIT === Infinity ? targets : targets.slice(0, LIMIT);
  console.log(`대상: ${sliced.length}명 (전체 미번역 ${targets.length}명)`);

  const batches = chunk(sliced, BATCH_SIZE);
  let updated = 0;
  let failed = 0;
  let totalIn = 0;
  let totalOut = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n[${i + 1}/${batches.length}] ${batch.length}명 처리...`);

    const names = batch.map((b) => b.fullName);
    let translations: string[];
    try {
      translations = await translateBatch(names);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`  배치 실패: ${msg}`);
      failed += batch.length;
      continue;
    }

    for (let j = 0; j < batch.length; j++) {
      const fighter = batch[j];
      const ko = translations[j].trim();
      if (!ko || ko === fighter.fullName) {
        console.log(`    ⊘ ${fighter.fullName} → (스킵)`);
        continue;
      }

      console.log(`    ${fighter.fullName} → ${ko}`);

      if (!DRY_RUN) {
        await db
          .update(fighters)
          .set({ fullNameKo: ko, updatedAt: new Date() })
          .where(eq(fighters.id, fighter.id));
      }
      updated++;
    }

    // 비용/토큰 계측은 translateBatch 내부 로그로 출력. 누적은 별도 추적 X (간략화)
  }

  console.log(`\n=== 완료 ===`);
  console.log(`  업데이트: ${updated}명`);
  console.log(`  실패: ${failed}명`);
  console.log(`  dry=${DRY_RUN}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("스크립트 오류:", err);
  process.exit(1);
});
