"use client";

import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Trophy, Medal, Users, Vote, ChevronDown, Flame, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

interface MockCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  totalVotes: number;
  personCount: number;
}

interface ApiResponse {
  success: boolean;
  data: MockCategory[];
}

// ─────────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────────

/** 한 번에 보여줄 카테고리 개수 */
const PAGE_SIZE = 6;

/** 순위별 스타일 설정 */
const RANK_CONFIG = [
  {
    label: "1위",
    icon: Crown,
    iconColor: "text-yellow-400",
    badgeBg: "bg-yellow-400/20 border-yellow-400/40",
    badgeText: "text-yellow-300",
    glow: "shadow-yellow-500/30",
    gradient: "from-yellow-600/80 via-yellow-500/40 to-transparent",
    ring: "ring-yellow-400/60",
  },
  {
    label: "2위",
    icon: Trophy,
    iconColor: "text-slate-300",
    badgeBg: "bg-slate-300/20 border-slate-300/40",
    badgeText: "text-slate-200",
    glow: "shadow-slate-400/30",
    gradient: "from-slate-500/80 via-slate-400/40 to-transparent",
    ring: "ring-slate-300/60",
  },
  {
    label: "3위",
    icon: Medal,
    iconColor: "text-amber-600",
    badgeBg: "bg-amber-700/20 border-amber-600/40",
    badgeText: "text-amber-500",
    glow: "shadow-amber-700/30",
    gradient: "from-amber-800/80 via-amber-700/40 to-transparent",
    ring: "ring-amber-600/60",
  },
];

// ─────────────────────────────────────────────────────────────
// SWR fetcher
// ─────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─────────────────────────────────────────────────────────────
// 스켈레톤 컴포넌트
// ─────────────────────────────────────────────────────────────

function TopCardSkeleton() {
  return (
    <div className="h-72 md:h-80 rounded-2xl bg-surface border border-border animate-pulse" />
  );
}

