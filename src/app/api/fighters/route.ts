import { NextRequest, NextResponse } from "next/server";
import { getFighters, FALLBACK_FIGHTERS } from "@/lib/api/mma";

// ── 선수 목록 API ──

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? undefined;

  try {
    const result = await getFighters(search);

    if (result && result.data.length > 0) {
      return NextResponse.json({ success: true, data: result.data });
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
