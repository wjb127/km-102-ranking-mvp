import { NextRequest, NextResponse } from "next/server";
import { mockCategories, getPersonsBySlug } from "@/lib/mock-data";
import { getVotedPersonIds } from "@/lib/mock-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const fingerprint = searchParams.get("fingerprint");

  if (!slug || !fingerprint) {
    return NextResponse.json(
      { success: false, error: "slug와 fingerprint가 필요합니다." },
      { status: 400 }
    );
  }

  const category = mockCategories.find((c) => c.slug === slug);
  if (!category) {
    return NextResponse.json(
      { success: false, error: "카테고리를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const persons = getPersonsBySlug(slug);
  const personIds = persons.map((p) => p.id);
  const votedPersonIds = getVotedPersonIds(personIds, fingerprint);

  return NextResponse.json({
    success: true,
    data: { votedPersonIds },
  });
}
