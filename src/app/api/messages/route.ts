import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";
import { requireSession } from "@/lib/auth/guard";

// ── GET /api/messages?box=inbox|sent ──
// 받은편지함 기본. ?box=sent 이면 보낸편지함.
export async function GET(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const box = searchParams.get("box") === "sent" ? "sent" : "inbox";

  // 상대방 정보 조인
  const senderAlias = users;
  const receiverAlias = users;

  if (box === "inbox") {
    const rows = await db
      .select({
        id: messages.id,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderNickname: senderAlias.nickname,
      })
      .from(messages)
      .leftJoin(senderAlias, eq(messages.senderId, senderAlias.id))
      .where(
        and(
          eq(messages.receiverId, session.sub),
          eq(messages.isDeletedReceiver, false)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(100);

    const data = rows.map((r) => ({
      id: r.id,
      content: r.content,
      isRead: r.isRead,
      createdAt: r.createdAt.toISOString(),
      counterpart: {
        id: r.senderId,
        nickname: r.senderNickname ?? "(탈퇴)",
      },
    }));

    const [{ unread = 0 } = { unread: 0 }] = await db
      .select({ unread: sql<number>`COUNT(*)::int` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, session.sub),
          eq(messages.isRead, false),
          eq(messages.isDeletedReceiver, false)
        )
      );

    return NextResponse.json({ success: true, data, unread: Number(unread) });
  }

  // sent
  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      isRead: messages.isRead,
      createdAt: messages.createdAt,
      receiverId: messages.receiverId,
      receiverNickname: receiverAlias.nickname,
    })
    .from(messages)
    .leftJoin(receiverAlias, eq(messages.receiverId, receiverAlias.id))
    .where(
      and(
        eq(messages.senderId, session.sub),
        eq(messages.isDeletedSender, false)
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(100);

  const data = rows.map((r) => ({
    id: r.id,
    content: r.content,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
    counterpart: {
      id: r.receiverId,
      nickname: r.receiverNickname ?? "(탈퇴)",
    },
  }));

  return NextResponse.json({ success: true, data });
}

// ── POST /api/messages ── { receiverNickname, content }
export async function POST(req: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  try {
    const body = await req.json();
    const receiverNickname = String(body.receiverNickname ?? "").trim();
    const content = String(body.content ?? "").trim();

    if (!receiverNickname || !content) {
      return NextResponse.json(
        { success: false, error: "수신자 닉네임과 내용은 필수입니다." },
        { status: 400 }
      );
    }
    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: "쪽지는 1000자 이내로 작성해주세요." },
        { status: 400 }
      );
    }

    const [receiver] = await db
      .select({ id: users.id, nickname: users.nickname })
      .from(users)
      .where(eq(users.nickname, receiverNickname))
      .limit(1);

    if (!receiver) {
      return NextResponse.json(
        { success: false, error: "해당 닉네임의 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    if (receiver.id === session.sub) {
      return NextResponse.json(
        { success: false, error: "본인에게는 쪽지를 보낼 수 없습니다." },
        { status: 400 }
      );
    }

    const [inserted] = await db
      .insert(messages)
      .values({
        senderId: session.sub,
        receiverId: receiver.id,
        content,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: inserted.id,
          content: inserted.content,
          createdAt: inserted.createdAt.toISOString(),
          counterpart: { id: receiver.id, nickname: receiver.nickname },
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[POST /api/messages]", e);
    return NextResponse.json({ success: false, error: "쪽지 전송 실패." }, { status: 500 });
  }
}
