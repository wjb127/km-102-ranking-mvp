"use client";

import { useParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Eye,
  ThumbsUp,
  Clock,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CommentSection from "@/components/comment-section";

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
  createdAt: string;
}

// ── 상수 ──

const CATEGORY_BADGE: Record<string, string> = {
  분석: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  토론: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  자유: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// ── SWR fetcher ──

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

// ── 날짜 포맷 (YYYY.MM.DD HH:mm) ──

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  const h = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  return `${y}.${m}.${d} ${h}:${min}`;
}

// ── fingerprint 간이 생성 ──

function getFingerprint(): string {
  if (typeof window === "undefined") return "server";
  let fp = localStorage.getItem("board_fingerprint");
  if (!fp) {
    fp = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("board_fingerprint", fp);
  }
  return fp;
}

// ── 스켈레톤 ──

function PostSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-16 rounded bg-border/60" />
      <div className="h-8 w-3/4 rounded bg-border/60" />
      <div className="flex items-center gap-4">
        <div className="h-4 w-20 rounded bg-border/60" />
        <div className="h-4 w-24 rounded bg-border/60" />
        <div className="h-4 w-12 rounded bg-border/60" />
      </div>
      <div className="border-t border-border pt-4 space-y-2">
        <div className="h-4 w-full rounded bg-border/60" />
        <div className="h-4 w-full rounded bg-border/60" />
        <div className="h-4 w-2/3 rounded bg-border/60" />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──

export default function BoardDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [fingerprint, setFingerprint] = useState("anon");

  // fingerprint 초기화
  useEffect(() => {
    setFingerprint(getFingerprint());
  }, []);

  const { data, isLoading, error } = useSWR(
    id ? `/api/board/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const post: BoardPost | null = data?.data ?? null;

  // 좋아요 수 초기화
  useEffect(() => {
    if (post) {
      setLikeCount(post.likes);
    }
  }, [post]);

  // 좋아요 토글
  const handleLike = useCallback(async () => {
    if (liking) return;
    setLiking(true);

    const newLiked = !liked;

    try {
      const res = await fetch(`/api/board/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add: newLiked }),
      });
      const result = await res.json();

      if (res.ok) {
        setLiked(newLiked);
        setLikeCount(result.data.likes);
      }
    } catch {
      // 무시
    } finally {
      setLiking(false);
    }
  }, [id, liked, liking]);

  return (
    <div className="min-h-screen bg-background">
      {/* ── 헤더 ── */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/board"
            className="flex items-center gap-1 text-muted hover:text-foreground transition-colors text-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>목록</span>
          </Link>
          <h1 className="text-lg font-bold text-foreground">
            자유게시판
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <PostSkeleton />
        ) : error || !post ? (
          <div className="text-center py-16">
            <p className="text-muted mb-4">
              {error ? "게시글을 불러올 수 없습니다." : "게시글을 찾을 수 없습니다."}
            </p>
            <Link
              href="/board"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ChevronLeft className="h-4 w-4" />
              목록으로 돌아가기
            </Link>
          </div>
        ) : (
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" as const }}
            className="space-y-5"
          >
            {/* ── 글 헤더 ── */}
            <div className="space-y-3">
              {/* 카테고리 뱃지 */}
              <span
                className={cn(
                  "inline-block rounded px-2 py-0.5 text-xs font-medium border",
                  CATEGORY_BADGE[post.category]
                )}
              >
                {post.category}
              </span>

              {/* 제목 */}
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                {post.title}
              </h2>

              {/* 메타 정보 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {post.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatFullDate(post.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  조회 {post.views}
                </span>
              </div>
            </div>

            {/* ── 구분선 ── */}
            <div className="border-t border-border" />

            {/* ── 본문 ── */}
            <div className="py-4 min-h-[120px]">
              <p className="text-foreground/90 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* ── 추천 버튼 ── */}
            <div className="flex justify-center py-4">
              <button
                onClick={handleLike}
                disabled={liking}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-8 py-4 transition-all",
                  liked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/50 hover:text-primary"
                )}
              >
                {liking ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <ThumbsUp
                    className={cn(
                      "h-6 w-6 transition-transform",
                      liked && "fill-primary scale-110"
                    )}
                  />
                )}
                <span className="text-lg font-bold">{likeCount}</span>
                <span className="text-xs">추천</span>
              </button>
            </div>

            {/* ── 구분선 ── */}
            <div className="border-t border-border" />

            {/* ── 댓글 섹션 ── */}
            <CommentSection
              categoryId={post.id}
              fingerprint={fingerprint}
            />

            {/* ── 목록으로 돌아가기 ── */}
            <div className="pt-4 border-t border-border">
              <Link
                href="/board"
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                목록으로 돌아가기
              </Link>
            </div>
          </motion.article>
        )}
      </main>
    </div>
  );
}
