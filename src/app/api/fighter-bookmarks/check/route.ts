import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { fighterBookmarks } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";

// ── GET /api/fighter-bookmarks/check?fighterId=123 ──
// 현재 로그인 사용자가 해당 선수를 북마크했는지 확인.
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const url = new URL(req.url);
  const fighterId = Number(url.searchParams.get("fighterId"));
  if (!Number.isInteger(fighterId) || fighterId <= 0) {
    return NextResponse.json(
      { success: false, error: "fighterId가 필요합니다." },
      { status: 400 }
    );
  }

  const [row] = await db
    .select({ id: fighterBookmarks.id })
    .from(fighterBookmarks)
    .where(
      and(
        eq(fighterBookmarks.userId, session!.sub),
        eq(fighterBookmarks.fighterId, fighterId)
      )
    )
    .limit(1);

  return NextResponse.json({ success: true, data: { bookmarked: !!row } });
}
