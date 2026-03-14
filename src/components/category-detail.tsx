"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Trophy, Medal, Award, Users, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";
import CommentSection from "@/components/comment-section";

// ── 타입 정의 ──────────────────────────────────────────────

interface PersonData {
  id: number;
  categoryId: number;
  name: string;
  photoUrl: string | null;
  nationality: string | null;
  description: string | null;
  voteCount: number;
}

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  totalVotes: number;
  personCount: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    category: CategoryData;
    persons: PersonData[];
  };
}

interface VoteStatusResponse {
  success: boolean;
  data: { votedPersonIds: number[] };
}

// ── 투표 애니메이션 ("+1" 플로팅) ──────────────────────────

interface FloatingPlus {
  id: number;
  x: number;
  y: number;
  text: string; // "+1" 또는 "-1"
}

// ── SWR 페처 ──────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

// ── 순위 아이콘 ──────────────────────────────────────────────

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400 drop-shadow" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400 drop-shadow" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600 drop-shadow" />;
  return (
    <span className="text-sm font-bold text-muted">#{rank}</span>
  );
}

// ── 순위 배지 색상 ──────────────────────────────────────────

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-yellow-400/20 text-yellow-500 border border-yellow-400/40";
  if (rank === 2) return "bg-slate-400/20 text-slate-400 border border-slate-400/40";
  if (rank === 3) return "bg-amber-600/20 text-amber-600 border border-amber-600/40";
  return "bg-border/60 text-muted border border-border";
}

// ── 커스텀 차트 툴팁 ──────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string; voteCount: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-2 shadow-xl">
      <p className="text-sm font-semibold text-foreground">{data.name}</p>
      <p className="text-xs text-muted">{data.voteCount.toLocaleString()} 표</p>
    </div>
  );
}

// ── 차트 스켈레톤 ──────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="space-y-3 p-4 sm:p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-4 w-16 rounded bg-border" />
          <div className="h-6 rounded bg-border/60" style={{ width: `${80 - i * 12}%` }} />
        </div>
      ))}
    </div>
  );
}

// ── 카드 스켈레톤 ──────────────────────────────────────────

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="h-9 w-9 rounded-xl bg-border" />
            <div className="h-5 w-14 rounded-full bg-border/60" />
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 rounded-xl bg-border" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-border" />
              <div className="h-3 w-16 rounded bg-border/60" />
            </div>
          </div>
          <div className="mb-4 h-3 w-3/4 rounded bg-border/40" />
          <div className="h-10 w-full rounded-xl bg-border/60" />
        </div>
      ))}
    </div>
  );
}

// ── 메인 클라이언트 컴포넌트 ──────────────────────────────────

interface Props {
  slug: string;
}

