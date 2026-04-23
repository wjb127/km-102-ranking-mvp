/**
 * DeepL 배치 번역 스크립트 — fighters/events 한국어 필드 채우기
 *
 * 실행: pnpm translate:batch [--fighters] [--events] [--limit N]
 *
 * 필요 환경변수:
 *   DEEPL_API_KEY   — DeepL API 키 (https://www.deepl.com/pro-api)
 *   DATABASE_URL    — Neon Postgres 연결 문자열
 *
 * 무료 티어: 500,000자/월. fighters 이름 평균 15자 × 4023명 ≈ 60,000자
 * → 무료 티어로 전부 가능
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { eq, isNull, sql } from "drizzle-orm";
import { db } from "../src/db";
import { fighters, mmaEvents } from "../src/db/schema";

const DEEPL_API_KEY = process.env.DEEPL_API_KEY ?? "";
const BATCH_SIZE = 50; // DeepL 한 번에 최대 50개 텍스트
const DELAY_MS = 300;  // API 요청 간격

const args = process.argv.slice(2);
const onlyFighters = args.includes("--fighters");
const onlyEvents   = args.includes("--events");
const runFighters  = !onlyEvents;
const runEvents    = !onlyFighters;

function argNumber(flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i === -1) return fallback;
  const v = Number(args[i + 1]);
  return Number.isFinite(v) ? v : fallback;
}
const ROW_LIMIT = argNumber("--limit", Infinity);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── DeepL API 호출 (최대 50개 텍스트 배치) ──
async function translateBatch(texts: string[]): Promise<string[]> {
  const params = new URLSearchParams({ target_lang: "KO", source_lang: "EN" });
  texts.forEach((t) => params.append("text", t));

  const res = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepL ${res.status}: ${body}`);
  }

  const json = await res.json() as { translations: { text: string }[] };
  return json.translations.map((t) => t.text);
}

// ── fighters 번역 ──
async function translateFighters() {
  console.log("\n=== fighters 번역 시작 ===");

  const rows = await db
    .select({ id: fighters.id, fullName: fighters.fullName, nationality: fighters.nationality })
    .from(fighters)
    .where(isNull(fighters.fullNameKo))
    .limit(ROW_LIMIT === Infinity ? 10000 : ROW_LIMIT);

  console.log(`  번역 대상: ${rows.length}명`);
  let done = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const names = chunk.map((r) => r.fullName);

    const translated = await translateBatch(names);

    for (let j = 0; j < chunk.length; j++) {
      const nameKo = translated[j];
      await db
        .update(fighters)
        .set({ fullNameKo: nameKo })
        .where(eq(fighters.id, chunk[j].id));
    }

    done += chunk.length;
    console.log(`  [fighters] ${done}/${rows.length} 처리`);
    if (i + BATCH_SIZE < rows.length) await sleep(DELAY_MS);
  }

  // nationality 번역 (고유명 그대로 쓸 수도 있어 영→한 매핑 테이블 사용)
  const nationalityMap: Record<string, string> = {
    USA: "미국", Brazil: "브라질", Russia: "러시아", Canada: "캐나다",
    Japan: "일본", "South Korea": "한국", Korea: "한국",
    Ireland: "아일랜드", England: "영국", Australia: "호주",
    Mexico: "멕시코", Netherlands: "네덜란드", Georgia: "조지아",
    Ukraine: "우크라이나", Poland: "폴란드", France: "프랑스",
    Germany: "독일", China: "중국", Kazakhstan: "카자흐스탄",
    Kyrgyzstan: "키르기스스탄", Dagestan: "다게스탄", Cameroon: "카메룬",
    Nigeria: "나이지리아", Sweden: "스웨덴", Norway: "노르웨이",
    Denmark: "덴마크", "Czech Republic": "체코", Hungary: "헝가리",
    Romania: "루마니아", Croatia: "크로아티아", Serbia: "세르비아",
    Bulgaria: "불가리아", Belgium: "벨기에", Spain: "스페인",
    Portugal: "포르투갈", Italy: "이탈리아", Wales: "웨일스",
    Scotland: "스코틀랜드", "New Zealand": "뉴질랜드",
    "United Kingdom": "영국", Philippines: "필리핀",
    Thailand: "태국", Indonesia: "인도네시아", Malaysia: "말레이시아",
    Iran: "이란", Turkey: "터키", Israel: "이스라엘",
  };

  const natRows = await db
    .select({ id: fighters.id, nationality: fighters.nationality })
    .from(fighters)
    .where(isNull(fighters.nationalityKo))
    .limit(ROW_LIMIT === Infinity ? 10000 : ROW_LIMIT);

  let natDone = 0;
  for (const r of natRows) {
    if (!r.nationality) continue;
    const ko = nationalityMap[r.nationality];
    if (ko) {
      await db.update(fighters).set({ nationalityKo: ko }).where(eq(fighters.id, r.id));
      natDone++;
    }
  }
  console.log(`  국적 매핑: ${natDone}건 처리`);
  console.log(`=== fighters 번역 완료 ===`);
}

// ── events 번역 ──
async function translateEvents() {
  console.log("\n=== events 번역 시작 ===");

  const rows = await db
    .select({ id: mmaEvents.id, name: mmaEvents.name })
    .from(mmaEvents)
    .where(isNull(mmaEvents.nameKo))
    .limit(ROW_LIMIT === Infinity ? 10000 : ROW_LIMIT);

  console.log(`  번역 대상: ${rows.length}개`);
  let done = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const names = chunk.map((r) => r.name);

    // 이벤트명은 고유명사가 많아 번역 후 원문 유지 여부 선택
    // "UFC 300" 같은 단순 번호는 그대로 사용
    const needTranslate = names.map((n) => /^[A-Za-z\s]+\d/.test(n) ? false : true);
    const toTranslate = names.filter((_, idx) => needTranslate[idx]);

    let translated: string[] = [];
    if (toTranslate.length > 0) {
      translated = await translateBatch(toTranslate);
    }

    let tIdx = 0;
    for (let j = 0; j < chunk.length; j++) {
      const nameKo = needTranslate[j] ? translated[tIdx++] : names[j];
      await db
        .update(mmaEvents)
        .set({ nameKo })
        .where(eq(mmaEvents.id, chunk[j].id));
    }

    done += chunk.length;
    console.log(`  [events] ${done}/${rows.length} 처리`);
    if (i + BATCH_SIZE < rows.length) await sleep(DELAY_MS);
  }

  console.log(`=== events 번역 완료 ===`);
}

async function main() {
  if (!DEEPL_API_KEY) {
    console.error("❌ DEEPL_API_KEY 환경변수가 없습니다. .env.local에 추가하세요.");
    console.error("   발급: https://www.deepl.com/pro-api (무료 티어 500,000자/월)");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL 환경변수가 없습니다.");
    process.exit(1);
  }

  console.log("DeepL 배치 번역 시작");
  console.log(`  대상: ${[runFighters && "fighters", runEvents && "events"].filter(Boolean).join(", ")}`);

  const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)::int` }).from(fighters).where(isNull(fighters.fullNameKo));
  console.log(`  fighters 미번역: ${cnt}명`);

  try {
    if (runFighters) await translateFighters();
    if (runEvents) await translateEvents();
  } catch (err) {
    console.error("\n❌ 번역 실패:", err);
    process.exit(1);
  }

  console.log("\n✅ 번역 완료");
  process.exit(0);
}

main();
