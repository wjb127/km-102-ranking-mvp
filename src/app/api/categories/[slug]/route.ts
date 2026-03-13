import { NextRequest, NextResponse } from "next/server";
import { mockCategories, getPersonsWithJitter } from "@/lib/mock-data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const category = mockCategories.find((c) => c.slug === slug);

  if (!category) {
    return NextResponse.json(
      { success: false, error: "카테고리를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const persons = getPersonsWithJitter(slug);

  return NextResponse.json({
    success: true,
    data: {
      category,
      persons: persons.sort((a, b) => b.voteCount - a.voteCount),
    },
  });
}
