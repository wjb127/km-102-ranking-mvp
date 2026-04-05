"use client";

import { useState } from "react";
import useSWR from "swr";
import { Database, Search, ChevronRight, Copy, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// ── fetcher ──
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── 엔드포인트 목록 ──
const ENDPOINTS = [
  {
    slug: "fighters",
    label: "Fighters (선수)",
    desc: "선수 프로필 + 전적 + 체급",
    free: true,
    searchable: true,
    params: ["search", "per_page", "cursor"],
  },
  {
    slug: "events",
    label: "Events (이벤트)",
    desc: "UFC 대회 일정 + 장소 + 상태",
    free: true,
    searchable: false,
    params: ["year", "per_page", "cursor"],
  },
  {
    slug: "fights",
    label: "Fights (경기)",
    desc: "개별 경기 결과 + 라운드 + 방식",
    free: false,
    searchable: false,
    params: ["event_id", "fighter_id", "per_page"],
  },
  {
    slug: "rankings",
    label: "Rankings (랭킹)",
    desc: "체급별 공식 랭킹",
    free: false,
    searchable: false,
    params: [],
  },
  {
    slug: "fight_stats",
    label: "Fight Stats (경기 통계)",
    desc: "타격수, 테이크다운, 서브미션 시도 등",
    free: false,
    searchable: false,
    params: ["fight_id"],
  },
];

// ── JSON 하이라이팅 ──
function JsonView({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2);

  return (
    <pre className="text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words font-mono text-foreground/80">
      {json.split("\n").map((line, i) => (
        <div key={i} className="hover:bg-primary/5 px-2">
          <span className="text-muted/40 select-none mr-3 inline-block w-8 text-right">
            {i + 1}
          </span>
          {highlightLine(line)}
        </div>
      ))}
    </pre>
  );
}

function highlightLine(line: string) {
  // 키
  const keyMatch = line.match(/^(\s*)"([^"]+)":/);
  if (keyMatch) {
    const [, indent, key] = keyMatch;
    const rest = line.slice(keyMatch[0].length);
    return (
      <>
        {indent}&quot;<span className="text-blue-400 font-semibold">{key}</span>&quot;:
        {highlightValue(rest)}
      </>
    );
  }
  return highlightValue(line);
}

function highlightValue(text: string) {
  // 문자열 값
  if (text.match(/^\s*".*"/)) {
    return <span className="text-green-400">{text}</span>;
  }
  // 숫자
  if (text.match(/^\s*\d/)) {
    return <span className="text-orange-400">{text}</span>;
  }
  // boolean / null
  if (text.match(/^\s*(true|false|null)/)) {
    return <span className="text-purple-400">{text}</span>;
  }
  return <span>{text}</span>;
}

// ── 필드 분석 ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function analyzeFields(data: any[]): { key: string; type: string; sample: string; filled: number }[] {
  if (!data || data.length === 0) return [];

  const allKeys = new Set<string>();
  data.forEach((item) => Object.keys(item).forEach((k) => allKeys.add(k)));

  return Array.from(allKeys).map((key) => {
    const values = data.map((item) => item[key]);
    const filled = values.filter((v) => v !== null && v !== undefined).length;
    const sample = values.find((v) => v !== null && v !== undefined);
    const type =
      sample === undefined || sample === null
        ? "null"
        : typeof sample === "object"
          ? Array.isArray(sample)
            ? "array"
            : "object"
          : typeof sample;

    return {
      key,
      type,
      sample: typeof sample === "object" ? JSON.stringify(sample).slice(0, 80) : String(sample ?? "null").slice(0, 80),
      filled,
    };
  });
}

