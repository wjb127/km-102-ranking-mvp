import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { fighterBookmarks, fighters } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";

// ── GET /api/fighter-bookmarks ──
// 내가 북마크한 선수 목록 (최신순). 프로필 페이지에서 사용.
export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const rows = await db
    .select({
      id: fighterBookmarks.id,
      createdAt: fighterBookmarks.createdAt,
      fighter: {
        id: fighters.id,
        fullName: fighters.fullName,
        fullNameKo: fighters.fullNameKo,
        nickname: fighters.nickname,
        nicknameKo: fighters.nicknameKo,
        weightClass: fighters.weightClass,
        nationality: fighters.nationality,
        nationalityKo: fighters.nationalityKo,
        careerWins: fighters.careerWins,
        careerLosses: fighters.careerLosses,
        careerDraws: fighters.careerDraws,
        imageUrl: fighters.imageUrl,
      },
    })
    .from(fighterBookmarks)
    .innerJoin(fighters, eq(fighters.id, fighterBookmarks.fighterId))
    .where(eq(fighterBookmarks.userId, session!.sub))
    .orderBy(desc(fighterBookmarks.createdAt))
    .limit(200);

  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      bookmarkId: r.id,
      createdAt: r.createdAt.toISOString(),
      fighter: r.fighter,
    })),
  });
}

// ── POST /api/fighter-bookmarks ──
// body: { fighterId: number, fighterIds?: number[] }
// 단일 또는 여러 선수를 북마크. 이미 있으면 무시.
export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const rawIds: unknown[] = Array.isArray(body.fighterIds)
    ? body.fighterIds
    : body.fighterId !== undefined
      ? [body.fighterId]
      : [];
  const fighterIds = rawIds
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v > 0);

  if (fighterIds.length === 0) {
    return NextResponse.json(
      { success: false, error: "fighterId가 필요합니다." },
      { status: 400 }
    );
  }

  // 존재하는 선수만 필터
  const exist = await db
    .select({ id: fighters.id })
    .from(fighters)
    .where(inArray(fighters.id, fighterIds));
  const existIds = new Set(exist.map((r) => r.id));
  const valid = fighterIds.filter((id) => existIds.has(id));

  if (valid.length === 0) {
    return NextResponse.json(
      { success: false, error: "존재하지 않는 선수입니다." },
      { status: 404 }
    );
  }

  await db
    .insert(fighterBookmarks)
    .values(valid.map((fighterId) => ({ userId: session!.sub, fighterId })))
    .onConflictDoNothing();

  return NextResponse.json({ success: true, data: { added: valid.length } });
}

// ── DELETE /api/fighter-bookmarks?fighterId=123 ──
export async function DELETE(req: NextRequest) {
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

  await db
    .delete(fighterBookmarks)
    .where(
      and(
        eq(fighterBookmarks.userId, session!.sub),
        eq(fighterBookmarks.fighterId, fighterId)
      )
    );

  return NextResponse.json({ success: true });
}
