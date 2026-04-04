import { NextRequest, NextResponse } from "next/server";
import { getEventById, FALLBACK_EVENTS } from "@/lib/api/mma";

/** GET /api/events/[id] — 이벤트 상세 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getEventById(id);

  // API 응답이 있으면 사용, 없으면 fallback에서 검색
  const event =
    result?.data ?? FALLBACK_EVENTS.find((e) => String(e.id) === id) ?? null;

  if (!event) {
    return NextResponse.json(
      { success: false, error: "이벤트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: event });
}
