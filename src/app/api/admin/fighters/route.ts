import { NextRequest, NextResponse } from "next/server";
import { asc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { fighters } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── GET /api/admin/fighters?q=이름 : 선수 검색 ──
export async function GET(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);

  const rowsQuery = db
    .select({
      id: fighters.id,
      externalId: fighters.externalId,
      fullName: fighters.fullName,
      fullNameKo: fighters.fullNameKo,
      nickname: fighters.nickname,
      nicknameKo: fighters.nicknameKo,
      weightClass: fighters.weightClass,
      nationalityKo: fighters.nationalityKo,
      imageUrl: fighters.imageUrl,
    })
    .from(fighters);

  const rows = q
    ? await rowsQuery
        .where(
          or(
            ilike(fighters.fullName, `%${q}%`),
            ilike(fighters.fullNameKo, `%${q}%`),
            ilike(fighters.nickname, `%${q}%`),
            ilike(fighters.nicknameKo, `%${q}%`)
          )
        )
        .orderBy(asc(fighters.fullName))
        .limit(limit)
    : await rowsQuery.orderBy(asc(fighters.fullName)).limit(limit);

  return NextResponse.json({ success: true, data: rows });
}
