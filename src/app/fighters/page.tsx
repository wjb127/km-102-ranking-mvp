"use client";

import { useState, useEffect, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Users, X, Loader2, SlidersHorizontal, GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNameKoEn, primaryName, secondaryName } from "@/lib/format-name";
import { MethodChip, ResultChip } from "@/components/fight-chips";
import type { DbFighter } from "@/lib/mma-types";

const PAGE_SIZE = 60;

// 표준 체급 (UFC 기준 + 유니섹스 포함)
const WEIGHT_CLASSES = [
  "Strawweight",
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
  "Openweight",
  "Catchweight",
] as const;

const SORT_OPTIONS = [
  { value: "name", label: "이름순" },
  { value: "wins", label: "승수 많은순" },
  { value: "winrate", label: "승률 높은순" },
  { value: "fights", label: "경기 많은순" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ── SWR fetcher ──

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

// ── 국적 → 국기 이모지 매핑 ──

const FLAG_MAP: Record<string, string> = {
  USA: "\u{1F1FA}\u{1F1F8}",
  "United States": "\u{1F1FA}\u{1F1F8}",
  Ireland: "\u{1F1EE}\u{1F1EA}",
  Russia: "\u{1F1F7}\u{1F1FA}",
  Brazil: "\u{1F1E7}\u{1F1F7}",
  "New Zealand": "\u{1F1F3}\u{1F1FF}",
  Australia: "\u{1F1E6}\u{1F1FA}",
  Nigeria: "\u{1F1F3}\u{1F1EC}",
  China: "\u{1F1E8}\u{1F1F3}",
  Japan: "\u{1F1EF}\u{1F1F5}",
  "South Korea": "\u{1F1F0}\u{1F1F7}",
  Korea: "\u{1F1F0}\u{1F1F7}",
  England: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
  Mexico: "\u{1F1F2}\u{1F1FD}",
  Canada: "\u{1F1E8}\u{1F1E6}",
  France: "\u{1F1EB}\u{1F1F7}",
  Germany: "\u{1F1E9}\u{1F1EA}",
  Poland: "\u{1F1F5}\u{1F1F1}",
  Sweden: "\u{1F1F8}\u{1F1EA}",
  Netherlands: "\u{1F1F3}\u{1F1F1}",
  Georgia: "\u{1F1EC}\u{1F1EA}",
  Cameroon: "\u{1F1E8}\u{1F1F2}",
  Jamaica: "\u{1F1EF}\u{1F1F2}",
};

function getFlag(nationality: string | null): string {
  if (!nationality) return "\u{1F30D}";
  return FLAG_MAP[nationality] ?? "\u{1F30D}";
}

// ── 스켈레톤 ──

function FighterCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-border" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-2/3 rounded bg-border" />
          <div className="h-3 w-1/3 rounded bg-border/60" />
        </div>
      </div>
      <div className="h-3 w-1/2 rounded bg-border/60 mb-2" />
      <div className="h-3 w-2/5 rounded bg-border/60" />
    </div>
  );
}

// ── 선수 카드 ──

interface FighterCardProps {
  fighter: DbFighter;
  index: number;
  selected: boolean;
  compareFull: boolean;
  onToggleCompare: (fighter: DbFighter) => void;
}

function getFighterStats(fighter: DbFighter) {
  const totalFights = fighter.wins + fighter.losses + fighter.draws;
  const winRate =
    totalFights > 0 ? Math.round((fighter.wins / totalFights) * 100) : 0;
  const finishWins = fighter.winsByKo + fighter.winsBySub;
  const finishRate = fighter.wins > 0 ? Math.round((finishWins / fighter.wins) * 100) : 0;

  return { totalFights, winRate, finishWins, finishRate };
}

