import { NextRequest, NextResponse } from "next/server";
import { getFighters, FALLBACK_FIGHTERS } from "@/lib/api/mma";

// ── weight_class가 객체로 올 수 있으므로 문자열로 정규화 ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeFighter(f: any) {
  return {
    ...f,
    weight_class:
      typeof f.weight_class === "object" && f.weight_class !== null
        ? f.weight_class.name ?? f.weight_class.abbreviation ?? null
        : f.weight_class ?? null,
  };
}

// ── 선수 목록 API ──

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? undefined;

  try {
    const result = await getFighters(search);

    if (result && result.data.length > 0) {
      return NextResponse.json({ success: true, data: result.data.map(normalizeFighter) });
    }

    // API 실패 또는 빈 결과 → 폴백 데이터
    const filtered = search
      ? FALLBACK_FIGHTERS.filter((f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          (f.nickname && f.nickname.toLowerCase().includes(search.toLowerCase()))
        )
      : FALLBACK_FIGHTERS;

    return NextResponse.json({ success: true, data: filtered });
  } catch {
    // 에러 시 폴백
    const filtered = search
      ? FALLBACK_FIGHTERS.filter((f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          (f.nickname && f.nickname.toLowerCase().includes(search.toLowerCase()))
        )
      : FALLBACK_FIGHTERS;

    return NextResponse.json({ success: true, data: filtered });
  }
}
