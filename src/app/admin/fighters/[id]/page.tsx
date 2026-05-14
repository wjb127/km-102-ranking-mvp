"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldAlert, Save, Upload } from "lucide-react";
import AdminShell from "@/components/admin-shell";

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  async function onUploadImage(file: File) {
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("10MB 이하 파일만 업로드 가능합니다.");
      return;
    }
    setUploading(true);
    try {
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const sigJson = await sigRes.json();
      if (!sigRes.ok || !sigJson.success) {
        setUploadError(sigJson.error ?? "서명 발급 실패");
        return;
      }
      const { cloudName, apiKey, timestamp, signature, folder, uploadUrl, allowedFormats } = sigJson.data;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      fd.append("folder", folder);
      fd.append("allowed_formats", allowedFormats.join(","));

      const cloudRes = await fetch(uploadUrl ?? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: fd,
      });
      const cloudJson = await cloudRes.json();
      if (!cloudRes.ok || !cloudJson.secure_url) {
        setUploadError(cloudJson.error?.message ?? "Cloudinary 업로드 실패");
        return;
      }
      setPatch((p) => ({ ...p, imageUrl: cloudJson.secure_url as string }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <AdminShell>
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

        {/* 단체별 전적 (수동 보정 가능) */}
        <RecordsEditor
          fighterId={Number(fighterId)}
          initial={orgRecords}
          onSaved={load}
        />

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
              ) : k === "imageUrl" ? (
                <div className="space-y-2">
                  {currentValue(k) && (
                    <div className="relative w-24 h-24 overflow-hidden rounded border border-gray-300 bg-gray-100">
                      <Image
                        src={currentValue(k)}
                        alt="현재 이미지"
                        fill
                        sizes="96px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? "업로드 중..." : "파일 선택 (10MB 이하)"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onUploadImage(file);
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                    {currentValue(k) && (
                      <button
                        type="button"
                        onClick={() => setPatch((p) => ({ ...p, imageUrl: "" }))}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        제거
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={currentValue(k)}
                    onChange={(e) =>
                      setPatch((p) => ({ ...p, [k]: e.target.value }))
                    }
                    placeholder="또는 이미지 URL 직접 입력"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  {uploadError && (
                    <div className="text-xs text-red-600">{uploadError}</div>
                  )}
                </div>
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
    </AdminShell>
  );
}

// ── 단체별 전적 수동 보정 컴포넌트 ──
type RecordKey =
  | "wins"
  | "losses"
  | "draws"
  | "noContests"
  | "winsByKo"
  | "winsBySub"
  | "winsByDec";

const RECORD_LABELS: Record<RecordKey, string> = {
  wins: "승",
  losses: "패",
  draws: "무",
  noContests: "NC",
  winsByKo: "KO승",
  winsBySub: "SUB승",
  winsByDec: "판정승",
};

function RecordsEditor({
  fighterId,
  initial,
  onSaved,
}: {
  fighterId: number;
  initial: OrgRecord[];
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<OrgRecord[]>(initial);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  async function onSave() {
    setMsg(null);
    setError(null);
    if (!reason.trim()) {
      setError("보정 사유를 입력해주세요.");
      return;
    }
    if (!dirty) {
      setError("수정된 전적이 없습니다.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/fighters/${fighterId}/records`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, records: rows }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "저장 실패");
        return;
      }
      setMsg("전적 저장 완료 (감사 로그 기록).");
      setReason("");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  function setVal(idx: number, key: RecordKey, value: string) {
    const num = Math.max(0, Math.floor(Number(value) || 0));
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: num } : r)));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
      <h2 className="text-sm font-bold text-gray-900 mb-3">
        단체별 전적 수동 보정
      </h2>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-500">등록된 전적이 없습니다.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-1.5 pr-2">조직</th>
                  {(Object.keys(RECORD_LABELS) as RecordKey[]).map((k) => (
                    <th key={k} className="px-1">
                      {RECORD_LABELS[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-1.5 pr-2 text-gray-600">org#{r.organizationId}</td>
                    {(Object.keys(RECORD_LABELS) as RecordKey[]).map((k) => (
                      <td key={k} className="px-1">
                        <input
                          type="number"
                          min={0}
                          value={r[k]}
                          onChange={(e) => setVal(idx, k, e.target.value)}
                          className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none focus:border-red-500"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <label className="block text-xs font-semibold text-red-700 mb-1">
              보정 사유 (필수, 감사 로그 기록)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 11/10 이벤트 경기 판정 번복 → 승패 정정"
              className="w-full px-3 py-2 border border-red-200 rounded text-xs focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-2">
              {error}
            </div>
          )}
          {msg && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mt-2">
              {msg}
            </div>
          )}

          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={onSave}
              disabled={saving || !dirty}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded disabled:opacity-50 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "저장 중..." : "전적 저장"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
