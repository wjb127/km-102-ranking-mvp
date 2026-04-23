import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/guard";

// ── PATCH /api/admin/users/[id] : 밴/role 변경 ──
// body: { isBanned?: boolean, role?: 'user' | 'admin' }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdmin();
  if (response) return response;
  void session;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "잘못된 id." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const update: { isBanned?: boolean; role?: string; updatedAt?: Date } = {};
  if (typeof body.isBanned === "boolean") {
    update.isBanned = body.isBanned;
  }
  if (typeof body.role === "string") {
    if (body.role !== "user" && body.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "role은 user 또는 admin 이어야 합니다." },
        { status: 400 }
      );
    }
    update.role = body.role;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { success: false, error: "변경할 값이 없습니다." },
      { status: 400 }
    );
  }
  update.updatedAt = new Date();

  const [updated] = await db
    .update(users)
    .set(update)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      nickname: users.nickname,
      role: users.role,
      isBanned: users.isBanned,
    });

  if (!updated) {
    return NextResponse.json(
      { success: false, error: "사용자를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: updated });
}
