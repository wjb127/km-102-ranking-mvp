import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { db } from "@/db";
import { fighters } from "@/db/schema";

// ── GET /api/mma-fighters?search=...&weight=... ──
// DB 기반 선수 목록. 관리자 보정값 포함(한글명/이미지/소개 등)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("search") ?? "").trim();
  const weight = (searchParams.get("weight") ?? "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);

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
  if (weight) conditions.push(eq(fighters.weightClass, weight));

  const whereExpr = conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : and(...conditions);

  const rows = await db
    .select({
      id: fighters.id,
      externalId: fighters.externalId,
      fullName: fighters.fullName,
      fullNameKo: fighters.fullNameKo,
      nickname: fighters.nickname,
      nicknameKo: fighters.nicknameKo,
      weightClass: fighters.weightClass,
      nationality: fighters.nationality,
      nationalityKo: fighters.nationalityKo,
      imageUrl: fighters.imageUrl,
    })
    .from(fighters)
    .where(whereExpr)
    .orderBy(asc(fighters.fullName))
    .limit(limit);

  return NextResponse.json({ success: true, data: rows });
}
