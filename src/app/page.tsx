"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Calendar,
  MessageSquare,
  Trophy,
  ChevronRight,
  Eye,
  ThumbsUp,
  Crown,
  Flame,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbFighter, DbEventSummary } from "@/lib/mma-types";
import { weightKo } from "@/lib/weight-class";
import { HeroBanner, NoticeBanner } from "@/components/hero-banner";

// ── 타입 ──

interface BoardPost {
  id: number;
  category: string;
  title: string;
  author: string;
  views: number;
  likes: number;
  commentCount: number;
  createdAt: string;
}

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

// ── fetcher ──
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── 국기 이모지 ──
function getFlag(nationality: string | null): string {
  if (!nationality) return "🌍";
  const flags: Record<string, string> = {
    Ireland: "🇮🇪", Russia: "🇷🇺", USA: "🇺🇸", Brazil: "🇧🇷",
    "New Zealand": "🇳🇿", Australia: "🇦🇺", Nigeria: "🇳🇬", China: "🇨🇳",
  };
  return flags[nationality] ?? "🌍";
}

// ── 시간 포맷 (n분 전, n시간 전...) ──
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// ── 스켈레톤 ──
function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-0 divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse bg-surface" />
      ))}
    </div>
  );
}

// ── 섹션 헤더 ──
function SectionHeader({
  icon: Icon,
  iconBg,
  title,
  href,
}: {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconBg)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-[15px] font-extrabold text-foreground">{title}</h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-0.5 text-xs text-muted hover:text-primary transition-colors"
      >
        더보기 <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ── 메인 페이지 ──
export default function HomePage() {
  // GOAT 투표 (파운드포파운드)
  const { data: voteData } = useSWR<{ success: boolean; data: CategoryVoteData }>(
    "/api/mma-vote?category=pound-for-pound",
    fetcher,
    { revalidateOnFocus: false }
  );
  const voteRanking = voteData?.data?.fighters?.slice(0, 5) ?? [];
  const voteTotalVotes = voteData?.data?.totalVotes ?? 0;

  // 게시판 최신글
  const { data: boardData } = useSWR<{ data: BoardPost[] }>(
    "/api/board?limit=8",
    fetcher,
    { revalidateOnFocus: false }
  );
  const recentPosts = boardData?.data?.slice(0, 8) ?? [];

  // 예정 경기
  const { data: eventsData } = useSWR<{ data: DbEventSummary[] }>(
    "/api/mma-events?limit=200",
    fetcher,
    { revalidateOnFocus: false }
  );
  const events = eventsData?.data ?? [];
  const [now] = useState(() => Date.now());
  const upcomingEvents = events
    .filter((e) => e.eventDate && new Date(e.eventDate).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.eventDate ?? 0).getTime() - new Date(b.eventDate ?? 0).getTime()
    )
    .slice(0, 3);

  // 인기 선수 TOP 3
  const { data: fightersData } = useSWR<{ data: DbFighter[] }>(
    "/api/mma-fighters?active=1&verified=1&minWins=10&sort=wins&limit=3",
    fetcher,
    { revalidateOnFocus: false }
  );
  const top3 = fightersData?.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* ── 배너 + 공지 ── */}
      <section className="pt-12 md:pt-18 px-4">
        <div className="max-w-5xl mx-auto">
          <HeroBanner />
          <div className="mt-2">
            <NoticeBanner />
          </div>
        </div>
      </section>

      {/* ── GOAT 투표 순위 ── */}
      <section className="max-w-5xl mx-auto px-4 pt-5 pb-6">
        <SectionHeader
          icon={Trophy}
          iconBg="bg-yellow-500/15 text-yellow-500"
          title="GOAT 투표 순위"
          href="/vote"
        />

        {voteRanking.length === 0 ? (
          <ListSkeleton rows={5} />
        ) : (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b border-border">
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-primary">파운드 포 파운드</span>
              <span className="ml-auto text-[11px] text-muted">
                총 {voteTotalVotes.toLocaleString()}표
              </span>
            </div>

            {/* 순위 리스트 */}
            <div className="divide-y divide-border">
              {voteRanking.map((fighter, i) => {
                const medals = ["🥇", "🥈", "🥉"];
                const pct =
                  voteTotalVotes > 0
                    ? ((fighter.voteCount / voteTotalVotes) * 100).toFixed(1)
                    : "0";
                return (
                  <motion.div
                    key={fighter.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" as const }}
                  >
                    <Link
                      href={`/fighters/${fighter.fighterId}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 transition-colors"
                    >
                      {/* 순위 */}
                      <span className="w-6 text-center shrink-0">
                        {i < 3 ? (
                          <span className="text-lg">{medals[i]}</span>
                        ) : (
                          <span className="text-sm font-bold text-muted">{i + 1}</span>
                        )}
                      </span>

                      {/* 사진 */}
                      {fighter.imageUrl ? (
                        <Image
                          src={fighter.imageUrl}
                          alt={fighter.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted/20 border border-border shrink-0 flex items-center justify-center">
                          <span className="text-xs text-muted">?</span>
                        </div>
                      )}

                      {/* 이름 */}
                      <span className="flex-1 text-sm font-semibold text-foreground truncate">
                        {fighter.name}
                      </span>

                      {/* 득표 바 + 수치 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-primary min-w-[40px] text-right">
                          {fighter.voteCount.toLocaleString()}표
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* 투표하기 CTA */}
            <Link
              href="/vote"
              className="flex items-center justify-center gap-1.5 py-2.5 border-t border-border text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
            >
              <Flame className="h-3.5 w-3.5" />
              투표하러 가기
            </Link>
          </div>
        )}
      </section>

      {/* ── 실시간 게시판 ── */}
      <section className="max-w-5xl mx-auto px-4 pb-6">
        <SectionHeader
          icon={MessageSquare}
          iconBg="bg-blue-500/15 text-blue-500"
          title="실시간 게시판"
          href="/board"
        />

        {recentPosts.length === 0 ? (
          <ListSkeleton rows={5} />
        ) : (
          <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-border">
            {recentPosts.map((post, i) => {
              const catColors: Record<string, string> = {
                분석: "text-blue-500 bg-blue-500/10",
                토론: "text-orange-500 bg-orange-500/10",
                자유: "text-muted bg-muted/10",
              };
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" as const }}
                >
                  <Link href={`/board/${post.id}`}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-primary/5 transition-colors">
                      {/* 카테고리 */}
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold",
                          catColors[post.category] ?? "text-muted bg-muted/10"
                        )}
                      >
                        {post.category}
                      </span>

                      {/* 제목 + 댓글 수 */}
                      <h3 className="flex-1 text-[13px] text-foreground truncate">
                        {post.title}
                        {post.commentCount > 0 && (
                          <span className="ml-1 text-primary text-xs font-semibold">
                            [{post.commentCount}]
                          </span>
                        )}
                      </h3>

                      {/* 메타 */}
                      <div className="flex items-center gap-2 text-[11px] text-muted shrink-0">
                        <span className="hidden sm:inline">{post.author}</span>
                        <span className="flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {post.views}
                        </span>
                        {post.likes > 0 && (
                          <span className="flex items-center gap-0.5">
                            <ThumbsUp className="h-3 w-3" />
                            {post.likes}
                          </span>
                        )}
                        <span className="hidden sm:inline">{timeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 예정 경기 ── */}
      <section className="max-w-5xl mx-auto px-4 pb-6">
        <SectionHeader
          icon={Calendar}
          iconBg="bg-accent/15 text-accent"
          title="예정 경기"
          href="/events"
        />

        {upcomingEvents.length === 0 ? (
          <ListSkeleton rows={3} />
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event, i) => {
              const displayName = event.nameKo || event.name;
              const eventDate = event.eventDate ? new Date(event.eventDate) : null;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" as const }}
                >
                  <Link href={`/events/${event.id}`}>
                    <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 transition-all hover:border-primary/40">
                      {/* 날짜 블록 */}
                      <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-2.5 py-1.5 min-w-[52px]">
                        <span className="text-[10px] font-semibold text-primary uppercase">
                          {eventDate
                            ? eventDate.toLocaleDateString("ko-KR", { month: "short" })
                            : "-"}
                        </span>
                        <span className="text-lg font-black text-primary leading-tight">
                          {eventDate ? eventDate.getDate() : "-"}
                        </span>
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                          {displayName}
                        </h3>
                        <p className="text-xs text-muted mt-0.5 truncate">
                          {[event.venueKo || event.venue, event.country]
                            .filter(Boolean)
                            .join(" · ") || "-"}
                        </p>
                      </div>

                      {/* D-day */}
                      {eventDate && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          D-{Math.max(0, Math.ceil((eventDate.getTime() - now) / 86400000))}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 인기 선수 TOP 3 ── */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <SectionHeader
          icon={Flame}
          iconBg="bg-red-500/15 text-red-500"
          title="인기 선수"
          href="/fighters"
        />

        {top3.length === 0 ? (
          <ListSkeleton rows={3} />
        ) : (
          <div className="space-y-2">
            {top3.map((fighter, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              const total = fighter.wins + fighter.losses + fighter.draws;
              const winRate = total > 0 ? Math.round((fighter.wins / total) * 100) : 0;
              const displayName = fighter.fullNameKo || fighter.fullName;
              const nick = fighter.nickname || fighter.nicknameKo;
              return (
                <motion.div
                  key={fighter.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" as const }}
                >
                  <Link href={`/fighters/${fighter.id}`}>
                    <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 transition-all hover:border-primary/40">
                      <span className="text-xl shrink-0">{medals[i]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{getFlag(fighter.nationality)}</span>
                          <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {displayName}
                          </h3>
                          {nick && (
                            <span className="text-[11px] text-muted truncate hidden sm:inline">
                              &quot;{nick}&quot;
                            </span>
                          )}
                        </div>
                        {fighter.weightClass && (
                          <span className="text-[10px] text-muted">
                            {weightKo(fighter.weightClass)}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold">
                          <span className="text-green-500">{fighter.wins}W</span>
                          {" - "}
                          <span className="text-red-500">{fighter.losses}L</span>
                          {fighter.draws > 0 && (
                            <span className="text-muted"> - {fighter.draws}D</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted">승률 {winRate}%</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
