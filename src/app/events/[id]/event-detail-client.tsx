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
  Swords,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";
import CommentSection from "@/components/comment-section";
import { MethodChip, ResultChip, type FightResultTag } from "@/components/fight-chips";
import type { DbEventSummary, DbFightCard } from "@/lib/mma-types";

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
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdays[d.getDay()];
  return `${y}.${m}.${day} (${weekday})`;
}

function isUpcoming(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() >= Date.now();
}

function getResultTag(f: DbFightCard, fighterId: number): FightResultTag {
  if (f.result === "DRAW") return "D";
  if (f.result === "NO_CONTEST") return "NC";
  if (f.winnerId == null) return "-";
  return f.winnerId === fighterId ? "W" : "L";
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

// ── 파이트 카드 로우 ──

function FightRow({ f }: { f: DbFightCard }) {
  const aName = f.fighterANameKo || f.fighterAName || "-";
  const bName = f.fighterBNameKo || f.fighterBName || "-";
  const tagA = getResultTag(f, f.fighterAId);
  const tagB = getResultTag(f, f.fighterBId);
  const finished = tagA !== "-" || tagB !== "-";

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5",
        f.isMainEvent
          ? "border-primary/40 bg-primary/5"
          : f.isTitleFight
            ? "border-accent/40 bg-accent/5"
            : "border-border bg-surface"
      )}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5">
          {f.isMainEvent && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              MAIN
            </span>
          )}
          {f.isTitleFight && (
            <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Crown className="w-2.5 h-2.5" />
              타이틀
            </span>
          )}
          {f.weightClass && (
            <span className="text-[10px] text-muted">{f.weightClass}</span>
          )}
        </div>
        {(f.method || f.round || f.time) && (
          <div className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted">
            {f.method && <MethodChip method={f.method} />}
            {f.round && <span className="tabular-nums">R{f.round}</span>}
            {f.time && <span className="tabular-nums">{f.time}</span>}
          </div>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Link
          href={`/fighters/${f.fighterAId}`}
          className={cn(
            "flex min-w-0 items-center justify-end gap-1.5 text-sm font-semibold hover:text-primary transition-colors",
            tagA === "W" ? "text-foreground" : finished ? "text-muted" : "text-foreground"
          )}
        >
          <span className="truncate">{aName}</span>
          {finished && <ResultChip tag={tagA} />}
        </Link>
        <Swords className="w-3.5 h-3.5 text-muted/40" />
        <Link
          href={`/fighters/${f.fighterBId}`}
          className={cn(
            "flex min-w-0 items-center gap-1.5 text-sm font-semibold hover:text-primary transition-colors",
            tagB === "W" ? "text-foreground" : finished ? "text-muted" : "text-foreground"
          )}
        >
          {finished && <ResultChip tag={tagB} />}
          <span className="truncate">{bName}</span>
        </Link>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──

interface Props {
  id: string;
}

interface EventDetailResponse {
  event: DbEventSummary;
  card: DbFightCard[];
}

export default function EventDetailClient({ id }: Props) {
  const [fingerprint, setFingerprint] = useState("");

  useEffect(() => {
    getFingerprint().then(setFingerprint);
  }, []);

  const { data, isLoading, error } = useSWR<{
    success: boolean;
    data: EventDetailResponse;
  }>(`/api/mma-events/${id}`, fetcher, { revalidateOnFocus: false });

  const payload = data?.data;
  const event = payload?.event;
  const card = payload?.card ?? [];
  const upcoming = isUpcoming(event?.eventDate ?? null);
  const displayName = event?.nameKo || event?.name || "";
  const venueText = event?.venueKo || event?.venue;

  const eventIdNum = Number(id);

  return (
    <div className="min-h-screen bg-background">
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
        {isLoading && <DetailSkeleton />}

        {error && !isLoading && (
          <div className="text-center py-16 text-muted">
            이벤트 정보를 불러올 수 없습니다.
          </div>
        )}

        {event && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
            className="space-y-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                    upcoming
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/15 text-muted border border-border"
                  )}
                >
                  {upcoming ? (
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
                {(event.orgNameKo || event.orgName) && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-accent/15 text-accent border border-accent/30">
                    <Tag className="h-3 w-3" />
                    {event.orgNameKo || event.orgName}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
                {displayName}
              </h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" as const }}
              className="rounded-2xl border border-border bg-surface p-5 space-y-4"
            >
              {event.eventDate && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">일시</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDate(event.eventDate)}
                    </p>
                  </div>
                </div>
              )}

              {(venueText || event.country) && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 shrink-0">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">장소</p>
                    <p className="text-sm font-semibold text-foreground">
                      {venueText ?? "-"}
                    </p>
                    {event.country && (
                      <p className="text-xs text-muted mt-0.5">{event.country}</p>
                    )}
                  </div>
                </div>
              )}

              {(event.orgNameKo || event.orgName) && (
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted/10 border border-border shrink-0">
                    <Building2 className="h-5 w-5 text-muted" />
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-0.5">단체</p>
                    <p className="text-sm font-semibold text-foreground">
                      {event.orgNameKo || event.orgName}
                    </p>
                    {event.orgSlug && (
                      <p className="text-xs text-muted mt-0.5 uppercase">{event.orgSlug}</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" as const }}
              className="space-y-3"
            >
              <h2 className="text-sm font-semibold text-muted flex items-center gap-1.5">
                <Swords className="w-4 h-4" />
                파이트 카드
                {card.length > 0 && (
                  <span className="text-xs font-normal text-muted/70">({card.length})</span>
                )}
              </h2>
              {card.length > 0 ? (
                <div className="space-y-2">
                  {card.map((f) => (
                    <FightRow key={f.id} f={f} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center">
                  <Swords className="w-8 h-8 text-muted/40 mx-auto mb-2" />
                  <p className="text-sm text-muted">파이트 카드 정보가 아직 등록되지 않았습니다.</p>
                </div>
              )}
            </motion.div>

            <div className="border-t border-border" />

            {fingerprint && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" as const }}
              >
                <CommentSection
                  targetType="event"
                  targetId={eventIdNum}
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