// ── 메인 페이지 ──
export default function RawDataPage() {
  const [activeEndpoint, setActiveEndpoint] = useState("fighters");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [year, setYear] = useState("2026");
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "json">("table");

  const ep = ENDPOINTS.find((e) => e.slug === activeEndpoint)!;

  // API 쿼리 URL 구성
  let apiUrl = `/api/raw-data?endpoint=${activeEndpoint}&per_page=25`;
  if (ep.searchable && search) apiUrl += `&search=${encodeURIComponent(search)}`;
  if (activeEndpoint === "events") apiUrl += `&year=${year}`;

  const { data, isLoading, error } = useSWR(
    ep.free ? apiUrl : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const items = data?.data ?? [];
  const fields = analyzeFields(items);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── 헤더 ── */}
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">API 데이터 탐색기</h1>
              <p className="text-xs text-muted">balldontlie MMA API 원본 데이터</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* ── 엔드포인트 선택 ── */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted mb-3">엔드포인트 선택</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.slug}
                onClick={() => ep.free && setActiveEndpoint(ep.slug)}
                className={cn(
                  "relative text-left rounded-xl border p-3 transition-all",
                  ep.slug === activeEndpoint
                    ? "border-primary bg-primary/10"
                    : ep.free
                      ? "border-border bg-surface hover:border-primary/30"
                      : "border-border bg-surface/50 opacity-60 cursor-not-allowed"
                )}
              >
                {!ep.free && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-muted" />
                  </div>
                )}
                <div className="text-sm font-bold text-foreground">{ep.label}</div>
                <div className="text-[10px] text-muted mt-0.5">{ep.desc}</div>
                <div className="mt-1.5">
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                      ep.free
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    )}
                  >
                    {ep.free ? "FREE" : "PAID"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── 검색/필터 ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {ep.searchable && (
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="선수 이름 검색 (영문)..."
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSearch}
                className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
              >
                <Search className="w-4 h-4" />
                검색
              </button>
            </div>
          )}

          {activeEndpoint === "events" && (
            <div className="flex gap-1">
              {["2024", "2025", "2026"].map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                    year === y
                      ? "bg-primary text-white"
                      : "border border-border bg-surface text-muted hover:text-foreground"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* 뷰 모드 토글 */}
          <div className="flex gap-1 ml-auto">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
                viewMode === "table"
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-muted"
              )}
            >
              테이블
            </button>
            <button
              onClick={() => setViewMode("json")}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
                viewMode === "json"
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-muted"
              )}
            >
              JSON
            </button>
          </div>
        </div>

        {/* ── API 정보 ── */}
        {data?._info && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] text-muted">
            <span className="font-mono bg-surface border border-border rounded px-2 py-1">
              GET {data._info.endpoint}
            </span>
            <span>{items.length}건 반환</span>
            <span>API Key: {data._info.api_key_set ? "설정됨" : "미설정"}</span>
            {data.meta?.next_cursor && (
              <span>next_cursor: {data.meta.next_cursor}</span>
            )}
          </div>
        )}

        {/* ── 필드 분석 ── */}
        {fields.length > 0 && (
          <div className="mb-6 rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-primary/5">
              <h3 className="text-sm font-bold text-foreground">
                필드 분석 ({fields.length}개 필드)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="text-left px-4 py-2 font-semibold">필드명</th>
                    <th className="text-left px-4 py-2 font-semibold">타입</th>
                    <th className="text-center px-4 py-2 font-semibold">채움률</th>
                    <th className="text-left px-4 py-2 font-semibold">샘플 값</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f) => (
                    <tr key={f.key} className="border-b border-border/50 hover:bg-primary/5">
                      <td className="px-4 py-2 font-mono font-bold text-blue-400">{f.key}</td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-bold",
                            f.type === "string" && "bg-green-500/10 text-green-500",
                            f.type === "number" && "bg-orange-500/10 text-orange-500",
                            f.type === "boolean" && "bg-purple-500/10 text-purple-500",
                            f.type === "object" && "bg-blue-500/10 text-blue-500",
                            f.type === "null" && "bg-muted/10 text-muted"
                          )}
                        >
                          {f.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={cn(
                            "font-semibold",
                            f.filled === items.length ? "text-green-500" : "text-orange-500"
                          )}
                        >
                          {f.filled}/{items.length}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted font-mono truncate max-w-[300px]">
                        {f.sample}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 데이터 뷰 ── */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-center">
            <p className="text-sm text-danger font-semibold">API 요청 실패</p>
          </div>
        ) : !ep.free ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center">
            <Lock className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted font-semibold">유료 플랜에서만 사용 가능한 엔드포인트</p>
            <p className="text-xs text-muted mt-1">fights, rankings, fight_stats는 유료 구독 필요</p>
          </div>
        ) : viewMode === "table" ? (
          /* 테이블 뷰 */
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">
                데이터 ({items.length}건)
              </h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "복사됨" : "JSON 복사"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    {fields.slice(0, 10).map((f) => (
                      <th key={f.key} className="text-left px-3 py-2 font-semibold whitespace-nowrap">
                        {f.key}
                      </th>
                    ))}
                    {fields.length > 10 && (
                      <th className="text-left px-3 py-2 font-semibold text-muted">
                        +{fields.length - 10}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {items.map((item: any, i: number) => (
                    <tr key={item.id ?? i} className="border-b border-border/50 hover:bg-primary/5">
                      {fields.slice(0, 10).map((f) => {
                        const val = item[f.key];
                        const display =
                          val === null || val === undefined
                            ? "—"
                            : typeof val === "object"
                              ? JSON.stringify(val).slice(0, 50)
                              : String(val);
                        return (
                          <td
                            key={f.key}
                            className={cn(
                              "px-3 py-2 whitespace-nowrap max-w-[200px] truncate",
                              val === null && "text-muted/40"
                            )}
                          >
                            {display}
                          </td>
                        );
                      })}
                      {fields.length > 10 && (
                        <td className="px-3 py-2 text-muted">
                          <ChevronRight className="w-3 h-3" />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* JSON 뷰 */
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Raw JSON</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "복사됨" : "JSON 복사"}
              </button>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              <JsonView data={data} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
