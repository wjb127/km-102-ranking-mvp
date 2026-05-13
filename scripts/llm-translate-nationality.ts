/**
 * LLM 국적 한글 매핑 — fighters.nationality_ko 채우기.
 * distinct nationality 162종을 한 번에 번역 후 일괄 UPDATE.
 *
 * 실행: pnpm tsx scripts/llm-translate-nationality.ts
 *
 * 옵션:
 *   --dry         DB 업데이트 없이 결과만 출력
 *   --overwrite   기존 nationality_ko 값까지 덮어쓰기 (기본은 결측치만)
 *   --model NAME  모델 (기본 claude-haiku-4-5-20251001)
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "../src/db";
import { fighters } from "../src/db/schema";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry");
const OVERWRITE = args.includes("--overwrite");

function argString(flag: string, fallback: string): string {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
}

const MODEL = argString("--model", "claude-haiku-4-5-20251001");
const API_KEY = process.env.ANTHROPIC_API_KEY?.trim();
if (!API_KEY) {
  console.error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const SYSTEM_PROMPT = `너는 국가/지역명을 한국어로 번역하는 전문가다.
입력으로 영문 국가명 배열이 들어오면, 한국 MMA 팬에게 익숙한 한국어 표기로 변환한다.

규칙:
- 통상 한국어 국명 사용 (예: USA → "미국", England → "잉글랜드", UK → "영국", Korea → "한국")
- South Korea/North Korea 명시되면 "대한민국"/"북한"으로 구분
- 약어/별칭도 일반 표기 (예: UAE → "아랍에미리트", DR Congo → "콩고민주공화국")
- 영문 그대로 가독성 있으면 음차 (예: "Kyrgyzstan" → "키르기스스탄")
- 입력 순서 유지하는 JSON 배열만 출력. 설명/주석 금지.

출력 형식 (예시):
입력: ["USA","Brazil","Korea"]
출력: ["미국","브라질","한국"]`;

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
          content: `다음 국적을 한국어로 변환해서 JSON 배열로 반환:\n${JSON.stringify(items)}`,
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
  if (!jsonMatch) throw new Error(`JSON 배열 파싱 실패: ${textBlock.slice(0, 200)}`);
  const parsed = JSON.parse(jsonMatch[0]) as unknown;
  if (!Array.isArray(parsed)) throw new Error(`배열 아님: ${typeof parsed}`);
  if (parsed.length !== items.length)
    throw new Error(`크기 불일치: 입력 ${items.length} vs 출력 ${parsed.length}`);
  if (!parsed.every((v) => typeof v === "string")) throw new Error("문자열 아닌 항목 포함");

  console.log(`  [api] in=${data.usage?.input_tokens} out=${data.usage?.output_tokens}`);
  return parsed as string[];
}

async function main() {
  console.log(`국적 한글 번역 시작 (model=${MODEL}, dry=${DRY_RUN}, overwrite=${OVERWRITE})`);

  // distinct nationality 추출
  const baseWhere = isNotNull(fighters.nationality);
  const filterWhere = OVERWRITE
    ? baseWhere
    : and(baseWhere, or(isNull(fighters.nationalityKo), eq(fighters.nationalityKo, "")));

  const distinctRows = await db
    .selectDistinct({ nationality: fighters.nationality })
    .from(fighters)
    .where(filterWhere);

  const nationalities = distinctRows
    .map((r) => r.nationality)
    .filter((n): n is string => !!n && n.trim().length > 0);

  console.log(`distinct 국적: ${nationalities.length}종`);
  if (nationalities.length === 0) {
    console.log("처리할 국적 없음. 종료.");
    process.exit(0);
  }

  // 배치 1회 호출 (162종 정도면 충분히 한 번에 들어감)
  let translations: string[];
  try {
    translations = await translateBatch(nationalities);
  } catch (error) {
    console.error("배치 실패:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const mapping = new Map<string, string>();
  for (let i = 0; i < nationalities.length; i++) {
    const ko = translations[i].trim();
    if (!ko || ko === nationalities[i]) {
      console.log(`  ⊘ ${nationalities[i]} → (스킵)`);
      continue;
    }
    mapping.set(nationalities[i], ko);
    console.log(`  ${nationalities[i]} → ${ko}`);
  }

  if (DRY_RUN) {
    console.log(`\n=== DRY 완료 ===\n  매핑 ${mapping.size}건`);
    process.exit(0);
  }

  // 매핑 일괄 UPDATE
  let updated = 0;
  for (const [en, ko] of mapping) {
    const updateWhere = OVERWRITE
      ? eq(fighters.nationality, en)
      : and(
          eq(fighters.nationality, en),
          or(isNull(fighters.nationalityKo), eq(fighters.nationalityKo, ""))
        );
    const result = await db
      .update(fighters)
      .set({ nationalityKo: ko, updatedAt: new Date() })
      .where(updateWhere)
      .returning({ id: fighters.id });
    updated += result.length;
    console.log(`    ${en} → ${ko}: ${result.length}건 갱신`);
  }

  // sql import 무사용 경고 방지 (조건부 다른 분기에서 사용 가능)
  void sql;

  console.log(`\n=== 완료 ===\n  매핑 ${mapping.size}종, ${updated}행 갱신`);
  process.exit(0);
}

main().catch((err) => {
  console.error("스크립트 오류:", err);
  process.exit(1);
});
