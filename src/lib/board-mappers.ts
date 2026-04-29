// ── 게시판 카테고리 한국어 ↔ DB slug 매핑

export const CATEGORY_KO_TO_SLUG: Record<string, string> = {
  분석: "analysis",
  토론: "discussion",
  자유: "free",
};

export const CATEGORY_SLUG_TO_KO: Record<string, "분석" | "토론" | "자유"> = {
  analysis: "분석",
  discussion: "토론",
  free: "자유",
};

export type BoardCategoryKo = "분석" | "토론" | "자유";

export function toSlug(ko: string): string | null {
  return CATEGORY_KO_TO_SLUG[ko] ?? null;
}

export function toKo(slug: string): BoardCategoryKo | null {
  return CATEGORY_SLUG_TO_KO[slug] ?? null;
}

// DB row → 프론트에서 기대하는 BoardPost 형태
export interface BoardPostDTO {
  id: number;
  category: BoardCategoryKo;
  title: string;
  content: string;
  author: string;
  hasImage: boolean;
  imageUrls: string[];
  views: number;
  likes: number;
  commentCount: number;
  createdAt: string;
}

export function rowToDto(row: {
  id: number;
  category: string;
  title: string;
  content: string;
  authorNickname: string;
  imageUrls: string[] | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
}): BoardPostDTO {
  return {
    id: row.id,
    category: toKo(row.category) ?? "자유",
    title: row.title,
    content: row.content,
    author: row.authorNickname,
    hasImage: (row.imageUrls?.length ?? 0) > 0,
    imageUrls: row.imageUrls ?? [],
    views: row.viewCount,
    likes: row.likeCount,
    commentCount: row.commentCount,
    createdAt: row.createdAt.toISOString(),
  };
}
