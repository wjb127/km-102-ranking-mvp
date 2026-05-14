"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Heart,
  Crown,
  Swords,
  Flame,
  Target,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";

// ── 타입 ──

interface FighterVote {
  id: string;
  fighterId: number;
  name: string;
  imageUrl: string | null;
  voteCount: number;
  voted: boolean;
}

interface CategoryVoteData {
  category: string;
  label: string;
  description: string;
  fighters: FighterVote[];
  totalVotes: number;
}

interface CategorySummary {
  slug: string;
  label: string;
  description: string;
  fighterCount: number;
  totalVotes: number;
}

// ── 카테고리 메타 (아이콘, 색상) ──

const CATEGORY_META: Record<
  string,
  { icon: typeof Trophy; color: string; bgColor: string }
> = {
  "pound-for-pound": {
    icon: Crown,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
  },
  heavyweight: {
    icon: Swords,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  lightweight: {
    icon: Flame,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
  },
  "knockout-artist": {
    icon: Target,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
  },
  "submission-artist": {
    icon: Swords,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
};

// ── 순위별 메달 스타일 ──

function getRankStyle(rank: number) {
  switch (rank) {
    case 1:
      return {
        border: "border-yellow-400/40",
        bg: "bg-yellow-400/5",
        badge: "bg-yellow-400 text-black",
        text: "text-yellow-400",
      };
    case 2:
      return {
        border: "border-gray-400/30",
        bg: "bg-gray-400/5",
        badge: "bg-gray-400 text-black",
        text: "text-gray-400",
      };
    case 3:
      return {
        border: "border-amber-600/30",
        bg: "bg-amber-600/5",
        badge: "bg-amber-600 text-white",
        text: "text-amber-600",
      };
    default:
      return {
        border: "border-border",
        bg: "bg-surface",
        badge: "bg-surface text-muted",
        text: "text-muted",
      };
  }
}

function VoteDistribution({ voteData }: { voteData: CategoryVoteData }) {
  const topFighters = voteData.fighters.slice(0, 6);

  return (
    <motion.div
      key={`distribution-${voteData.category}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" as const }}
      className="mb-6 rounded-xl border border-border bg-surface p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-foreground">득표 분포</h4>
          <p className="text-[11px] text-muted">상위 후보별 투표 비중</p>
        </div>
        <span className="text-xs font-semibold text-muted">
          {voteData.totalVotes.toLocaleString()}표
        </span>
      </div>
      <div className="space-y-2.5">
        {topFighters.map((fighter, index) => {
          const percentage =
            voteData.totalVotes > 0
              ? (fighter.voteCount / voteData.totalVotes) * 100
              : 0;
          const rank = index + 1;
          const style = getRankStyle(rank);

          return (
            <div key={fighter.id} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-black",
                    style.badge
                  )}
                >
                  {rank}
                </span>
                <span className="truncate text-xs font-semibold text-foreground">
                  {fighter.name}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-border/60">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    rank === 1
                      ? "bg-yellow-400"
                      : rank === 2
                        ? "bg-gray-400"
                        : rank === 3
                          ? "bg-amber-600"
                          : "bg-primary"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{
                    duration: 0.55,
                    delay: index * 0.04,
                    ease: "easeOut" as const,
                  }}
                />
              </div>
              <span className="w-12 text-right text-xs font-bold tabular-nums text-foreground">
                {percentage.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── fetcher ──
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── 메인 컴포넌트 ──

export default function VotePage() {
  const [activeCategory, setActiveCategory] = useState("pound-for-pound");
  const [fingerprint, setFingerprint] = useState<string>("");
  const [votingId, setVotingId] = useState<string | null>(null);

  // fingerprint 로드
  useEffect(() => {
    getFingerprint().then(setFingerprint);
  }, []);

  // 카테고리 목록
  const { data: categoriesRes, mutate: mutateCategories } = useSWR<{ data: CategorySummary[] }>(
    "/api/mma-vote",
    fetcher,
    { revalidateOnFocus: false }
  );
  const categories = categoriesRes?.data ?? [];

  // 선택된 카테고리 투표 데이터
  const {
    data: voteRes,
    mutate: mutateVotes,
  } = useSWR<{ data: CategoryVoteData }>(
    fingerprint
      ? `/api/mma-vote?category=${activeCategory}&fingerprint=${fingerprint}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  const voteData = voteRes?.data;

  // ── 투표 처리 ──
  const handleVote = useCallback(
    async (fighter: FighterVote) => {
      if (!fingerprint || votingId) return;

      setVotingId(fighter.id);

      try {
        // 낙관적 업데이트
        if (voteData) {
          const optimistic = { ...voteData };
          optimistic.fighters = optimistic.fighters.map((f) => {
            if (f.id === fighter.id) {
              // 토글
              return {
                ...f,
                voteCount: f.voted
                  ? Math.max(0, f.voteCount - 1)
                  : f.voteCount + 1,
                voted: !f.voted,
              };
            }
            // 같은 카테고리 내 다른 선수 투표 해제
            if (f.voted && !fighter.voted) {
              return {
                ...f,
                voteCount: Math.max(0, f.voteCount - 1),
                voted: false,
              };
            }
            return f;
          });
          optimistic.totalVotes = optimistic.fighters.reduce(
            (sum, f) => sum + f.voteCount,
            0
          );
          // 다시 정렬
          optimistic.fighters.sort((a, b) => b.voteCount - a.voteCount);
          mutateVotes({ data: optimistic }, false);
        }

        // 서버 요청
        await fetch("/api/mma-vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: activeCategory,
            fighterId: fighter.id,
            fingerprint,
          }),
        });

        // 서버 데이터로 동기화 (카테고리 목록의 totalVotes도 갱신)
        mutateVotes();
        mutateCategories();
      } catch {
        // 실패 시 서버 데이터 재요청
        mutateVotes();
        mutateCategories();
      } finally {
        setTimeout(() => setVotingId(null), 300);
      }
    },
    [fingerprint, votingId, voteData, activeCategory, mutateVotes, mutateCategories]
  );

  // ── 전체 투표수 합산 ──
  const globalTotalVotes = categories.reduce(
    (sum, c) => sum + c.totalVotes,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-muted" />
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-black text-foreground">GOAT 투표</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 pb-24">
        {/* ── 타이틀 섹션 ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">
            MMA 역대 최고
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              {" "}
              GOAT
            </span>
            를 뽑아주세요
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            카테고리별로 당신이 생각하는 역대 최강 파이터에게 투표하세요.
            <br className="hidden md:block" />
            카테고리당 1명만 선택 가능하며, 다시 누르면 투표가 취소됩니다.
          </p>
        </motion.div>

        {/* ── 카테고리 탭 ── */}
        <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-2 min-w-max">
            {Object.entries(CATEGORY_META).map(([slug, meta], i) => {
              const isActive = activeCategory === slug;
              const cat = categories.find((c) => c.slug === slug);
              const Icon = meta.icon;

              return (
                <motion.button
                  key={slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.05,
                    ease: "easeOut" as const,
                  }}
                  onClick={() => setActiveCategory(slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/25"
                      : "border border-border bg-surface text-muted hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat?.label ?? slug}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── 카테고리 설명 ── */}
        <AnimatePresence mode="wait">
          {voteData && (
            <motion.div
              key={`desc-${activeCategory}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" as const }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground">
                  {voteData.label}
                </h3>
                <span className="text-xs text-muted">
                  ({voteData.totalVotes.toLocaleString()}표)
                </span>
              </div>
              <p className="text-sm text-muted">{voteData.description}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {voteData && <VoteDistribution voteData={voteData} />}

        {/* ── 선수 리스트 ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`list-${activeCategory}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" as const }}
            className="space-y-3"
          >
            {!voteData ? (
              // 스켈레톤
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-surface border border-border animate-pulse"
                />
              ))
            ) : (
              voteData.fighters.map((fighter, index) => {
                const rank = index + 1;
                const style = getRankStyle(rank);
                const percentage =
                  voteData.totalVotes > 0
                    ? (fighter.voteCount / voteData.totalVotes) * 100
                    : 0;
                const isVoting = votingId === fighter.id;

                return (
                  <motion.div
                    key={fighter.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.06,
                      ease: "easeOut" as const,
                    }}
                    layout
                    className={cn(
                      "relative rounded-xl border p-4 transition-all",
                      style.border,
                      style.bg,
                      fighter.voted && "ring-1 ring-primary/30"
                    )}
                  >
                    {/* 배경 퍼센트 바 */}
                    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                      <motion.div
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-xl",
                          rank === 1
                            ? "bg-yellow-400/8"
                            : rank === 2
                              ? "bg-gray-400/6"
                              : rank === 3
                                ? "bg-amber-600/6"
                                : "bg-primary/5"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.06 + 0.2,
                          ease: "easeOut" as const,
                        }}
                      />
                    </div>

                    <div className="relative flex items-center gap-3">
                      {/* 순위 뱃지 */}
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black shrink-0",
                          style.badge
                        )}
                      >
                        {rank}
                      </div>

                      {fighter.imageUrl && (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-background">
                          <Image
                            src={fighter.imageUrl}
                            alt={fighter.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}

                      {/* 선수 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              "font-bold text-foreground truncate",
                              rank <= 3 && style.text
                            )}
                          >
                            {fighter.name}
                          </h4>
                          {rank === 1 && (
                            <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <motion.span
                            key={fighter.voteCount}
                            initial={{ scale: 1.3, color: "var(--primary)" }}
                            animate={{ scale: 1, color: "var(--muted)" }}
                            transition={{
                              duration: 0.4,
                              ease: "easeOut" as const,
                            }}
                            className="text-xs font-semibold text-muted"
                          >
                            {fighter.voteCount.toLocaleString()}표
                          </motion.span>
                          <span className="text-xs text-muted/60">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      {/* 투표 버튼 */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleVote(fighter)}
                        disabled={isVoting}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all shrink-0",
                          fighter.voted
                            ? "bg-primary text-white shadow-lg shadow-primary/25"
                            : "border border-border bg-surface text-muted hover:border-primary/40 hover:text-primary"
                        )}
                      >
                        <motion.div
                          animate={
                            fighter.voted
                              ? { scale: [1, 1.3, 1] }
                              : { scale: 1 }
                          }
                          transition={{
                            duration: 0.3,
                            ease: "easeOut" as const,
                          }}
                        >
                          <Heart
                            className={cn(
                              "w-4 h-4",
                              fighter.voted && "fill-current"
                            )}
                          />
                        </motion.div>
                        <span className="hidden sm:inline">
                          {fighter.voted ? "투표함" : "투표"}
                        </span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── 하단 전체 투표수 ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" as const }}
          className="mt-10 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5">
            <Flame className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted">
              전체 투표{" "}
              <span className="font-bold text-foreground">
                {globalTotalVotes.toLocaleString()}
              </span>
              표 참여중
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
