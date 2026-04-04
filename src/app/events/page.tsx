"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Tag, ChevronRight, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MmaEvent } from "@/lib/api/mma";

// ── 상수 ──

const YEAR_TABS = [2024, 2025, 2026];

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

// ── 날짜 포맷 ──

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// ── 상태 뱃지 ──

function StatusBadge({ status }: { status: string }) {
  const isUpcoming = status === "upcoming";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        isUpcoming
          ? "bg-primary/15 text-primary border border-primary/30"
          : "bg-muted/15 text-muted border border-border"
      )}
    >
      {isUpcoming ? (
        <>
          <Flame className="h-3 w-3" />
          예정
        </>
      ) : (
        <>
          <Clock className="h-3 w-3" />
          종료
        </>
      )}
    </span>
  );
}

// ── 스켈레톤 ──

function EventCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-border" />
          <div className="h-4 w-1/2 rounded bg-border/60" />
          <div className="h-4 w-2/5 rounded bg-border/60" />
        </div>
        <div className="h-6 w-14 rounded-full bg-border" />
      </div>
    </div>
  );
}

// ── 이벤트 카드 ──

interface EventCardProps {
  event: MmaEvent;
  index: number;
}

function EventCard({ event, index }: EventCardProps) {
  const venue = [event.venue_city, event.venue_state].filter(Boolean).join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: "easeOut" as const,
      }}
    >
      <Link href={`/events/${event.id}`} className="block group">
        <div
          className={cn(
            "rounded-xl border border-border bg-surface p-4 transition-all duration-200",
            "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {/* 이벤트명 */}
              <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors duration-200 mb-2">
                {event.name}
              </h3>

              {/* 날짜 */}
              <div className="flex items-center gap-1.5 text-sm text-muted mb-1">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDate(event.date)}</span>
              </div>

              {/* 장소 */}
              {(event.venue_name || venue) && (
                <div className="flex items-center gap-1.5 text-sm text-muted mb-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {venue}
                    {event.venue_name && ` · ${event.venue_name}`}
                  </span>
                </div>
              )}

              {/* 리그 */}
              {event.league && (
                <div className="flex items-center gap-1.5 text-xs text-muted/80 mt-1">
                  <Tag className="h-3 w-3 shrink-0" />
                  <span>{event.league.abbreviation}</span>
                </div>
              )}
            </div>

            {/* 우측: 상태 뱃지 + 화살표 */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusBadge status={event.status} />
              <ChevronRight className="h-4 w-4 text-muted/40 group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── 메인 페이지 ──

export default function EventsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(
    YEAR_TABS.includes(currentYear) ? currentYear : YEAR_TABS[YEAR_TABS.length - 1]
  );

  const { data, isLoading, error } = useSWR<{ success: boolean; data: MmaEvent[] }>(
    `/api/events?year=${selectedYear}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const events = data?.data ?? [];

  // 예정 이벤트를 먼저, 종료 이벤트 나중에
  const upcoming = events
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const completed = events
    .filter((e) => e.status !== "upcoming")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background">
      {/* 히어로 */}
      <section className="relative overflow-hidden pt-16 pb-10 md:pt-20 md:pb-14">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-[10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-accent/8 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-3"
          >
            경기{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              일정
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" as const }}
            className="text-base md:text-lg text-muted"
          >
            MMA 주요 대회 일정을 확인하세요
          </motion.p>
        </div>
      </section>

      {/* 콘텐츠 */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        {/* 연도 탭 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" as const }}
          className="flex gap-2 mb-8"
        >
          {YEAR_TABS.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                selectedYear === year
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-surface border border-border text-muted hover:border-primary/40 hover:text-foreground"
              )}
            >
              {year}
            </button>
          ))}
        </motion.div>

        {/* 로딩 스켈레톤 */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* 에러 */}
        {error && !isLoading && (
          <div className="text-center py-16 text-muted">
            데이터를 불러오는 중 오류가 발생했습니다.
          </div>
        )}

        {/* 데이터 없음 */}
        {!isLoading && !error && events.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-surface/50 py-16 text-center">
            <Calendar className="h-8 w-8 text-muted/40" />
            <p className="text-sm text-muted">{selectedYear}년 등록된 이벤트가 없습니다.</p>
          </div>
        )}

        {/* 예정 이벤트 */}
        {!isLoading && upcoming.length > 0 && (
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" as const }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/30">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                예정된 이벤트
                <span className="ml-2 text-sm font-normal text-muted">
                  ({upcoming.length})
                </span>
              </h2>
            </motion.div>
            <div className="space-y-3">
              {upcoming.map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* 종료 이벤트 */}
        {!isLoading && completed.length > 0 && (
          <div>
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" as const }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/15 border border-border">
                <Clock className="w-4 h-4 text-muted" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                종료된 이벤트
                <span className="ml-2 text-sm font-normal text-muted">
                  ({completed.length})
                </span>
              </h2>
            </motion.div>
            <div className="space-y-3">
              {completed.map((event, i) => (
                <EventCard key={event.id} event={event} index={i + upcoming.length} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
