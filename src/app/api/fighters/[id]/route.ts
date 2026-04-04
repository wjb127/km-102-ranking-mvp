import { NextRequest, NextResponse } from "next/server";
import { getFighterById, FALLBACK_FIGHTERS } from "@/lib/api/mma";

// ── 선수 상세 API ──

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await getFighterById(id);

    if (result?.data) {
      return NextResponse.json({ success: true, data: result.data });
    }

    // API 실패 → 폴백에서 검색
    const fallback = FALLBACK_FIGHTERS.find((f) => f.id === Number(id));

    if (!fallback) {
      return NextResponse.json(
        { success: false, error: "선수를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: fallback });
  } catch {
    const fallback = FALLBACK_FIGHTERS.find((f) => f.id === Number(id));

    if (!fallback) {
      return NextResponse.json(
        { success: false, error: "선수를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: fallback });
  }
}
