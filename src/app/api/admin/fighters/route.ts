import { NextRequest, NextResponse } from "next/server";
import { and, asc, ilike, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
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
  const includeIncomplete = searchParams.get("includeIncomplete") === "1";

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

  const conditions: SQL[] = [];
  if (q) {
    const searchCond = or(
      ilike(fighters.fullName, `%${q}%`),
      ilike(fighters.fullNameKo, `%${q}%`),
      ilike(fighters.nickname, `%${q}%`),
      ilike(fighters.nicknameKo, `%${q}%`)
    );
    if (searchCond) conditions.push(searchCond);
  }
  if (!includeIncomplete) {
    conditions.push(sql`NOT (
      ${fighters.externalId} IS NULL
      AND ${fighters.fullNameKo} IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM fighters f2
        WHERE f2.id <> ${fighters.id}
          AND f2.external_id IS NOT NULL
          AND f2.full_name_ko = ${fighters.fullNameKo}
      )
    )`);
  }

  const whereExpr = conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : and(...conditions);

  const rows = await rowsQuery
    .where(whereExpr)
    .orderBy(sql`${fighters.externalId} IS NULL`, asc(fighters.fullName))
    .limit(limit);

  return NextResponse.json({ success: true, data: rows });
}
