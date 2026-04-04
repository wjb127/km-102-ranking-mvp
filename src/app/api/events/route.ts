import { NextRequest, NextResponse } from "next/server";
import { getEvents, FALLBACK_EVENTS } from "@/lib/api/mma";

/** GET /api/events?year= — 이벤트 목록 */
export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;

  const result = await getEvents(year);

  // API 응답이 있으면 그대로, 없으면 fallback
  const events = result?.data ?? FALLBACK_EVENTS;

  return NextResponse.json({ success: true, data: events });
}
