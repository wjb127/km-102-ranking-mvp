"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ShieldAlert } from "lucide-react";
import AdminShell from "@/components/admin-shell";

interface FighterRow {
  id: number;
  externalId: number | null;
  fullName: string;
  fullNameKo: string | null;
  nickname: string | null;
  nicknameKo: string | null;
  weightClass: string | null;
  nationalityKo: string | null;
  imageUrl: string | null;
}

export default function AdminFightersPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<FighterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = q ? `/api/admin/fighters?q=${encodeURIComponent(q)}` : "/api/admin/fighters";
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        if (!cancelled) setForbidden(true);
        return;
      }
      const json = await res.json();
      if (!cancelled && json.success) {
        setRows(json.data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, router]);

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

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" /> 선수 정보 관리
          </h1>
          <Link
            href="/admin/overrides"
            className="text-xs text-blue-600 hover:underline"
          >
            보정 이력 →
          </Link>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="선수 이름 검색 (영문/한글)"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">불러오는 중...</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">검색 결과가 없습니다.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/admin/fighters/${f.id}`}
                    className="block px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-400">
                        {f.imageUrl ? (
                          <Image
                            src={f.imageUrl}
                            alt={f.fullNameKo || f.fullName}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          "No"
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">
                          {f.fullName}
                          {f.fullNameKo && (
                            <span className="text-xs text-gray-500 ml-2">({f.fullNameKo})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {f.weightClass ?? "-"} · {f.nationalityKo ?? "-"}
                          {f.nickname && ` · "${f.nickname}"`}
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400">#{f.id}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
