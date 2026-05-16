"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminShell from "@/components/admin-shell";

interface Suggestion {
  id: number;
  fighterId: number;
  fighterName: string;
  fighterNameKo: string | null;
  userNickname: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  reason: string | null;
  status: string;
  rejectReason: string | null;
  createdAt: string;
}

const FIELD_LABEL: Record<string, string> = {
  fullNameKo: "한글명",
  nicknameKo: "한글 별명",
  nationalityKo: "한글 국적",
  nickname: "영문 별명",
};

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  pending: { text: "대기", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  approved: { text: "승인", color: "text-success bg-success/5 border-success/20" },
  rejected: { text: "거절", color: "text-danger bg-danger/5 border-danger/20" },
};

export default function AdminFighterSuggestionsPage() {
  return (
    <Suspense fallback={null}>
      <AdminShell>
        <Inner />
      </AdminShell>
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const [rows, setRows] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/fighter-suggestions?status=${filter}`, { cache: "no-store" });
    if (res.status === 401) { router.push("/login"); return; }
    if (res.status === 403) return;
    const json = await res.json();
    if (json.success) setRows(json.data);
    setLoading(false);
  }, [filter, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAction(id: number, action: "approve" | "reject", reason?: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/fighter-suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectReason: reason }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
        setRejectId(null);
        setRejectReason("");
      }
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-24 md:pt-8 pb-24 md:pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 관리자 대시보드
        </Link>

        <h1 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5" /> 선수 정보 수정 제안
        </h1>

        <div className="flex gap-2 mb-4">
          {(["pending", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                filter === f
                  ? "border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
              )}
            >
              {f === "pending" ? "대기 중" : "전체"}
            </button>
          ))}
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          {loading ? (
            <div className="py-12 text-center text-sm text-[var(--muted)]">불러오는 중...</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--muted)]">
              {filter === "pending" ? "대기 중인 제안이 없습니다." : "제안이 없습니다."}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]/60">
              {rows.map((r) => {
                const sl = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
                return (
                  <li key={r.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("inline-block rounded-md border px-2 py-0.5 text-[11px] font-bold", sl.color)}>
                            {sl.text}
                          </span>
                          <Link
                            href={`/fighters/${r.fighterId}`}
                            className="text-sm font-bold text-[var(--foreground)] hover:text-[var(--primary)]"
                          >
                            {r.fighterNameKo || r.fighterName}
                          </Link>
                        </div>
                        <div className="text-xs text-[var(--muted)] mb-1.5">
                          {r.userNickname} · {new Date(r.createdAt).toLocaleString("ko-KR")}
                        </div>
                        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
                          <div className="mb-1">
                            <span className="font-semibold text-[var(--foreground)]">{FIELD_LABEL[r.fieldName] ?? r.fieldName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--muted)] line-through">{r.oldValue || "(없음)"}</span>
                            <span className="text-[var(--muted)]">&rarr;</span>
                            <span className="font-semibold text-[var(--primary)]">{r.newValue}</span>
                          </div>
                          {r.reason && (
                            <p className="mt-1.5 text-[var(--muted)]">사유: {r.reason}</p>
                          )}
                          {r.rejectReason && (
                            <p className="mt-1.5 text-danger">거절 사유: {r.rejectReason}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {r.status === "pending" && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleAction(r.id, "approve")}
                          disabled={actionLoading === r.id}
                          className="flex items-center gap-1.5 rounded-lg bg-success/10 border border-success/20 px-3 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/20 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          승인
                        </button>
                        {rejectId === r.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="거절 사유 (선택)"
                              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-xs text-[var(--foreground)]"
                            />
                            <button
                              onClick={() => handleAction(r.id, "reject", rejectReason)}
                              disabled={actionLoading === r.id}
                              className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger disabled:opacity-50"
                            >
                              확인
                            </button>
                            <button
                              onClick={() => { setRejectId(null); setRejectReason(""); }}
                              className="text-xs text-[var(--muted)]"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectId(r.id)}
                            disabled={actionLoading === r.id}
                            className="flex items-center gap-1.5 rounded-lg bg-danger/10 border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            거절
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
