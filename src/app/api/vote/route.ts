import { NextRequest, NextResponse } from "next/server";
import { simulateVote } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  const { slug, personId } = await req.json();

  if (!slug || !personId) {
    return NextResponse.json(
      { success: false, error: "slug와 personId가 필요합니다." },
      { status: 400 }
    );
  }

  const person = simulateVote(slug, personId);

  if (!person) {
    return NextResponse.json(
      { success: false, error: "인물을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: person,
  });
}
