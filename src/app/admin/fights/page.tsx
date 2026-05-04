"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Swords, Crown, Ban } from "lucide-react";

interface FightRow {
  id: number;
  eventId: number;
  eventName: string | null;
  eventNameKo: string | null;
  eventDate: string | null;
  orgSlug: string | null;
  weightClass: string | null;
  isTitleFight: boolean;
  isMainEvent: boolean;
  isVoid: boolean;
  result: string | null;
  method: string | null;
  round: number | null;
  time: string | null;
  winnerId: number | null;
  fighterA: { id: number; name: string; nameKo: string | null } | null;
  fighterB: { id: number; name: string; nameKo: string | null } | null;
}

export default function AdminFightsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [rows, setRows] = useState<FightRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 30;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        if (!json?.data || json.data.role !== "admin") {
          router.replace("/");
          return;
        }
        setAuthChecked(true);
      } catch {
        router.replace("/");
      }
    })();
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/fights?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (json?.success) {
        setRows(json.data);
        setTotal(Number(json.total ?? 0));
      }
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    if (authChecked) load();
  }, [authChecked, load]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted)]">권한 확인 중...</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> 관리자 콘솔
            </Link>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">경기 보정</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              경기 결과/승자/방법/라운드를 수동 보정합니다. 모든 변경은 감사 로그에 기록됩니다.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(draft.trim());
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="선수명 또는 이벤트명 검색"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2 pl-10 pr-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            검색
          </button>
        </form>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {loading ? (
            <p className="p-6 text-sm text-[var(--muted)]">불러오는 중...</p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <Swords className="h-10 w-10 text-[var(--muted)]/40" />
              <p className="text-sm text-[var(--muted)]">경기가 없습니다.</p>
            </div>
          ) : (
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">이벤트</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">대진</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">결과</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">방법</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">상태</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">액션</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const aName = r.fighterA?.nameKo || r.fighterA?.name || "?";
                  const bName = r.fighterB?.nameKo || r.fighterB?.name || "?";
                  const winnerSide =
                    r.winnerId == null
                      ? null
                      : r.winnerId === r.fighterA?.id
                      ? "a"
                      : r.winnerId === r.fighterB?.id
                      ? "b"
                      : null;
                  return (
                    <tr key={r.id} className="border-b border-[var(--border)]/60 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--foreground)]">
                          {r.eventNameKo || r.eventName || "(미상)"}
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          {r.eventDate ? new Date(r.eventDate).toLocaleDateString("ko-KR") : ""}
                          {r.orgSlug ? ` · ${r.orgSlug.toUpperCase()}` : ""}
                          {r.weightClass ? ` · ${r.weightClass}` : ""}
                          {r.isTitleFight ? " · 타이틀" : ""}
                          {r.isMainEvent ? " · 메인" : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {winnerSide === "a" && <Crown className="h-3.5 w-3.5 text-[var(--accent)]" />}
                          <span className={winnerSide === "a" ? "font-bold text-[var(--foreground)]" : "text-[var(--muted)]"}>
                            {aName}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--muted)]">vs</div>
                        <div className="flex items-center gap-1.5">
                          {winnerSide === "b" && <Crown className="h-3.5 w-3.5 text-[var(--accent)]" />}
                          <span className={winnerSide === "b" ? "font-bold text-[var(--foreground)]" : "text-[var(--muted)]"}>
                            {bName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">{r.result ?? "-"}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {r.method ?? "-"}
                        {r.round != null ? ` · R${r.round}` : ""}
                        {r.time ? ` · ${r.time}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        {r.isVoid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--danger)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--danger)]">
                            <Ban className="h-3 w-3" /> 무효
                          </span>
                        ) : (
                          <span className="rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--success)]">
                            정상
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/fights/${r.id}`}
                          className="inline-flex items-center rounded-md border border-[var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--foreground)] hover:bg-[var(--border)]/40"
                        >
                          편집
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {total > limit && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">
              총 {total}건 · {page}/{totalPages} 페이지
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-[var(--border)] px-3 py-1 text-xs disabled:opacity-40"
              >
                이전
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-[var(--border)] px-3 py-1 text-xs disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