function FighterCard({
  fighter,
  index,
  selected,
  compareFull,
  onToggleCompare,
}: FighterCardProps) {
  const { totalFights, winRate } = getFighterStats(fighter);

  const displayName = primaryName(fighter.fullNameKo, fighter.fullName);
  const subName = secondaryName(fighter.fullNameKo, fighter.fullName);
  const nick = fighter.nicknameKo || fighter.nickname;
  const compareDisabled = compareFull && !selected;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: (index % 6) * 0.06,
        ease: "easeOut" as const,
      }}
    >
      <div
        className={cn(
          "group relative rounded-xl border bg-surface p-5",
          "transition-all duration-200",
          selected
            ? "border-primary/50 shadow-lg shadow-primary/10"
            : "border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
        )}
      >
        <button
          type="button"
          onClick={() => onToggleCompare(fighter)}
          disabled={compareDisabled}
          aria-pressed={selected}
          aria-label={`${displayName} 비교 ${selected ? "해제" : "선택"}`}
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
            selected
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border bg-background/60 text-muted hover:border-primary/40 hover:text-primary",
            compareDisabled && "cursor-not-allowed opacity-40 hover:border-border hover:text-muted"
          )}
        >
          <GitCompareArrows className="h-4 w-4" />
        </button>

        <Link href={`/fighters/${fighter.id}`} className="block pr-9">
          {/* 상단: 국기 + 이름 + 닉네임 */}
          <div className="flex items-start gap-3 mb-3">
            <span
              className="text-2xl leading-none mt-0.5"
              aria-label={fighter.nationality ?? "국적"}
            >
              {getFlag(fighter.nationality)}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors truncate">
                {displayName}
              </h3>
              {subName && (
                <p className="text-[10px] text-muted/70 truncate">{subName}</p>
              )}
              {nick && (
                <p className="text-xs text-muted truncate mt-0.5">&quot;{nick}&quot;</p>
              )}
            </div>
          </div>

          {/* 전적 */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <ResultChip tag="W" />
              <span className="text-sm font-bold tabular-nums text-success">{fighter.wins}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <ResultChip tag="L" />
              <span className="text-sm font-bold tabular-nums text-danger">{fighter.losses}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <ResultChip tag="D" />
              <span className="text-sm font-bold tabular-nums text-muted">{fighter.draws}</span>
            </span>
            {totalFights > 0 && (
              <span className="ml-auto text-xs text-muted">승률 {winRate}%</span>
            )}
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3">
            <span className="inline-flex items-center gap-1">
              <MethodChip method="KO" />
              <span className="text-[10px] tabular-nums text-muted">{fighter.winsByKo}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MethodChip method="SUB" />
              <span className="text-[10px] tabular-nums text-muted">{fighter.winsBySub}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MethodChip method="DEC" />
              <span className="text-[10px] tabular-nums text-muted">{fighter.winsByDec}</span>
            </span>
          </div>

          {/* 체급 */}
          {fighter.weightClass && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-muted" />
              <span className="text-xs text-muted">{fighter.weightClass}</span>
            </div>
          )}
        </Link>
      </div>
    </motion.div>
  );
}

function CompareValue({
  label,
  left,
  right,
}: {
  label: string;
  left: string | number;
  right: string | number;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border/60 py-2 text-sm">
      <span className="text-right font-semibold text-foreground tabular-nums">{left}</span>
      <span className="min-w-20 text-center text-[11px] font-medium text-muted">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{right}</span>
    </div>
  );
}

