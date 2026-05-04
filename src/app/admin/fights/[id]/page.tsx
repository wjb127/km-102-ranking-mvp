"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Save } from "lucide-react";

interface FightDetail {
  id: number;
  eventId: number;
  eventName: string | null;
  eventNameKo: string | null;
  eventDate: string | null;
  weightClass: string | null;
  isTitleFight: boolean;
  isMainEvent: boolean;
  isVoid: boolean;
  isAppliedToRecord: boolean;
  result: string | null;
  method: string | null;
  round: number | null;
  time: string | null;
  winnerId: number | null;
  fighterAId: number;
  fighterBId: number;
  fighterA: { id: number; name: string; nameKo: string | null } | null;
  fighterB: { id: number; name: string; nameKo: string | null } | null;
}

const RESULT_OPTIONS = [
  { value: "", label: "(미정)" },
  { value: "win", label: "승" },
  { value: "loss", label: "패" },
  { value: "draw", label: "무승부" },
  { value: "no_contest", label: "무효경기 (NC)" },
];

export default function AdminFightEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [authChecked, setAuthChecked] = useState(false);
  const [fight, setFight] = useState<FightDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 편집 상태
  const [winnerId, setWinnerId] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [round, setRound] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [isVoid, setIsVoid] = useState<boolean>(false);

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
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/fights/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!json?.success) {
        setErrorMsg(json?.error ?? "불러오기 실패");
        return;
      }
      const d: FightDetail = json.data;
      setFight(d);
      setWinnerId(d.winnerId == null ? "" : String(d.winnerId));
      setResult(d.result ?? "");
      setMethod(d.method ?? "");
      setRound(d.round == null ? "" : String(d.round));
      setTime(d.time ?? "");
      setIsVoid(Boolean(d.isVoid));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authChecked) load();
  }, [authChecked, load]);

  async function save() {
    if (!reason.trim()) {
      alert("보정 사유를 입력해주세요.");
      return;
    }
    if (!fight) return;
    setSaving(true);
    try {
      const patch: Record<string, unknown> = {
        winnerId: winnerId === "" ? null : Number(winnerId),
        result: result === "" ? null : result,
        method: method.trim() === "" ? null : method.trim(),
        round: round === "" ? null : Number(round),
        time: time.trim() === "" ? null : time.trim(),
        isVoid,
      };
      const res = await fetch(`/api/admin/fights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim(), patch }),
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error ?? "저장 실패");
        return;
      }
      alert("저장되었습니다.");
      setReason("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted)]">권한 확인 중...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted)]">불러오는 중...</p>
      </div>
    );
  }

  if (errorMsg || !fight) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
        <div className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 p-6 text-center">
          <p className="text-sm text-[var(--danger)]">{errorMsg ?? "경기를 찾을 수 없습니다."}</p>
          <Link
            href="/admin/fights"
            className="mt-3 inline-block text-xs text-[var(--muted)] underline"
          >
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  const aName = fight.fighterA?.nameKo || fight.fighterA?.name || "선수 A";
  const bName = fight.fighterB?.nameKo || fight.fighterB?.name || "선수 B";

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <Link
            href="/admin/fights"
            className="mb-2 inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 경기 목록
          </Link>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">경기 편집</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {fight.eventNameKo || fight.eventName || "(이벤트명 없음)"}
            {fight.eventDate ? ` · ${new Date(fight.eventDate).toLocaleDateString("ko-KR")}` : ""}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
          {/* 대진 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[var(--border)]/60 p-3">
              <p className="text-[11px] uppercase text-[var(--muted)]">선수 A</p>
              <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{aName}</p>
              <p className="text-[11px] text-[var(--muted)]">id: {fight.fighterAId}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)]/60 p-3">
              <p className="text-[11px] uppercase text-[var(--muted)]">선수 B</p>
              <p className="mt-1 text-sm font-bold text-[var(--foreground)]">{bName}</p>
              <p className="text-[11px] text-[var(--muted)]">id: {fight.fighterBId}</p>
            </div>
          </div>

          {/* 승자 */}
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1">승자</label>
            <select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            >
              <option value="">(미정/무승부)</option>
              <option value={String(fight.fighterAId)}>A · {aName}</option>
              <option value={String(fight.fighterBId)}>B · {bName}</option>
            </select>
          </div>

          {/* 결과 */}
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1">결과 코드</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            >
              {RESULT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* 방법 */}
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1">방법 (KO/TKO/Submission/Decision 등)</label>
            <input
              type="text"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="예: KO (Punch), Submission (RNC), Decision (Unanimous)"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* 라운드/시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">라운드</label>
              <input
                type="number"
                min={0}
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] mb-1">시간 (mm:ss)</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="예: 4:32"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {/* 무효 여부 */}
          <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
            <input
              type="checkbox"
              checked={isVoid}
              onChange={(e) => setIsVoid(e.target.checked)}
              className="h-4 w-4"
            />
            <span>경기 무효 (취소/번복)</span>
          </label>

          {/* 사유 */}
          <div>
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
              보정 사유 <span className="text-[var(--danger)]">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="예: 경기 후 도핑 적발로 결과 NC 처리"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
            <p className="mt-1 flex items-start gap-1 text-[11px] text-[var(--muted)]">
              <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
              모든 변경 사항은 admin_overrides 감사 로그에 기록됩니다. 선수 통산 전적 합계는 별도로
              <Link href={`/admin/fighters`} className="underline mx-1">선수 페이지</Link>
              에서 보정해주세요.
            </p>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "저장 중..." : "저장 (감사 로그 기록)"}
          </button>
        </div>
      </div>
    </div>
  );
}