function GridCardSkeleton() {
  return (
    <div className="rounded-xl bg-surface border border-border overflow-hidden animate-pulse">
      <div className="h-44 bg-muted/20" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 rounded bg-muted/20" />
        <div className="h-3 w-full rounded bg-muted/20" />
        <div className="h-3 w-4/5 rounded bg-muted/20" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TOP 3 카드 컴포넌트
// ─────────────────────────────────────────────────────────────

interface TopCardProps {
  category: MockCategory;
  rank: number;
  index: number;
}

function TopCard({ category, rank, index }: TopCardProps) {
  const config = RANK_CONFIG[rank - 1];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" as const }}
      whileHover={{ scale: 1.03, y: -6 }}
      className="group"
    >
      <Link href={`/category/${category.slug}`} className="block h-full">
        <div
          className={cn(
            "relative h-72 md:h-80 rounded-2xl overflow-hidden border",
            "ring-1 transition-all duration-300 cursor-pointer",
            config.ring,
            `shadow-xl ${config.glow}`,
            "hover:shadow-2xl group-hover:ring-2"
          )}
        >
          {/* 배경 이미지 */}
          <Image
            src={category.thumbnailUrl}
            alt={category.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* 그라디언트 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
          <div className={cn("absolute inset-0 bg-gradient-to-b", config.gradient)} />

          {/* 순위 뱃지 */}
          <div className="absolute top-4 left-4">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm",
                config.badgeBg
              )}
            >
              <Icon className={cn("w-4 h-4", config.iconColor)} />
              <span className={cn("text-sm font-bold", config.badgeText)}>
                {config.label}
              </span>
            </div>
          </div>

          {/* 투표수 뱃지 */}
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-white">
                {category.totalVotes.toLocaleString()}표
              </span>
            </div>
          </div>

          {/* 카드 하단 텍스트 */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-xl font-bold text-white leading-tight mb-1.5 drop-shadow-md">
              {category.name}
            </h3>
            <p className="text-sm text-white/75 line-clamp-2 mb-3 leading-relaxed">
              {category.description}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-white/60 text-xs">
                <Users className="w-3.5 h-3.5" />
                <span>{category.personCount}명 참여</span>
              </div>
              <div className="flex items-center gap-1 text-white/60 text-xs">
                <Vote className="w-3.5 h-3.5" />
                <span>총 {category.totalVotes.toLocaleString()}표</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 그리드 카드 컴포넌트
// ─────────────────────────────────────────────────────────────

interface GridCardProps {
  category: MockCategory;
  index: number;
}

function GridCard({ category, index }: GridCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.08, ease: "easeOut" as const }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link href={`/category/${category.slug}`} className="block h-full">
        <div className="h-full rounded-xl border border-border bg-surface overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
          {/* 썸네일 */}
          <div className="relative h-44 overflow-hidden">
            <Image
              src={category.thumbnailUrl}
              alt={category.name}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* 투표 뱃지 오버레이 */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-xs font-semibold text-white">
                {category.totalVotes.toLocaleString()}표
              </span>
            </div>
          </div>

          {/* 카드 본문 */}
          <div className="p-4">
            <h3 className="font-bold text-foreground text-base mb-1.5 leading-snug group-hover:text-primary transition-colors duration-200">
              {category.name}
            </h3>
            <p className="text-sm text-muted line-clamp-2 leading-relaxed mb-3">
              {category.description}
            </p>

            {/* 통계 */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1 text-muted text-xs">
                <Users className="w-3.5 h-3.5" />
                <span>{category.personCount}명</span>
              </div>
              <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-primary" />
                <span>{category.totalVotes.toLocaleString()}표</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 메인 페이지 컴포넌트
// ─────────────────────────────────────────────────────────────

export default function HomePage() {
  // 표시할 카테고리 개수 (더보기 로직)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // SWR로 카테고리 데이터 패칭
  const { data, isLoading, error } = useSWR<ApiResponse>("/api/categories", fetcher, {
    revalidateOnFocus: false,
  });

  const categories = data?.data ?? [];

  // 투표 수 내림차순 정렬
  const sorted = [...categories].sort((a, b) => b.totalVotes - a.totalVotes);

  // TOP 3 / 나머지 분리
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3, visibleCount + 3);
  const hasMore = visibleCount + 3 < sorted.length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── 히어로 섹션 ── */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        {/* 배경 그라디언트 블롭 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-[10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[40%] rounded-full bg-primary/8 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          {/* 상단 뱃지 */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold mb-6"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>실시간 인기투표 진행 중</span>
          </motion.div>

          {/* 메인 타이틀 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" as const }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-5 leading-tight"
          >
            인기투표{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              랭킹
            </span>
          </motion.h1>

          {/* 서브타이틀 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: "easeOut" as const }}
            className="text-lg md:text-xl text-muted max-w-xl mx-auto leading-relaxed"
          >
            누구나 만들고 참여하는 인기투표 랭킹 서비스.
            <br className="hidden md:block" />
            당신의 한 표가 순위를 바꿉니다.
          </motion.p>

          {/* 통계 요약 */}
          {!isLoading && categories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24, ease: "easeOut" as const }}
              className="mt-8 flex items-center justify-center gap-8"
            >
              <div className="text-center">
                <div className="text-2xl font-extrabold text-foreground">
                  {categories.length}
                </div>
                <div className="text-xs text-muted mt-0.5">투표 카테고리</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-foreground">
                  {categories
                    .reduce((acc, c) => acc + c.totalVotes, 0)
                    .toLocaleString()}
                </div>
                <div className="text-xs text-muted mt-0.5">총 투표수</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-foreground">
                  {categories
                    .reduce((acc, c) => acc + c.personCount, 0)
                    .toLocaleString()}
                </div>
                <div className="text-xs text-muted mt-0.5">참여 후보</div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── TOP 3 인기 카테고리 섹션 ── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        {/* 섹션 헤더 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" as const }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/30">
            <Crown className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">
              TOP 3 인기 카테고리
            </h2>
            <p className="text-sm text-muted mt-0.5">가장 뜨거운 투표 현황</p>
          </div>
        </motion.div>

        {/* TOP 3 카드 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <TopCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-muted">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((cat, i) => (
              <TopCard key={cat.id} category={cat} rank={i + 1} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── 전체 카테고리 섹션 ── */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        {/* 구분선 */}
        <div className="border-t border-border mb-12" />

        {/* 섹션 헤더 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" as const }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 border border-primary/30">
            <Vote className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">
              전체 카테고리
            </h2>
            <p className="text-sm text-muted mt-0.5">모든 투표 카테고리 보기</p>
          </div>
        </motion.div>

        {/* 그리드 카드 목록 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <GridCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((cat, i) => (
                <GridCard key={cat.id} category={cat} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* 더보기 버튼 */}
        {!isLoading && hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex justify-center"
          >
            <button
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
              className="group flex items-center gap-2 px-8 py-3.5 rounded-full border border-border bg-surface text-foreground font-semibold text-sm transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              <span>더보기</span>
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
            </button>
          </motion.div>
        )}

        {/* 모두 로드됨 표시 */}
        {!isLoading && !hasMore && rest.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 text-center text-sm text-muted"
          >
            모든 카테고리를 확인했습니다.
          </motion.p>
        )}
      </section>
    </div>
  );
}
