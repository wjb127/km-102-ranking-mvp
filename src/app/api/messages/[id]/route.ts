import { NextRequest, NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";

// ── GET /api/messages/[id] : 쪽지 상세 + 받은사람이면 읽음 처리 ──
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const msgId = parseInt(id, 10);
  if (isNaN(msgId)) {
    return NextResponse.json({ success: false, error: "잘못된 id." }, { status: 400 });
  }

  const [row] = await db
    .select({
      id: messages.id,
      content: messages.content,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
    })
    .from(messages)
    .where(eq(messages.id, msgId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ success: false, error: "쪽지를 찾을 수 없습니다." }, { status: 404 });
  }
  if (row.senderId !== session.sub && row.receiverId !== session.sub) {
    return NextResponse.json({ success: false, error: "권한이 없습니다." }, { status: 403 });
  }

  // 상대방 닉네임 조회
  const counterpartId = row.senderId === session.sub ? row.receiverId : row.senderId;
  const [counterpart] = await db
    .select({ id: users.id, nickname: users.nickname })
    .from(users)
    .where(eq(users.id, counterpartId))
    .limit(1);

  // 받은사람이고 아직 안 읽었으면 읽음 처리
  if (row.receiverId === session.sub && !row.isRead) {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, msgId));
  }

  return NextResponse.json({
    success: true,
    data: {
      id: row.id,
      content: row.content,
      isRead: row.receiverId === session.sub ? true : row.isRead,
      createdAt: row.createdAt.toISOString(),
      direction: row.senderId === session.sub ? "sent" : "inbox",
      counterpart: counterpart
        ? { id: counterpart.id, nickname: counterpart.nickname }
        : { id: counterpartId, nickname: "(탈퇴)" },
    },
  });
}

// ── DELETE /api/messages/[id] : 본인 쪽에서만 삭제 (소프트) ──
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const msgId = parseInt(id, 10);
  if (isNaN(msgId)) {
    return NextResponse.json({ success: false, error: "잘못된 id." }, { status: 400 });
  }

  const [row] = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      receiverId: messages.receiverId,
    })
    .from(messages)
    .where(
      and(
        eq(messages.id, msgId),
        or(eq(messages.senderId, session.sub), eq(messages.receiverId, session.sub))
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ success: false, error: "쪽지를 찾을 수 없습니다." }, { status: 404 });
  }

  const patch: { isDeletedSender?: boolean; isDeletedReceiver?: boolean } = {};
  if (row.senderId === session.sub) patch.isDeletedSender = true;
  if (row.receiverId === session.sub) patch.isDeletedReceiver = true;

  await db.update(messages).set(patch).where(eq(messages.id, msgId));
  return NextResponse.json({ success: true });
}
