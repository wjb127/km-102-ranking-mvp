import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) {
    return NextResponse.json({ success: true, data: null });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: session!.sub,
      email: session!.email,
      nickname: session!.nickname,
      role: session!.role,
    },
  });
}
