"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Calendar,
  MessageSquare,
  Trophy,
  ChevronRight,
  Swords,
  Eye,
  ThumbsUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbFighter, DbEventSummary } from "@/lib/mma-types";
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

// ── 네비게이션 ──
const NAV_ITEMS = [
  { label: "선수 검색", href: "/fighters", icon: Search, desc: "MMA 선수 프로필 · 전적" },
  { label: "경기 일정", href: "/events", icon: Calendar, desc: "UFC 대회 일정 · 결과" },
  { label: "GOAT 투표", href: "/vote", icon: Trophy, desc: "역대 최고 선수 투표" },
  { label: "게시판", href: "/board", icon: MessageSquare, desc: "분석 · 토론 · 자유" },
];

// ── 스켈레톤 ──
function CardSkeleton() {
  return <div className="h-24 rounded-xl bg-surface border border-border animate-pulse" />;
}

// ── 메인 페이지 ──
export default function HomePage() {
  // 선수 TOP 3 (전역 승수 기준) — 검증/필터/정렬 모두 서버에서 수행.
  // active=1, verified=1(externalId not null), minWins=10, sort=wins, limit=3
  const { data: fightersData } = useSWR<{ data: DbFighter[] }>(
    "/api/mma-fighters?active=1&verified=1&minWins=10&sort=wins&limit=3",
    fetcher,
    { revalidateOnFocus: false }
  );
  const top3 = fightersData?.data ?? [];

  // 예정 경기 (eventDate >= now)
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

  // 게시판 최신글
  const { data: boardData } = useSWR<{ data: BoardPost[] }>(
    "/api/board",
    fetcher,
    { revalidateOnFocus: false }
  );
  const recentPosts = boardData?.data?.slice(0, 5) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* ── 히어로 (컴팩트) ── */}
      <section className="relative overflow-hidden pt-8 pb-6 md:pt-10 md:pb-8">
        {/* 배경 glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-accent/6 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" as const }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-3"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>MMA 분석 커뮤니티</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07, ease: "easeOut" as const }}
            className="text-3xl md:text-5xl font-black tracking-tight text-foreground mb-2 leading-tight"
          >
            격투기의 모든 것,{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              한곳에서
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14, ease: "easeOut" as const }}
            className="text-sm text-muted max-w-sm mx-auto"
          >
            선수 정보 · 경기 일정 · GOAT 투표 · 커뮤니티
          </motion.p>
        </div>
      </section>

      {/* ── 공지 띠 + 히어로 배너 ── */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        {/* 공지 한 줄 띠 */}
        <NoticeBanner />
        {/* 디시인사이드 스타일 배너 슬라이더 */}
        <HeroBanner />
      </section>

      {/* ── 퀵 네비게이션 ── */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {NAV_ITEMS.map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.06, ease: "easeOut" as const }}
            >
              <Link href={item.href}>
                <div className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/40 hover:bg-primary/5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{item.label}</span>
                  <span className="text-[11px] text-muted text-center leading-tight">{item.desc}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 인기 선수 TOP 3 ── */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/15">
              <Trophy className="h-4 w-4 text-yellow-400" />
            </div>
            <h2 className="text-lg font-extrabold text-foreground">인기 선수 TOP 3</h2>
          </div>
          <Link href="/fighters" className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors">
            전체보기 <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {top3.length === 0 ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {top3.map((fighter, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              const total = fighter.wins + fighter.losses + fighter.draws;
              const winRate = total > 0 ? Math.round((fighter.wins / total) * 100) : 0;
              const displayName = fighter.fullNameKo || fighter.fullName;
              const nick = fighter.nicknameKo || fighter.nickname;
              return (
                <motion.div
                  key={fighter.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" as const }}
                >
                  <Link href={`/fighters/${fighter.id}`}>
                    <div className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{medals[i]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getFlag(fighter.nationality)}</span>
                            <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {displayName}
                            </h3>
                          </div>
                          {nick && (
                            <p className="text-xs text-muted truncate">&quot;{nick}&quot;</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-foreground">
                            <span className="text-green-500">{fighter.wins}W</span>
                            {" - "}
                            <span className="text-red-500">{fighter.losses}L</span>
                            {fighter.draws > 0 && (
                              <span className="text-muted"> - {fighter.draws}D</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted">승률 {winRate}%</p>
                        </div>
                      </div>
                      {fighter.weightClass && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {fighter.weightClass}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 예정 경기 ── */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <Calendar className="h-4 w-4 text-accent" />
            </div>
            <h2 className="text-lg font-extrabold text-foreground">예정 경기</h2>
          </div>
          <Link href="/events" className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors">
            전체보기 <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="space-y-3">{[0, 1].map((i) => <CardSkeleton key={i} />)}</div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => {
              const displayName = event.nameKo || event.name;
              const venue = event.venueKo || event.venue;
              const eventDate = event.eventDate ? new Date(event.eventDate) : null;
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" as const }}
                >
                  <Link href={`/events/${event.id}`}>
                    <div className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40">
                      {/* 날짜 */}
                      <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 px-3 py-2 min-w-[60px]">
                        <span className="text-[10px] font-semibold text-primary uppercase">
                          {eventDate
                            ? eventDate.toLocaleDateString("ko-KR", { month: "short" })
                            : "-"}
                        </span>
                        <span className="text-xl font-black text-primary">
                          {eventDate ? eventDate.getDate() : "-"}
                        </span>
                      </div>
                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                          {displayName}
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                          {[venue, event.country].filter(Boolean).join(" · ") || "-"}
                        </p>
                      </div>
                      {/* 뱃지 */}
                      {eventDate && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
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

      {/* ── 실시간 게시판 ── */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-lg font-extrabold text-foreground">실시간 게시판</h2>
          </div>
          <Link href="/board" className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors">
            전체보기 <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
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
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" as const }}
                >
                  <Link href={`/board/${post.id}`}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors">
                      <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold", catColors[post.category] ?? "text-muted bg-muted/10")}>
                        {post.category}
                      </span>
                      <h3 className="flex-1 text-sm text-foreground truncate">
                        {post.title}
                        {post.commentCount > 0 && (
                          <span className="ml-1 text-primary text-xs font-semibold">[{post.commentCount}]</span>
                        )}
                      </h3>
                      <div className="hidden md:flex items-center gap-3 text-[11px] text-muted shrink-0">
                        <span>{post.author}</span>
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" />{post.views}</span>
                        <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" />{post.likes}</span>
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
