"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MmaFighter } from "@/lib/api/mma";

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
  fighter: MmaFighter;
  index: number;
}

function FighterCard({ fighter, index }: FighterCardProps) {
  const totalFights =
    fighter.record_wins + fighter.record_losses + fighter.record_draws;
  const winRate =
    totalFights > 0
      ? Math.round((fighter.record_wins / totalFights) * 100)
      : 0;

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
      <Link href={`/fighters/${fighter.id}`} className="block group">
        <div
          className={cn(
            "rounded-xl border border-border bg-surface p-5",
            "transition-all duration-200",
            "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
            "group-hover:-translate-y-1"
          )}
        >
          {/* 상단: 국기 + 이름 + 닉네임 */}
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl leading-none mt-0.5" aria-label={fighter.nationality ?? "국적"}>
              {getFlag(fighter.nationality)}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-primary transition-colors truncate">
                {fighter.name}
              </h3>
              {fighter.nickname && (
                <p className="text-xs text-muted truncate mt-0.5">
                  &quot;{fighter.nickname}&quot;
                </p>
              )}
            </div>
            {/* 활동 상태 뱃지 */}
            <span
              className={cn(
                "shrink-0 mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                fighter.active
                  ? "bg-success/15 text-success border border-success/30"
                  : "bg-muted/15 text-muted border border-border"
              )}
            >
              {fighter.active ? "Active" : "Retired"}
            </span>
          </div>

          {/* 전적 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-success">
              {fighter.record_wins}W
            </span>
            <span className="text-muted/40">-</span>
            <span className="text-sm font-bold text-danger">
              {fighter.record_losses}L
            </span>
            <span className="text-muted/40">-</span>
            <span className="text-sm font-bold text-muted">
              {fighter.record_draws}D
            </span>
            {totalFights > 0 && (
              <span className="ml-auto text-xs text-muted">
                승률 {winRate}%
              </span>
            )}
          </div>

          {/* 체급 */}
          {fighter.weight_class && (
            <div className="flex items-center gap-1.5 pt-3 border-t border-border">
              <Users className="w-3.5 h-3.5 text-muted" />
              <span className="text-xs text-muted">{fighter.weight_class}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ── 메인 페이지 ──

export default function FightersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 디바운스 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // SWR 데이터 패칭
  const apiUrl = debouncedSearch
    ? `/api/fighters?search=${encodeURIComponent(debouncedSearch)}`
    : "/api/fighters";

  const { data, isLoading } = useSWR<{ success: boolean; data: MmaFighter[] }>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  const fighters = data?.data ?? [];

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
            placeholder="선수 이름 또는 닉네임 검색..."
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

        {/* 결과 카운트 */}
        {!isLoading && (
          <p className="text-xs text-muted mb-4">
            {debouncedSearch
              ? `"${debouncedSearch}" 검색 결과 ${fighters.length}명`
              : `전체 ${fighters.length}명`}
          </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fighters.map((fighter, i) => (
              <FighterCard key={fighter.id} fighter={fighter} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
