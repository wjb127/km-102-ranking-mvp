"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert, Clock } from "lucide-react";
import AdminShell from "@/components/admin-shell";

interface OverrideRow {
  id: number;
  targetType: string;
  targetId: number;
  reason: string;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
  adminNickname: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR");
}

export default function AdminOverridesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/overrides", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const json = await res.json();
      if (json.success) setRows(json.data);
      setLoading(false);
    })();
  }, [router]);

  if (forbidden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-700">관리자 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  const openRow = rows.find((r) => r.id === openId);

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/fighters"
          className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> 선수 관리
        </Link>

        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" /> 관리자 보정 이력
        </h1>

        <div className="bg-white border border-gray-200 rounded-lg">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">불러오는 중...</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              아직 보정 이력이 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-500 mb-0.5">
                          {r.targetType} #{r.targetId} · {r.adminNickname}
                        </div>
                        <div className="text-sm text-gray-900 truncate">{r.reason}</div>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatTime(r.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {openRow && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 py-8"
            onClick={() => setOpenId(null)}
          >
            <div
              className="bg-white rounded-lg p-5 w-full max-w-2xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-bold mb-2">
                {openRow.targetType} #{openRow.targetId} · {openRow.adminNickname}
              </h3>
              <p className="text-xs text-gray-600 mb-3">{openRow.reason}</p>
              <div className="grid md:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Before</div>
                  <pre className="bg-gray-50 border border-gray-200 rounded p-2 overflow-auto">
                    {JSON.stringify(openRow.beforeData, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-1">After</div>
                  <pre className="bg-gray-50 border border-gray-200 rounded p-2 overflow-auto">
                    {JSON.stringify(openRow.afterData, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => setOpenId(null)}
                  className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
