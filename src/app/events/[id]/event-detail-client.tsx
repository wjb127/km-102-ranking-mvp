"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Flame,
  Clock,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";
import CommentSection from "@/components/comment-section";
import type { MmaEvent } from "@/lib/api/mma";

// ── 유틸 ──

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  // 요일
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[d.getDay()];
  return `${y}.${m}.${day} (${weekday})`;
}

// ── 스켈레톤 ──

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-3/4 rounded bg-border" />
      <div className="h-5 w-1/2 rounded bg-border/60" />
      <div className="h-48 w-full rounded-xl bg-border/40" />
      <div className="space-y-3">
        <div className="h-4 w-2/3 rounded bg-border/60" />
        <div className="h-4 w-1/2 rounded bg-border/60" />
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──

interface Props {
  id: string;
}

export default function EventDetailClient({ id }: Props) {
  const [fingerprint, setFingerprint] = useState("");

  // fingerprint 가져오기
  useEffect(() => {
    getFingerprint().then(setFingerprint);
  }, []);

  const { data, isLoading, error } = useSWR<{ success: boolean; data: MmaEvent }>(
    `/api/events/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const event = data?.data;
  const isUpcoming = event?.status === "upcoming";
  const venue = event
    ? [event.venue_city, event.venue_state].filter(Boolean).join(", ")
    : "";

  // 댓글용 categoryId — 이벤트 id를 숫자로 변환
  const commentCategoryId = Number(id);

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 내비게이션 */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>경기 일정</span>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* 로딩 */}
        {isLoading && <DetailSkeleton />}

        {/* 에러 */}
        {error && !isLoading && (
          <div className="text-center py-16 text-muted">
            이벤트 정보를 불러올 수 없습니다.
          </div>
        )}

        {/* 이벤트 정보 */}
        {event && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="space-y-8"
          >
            {/* 제목 + 상태 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
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
                {event.league && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-accent/15 text-accent border border-accent/30">
                    <Tag className="h-3 w-3" />
                    {event.league.abbreviation}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
                {event.name}
              </h1>
            </div>

            {/* 상세 정보 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" as const }}
              className="rounded-2xl border border-border bg-surface p-5 space-y-4"
            >
              {/* 날짜 */}
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted mb-0.5">일시</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDate(event.date)}
                  </p>
                </div>
              </div>

              {/* 장소 */}
              {(event.venue_name || venue) && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 shrink-0">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">장소</p>
                    <p className="text-sm font-semibold text-foreground">
                      {venue}
                    </p>
                    {event.venue_name && (
                      <p className="text-xs text-muted mt-0.5">
                        {event.venue_name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 리그 */}
              {event.league && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/10 border border-border shrink-0">
                    <Building2 className="h-5 w-5 text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">리그</p>
                    <p className="text-sm font-semibold text-foreground">
                      {event.league.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {event.league.abbreviation}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* 장소 플레이스홀더 (지도/이미지 대용) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" as const }}
              className="rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <div className="flex items-center justify-center h-48 bg-gradient-to-br from-surface via-background to-surface">
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-muted/30 mx-auto mb-2" />
                  <p className="text-sm text-muted/50">
                    {event.venue_name ?? "경기장 정보"}
                  </p>
                  {venue && (
                    <p className="text-xs text-muted/40 mt-0.5">{venue}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 구분선 */}
            <div className="border-t border-border" />

            {/* 댓글 섹션 */}
            {fingerprint && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" as const }}
              >
                <CommentSection
                  categoryId={commentCategoryId}
                  fingerprint={fingerprint}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
