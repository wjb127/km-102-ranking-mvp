import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { fighterBookmarks, fighters } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";
import { publicFighterCondition } from "@/lib/fighter-visibility";

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
const MAX_BOOKMARK_BATCH = 50;

export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const rawIds: unknown[] = Array.isArray(body.fighterIds)
    ? body.fighterIds
    : body.fighterId !== undefined
      ? [body.fighterId]
      : [];

  // 정수화 + 중복 제거 + 최대 개수 제한
  const dedupe = Array.from(
    new Set(
      rawIds
        .map((v) => Number(v))
        .filter((v) => Number.isInteger(v) && v > 0)
    )
  );

  if (dedupe.length === 0) {
    return NextResponse.json(
      { success: false, error: "fighterId가 필요합니다." },
      { status: 400 }
    );
  }
  if (dedupe.length > MAX_BOOKMARK_BATCH) {
    return NextResponse.json(
      {
        success: false,
        error: `한 번에 최대 ${MAX_BOOKMARK_BATCH}명까지 북마크할 수 있습니다.`,
      },
      { status: 400 }
    );
  }

  // 공개 노출 가능한 선수만 북마크 허용 (placeholder/빈 전적 차단)
  const exist = await db
    .select({ id: fighters.id })
    .from(fighters)
    .where(and(inArray(fighters.id, dedupe), publicFighterCondition()));
  const valid = exist.map((r) => r.id);

  if (valid.length === 0) {
    return NextResponse.json(
      { success: false, error: "존재하지 않는 선수입니다." },
      { status: 404 }
    );
  }

  // 실제 insert된 행만 returning — 충돌은 onConflictDoNothing 으로 제외
  const inserted = await db
    .insert(fighterBookmarks)
    .values(valid.map((fighterId) => ({ userId: session!.sub, fighterId })))
    .onConflictDoNothing()
    .returning({ id: fighterBookmarks.id });

  return NextResponse.json({
    success: true,
    data: {
      requested: dedupe.length,
      valid: valid.length,
      added: inserted.length,
    },
  });
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
