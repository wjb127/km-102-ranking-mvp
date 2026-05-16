import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { fighterEditSuggestions, fighters } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// GET /api/admin/fighter-suggestions?status=pending
export async function GET(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const rows = await db
    .select({
      id: fighterEditSuggestions.id,
      fighterId: fighterEditSuggestions.fighterId,
      fighterName: fighters.fullName,
      fighterNameKo: fighters.fullNameKo,
      userId: fighterEditSuggestions.userId,
      userNickname: fighterEditSuggestions.userNickname,
      fieldName: fighterEditSuggestions.fieldName,
      oldValue: fighterEditSuggestions.oldValue,
      newValue: fighterEditSuggestions.newValue,
      reason: fighterEditSuggestions.reason,
      status: fighterEditSuggestions.status,
      rejectReason: fighterEditSuggestions.rejectReason,
      createdAt: fighterEditSuggestions.createdAt,
    })
    .from(fighterEditSuggestions)
    .innerJoin(fighters, eq(fighterEditSuggestions.fighterId, fighters.id))
    .where(status === "all" ? undefined : eq(fighterEditSuggestions.status, status))
    .orderBy(desc(fighterEditSuggestions.createdAt))
    .limit(200);

  const pendingCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fighterEditSuggestions)
    .where(eq(fighterEditSuggestions.status, "pending"));

  return NextResponse.json({
    success: true,
    data: rows,
    pendingCount: pendingCount[0]?.count ?? 0,
  });
}
