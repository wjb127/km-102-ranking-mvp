"use client";

import { use, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Ruler,
  Target,
  Globe,
  Dumbbell,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";
import CommentSection from "@/components/comment-section";
import type { MmaFighter } from "@/lib/api/mma";

// ── SWR fetcher ──

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

// ── 인치 → cm 변환 ──

function inchesToCm(inches: number | null): string {
  if (inches === null) return "-";
  return `${Math.round(inches * 2.54)}cm`;
}

// ── 국적 → 국기 이모지 ──

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

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded bg-border" />
      <div className="h-5 w-32 rounded bg-border/60" />
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-border/60" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-border/60" />
        ))}
      </div>
    </div>
  );
}

// ── 전적 통계 카드 ──

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, color, bgColor }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-border p-4",
        bgColor
      )}
    >
      <span className={cn("text-3xl md:text-4xl font-extrabold", color)}>
        {value}
      </span>
      <span className="text-xs text-muted mt-1 font-medium">{label}</span>
    </motion.div>
  );
}

// ── 정보 그리드 아이템 ──

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
        <Icon className="w-4.5 h-4.5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

// ── 상세 클라이언트 컴포넌트 ──

function FighterDetailClient({ id }: { id: string }) {
  const [fingerprint, setFingerprint] = useState("");

  // fingerprint 로드
  useEffect(() => {
    getFingerprint().then(setFingerprint);
  }, []);

  // 선수 데이터 패칭
  const { data, isLoading, error } = useSWR<{
    success: boolean;
    data: MmaFighter;
  }>(`/api/fighters/${id}`, fetcher, { revalidateOnFocus: false });

  const fighter = data?.data;

  // 댓글용 categoryId — 선수 ID에 오프셋을 줘서 카테고리 투표 댓글과 충돌 방지
  const commentCategoryId = fighter ? 100000 + fighter.id : 0;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted text-sm">
          선수 정보를 불러오는 중 오류가 발생했습니다.
        </p>
        <Link
          href="/fighters"
          className="text-sm text-primary hover:underline"
        >
          선수 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 영역 */}
      <section className="relative overflow-hidden pt-12 pb-6 md:pt-16 md:pb-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/6 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4">
          {/* 뒤로가기 */}
          <Link
            href="/fighters"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>선수 목록</span>
          </Link>

          {isLoading ? (
            <DetailSkeleton />
          ) : fighter ? (
            <>
              {/* 이름 + 닉네임 */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" as const }}
                className="mb-6"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl" aria-label={fighter.nationality ?? "국적"}>
                    {getFlag(fighter.nationality)}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
                    {fighter.name}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      fighter.active
                        ? "bg-success/15 text-success border border-success/30"
                        : "bg-muted/15 text-muted border border-border"
                    )}
                  >
                    {fighter.active ? "Active" : "Retired"}
                  </span>
                </div>
                {fighter.nickname && (
                  <p className="text-muted text-base md:text-lg font-medium ml-[calc(1.875rem+0.75rem)]">
                    &quot;{fighter.nickname}&quot;
                  </p>
                )}
              </motion.div>

              {/* 전적 통계 */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.1,
                  ease: "easeOut" as const,
                }}
                className="mb-6"
              >
                <h2 className="text-sm font-semibold text-muted mb-3">전적</h2>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="승리"
                    value={fighter.record_wins}
                    color="text-success"
                    bgColor="bg-success/5"
                  />
                  <StatCard
                    label="패배"
                    value={fighter.record_losses}
                    color="text-danger"
                    bgColor="bg-danger/5"
                  />
                  <StatCard
                    label="무승부"
                    value={fighter.record_draws}
                    color="text-muted"
                    bgColor="bg-surface"
                  />
                </div>
                {fighter.record_no_contests > 0 && (
                  <p className="text-xs text-muted mt-2 text-center">
                    무효 경기: {fighter.record_no_contests}
                  </p>
                )}
              </motion.div>

              {/* 선수 정보 그리드 */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  ease: "easeOut" as const,
                }}
                className="mb-10"
              >
                <h2 className="text-sm font-semibold text-muted mb-3">
                  선수 정보
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem
                    icon={Dumbbell}
                    label="체급"
                    value={fighter.weight_class ?? "-"}
                  />
                  <InfoItem
                    icon={Globe}
                    label="국적"
                    value={fighter.nationality ?? "-"}
                  />
                  <InfoItem
                    icon={Ruler}
                    label="신장"
                    value={inchesToCm(fighter.height_inches)}
                  />
                  <InfoItem
                    icon={Target}
                    label="리치"
                    value={inchesToCm(fighter.reach_inches)}
                  />
                  <InfoItem
                    icon={Shield}
                    label="스탠스"
                    value={fighter.stance ?? "-"}
                  />
                  <InfoItem
                    icon={Activity}
                    label="활동 상태"
                    value={fighter.active ? "현역" : "은퇴"}
                  />
                </div>
              </motion.div>

              {/* 댓글 섹션 */}
              {fingerprint && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3,
                    ease: "easeOut" as const,
                  }}
                >
                  <CommentSection
                    categoryId={commentCategoryId}
                    fingerprint={fingerprint}
                  />
                </motion.div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}

// ── 페이지 컴포넌트 ──

export default function FighterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <FighterDetailClient id={id} />;
}
