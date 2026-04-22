"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Save } from "lucide-react";

interface Fighter {
  id: number;
  externalId: number | null;
  fullName: string;
  fullNameKo: string | null;
  nickname: string | null;
  nicknameKo: string | null;
  weightClass: string | null;
  nationality: string | null;
  nationalityKo: string | null;
  imageUrl: string | null;
  bio: string | null;
  bioKo: string | null;
}

interface OrgRecord {
  id: number;
  organizationId: number;
  wins: number;
  losses: number;
  draws: number;
  noContests: number;
  winsByKo: number;
  winsBySub: number;
  winsByDec: number;
}

type EditableKey =
  | "fullNameKo"
  | "nicknameKo"
  | "weightClass"
  | "nationalityKo"
  | "bioKo"
  | "imageUrl";

const FIELD_LABELS: Record<EditableKey, string> = {
  fullNameKo: "한글 이름",
  nicknameKo: "한글 별명",
  weightClass: "체급",
  nationalityKo: "국적 (한글)",
  bioKo: "한글 소개",
  imageUrl: "이미지 URL",
};

export default function AdminFighterDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const fighterId = params?.id;

  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [orgRecords, setOrgRecords] = useState<OrgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [patch, setPatch] = useState<Partial<Record<EditableKey, string>>>({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!fighterId) return;
    setLoading(true);
    const res = await fetch(`/api/admin/fighters/${fighterId}`, { cache: "no-store" });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    const json = await res.json();
    if (json.success) {
      setFighter(json.data.fighter);
      setOrgRecords(json.data.orgRecords ?? []);
    }
    setLoading(false);
  }, [fighterId, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (!reason.trim()) {
      setError("보정 사유를 입력해주세요.");
      return;
    }
    if (Object.keys(patch).length === 0) {
      setError("수정된 내용이 없습니다.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/fighters/${fighterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, patch }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "저장 실패");
        return;
      }
      setMsg("저장되었습니다. (감사 로그 기록)");
      setPatch({});
      setReason("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-700">관리자 권한이 필요한 페이지입니다.</p>
        </div>
      </div>
    );
  }

  if (loading || !fighter) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4 text-center text-sm text-gray-500">
        불러오는 중...
      </div>
    );
  }

  const currentValue = (k: EditableKey): string =>
    patch[k] ?? (fighter[k] ?? "");

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 pb-24 md:pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin/fighters"
          className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 선수 목록
        </Link>

        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
          <h1 className="text-xl font-bold text-gray-900">{fighter.fullName}</h1>
          <p className="text-xs text-gray-500 mt-1">
            ID #{fighter.id} · external {fighter.externalId ?? "-"}
          </p>
        </div>

        {/* 단체별 전적 (읽기 전용) */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">단체별 전적 (읽기 전용)</h2>
          {orgRecords.length === 0 ? (
            <p className="text-xs text-gray-500">등록된 전적이 없습니다.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-1.5">조직</th>
                  <th>W-L-D-NC</th>
                  <th>KO</th>
                  <th>SUB</th>
                  <th>DEC</th>
                </tr>
              </thead>
              <tbody>
                {orgRecords.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-1.5">org#{r.organizationId}</td>
                    <td>
                      {r.wins}-{r.losses}-{r.draws}-{r.noContests}
                    </td>
                    <td>{r.winsByKo}</td>
                    <td>{r.winsBySub}</td>
                    <td>{r.winsByDec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 수정 폼 */}
        <form onSubmit={onSave} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">선수 정보 수동 보정</h2>

          {(Object.keys(FIELD_LABELS) as EditableKey[]).map((k) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {FIELD_LABELS[k]}
                {patch[k] !== undefined && (
                  <span className="ml-2 text-[10px] text-blue-600">변경됨</span>
                )}
              </label>
              {k === "bioKo" ? (
                <textarea
                  rows={4}
                  value={currentValue(k)}
                  onChange={(e) =>
                    setPatch((p) => ({ ...p, [k]: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={currentValue(k)}
                  onChange={(e) =>
                    setPatch((p) => ({ ...p, [k]: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          ))}

          <div className="border-t border-gray-200 pt-4">
            <label className="block text-xs font-semibold text-red-700 mb-1">
              보정 사유 (필수, 감사 로그에 기록됨)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: API에서 체급이 잘못 들어와서 라이트급→웰터급으로 정정"
              className="w-full px-3 py-2 border border-red-200 rounded text-sm focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          {msg && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              {msg}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> {saving ? "저장 중..." : "저장 (감사 로그 기록)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
