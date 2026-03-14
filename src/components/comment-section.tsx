"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Flag, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { MockComment } from "@/lib/mock-store";

// ── 타입 ──

interface Props {
  categoryId: number;
  fingerprint: string;
}

const REPORT_REASONS = [
  "스팸/광고",
  "욕설/비방",
  "허위 정보",
  "개인정보 노출",
];

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

// ── 댓글 스켈레톤 ──

function CommentSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 rounded bg-border" />
            <div className="h-3 w-24 rounded bg-border/60" />
          </div>
          <div className="h-4 w-3/4 rounded bg-border/60" />
        </div>
      ))}
    </div>
  );
}

// ── 시간 포맷 ──

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  return `${day}일 전`;
}

// ── 메인 컴포넌트 ──

export default function CommentSection({ categoryId, fingerprint }: Props) {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 신고 모달
  const [reportTarget, setReportTarget] = useState<MockComment | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  // 댓글 목록 SWR (5초마다 폴링)
  const { data, isLoading, mutate } = useSWR(
    `/api/comments?categoryId=${categoryId}`,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: false }
  );

  const comments: MockComment[] = data?.data ?? [];

  // 댓글 작성
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!nickname.trim() || !content.trim() || submitting) return;

      setSubmitting(true);
      try {
        const res = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId,
            nickname: nickname.trim(),
            content: content.trim(),
            fingerprint,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          alert(data.error || "댓글 작성에 실패했습니다.");
          return;
        }
        setContent("");
        await mutate();
      } catch {
        alert("댓글 작성에 실패했습니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [categoryId, nickname, content, fingerprint, submitting, mutate]
  );

  // 신고 처리
  const handleReport = useCallback(async () => {
    if (!reportTarget || !reportReason || reporting) return;

    setReporting(true);
    try {
      const res = await fetch("/api/comments/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: reportTarget.id,
          reason: reportReason,
          fingerprint,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "신고에 실패했습니다.");
        return;
      }
      alert(data.data?.hidden ? "신고가 접수되어 댓글이 숨김 처리되었습니다." : "신고가 접수되었습니다.");
      setReportTarget(null);
      setReportReason("");
      await mutate();
    } catch {
      alert("신고에 실패했습니다.");
    } finally {
      setReporting(false);
    }
  }, [reportTarget, reportReason, fingerprint, reporting, mutate]);

  return (
    <section className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">
          댓글 {comments.length > 0 && <span className="text-muted font-normal text-sm">({comments.length})</span>}
        </h2>
      </div>

      {/* 댓글 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="w-28 shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none"
          />
          <input
            type="text"
            placeholder="댓글을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={300}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !nickname.trim() || !content.trim()}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all",
              submitting || !nickname.trim() || !content.trim()
                ? "cursor-not-allowed bg-primary/40"
                : "bg-primary hover:bg-primary-hover"
            )}
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">등록</span>
          </button>
        </div>
        <p className="text-right text-xs text-muted">{content.length}/300</p>
      </form>

      {/* 댓글 목록 */}
      {isLoading ? (
        <CommentSkeleton />
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-surface/50 py-12 text-center">
          <MessageCircle className="h-8 w-8 text-muted/40" />
          <p className="text-sm text-muted">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {comments.map((comment) => {
              const isMine = comment.writerFingerprint === fingerprint;
              return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="group rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {comment.nickname}
                        </span>
                        {isMine && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            나
                          </span>
                        )}
                        <span className="text-xs text-muted">
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                        {comment.content}
                      </p>
                    </div>

                    {/* 신고 버튼 */}
                    <button
                      onClick={() => setReportTarget(comment)}
                      className="shrink-0 rounded-lg p-1.5 text-muted/50 transition-all hover:bg-danger/10 hover:text-danger"
                      aria-label="댓글 신고"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* 신고 모달 */}
      <Modal
        open={!!reportTarget}
        onClose={() => {
          setReportTarget(null);
          setReportReason("");
        }}
        title="댓글 신고"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span>신고 사유를 선택해주세요</span>
          </div>

          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all",
                  reportReason === reason
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted hover:border-border/80"
                )}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={reason}
                  checked={reportReason === reason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="accent-primary"
                />
                {reason}
              </label>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setReportTarget(null);
                setReportReason("");
              }}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-border/30"
            >
              취소
            </button>
            <button
              onClick={handleReport}
              disabled={!reportReason || reporting}
              className={cn(
                "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all",
                !reportReason || reporting
                  ? "cursor-not-allowed bg-danger/40"
                  : "bg-danger hover:bg-danger/90"
              )}
            >
              {reporting ? "처리 중..." : "신고하기"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
