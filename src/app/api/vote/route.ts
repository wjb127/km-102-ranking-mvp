import { NextRequest, NextResponse } from "next/server";
import { simulateVote, getPersonsBySlug } from "@/lib/mock-data";
import { hasVoted, addVote, removeVote } from "@/lib/mock-store";

export async function POST(req: NextRequest) {
  const { slug, personId, fingerprint } = await req.json();

  if (!slug || !personId || !fingerprint) {
    return NextResponse.json(
      { success: false, error: "slug, personId, fingerprint가 필요합니다." },
      { status: 400 }
    );
  }

  // 인물 존재 확인
  const persons = getPersonsBySlug(slug);
  const person = persons.find((p) => p.id === personId);
  if (!person) {
    return NextResponse.json(
      { success: false, error: "인물을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 토글 방식: 이미 투표했으면 취소, 아니면 투표
  const alreadyVoted = hasVoted(personId, fingerprint);

  if (alreadyVoted) {
    // 투표 취소
    removeVote(personId, fingerprint);
    simulateVote(slug, personId, -1);
    return NextResponse.json({
      success: true,
      data: { ...person, voteCount: person.voteCount },
      voted: false,
    });
  } else {
    // 새 투표
    addVote(personId, fingerprint);
    simulateVote(slug, personId, 1);
    return NextResponse.json({
      success: true,
      data: { ...person, voteCount: person.voteCount },
      voted: true,
    });
  }
}
