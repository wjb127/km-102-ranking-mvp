"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenSquare,
  X,
  Image as ImageIcon,
  Eye,
  ThumbsUp,
  MessageCircle,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── 타입 ──

interface BoardPost {
  id: number;
  category: "분석" | "토론" | "자유";
  title: string;
  content: string;
  author: string;
  hasImage: boolean;
  views: number;
  likes: number;
  commentCount: number;
  createdAt: string; // ISO string (서버에서 직렬화)
}

type CategoryFilter = "전체" | "분석" | "토론" | "자유";

// ── 상수 ──

const CATEGORIES: CategoryFilter[] = ["전체", "분석", "토론", "자유"];

const CATEGORY_BADGE: Record<string, string> = {
  분석: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  토론: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  자유: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const CATEGORY_WRITE: { value: BoardPost["category"]; label: string }[] = [
  { value: "분석", label: "분석" },
  { value: "토론", label: "토론" },
  { value: "자유", label: "자유" },
];

// ── SWR fetcher ──

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

// ── 날짜 포맷 (오늘이면 시:분, 아니면 MM.DD) ──

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}.${day}`;
}

// ── 스켈레톤 ──

function TableSkeleton() {
  return (
    <div className="hidden md:block border border-border rounded-lg overflow-hidden">
      <div className="bg-surface">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 animate-pulse"
          >
            <div className="w-12 h-4 rounded bg-border/60" />
            <div className="w-14 h-5 rounded bg-border/60" />
            <div className="flex-1 h-4 rounded bg-border/60" />
            <div className="w-16 h-4 rounded bg-border/60" />
            <div className="w-14 h-4 rounded bg-border/60" />
            <div className="w-10 h-4 rounded bg-border/60" />
            <div className="w-10 h-4 rounded bg-border/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="md:hidden space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-surface p-3 animate-pulse space-y-2"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-5 rounded bg-border/60" />
            <div className="flex-1 h-4 rounded bg-border/60" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-3 rounded bg-border/60" />
            <div className="w-10 h-3 rounded bg-border/60" />
            <div className="w-10 h-3 rounded bg-border/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 글쓰기 폼 ──

interface WriteFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function WriteForm({ onClose, onSuccess }: WriteFormProps) {
  const [category, setCategory] = useState<BoardPost["category"]>("자유");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;

      // 클라이언트 사전 검증
      if (title.trim().length < 2) {
        setError("제목을 2자 이상 입력해주세요.");
        return;
      }
      if (author.trim().length < 2) {
        setError("글쓴이를 2자 이상 입력해주세요.");
        return;
      }
      if (content.trim().length < 2) {
        setError("내용을 2자 이상 입력해주세요.");
        return;
      }

      setSubmitting(true);
      setError("");

      try {
        const res = await fetch("/api/board", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            title: title.trim(),
            content: content.trim(),
            author: author.trim(),
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "글 작성에 실패했습니다.");
          return;
        }

        onSuccess();
      } catch {
        setError("글 작성에 실패했습니다.");
      } finally {
        setSubmitting(false);
      }
    },
    [category, title, author, content, submitting, onSuccess]
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
      className="overflow-hidden"
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-surface p-4 space-y-3"
      >
        {/* 상단: 분류 + 글쓴이 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as BoardPost["category"])
            }
            className="w-full sm:w-28 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {CATEGORY_WRITE.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="글쓴이 (2~20자)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={20}
            className="w-full sm:w-36 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none"
          />
        </div>

        {/* 제목 */}
        <input
          type="text"
          placeholder="제목 (2~100자)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none"
        />

        {/* 내용 */}
        <textarea
          placeholder="내용을 입력하세요 (2~5000자)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={5000}
          rows={6}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none resize-y"
        />

        {/* 글자수 카운트 */}
        <div className="flex justify-end text-xs text-muted">
          {content.length}/5000
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-border/30 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors",
              submitting
                ? "cursor-not-allowed bg-primary/40"
                : "bg-primary hover:bg-primary-hover"
            )}
          >
            {submitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                등록 중...
              </span>
            ) : (
              "등록"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ── 메인 페이지 컴포넌트 ──

export default function BoardPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("전체");
  const [showWriteForm, setShowWriteForm] = useState(false);

  const { data, isLoading, error, mutate } = useSWR(
    `/api/board?category=${encodeURIComponent(activeCategory)}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const posts: BoardPost[] = data?.data ?? [];

  const handleWriteSuccess = useCallback(() => {
    setShowWriteForm(false);
    mutate();
  }, [mutate]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── 헤더 ── */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-muted hover:text-foreground transition-colors text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">홈</span>
            </Link>
            <h1 className="text-lg font-bold text-foreground">
              자유게시판
            </h1>
          </div>
          <button
            onClick={() => setShowWriteForm((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              showWriteForm
                ? "bg-border/50 text-muted"
                : "bg-primary text-white hover:bg-primary-hover"
            )}
          >
            {showWriteForm ? (
              <>
                <X className="h-4 w-4" />
                닫기
              </>
            ) : (
              <>
                <PenSquare className="h-4 w-4" />
                글쓰기
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* ── 글쓰기 폼 ── */}
        <AnimatePresence>
          {showWriteForm && (
            <WriteForm
              onClose={() => setShowWriteForm(false)}
              onSuccess={handleWriteSuccess}
            />
          )}
        </AnimatePresence>

        {/* ── 카테고리 탭 ── */}
        <div className="flex items-center gap-1 border-b border-border">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                activeCategory === cat
                  ? "text-primary"
                  : "text-muted hover:text-foreground"
              )}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div
                  layoutId="board-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ duration: 0.25, ease: "easeOut" as const }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── 게시글 수 ── */}
        {!isLoading && !error && (
          <p className="text-xs text-muted">
            총 {posts.length}개의 글
          </p>
        )}

        {/* ── 데스크톱: 테이블 ── */}
        {isLoading ? (
          <>
            <TableSkeleton />
            <MobileSkeleton />
          </>
        ) : error ? (
          <div className="text-center py-16 text-muted">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted">
            게시글이 없습니다. 첫 글을 작성해보세요!
          </div>
        ) : (
          <>
            {/* 데스크톱 테이블 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
              className="hidden md:block border border-border rounded-lg overflow-hidden"
            >
              {/* 테이블 헤더 */}
              <div className="flex items-center gap-0 px-4 py-2.5 text-xs font-semibold text-muted bg-surface border-b border-border">
                <span className="w-14 text-center shrink-0">번호</span>
                <span className="w-16 text-center shrink-0">분류</span>
                <span className="flex-1 pl-2">제목</span>
                <span className="w-20 text-center shrink-0">글쓴이</span>
                <span className="w-16 text-center shrink-0">날짜</span>
                <span className="w-14 text-center shrink-0">조회</span>
                <span className="w-14 text-center shrink-0">추천</span>
              </div>

              {/* 테이블 행 */}
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/board/${post.id}`}
                  className="flex items-center gap-0 px-4 py-2.5 text-sm border-b border-border last:border-b-0 bg-surface hover:bg-background transition-colors"
                >
                  <span className="w-14 text-center shrink-0 text-muted text-xs">
                    {post.id}
                  </span>
                  <span className="w-16 text-center shrink-0">
                    <span
                      className={cn(
                        "inline-block rounded px-1.5 py-0.5 text-[11px] font-medium border",
                        CATEGORY_BADGE[post.category]
                      )}
                    >
                      {post.category}
                    </span>
                  </span>
                  <span className="flex-1 pl-2 flex items-center gap-1.5 min-w-0">
                    <span className="truncate text-foreground hover:text-primary transition-colors">
                      {post.title}
                    </span>
                    {post.hasImage && (
                      <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted/60" />
                    )}
                    {post.commentCount > 0 && (
                      <span className="text-primary text-xs font-semibold shrink-0">
                        [{post.commentCount}]
                      </span>
                    )}
                  </span>
                  <span className="w-20 text-center shrink-0 text-muted text-xs truncate">
                    {post.author}
                  </span>
                  <span className="w-16 text-center shrink-0 text-muted text-xs">
                    {formatDate(post.createdAt)}
                  </span>
                  <span className="w-14 text-center shrink-0 text-muted text-xs">
                    {post.views}
                  </span>
                  <span className="w-14 text-center shrink-0 text-muted text-xs">
                    {post.likes}
                  </span>
                </Link>
              ))}
            </motion.div>

            {/* 모바일 리스트 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
              className="md:hidden space-y-1.5"
            >
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/board/${post.id}`}
                  className="block rounded-lg border border-border bg-surface p-3 hover:bg-background transition-colors"
                >
                  {/* 상단: 카테고리 + 제목 */}
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "inline-block shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium border mt-0.5",
                        CATEGORY_BADGE[post.category]
                      )}
                    >
                      {post.category}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground line-clamp-1">
                        {post.title}
                        {post.hasImage && (
                          <ImageIcon className="inline h-3.5 w-3.5 ml-1 text-muted/60" />
                        )}
                        {post.commentCount > 0 && (
                          <span className="text-primary text-xs font-semibold ml-1">
                            [{post.commentCount}]
                          </span>
                        )}
                      </span>
                    </span>
                  </div>

                  {/* 하단: 메타 정보 */}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted pl-0">
                    <span>{post.author}</span>
                    <span>{formatDate(post.createdAt)}</span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {post.views}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp className="h-3 w-3" />
                      {post.likes}
                    </span>
                    {post.commentCount > 0 && (
                      <span className="flex items-center gap-0.5">
                        <MessageCircle className="h-3 w-3" />
                        {post.commentCount}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
