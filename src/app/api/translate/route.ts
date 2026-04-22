import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { translations } from "@/db/schema";

// ── POST /api/translate ──
// body: { texts: string[], target?: "ko"|"en", source?: "en"|"ko" }
// 결과: { items: Array<{ source, translated, cached, provider }> }
//
// 동작:
// 1. 입력 텍스트를 sha256 해시 → (source_hash, source_lang, target_lang) 로 DB 캐시 조회
// 2. 캐시 히트 → 즉시 반환
// 3. 캐시 미스 → DEEPL_API_KEY 있으면 DeepL 호출, 없으면 원문 그대로 echo (translated=false)
// 4. 성공 번역은 translations 테이블에 upsert

const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

interface TranslateItem {
  source: string;
  translated: string;
  cached: boolean;
  translated_ok: boolean;
  provider: "cache" | "deepl" | "fallback";
}

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

async function deeplTranslate(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[] | null> {
  const key = process.env.DEEPL_API_KEY;
  if (!key || texts.length === 0) return null;
  try {
    const body = new URLSearchParams();
    for (const t of texts) body.append("text", t);
    body.append("source_lang", sourceLang.toUpperCase());
    body.append("target_lang", targetLang.toUpperCase());
    const res = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { translations?: Array<{ text: string }> };
    if (!json.translations || json.translations.length !== texts.length) return null;
    return json.translations.map((t) => t.text);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTexts: unknown = body.texts;
    const target = String(body.target ?? "ko").toLowerCase();
    const source = String(body.source ?? "en").toLowerCase();

    if (!Array.isArray(rawTexts) || rawTexts.length === 0) {
      return NextResponse.json(
        { success: false, error: "texts 배열이 필요합니다." },
        { status: 400 }
      );
    }
    if (rawTexts.length > 50) {
      return NextResponse.json(
        { success: false, error: "한 번에 최대 50건까지 번역할 수 있습니다." },
        { status: 400 }
      );
    }

    const texts: string[] = rawTexts.map((t) => String(t)).filter((t) => t.length > 0);
    if (texts.length === 0) {
      return NextResponse.json({ success: true, items: [] });
    }

    // 해시 계산
    const hashes = texts.map(sha256);

    // DB 캐시 한 번에 조회
    const cachedRows = await db
      .select({
        sourceHash: translations.sourceHash,
        sourceText: translations.sourceText,
        translatedText: translations.translatedText,
      })
      .from(translations)
      .where(
        and(
          inArray(translations.sourceHash, hashes),
          eq(translations.sourceLang, source),
          eq(translations.targetLang, target)
        )
      );

    const cacheMap = new Map<string, string>();
    for (const r of cachedRows) cacheMap.set(r.sourceHash, r.translatedText);

    // 미스 대상 수집
    const missIdxList: number[] = [];
    for (let i = 0; i < texts.length; i++) {
      if (!cacheMap.has(hashes[i])) missIdxList.push(i);
    }

    // DeepL 호출
    let deeplResults: string[] | null = null;
    if (missIdxList.length > 0) {
      const missTexts = missIdxList.map((i) => texts[i]);
      deeplResults = await deeplTranslate(missTexts, source, target);

      if (deeplResults) {
        // 캐시 저장
        const rows = missIdxList.map((origIdx, j) => ({
          sourceHash: hashes[origIdx],
          sourceLang: source,
          targetLang: target,
          sourceText: texts[origIdx],
          translatedText: deeplResults![j],
        }));
        await db.insert(translations).values(rows).onConflictDoNothing();
        for (const r of rows) cacheMap.set(r.sourceHash, r.translatedText);
      }
    }

    const items: TranslateItem[] = texts.map((src, i) => {
      const cached = cachedRows.find((r) => r.sourceHash === hashes[i]);
      if (cached) {
        return {
          source: src,
          translated: cached.translatedText,
          cached: true,
          translated_ok: true,
          provider: "cache",
        };
      }
      const fromDeepl = cacheMap.get(hashes[i]);
      if (fromDeepl) {
        return {
          source: src,
          translated: fromDeepl,
          cached: false,
          translated_ok: true,
          provider: "deepl",
        };
      }
      return {
        source: src,
        translated: src,
        cached: false,
        translated_ok: false,
        provider: "fallback",
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (e) {
    console.error("[POST /api/translate]", e);
    return NextResponse.json({ success: false, error: "번역 요청 실패." }, { status: 500 });
  }
}
