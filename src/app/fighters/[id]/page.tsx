"use client";

import { use, useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Ruler,
  Target,
  Globe,
  Dumbbell,
  Trophy,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFingerprint } from "@/lib/fingerprint";
import CommentSection from "@/components/comment-section";
import { ResultChip, MethodChip, type FightResultTag } from "@/components/fight-chips";
import type { DbFighter, DbOrgRecord, DbRecentFight } from "@/lib/mma-types";

// ── SWR fetcher ──

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("API 오류");
    return res.json();
  });

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
  tag: FightResultTag;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, tag, color, bgColor }: StatCardProps) {
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
      <span className="flex items-center gap-2">
        <ResultChip tag={tag} size="md" />
        <span className={cn("text-3xl md:text-4xl font-extrabold", color)}>{value}</span>
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
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// ── 응답 타입 ──

interface FighterDetailResponse {
  fighter: DbFighter & {
    heightCm: string | null;
    reachCm: string | null;
    bio: string | null;
    bioKo: string | null;
    birthDate: string | null;
  };
  orgRecords: DbOrgRecord[];
  recentFights: DbRecentFight[];
}

function getRecentFightTag(f: DbRecentFight, fighterId: number): FightResultTag {
  const isWin = f.winnerId != null && f.winnerId === fighterId;
  const isLoss = f.winnerId != null && f.winnerId !== fighterId && f.result !== "DRAW";
  if (isWin) return "W";
  if (isLoss) return "L";
  if (f.result === "DRAW") return "D";
  if (f.result === "NO_CONTEST") return "NC";
  return "-";
}

const FORM_BAR_STYLE: Record<FightResultTag, string> = {
  W: "h-10 bg-success",
  L: "h-6 bg-danger",
  D: "h-4 bg-muted",
  NC: "h-5 bg-yellow-500",
  "-": "h-3 bg-border",
};

function FormSparkline({
  recentFights,
  fighterId,
}: {
  recentFights: DbRecentFight[];
  fighterId: number;
}) {
  const form = recentFights.slice(0, 5).reverse();
  const wins = form.filter((f) => getRecentFightTag(f, fighterId) === "W").length;

  return (
    <div className="mt-3 rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-foreground">최근 5경기 폼</p>
        <p className="text-[10px] text-muted">
          {form.length > 0 ? `${wins}승 / ${form.length}경기` : "데이터 없음"}
        </p>
      </div>
      {form.length > 0 ? (
        <div className="flex items-end gap-2">
          {form.map((fight) => {
            const tag = getRecentFightTag(fight, fighterId);
            return (
              <div key={fight.id} className="flex flex-1 flex-col items-center gap-1">
                <div
                  title={`${fight.eventNameKo || fight.eventName || "이벤트"}: ${tag}`}
                  className={cn(
                    "w-full min-w-7 rounded-t-md border border-white/10",
                    FORM_BAR_STYLE[tag]
                  )}
                />
                <ResultChip tag={tag} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-12 items-center justify-center text-xs text-muted">
          최근 경기 데이터가 쌓이면 폼 그래프가 표시됩니다.
        </div>
      )}
    </div>
  );
}

// ── 단체별 전적 카드 ──

function OrgRecordRow({ r }: { r: DbOrgRecord }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-xs gap-2">
      <span className="font-semibold text-foreground truncate">
        {r.orgNameKo || r.orgName || "기타"}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        <span className="font-mono tabular-nums text-muted">
          <span className="text-success font-bold">{r.wins}</span>
          <span className="mx-0.5">-</span>
          <span className="text-danger font-bold">{r.losses}</span>
          <span className="mx-0.5">-</span>
          <span>{r.draws}</span>
          {r.noContests > 0 && <span className="ml-1 text-yellow-500">(NC {r.noContests})</span>}
        </span>
        <span className="flex items-center gap-1">
          {r.winsByKo > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MethodChip method="KO" />
              <span className="text-[10px] text-muted tabular-nums">{r.winsByKo}</span>
            </span>
          )}
          {r.winsBySub > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MethodChip method="SUB" />
              <span className="text-[10px] text-muted tabular-nums">{r.winsBySub}</span>
            </span>
          )}
          {r.winsByDec > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MethodChip method="DEC" />
              <span className="text-[10px] text-muted tabular-nums">{r.winsByDec}</span>
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// ── 최근 경기 카드 ──

function RecentFightRow({ f, fighterId }: { f: DbRecentFight; fighterId: number }) {
  const tag = getRecentFightTag(f, fighterId);
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 text-xs gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <ResultChip tag={tag} />
        <div className="min-w-0">
          <p className="text-foreground truncate">
            {f.eventNameKo || f.eventName || "-"}
          </p>
          <p className="text-[10px] text-muted truncate flex items-center gap-1">
            <span className="tabular-nums">
              {f.eventDate ? new Date(f.eventDate).toLocaleDateString("ko-KR") : "-"}
            </span>
            {f.round && <span className="tabular-nums">· R{f.round}</span>}
            {f.time && <span className="tabular-nums">· {f.time}</span>}
          </p>
        </div>
      </div>
      {f.method && (
        <div className="shrink-0">
          <MethodChip method={f.method} />
        </div>
      )}
    </div>
  );
}

// ── 상세 클라이언트 컴포넌트 ──

function FighterDetailClient({ id }: { id: string }) {
  const [fingerprint, setFingerprint] = useState("");

  useEffect(() => {
    getFingerprint().then(setFingerprint);
  }, []);

  const { data, isLoading, error } = useSWR<{
    success: boolean;
    data: FighterDetailResponse;
  }>(`/api/mma-fighters/${id}`, fetcher, { revalidateOnFocus: false });

  const payload = data?.data;
  const fighter = payload?.fighter;
  const orgRecords = payload?.orgRecords ?? [];
  const recentFights = payload?.recentFights ?? [];

  const fighterIdNum = fighter?.id ?? 0;

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted text-sm">선수 정보를 불러오는 중 오류가 발생했습니다.</p>
        <Link href="/fighters" className="text-sm text-primary hover:underline">
          선수 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const totalWins = fighter?.wins ?? 0;
  const totalLosses = fighter?.losses ?? 0;
  const totalDraws = fighter?.draws ?? 0;
  const totalNC = fighter?.noContests ?? 0;

  const displayName = fighter?.fullNameKo || fighter?.fullName || "";
  const subName = fighter?.fullNameKo ? fighter.fullName : null;
  const nick = fighter?.nicknameKo || fighter?.nickname;
  const nationalityDisplay = fighter?.nationalityKo || fighter?.nationality;

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden pt-12 pb-6 md:pt-16 md:pb-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/6 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4">
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
                    {displayName}
                  </h1>
                </div>
                {subName && (
                  <p className="text-xs text-muted/70 ml-[calc(1.875rem+0.75rem)]">
                    {subName}
                  </p>
                )}
                {nick && (
                  <p className="text-muted text-base md:text-lg font-medium ml-[calc(1.875rem+0.75rem)] mt-0.5">
                    &quot;{nick}&quot;
                  </p>
                )}
              </motion.div>

              {/* 전적 통계 (합산) */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" as const }}
                className="mb-6"
              >
                <h2 className="text-sm font-semibold text-muted mb-3">
                  전적 (전체 합산)
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="승리" value={totalWins} tag="W" color="text-success" bgColor="bg-success/5" />
                  <StatCard label="패배" value={totalLosses} tag="L" color="text-danger" bgColor="bg-danger/5" />
                  <StatCard label="무승부" value={totalDraws} tag="D" color="text-muted" bgColor="bg-surface" />
                </div>
                <FormSparkline recentFights={recentFights} fighterId={fighter.id} />
                {totalNC > 0 && (
                  <p className="text-xs text-muted mt-2 text-center">무효 경기: {totalNC}</p>
                )}
              </motion.div>

              {/* 단체별 전적 */}
              {orgRecords.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" as const }}
                  className="mb-6 rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-semibold text-foreground">단체별 전적</h2>
                  </div>
                  {orgRecords.map((r) => (
                    <OrgRecordRow key={r.id} r={r} />
                  ))}
                </motion.div>
              )}

              {/* 선수 정보 그리드 */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" as const }}
                className="mb-10"
              >
                <h2 className="text-sm font-semibold text-muted mb-3">선수 정보</h2>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem icon={Dumbbell} label="체급" value={fighter.weightClass ?? "-"} />
                  <InfoItem icon={Globe} label="국적" value={nationalityDisplay ?? "-"} />
                  <InfoItem
                    icon={Ruler}
                    label="신장"
                    value={fighter.heightCm ? `${fighter.heightCm}cm` : "-"}
                  />
                  <InfoItem
                    icon={Target}
                    label="리치"
                    value={fighter.reachCm ? `${fighter.reachCm}cm` : "-"}
                  />
                </div>
                {fighter.bioKo && (
                  <div className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-foreground whitespace-pre-wrap">
                    {fighter.bioKo}
                  </div>
                )}
              </motion.div>

              {/* 최근 경기 */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" as const }}
                className="mb-10 rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">최근 경기</h2>
                </div>
                {recentFights.length > 0 ? (
                  recentFights.map((f) => (
                    <RecentFightRow key={f.id} f={f} fighterId={fighter.id} />
                  ))
                ) : (
                  <p className="text-sm text-muted text-center py-4">경기 기록이 없습니다.</p>
                )}
              </motion.div>

              {/* 댓글 섹션 (레거시 comments) */}
              {fingerprint && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" as const }}
                >
                  <CommentSection
                    targetType="fighter"
                    targetId={fighterIdNum}
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

export default function FighterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <FighterDetailClient id={id} />;
}