function ComparePanel({
  fighters,
  onClear,
}: {
  fighters: DbFighter[];
  onClear: () => void;
}) {
  const [left, right] = fighters;
  const leftStats = left ? getFighterStats(left) : null;
  const rightStats = right ? getFighterStats(right) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" as const }}
      className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">선수 비교</h2>
          <span className="text-xs text-muted">{fighters.length}/2명 선택</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted hover:text-foreground"
        >
          초기화
        </button>
      </div>

      {fighters.length < 2 || !left || !right || !leftStats || !rightStats ? (
        <div className="rounded-lg border border-border bg-surface px-4 py-5 text-center text-sm text-muted">
          비교할 선수 2명을 선택하세요.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-bold text-foreground">
                {formatNameKoEn(left.fullNameKo, left.fullName)}
              </p>
              <p className="text-[10px] text-muted">{left.weightClass ?? "-"}</p>
            </div>
            <span className="rounded-md bg-border/50 px-2 py-1 text-[10px] font-bold text-muted">
              VS
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {formatNameKoEn(right.fullNameKo, right.fullName)}
              </p>
              <p className="text-[10px] text-muted">{right.weightClass ?? "-"}</p>
            </div>
          </div>
          <CompareValue label="전적" left={`${left.wins}-${left.losses}-${left.draws}`} right={`${right.wins}-${right.losses}-${right.draws}`} />
          <CompareValue label="승률" left={`${leftStats.winRate}%`} right={`${rightStats.winRate}%`} />
          <CompareValue label="총 경기" left={leftStats.totalFights} right={rightStats.totalFights} />
          <CompareValue label="KO승" left={left.winsByKo} right={right.winsByKo} />
          <CompareValue label="SUB승" left={left.winsBySub} right={right.winsBySub} />
          <CompareValue label="판정승" left={left.winsByDec} right={right.winsByDec} />
          <CompareValue label="피니시율" left={`${leftStats.finishRate}%`} right={`${rightStats.finishRate}%`} />
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Link
              href={`/fighters/${left.id}`}
              className="rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold text-muted hover:border-primary/40 hover:text-primary"
            >
              왼쪽 상세
            </Link>
            <Link
              href={`/fighters/${right.id}`}
              className="rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold text-muted hover:border-primary/40 hover:text-primary"
            >
              오른쪽 상세
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── 메인 페이지 ──

export default function FightersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortValue>("wins");
  const [weight, setWeight] = useState<string>("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [compareFighters, setCompareFighters] = useState<DbFighter[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 디바운스 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // SWR Infinite: offset 기반 페이지네이션 + 필터/정렬
  const getKey = (pageIndex: number, previousPageData: { data: DbFighter[]; total: number } | null) => {
    if (previousPageData && previousPageData.data.length === 0) return null;
    const offset = pageIndex * PAGE_SIZE;
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
      sort,
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (weight) params.set("weight", weight);
    if (activeOnly) params.set("active", "1");
    return `/api/mma-fighters?${params.toString()}`;
  };

  const { data, isLoading, size, setSize } = useSWRInfinite<{
    success: boolean;
    data: DbFighter[];
    total: number;
  }>(getKey, fetcher, { revalidateOnFocus: false, revalidateFirstPage: false });

  const fighters = data ? data.flatMap((page) => page.data) : [];
  const total = data?.[0]?.total ?? 0;
  const hasMore = fighters.length < total;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  function toggleCompare(fighter: DbFighter) {
    setCompareFighters((current) => {
      if (current.some((f) => f.id === fighter.id)) {
        return current.filter((f) => f.id !== fighter.id);
      }
      if (current.length >= 2) return current;
      return [...current, fighter];
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <section className="relative overflow-hidden pt-12 pb-8 md:pt-16 md:pb-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/6 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4">
          {/* 뒤로가기 */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
          >
            <span>&larr;</span>
            <span>홈으로</span>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="text-3xl md:text-4xl font-extrabold text-foreground mb-2"
          >
            선수 목록
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.08,
              ease: "easeOut" as const,
            }}
            className="text-muted text-sm md:text-base"
          >
            MMA 선수 정보를 검색하고 상세 프로필을 확인하세요.
          </motion.p>
        </div>
      </section>

      {/* 검색바 + 목록 */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        {/* 검색바 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" as const }}
          className="relative mb-8"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="선수 이름 또는 닉네임 검색 (한글/영문)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full rounded-xl border border-border bg-surface pl-11 pr-10 py-3",
              "text-sm text-foreground placeholder:text-muted/60",
              "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30",
              "transition-all"
            )}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted hover:text-foreground hover:bg-border/50 transition-colors"
              aria-label="검색어 지우기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* 정렬 + 필터 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" as const }}
          className="flex flex-wrap items-center gap-2 mb-6"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted pr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>필터</span>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
          >
            <option value="">전체 체급</option>
            {WEIGHT_CLASSES.map((wc) => (
              <option key={wc} value={wc}>
                {wc}
              </option>
            ))}
          </select>

          <label
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer transition-colors",
              activeOnly
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="sr-only"
            />
            <span>{activeOnly ? "✓ " : ""}현역만</span>
          </label>

          {(weight || !activeOnly || sort !== "wins") && (
            <button
              onClick={() => {
                setSort("wins");
                setWeight("");
                setActiveOnly(true);
              }}
              className="ml-auto text-xs text-muted hover:text-foreground underline-offset-2 hover:underline transition-colors"
            >
              필터 초기화
            </button>
          )}
        </motion.div>

        {/* 결과 카운트 */}
        {!isLoading && (
          <p className="text-xs text-muted mb-4">
            {debouncedSearch
              ? `"${debouncedSearch}" 검색 결과 ${total}명 (표시 ${fighters.length}명)`
              : `전체 ${total}명 (표시 ${fighters.length}명)`}
          </p>
        )}

        {compareFighters.length > 0 && (
          <ComparePanel
            fighters={compareFighters}
            onClear={() => setCompareFighters([])}
          />
        )}

        {/* 선수 그리드 */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <FighterCardSkeleton key={i} />
            ))}
          </div>
        ) : fighters.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Search className="w-10 h-10 text-muted/30" />
            <p className="text-muted text-sm">
              {debouncedSearch
                ? `"${debouncedSearch}"에 대한 검색 결과가 없습니다.`
                : "선수 데이터를 불러올 수 없습니다."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fighters.map((fighter, i) => (
                <FighterCard
                  key={fighter.id}
                  fighter={fighter}
                  index={i}
                  selected={compareFighters.some((f) => f.id === fighter.id)}
                  compareFull={compareFighters.length >= 2}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setSize(size + 1)}
                  disabled={isLoadingMore}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold",
                    "hover:border-primary/40 hover:text-primary transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      불러오는 중…
                    </>
                  ) : (
                    <>더 보기 ({total - fighters.length}명 남음)</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
