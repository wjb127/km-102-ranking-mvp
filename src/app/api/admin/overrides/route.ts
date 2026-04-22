import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminOverrides, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── GET /api/admin/overrides : 최근 보정 이력 ──
export async function GET(req: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 200);

  const rows = await db
    .select({
      id: adminOverrides.id,
      targetType: adminOverrides.targetType,
      targetId: adminOverrides.targetId,
      reason: adminOverrides.reason,
      beforeData: adminOverrides.beforeData,
      afterData: adminOverrides.afterData,
      createdAt: adminOverrides.createdAt,
      adminNickname: users.nickname,
    })
    .from(adminOverrides)
    .leftJoin(users, eq(adminOverrides.adminId, users.id))
    .orderBy(desc(adminOverrides.createdAt))
    .limit(limit);

  const data = rows.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    reason: r.reason,
    beforeData: r.beforeData,
    afterData: r.afterData,
    createdAt: r.createdAt.toISOString(),
    adminNickname: r.adminNickname ?? "(탈퇴)",
  }));

  return NextResponse.json({ success: true, data });
}
