/** 카테고리 상태 */
export type CategoryStatus = "pending" | "approved" | "rejected";

/** 인물 상태 */
export type PersonStatus = "pending" | "approved" | "rejected";

/** 카테고리 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  status: CategoryStatus;
  totalVotes: number;
  createdAt: Date;
}

/** 인물 */
export interface Person {
  id: number;
  categoryId: number;
  name: string;
  photoUrl: string | null;
  nationality: string | null;
  description: string | null;
  status: PersonStatus;
  voteCount: number;
  createdAt: Date;
}

/** 투표 */
export interface Vote {
  id: number;
  personId: number;
  voterFingerprint: string;
  createdAt: Date;
}

/** 댓글 */
export interface Comment {
  id: number;
  categoryId: number;
  nickname: string;
  content: string;
  reportCount: number;
  isHidden: boolean;
  writerFingerprint: string;
  createdAt: Date;
}

/** 신고 */
export interface Report {
  id: number;
  commentId: number;
  reason: string | null;
  reporterFingerprint: string;
  createdAt: Date;
}

/** API 응답 래퍼 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