export default function CategoryDetailClient({ slug }: Props) {
  // fingerprint
  const [fp, setFp] = useState<string>("");
  // 투표한 인물 ID 목록
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());
  // 낙관적 투표 수 상태 (personId → 추가 투표 수)
  const [optimisticVotes, setOptimisticVotes] = useState<Record<number, number>>({});
  // 투표 중인 인물 (버튼 로딩)
  const [votingIds, setVotingIds] = useState<Set<number>>(new Set());
  // "+1"/"-1" 플로팅 애니메이션
  const [floatingPlus, setFloatingPlus] = useState<FloatingPlus[]>([]);
  const floatingIdRef = useRef(0);

  // fingerprint 로드
  useEffect(() => {
    getFingerprint().then(setFp);
  }, []);

  // SWR - 카테고리 데이터 (1초마다 갱신)
  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    `/api/categories/${slug}`,
    fetcher,
    {
      refreshInterval: 1000,
      revalidateOnFocus: false,
      dedupingInterval: 800,
    }
  );

  // SWR - 투표 상태
  const { data: voteStatusData } = useSWR<VoteStatusResponse>(
    fp ? `/api/vote/status?slug=${slug}&fingerprint=${fp}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  );

  // 투표 상태 동기화
  useEffect(() => {
    if (voteStatusData?.data?.votedPersonIds) {
      setVotedIds(new Set(voteStatusData.data.votedPersonIds));
    }
  }, [voteStatusData]);

  // 투표 처리 (토글 방식)
  const handleVote = useCallback(
    async (person: PersonData, event: React.MouseEvent<HTMLButtonElement>) => {
      if (votingIds.has(person.id) || !fp) return;

      const isVoted = votedIds.has(person.id);
      const delta = isVoted ? -1 : 1;
      const text = isVoted ? "-1" : "+1";

      // 플로팅 애니메이션
      const rect = event.currentTarget.getBoundingClientRect();
      const newFloating: FloatingPlus = {
        id: ++floatingIdRef.current,
        x: rect.left + rect.width / 2,
        y: rect.top,
        text,
      };
      setFloatingPlus((prev) => [...prev, newFloating]);
      setTimeout(() => {
        setFloatingPlus((prev) => prev.filter((f) => f.id !== newFloating.id));
      }, 1200);

      // 낙관적 업데이트
      setOptimisticVotes((prev) => ({
        ...prev,
        [person.id]: (prev[person.id] ?? 0) + delta,
      }));
      setVotedIds((prev) => {
        const next = new Set(prev);
        if (isVoted) next.delete(person.id);
        else next.add(person.id);
        return next;
      });
      setVotingIds((prev) => new Set(prev).add(person.id));

      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, personId: person.id, fingerprint: fp }),
        });
        if (!res.ok) throw new Error("투표 실패");
        await mutate();
        // 낙관적 수 리셋
        setOptimisticVotes((prev) => {
          const next = { ...prev };
          delete next[person.id];
          return next;
        });
      } catch {
        // 롤백
        setOptimisticVotes((prev) => {
          const next = { ...prev };
          const current = next[person.id] ?? 0;
          const rollback = current - delta;
          if (rollback === 0) delete next[person.id];
          else next[person.id] = rollback;
          return next;
        });
        setVotedIds((prev) => {
          const next = new Set(prev);
          if (isVoted) next.add(person.id);
          else next.delete(person.id);
          return next;
        });
      } finally {
        setVotingIds((prev) => {
          const next = new Set(prev);
          next.delete(person.id);
          return next;
        });
      }
    },
    [slug, votingIds, votedIds, fp, mutate]
  );

  // ── 스켈레톤 로딩 ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* 헤더 스켈레톤 */}
        <div className="relative overflow-hidden">
          <div className="mx-auto max-w-4xl px-4 pb-8 pt-6">
            <div className="mb-6 h-9 w-28 animate-pulse rounded-full bg-border" />
            <div className="space-y-3">
              <div className="h-9 w-64 animate-pulse rounded bg-border" />
              <div className="h-5 w-96 animate-pulse rounded bg-border/60" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16">
          {/* 차트 스켈레톤 */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/5">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-border" />
              <div className="space-y-1">
                <div className="h-4 w-24 animate-pulse rounded bg-border" />
                <div className="h-3 w-20 animate-pulse rounded bg-border/60" />
              </div>
            </div>
            <ChartSkeleton />
          </div>
          {/* 카드 스켈레톤 */}
          <div>
            <div className="mb-4 h-6 w-20 animate-pulse rounded bg-border" />
            <CardsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !data?.success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-8 py-6 text-center">
          <p className="text-lg font-semibold text-danger">카테고리를 불러올 수 없습니다</p>
          <p className="mt-1 text-sm text-muted">잠시 후 다시 시도해주세요</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const { category, persons } = data.data;

  // 투표 수에 낙관적 값 반영 후 정렬
  const sortedPersons = [...persons]
    .map((p) => ({
      ...p,
      voteCount: p.voteCount + (optimisticVotes[p.id] ?? 0),
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  // 차트용 데이터
  const chartData = sortedPersons.slice(0, 10).map((p, i) => ({
    name: p.name.length > 8 ? p.name.slice(0, 8) + "…" : p.name,
    fullName: p.name,
    voteCount: p.voteCount,
    rank: i + 1,
  }));

  // 총 투표 수 (낙관적 반영)
  const totalVotes =
    category.totalVotes +
    Object.values(optimisticVotes).reduce((acc, v) => acc + v, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* 플로팅 애니메이션 */}
      <AnimatePresence>
        {floatingPlus.map((fp) => (
          <motion.div
            key={fp.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -80, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" as const }}
            style={{ left: fp.x, top: fp.y }}
            className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full"
          >
            <span className={cn(
              "text-2xl font-black drop-shadow-lg",
              fp.text === "+1" ? "text-primary" : "text-danger"
            )}>
              {fp.text}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── 헤더 ── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, var(--primary) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, var(--accent) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, var(--primary) 0, var(--primary) 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 pb-8 pt-6">
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/80 px-4 py-2 text-sm font-medium text-muted backdrop-blur-sm transition-all hover:border-primary/40 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            전체 랭킹
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-black tracking-tight text-foreground sm:text-4xl"
              >
                {category.name}
              </motion.h1>
              {category.description && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mt-1 text-base text-muted"
                >
                  {category.description}
                </motion.p>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-wrap gap-2"
            >
              <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
                <Heart className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-primary">
                  {totalVotes.toLocaleString()} 표
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/80 px-4 py-2">
                <Users className="h-4 w-4 text-muted" />
                <span className="text-sm font-semibold text-muted">
                  {category.personCount}명
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16">
        {/* ── TOP 10 바 차트 ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/5"
        >
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">TOP 10 랭킹</h2>
              <p className="text-xs text-muted">실시간 투표 현황</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="text-xs font-semibold text-success">LIVE</span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {chartData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-muted">
                <p className="text-sm">등록된 인물이 없습니다</p>
              </div>
            ) : (
              <>
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--accent)" />
                    </linearGradient>
                    <linearGradient id="barGradientGold" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>

                <ResponsiveContainer width="100%" height={chartData.length * 52 + 20}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 64, left: 4, bottom: 4 }}
                    barSize={22}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                      strokeOpacity={0.6}
                    />
                    <XAxis
                      type="number"
                      dataKey="voteCount"
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v.toLocaleString()}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "var(--border)", fillOpacity: 0.4, radius: 6 }}
                    />
                    <Bar
                      dataKey="voteCount"
                      radius={[0, 8, 8, 0]}
                      isAnimationActive
                      animationDuration={600}
                      animationEasing="ease-out"
                      label={{
                        position: "right",
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter: (v: any) =>
                          typeof v === "number" ? v.toLocaleString() : String(v ?? ""),
                        fill: "var(--muted)",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.fullName}
                          fill={
                            entry.rank === 1
                              ? "url(#barGradientGold)"
                              : "url(#barGradient)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </motion.section>

        {/* ── 인물 카드 그리드 ── */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">전체 순위</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {sortedPersons.map((person, index) => {
                const rank = index + 1;
                const isVoting = votingIds.has(person.id);
                const isVoted = votedIds.has(person.id);

                return (
                  <motion.div
                    key={person.id}
                    layout
                    layoutId={`person-card-${person.id}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      layout: { duration: 0.4, ease: "easeInOut" as const },
                      opacity: { duration: 0.3 },
                      y: { duration: 0.3, delay: Math.min(index * 0.04, 0.3) },
                    }}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border bg-surface shadow-sm transition-shadow hover:shadow-lg hover:shadow-black/10",
                      rank === 1
                        ? "border-yellow-400/40 shadow-yellow-400/10 hover:shadow-yellow-400/20"
                        : rank === 2
                        ? "border-slate-400/30"
                        : rank === 3
                        ? "border-amber-600/30"
                        : "border-border"
                    )}
                  >
                    {rank === 1 && (
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="relative p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black",
                            rankBadgeClass(rank)
                          )}
                        >
                          <RankIcon rank={rank} />
                        </div>
                        {person.nationality && (
                          <span className="rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-xs font-medium text-muted">
                            {person.nationality}
                          </span>
                        )}
                      </div>

                      <div className="mb-3 flex items-center gap-3">
                        {person.photoUrl ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/60">
                            <Image
                              src={person.photoUrl}
                              alt={person.name}
                              fill
                              sizes="56px"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-gradient-to-br from-primary/20 to-accent/20">
                            <span className="text-xl font-black text-primary">
                              {person.name.slice(0, 1)}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-bold text-foreground">
                            {person.name}
                          </h3>
                          <motion.p
                            key={person.voteCount}
                            initial={{ opacity: 0.6, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="text-sm font-semibold text-primary"
                          >
                            {person.voteCount.toLocaleString()} 표
                          </motion.p>
                        </div>
                      </div>

                      {person.description && (
                        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted">
                          {person.description}
                        </p>
                      )}

                      {/* 투표 버튼 — 토글 방식 */}
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        onClick={(e) => handleVote(person, e)}
                        disabled={isVoting || !fp}
                        aria-label={isVoted ? `${person.name} 투표 취소` : `${person.name}에게 투표하기`}
                        className={cn(
                          "relative w-full overflow-hidden rounded-xl py-2.5 text-sm font-bold transition-all",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50",
                          isVoting
                            ? "bg-primary/60 cursor-not-allowed text-white"
                            : isVoted
                            ? "border-2 border-primary bg-primary/10 text-primary hover:bg-primary/20"
                            : "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 active:opacity-80"
                        )}
                      >
                        {!isVoting && !isVoted && (
                          <span className="absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform group-hover:translate-x-full group-hover:duration-700" />
                        )}

                        <span className="relative flex items-center justify-center gap-1.5">
                          <AnimatePresence mode="wait">
                            {isVoting ? (
                              <motion.span
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5"
                              >
                                <svg
                                  className="h-4 w-4 animate-spin"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                  />
                                </svg>
                                처리 중...
                              </motion.span>
                            ) : isVoted ? (
                              <motion.span
                                key="voted"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5"
                              >
                                <Heart className="h-4 w-4 fill-current" />
                                투표 완료
                              </motion.span>
                            ) : (
                              <motion.span
                                key="vote"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5"
                              >
                                <Heart className="h-4 w-4" />
                                투표하기
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* ── 댓글 섹션 ── */}
        {fp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <CommentSection categoryId={category.id} fingerprint={fp} />
          </motion.div>
        )}

        {/* 하단 실시간 갱신 안내 */}
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          1초마다 실시간 업데이트
        </div>
      </div>
    </div>
  );
}
