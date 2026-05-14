import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boardPosts } from "@/db/schema";
import { SITE_URL } from "@/lib/site";
import BoardDetailClient from "./board-detail-client";

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

const CATEGORY_LABEL: Record<string, string> = {
  analysis: "분석",
  discussion: "토론",
  free: "자유",
};

export async function generateMetadata({ params }: BoardPageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return {};

  const [row] = await db
    .select({
      title: boardPosts.title,
      content: boardPosts.content,
      category: boardPosts.category,
      authorNickname: boardPosts.authorNickname,
      isDeleted: boardPosts.isDeleted,
      hiddenByAdmin: boardPosts.hiddenByAdmin,
    })
    .from(boardPosts)
    .where(eq(boardPosts.id, numericId))
    .limit(1);

  if (!row || row.isDeleted || row.hiddenByAdmin) {
    return { robots: { index: false, follow: false } };
  }

  const categoryLabel = CATEGORY_LABEL[row.category] ?? row.category;
  const snippet = row.content.replace(/\s+/g, " ").slice(0, 140);

  return {
    title: row.title,
    description: snippet,
    alternates: { canonical: `/board/${numericId}` },
    openGraph: {
      title: `[${categoryLabel}] ${row.title}`,
      description: snippet,
      url: `${SITE_URL}/board/${numericId}`,
      type: "article",
      authors: row.authorNickname ? [row.authorNickname] : undefined,
    },
    twitter: {
      card: "summary",
      title: row.title,
      description: snippet,
    },
  };
}

export default function BoardPage() {
  return <BoardDetailClient />;
}
