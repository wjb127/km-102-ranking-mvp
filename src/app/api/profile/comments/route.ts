import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { mmaComments } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";

// ── GET /api/profile/comments?limit=20&offset=0 : 내 댓글 목록 ──
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
    100
  );
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0);

  const where = and(
    eq(mmaComments.authorId, session!.sub),
    eq(mmaComments.isDeleted, false)
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: mmaComments.id,
        targetType: mmaComments.targetType,
        targetId: mmaComments.targetId,
        content: mmaComments.content,
        createdAt: mmaComments.createdAt,
      })
      .from(mmaComments)
      .where(where)
      .orderBy(desc(mmaComments.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(mmaComments)
      .where(where),
  ]);

  const data = rows.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    data,
    total: Number(total ?? 0),
  });
}
