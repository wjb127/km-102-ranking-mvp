/** 서버 메모리 기반 투표/댓글/신고 저장소 (DB 연결 전 임시) */

export interface MockComment {
  id: number;
  categoryId: number;
  nickname: string;
  content: string;
  reportCount: number;
  isHidden: boolean;
  writerFingerprint: string;
  createdAt: string; // ISO string
}

export interface MockReport {
  commentId: number;
  reason: string;
  reporterFingerprint: string;
}

/** personId_fingerprint 형태로 저장 — 중복 투표 방지 */
const votedSet = new Set<string>();

/** 댓글 목록 */
const comments: MockComment[] = [];
let commentIdSeq = 1;

/** commentId별 신고자 fingerprint */
const reports = new Map<number, Set<string>>();

// ── 투표 관련 ──

export function hasVoted(personId: number, fingerprint: string): boolean {
  return votedSet.has(`${personId}_${fingerprint}`);
}

export function addVote(personId: number, fingerprint: string): void {
  votedSet.add(`${personId}_${fingerprint}`);
}

export function removeVote(personId: number, fingerprint: string): void {
  votedSet.delete(`${personId}_${fingerprint}`);
}

/** 특정 카테고리의 인물 ID 목록 중 fingerprint가 투표한 목록 반환 */
export function getVotedPersonIds(
  personIds: number[],
  fingerprint: string
): number[] {
  return personIds.filter((id) => votedSet.has(`${id}_${fingerprint}`));
}

// ── 댓글 관련 ──

export function getComments(categoryId: number): MockComment[] {
  return comments
    .filter((c) => c.categoryId === categoryId && !c.isHidden)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function addComment(
  categoryId: number,
  nickname: string,
  content: string,
  fingerprint: string
): MockComment {
  const comment: MockComment = {
    id: commentIdSeq++,
    categoryId,
    nickname,
    content,
    reportCount: 0,
    isHidden: false,
    writerFingerprint: fingerprint,
    createdAt: new Date().toISOString(),
  };
  comments.push(comment);
  return comment;
}

// ── 신고 관련 ──

export function hasReported(
  commentId: number,
  fingerprint: string
): boolean {
  const set = reports.get(commentId);
  return set ? set.has(fingerprint) : false;
}

export function addReport(
  commentId: number,
  reason: string,
  fingerprint: string
): { alreadyReported: boolean; hidden: boolean } {
  // 중복 신고 체크
  if (hasReported(commentId, fingerprint)) {
    return { alreadyReported: true, hidden: false };
  }

  // 신고 추가
  if (!reports.has(commentId)) {
    reports.set(commentId, new Set());
  }
  reports.get(commentId)!.add(fingerprint);

  // 댓글의 reportCount 증가
  const comment = comments.find((c) => c.id === commentId);
  if (comment) {
    comment.reportCount += 1;
    // 3회 이상 시 자동 숨김
    if (comment.reportCount >= 3) {
      comment.isHidden = true;
      return { alreadyReported: false, hidden: true };
    }
  }

  return { alreadyReported: false, hidden: false };
}
