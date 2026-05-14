import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { fighterBookmarks, fighters } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";
import { publicFighterCondition } from "@/lib/fighter-visibility";
import { parsePositiveIntParam } from "@/lib/parse-id";

// ── GET /api/fighter-bookmarks/check?fighterId=123 ──
// 현재 로그인 사용자가 해당 선수를 북마크했는지 확인.
// 비공개/placeholder로 전환된 선수는 false 응답 (UI 일관성 — GET 목록과 동일 조건).
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const url = new URL(req.url);
  const fighterId = parsePositiveIntParam(url.searchParams.get("fighterId"));
  if (fighterId === null) {
    return NextResponse.json(
      { success: false, error: "fighterId가 필요합니다." },
      { status: 400 }
    );
  }

  const [row] = await db
    .select({ id: fighterBookmarks.id })
    .from(fighterBookmarks)
    .innerJoin(fighters, eq(fighters.id, fighterBookmarks.fighterId))
    .where(
      and(
        eq(fighterBookmarks.userId, session!.sub),
        eq(fighterBookmarks.fighterId, fighterId),
        publicFighterCondition()
      )
    )
    .limit(1);

  return NextResponse.json({ success: true, data: { bookmarked: !!row } });
}
