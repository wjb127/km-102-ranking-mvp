"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
  Flame,
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
type SortMode = "전체글" | "베스트" | "실시간";

// ── 상수 ──

const CATEGORIES: CategoryFilter[] = ["전체", "분석", "토론", "자유"];
const SORT_MODES: { value: SortMode; label: string }[] = [
  { value: "전체글", label: "전체글" },
  { value: "베스트", label: "베스트" },
  { value: "실시간", label: "실시간" },
];

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

// 베스트 기준: likes >= 50
const BEST_THRESHOLD = 50;
// 실시간 기준: 6시간 이내
const REALTIME_HOURS = 6;

// ── SWR fetcher ──

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

// ── 날짜 포맷: 1시간 이내 → n분전/방금전, 오늘 → HH:mm, 이전 → MM/DD ──

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 1000 / 60);

  // 1시간 이내
  if (diffMins < 1) return "방금전";
  if (diffMins < 60) return `${diffMins}분전`;

  // 오늘
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  // 그 이전
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}/${day}`;
}

// ── 조회수 축약: 1000 이상이면 1.2k ──

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ── 정렬 필터 로직 ──

function applySort(posts: BoardPost[], sortMode: SortMode): BoardPost[] {
  if (sortMode === "베스트") {
    // likes >= 50인 글만, 추천 많은 순
    return [...posts]
      .filter((p) => p.likes >= BEST_THRESHOLD)
      .sort((a, b) => b.likes - a.likes);
  }
  if (sortMode === "실시간") {
    // 최근 6시간 이내 글, 최신순
    const cutoff = new Date(Date.now() - REALTIME_HOURS * 60 * 60 * 1000);
    return [...posts]
      .filter((p) => new Date(p.createdAt) >= cutoff)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  // 전체글: 최신순 (API 기본 정렬)
  return posts;
}

// ── 스켈레톤 ──

function TableSkeleton() {
  return (
    <div className="hidden md:block border border-border/50 rounded-lg overflow-hidden">
      <div className="bg-surface">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-0 px-3 py-1.5 border-b border-border/50 last:border-b-0 animate-pulse"
          >
            <div className="w-10 h-3.5 rounded bg-border/60" />
            <div className="w-12 h-4 rounded bg-border/60 ml-2" />
            <div className="flex-1 h-3.5 rounded bg-border/60 ml-2" />
            <div className="w-16 h-3.5 rounded bg-border/60 ml-2" />
            <div className="w-12 h-3.5 rounded bg-border/60 ml-2" />
            <div className="w-10 h-3.5 rounded bg-border/60 ml-2" />
            <div className="w-10 h-3.5 rounded bg-border/60 ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileSkeleton() {
  return (
    <div className="md:hidden space-y-px">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="border-b border-border/50 bg-surface px-3 py-2 animate-pulse space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-4 rounded bg-border/60" />
            <div className="flex-1 h-3.5 rounded bg-border/60" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-3 rounded bg-border/60" />
            <div className="w-8 h-3 rounded bg-border/60" />
            <div className="w-8 h-3 rounded bg-border/60" />
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
  const [loggedInNickname, setLoggedInNickname] = useState<string | null>(null);

  // 로그인 상태 확인 → 글쓴이 자동 채움
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        const nick = json?.data?.nickname as string | undefined;
        if (!cancelled && nick) {
          setLoggedInNickname(nick);
          setAuthor(nick);
        }
      } catch {
        /* 비로그인 — 기존 익명 입력 유지 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
            placeholder="ㅇㅇ"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            readOnly={!!loggedInNickname}
            maxLength={20}
            title={loggedInNickname ? "로그인 닉네임 고정" : undefined}
            className={cn(
              "w-full sm:w-36 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none",
              loggedInNickname && "cursor-not-allowed opacity-70"
            )}
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
  const [sortMode, setSortMode] = useState<SortMode>("전체글");
  const [showWriteForm, setShowWriteForm] = useState(false);

  const { data, isLoading, error, mutate } = useSWR(
    `/api/board?category=${encodeURIComponent(activeCategory)}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const rawPosts: BoardPost[] = data?.data ?? [];

  // 정렬 모드 적용
  const posts = useMemo(() => applySort(rawPosts, sortMode), [rawPosts, sortMode]);

  const handleWriteSuccess = useCallback(() => {
    setShowWriteForm(false);
    mutate();
  }, [mutate]);

  // 카테고리 변경 시 실시간/베스트 탭은 유지 (UX 자연스럽게)
  const handleCategoryChange = (cat: CategoryFilter) => {
    setActiveCategory(cat);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── 헤더 ── */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-muted hover:text-foreground transition-colors text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">홈</span>
            </Link>
            <h1 className="text-base font-bold text-foreground">
              MMA 자유게시판
            </h1>
          </div>
          <button
            onClick={() => setShowWriteForm((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              showWriteForm
                ? "bg-border/50 text-muted"
                : "bg-primary text-white hover:bg-primary-hover"
            )}
          >
            {showWriteForm ? (
              <>
                <X className="h-3.5 w-3.5" />
                닫기
              </>
            ) : (
              <>
                <PenSquare className="h-3.5 w-3.5" />
                글쓰기
              </>
            )}
          </button>
        </div>

        {/* ── 탭 2줄 ── */}
        <div className="max-w-5xl mx-auto px-4">
          {/* 1줄: 카테고리 탭 */}
          <div className="flex items-center gap-0 border-b border-border/50">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={cn(
                  "relative px-3.5 py-2 text-xs font-medium transition-colors",
                  activeCategory === cat
                    ? "text-primary"
                    : "text-muted hover:text-foreground"
                )}
              >
                {cat}
                {activeCategory === cat && (
                  <motion.div
                    layoutId="board-cat-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ duration: 0.2, ease: "easeOut" as const }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* 2줄: 정렬 탭 */}
          <div className="flex items-center gap-0 pb-0">
            {SORT_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setSortMode(mode.value)}
                className={cn(
                  "relative px-3.5 py-1.5 text-[11px] font-medium transition-colors",
                  sortMode === mode.value
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-1">
                  {mode.value === "베스트" && (
                    <Flame className="h-3 w-3 text-orange-400" />
                  )}
                  {mode.value === "실시간" && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  )}
                  {mode.label}
                </span>
                {sortMode === mode.value && (
                  <motion.div
                    layoutId="board-sort-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground/40"
                    transition={{ duration: 0.2, ease: "easeOut" as const }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-3 space-y-3">
        {/* ── 글쓰기 폼 ── */}
        <AnimatePresence>
          {showWriteForm && (
            <WriteForm
              onClose={() => setShowWriteForm(false)}
              onSuccess={handleWriteSuccess}
            />
          )}
        </AnimatePresence>

        {/* ── 글 수 표시 ── */}
        {!isLoading && !error && (
          <p className="text-[11px] text-muted font-mono">
            {sortMode === "베스트" && "추천 50+ 인기글 · "}
            {sortMode === "실시간" && "최근 6시간 이내 · "}
            총 {posts.length}개
          </p>
        )}

        {/* ── 게시글 목록 ── */}
        {isLoading ? (
          <>
            <TableSkeleton />
            <MobileSkeleton />
          </>
        ) : error ? (
          <div className="text-center py-16 text-muted text-sm">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">
            {sortMode === "베스트" && "추천 50개 이상인 글이 없습니다."}
            {sortMode === "실시간" && "최근 6시간 이내 작성된 글이 없습니다."}
            {sortMode === "전체글" && "게시글이 없습니다. 첫 글을 작성해보세요!"}
          </div>
        ) : (
          <>
            {/* ── 데스크톱 테이블 ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className="hidden md:block border border-border/50 rounded-lg overflow-hidden"
            >
              {/* 테이블 헤더 */}
              <div className="flex items-center px-3 py-1.5 text-[10px] font-semibold text-muted bg-surface border-b border-border/50 uppercase tracking-wide">
                <span className="w-10 text-center shrink-0">번호</span>
                <span className="w-14 text-center shrink-0 ml-2">분류</span>
                <span className="flex-1 pl-2">제목</span>
                <span className="w-18 text-center shrink-0">글쓴이</span>
                <span className="w-14 text-center shrink-0">날짜</span>
                <span className="w-12 text-center shrink-0">조회</span>
                <span className="w-10 text-center shrink-0">추천</span>
              </div>

              {/* 테이블 행 */}
              {posts.map((post) => {
                // 베스트 글 (likes >= 50) 여부
                const isBest = post.likes >= BEST_THRESHOLD;
                return (
                  <Link
                    key={post.id}
                    href={`/board/${post.id}`}
                    className={cn(
                      "flex items-center px-3 py-1 text-xs border-b border-border/50 last:border-b-0 transition-colors group",
                      isBest
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "bg-surface hover:bg-primary/5"
                    )}
                  >
                    {/* 번호 */}
                    <span className="w-10 text-center shrink-0 text-muted font-mono text-[10px]">
                      {post.id}
                    </span>

                    {/* 분류 배지 */}
                    <span className="w-14 text-center shrink-0 ml-2">
                      <span
                        className={cn(
                          "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium border",
                          CATEGORY_BADGE[post.category]
                        )}
                      >
                        {post.category}
                      </span>
                    </span>

                    {/* 제목 */}
                    <span className="flex-1 pl-2 flex items-center gap-1 min-w-0">
                      {/* 베스트 빨간 점 */}
                      {isBest && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                      <span className="truncate text-foreground group-hover:text-primary transition-colors">
                        {post.title}
                      </span>
                      {post.hasImage && (
                        <ImageIcon className="h-3 w-3 shrink-0 text-muted/50" />
                      )}
                      {post.commentCount > 0 && (
                        <span className="text-primary text-[10px] font-bold shrink-0">
                          [{post.commentCount}]
                        </span>
                      )}
                    </span>

                    {/* 글쓴이 */}
                    <span className="w-18 text-center shrink-0 text-muted text-[10px] truncate px-1">
                      {post.author}
                    </span>

                    {/* 날짜 */}
                    <span className="w-14 text-center shrink-0 text-muted text-[10px] font-mono">
                      {formatDate(post.createdAt)}
                    </span>

                    {/* 조회수 */}
                    <span className="w-12 text-center shrink-0 text-muted text-[10px] font-mono">
                      {formatViews(post.views)}
                    </span>

                    {/* 추천 */}
                    <span
                      className={cn(
                        "w-10 text-center shrink-0 text-[10px] font-mono",
                        isBest ? "text-primary font-bold" : "text-muted"
                      )}
                    >
                      {post.likes}
                    </span>
                  </Link>
                );
              })}
            </motion.div>

            {/* ── 모바일 리스트 ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className="md:hidden border border-border/50 rounded-lg overflow-hidden"
            >
              {posts.map((post, idx) => {
                const isBest = post.likes >= BEST_THRESHOLD;
                return (
                  <Link
                    key={post.id}
                    href={`/board/${post.id}`}
                    className={cn(
                      "block px-3 py-2 border-b border-border/50 last:border-b-0 transition-colors",
                      isBest
                        ? "bg-primary/5 hover:bg-primary/10"
                        : idx % 2 === 0
                          ? "bg-surface hover:bg-primary/5"
                          : "bg-background hover:bg-primary/5"
                    )}
                  >
                    {/* 카테고리 배지 + 제목 */}
                    <div className="flex items-start gap-1.5">
                      <span
                        className={cn(
                          "inline-block shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium border mt-0.5",
                          CATEGORY_BADGE[post.category]
                        )}
                      >
                        {post.category}
                      </span>
                      <span className="flex-1 min-w-0 flex items-baseline gap-1 flex-wrap">
                        {isBest && (
                          <span className="shrink-0 inline-block w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                        )}
                        <span className="text-xs font-medium text-foreground line-clamp-1">
                          {post.title}
                        </span>
                        {post.hasImage && (
                          <ImageIcon className="inline h-3 w-3 text-muted/50 shrink-0" />
                        )}
                        {post.commentCount > 0 && (
                          <span className="text-primary text-[10px] font-bold shrink-0">
                            [{post.commentCount}]
                          </span>
                        )}
                      </span>
                    </div>

                    {/* 메타 정보 한 줄 */}
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted font-mono">
                      <span className="text-muted/80">{post.author}</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-2.5 w-2.5" />
                        {formatViews(post.views)}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-0.5",
                          isBest && "text-primary font-bold"
                        )}
                      >
                        <ThumbsUp className="h-2.5 w-2.5" />
                        {post.likes}
                      </span>
                      {post.commentCount > 0 && (
                        <span className="flex items-center gap-0.5">
                          <MessageCircle className="h-2.5 w-2.5" />
                          {post.commentCount}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
