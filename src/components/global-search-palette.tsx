"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Dumbbell, Loader2, Search, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNameKoEn } from "@/lib/format-name";
import { weightKo } from "@/lib/weight-class";

interface SearchFighter {
  id: number;
  name: string;
  nameKo: string | null;
  nickname: string | null;
  nicknameKo: string | null;
  weightClass: string | null;
  href: string;
}

interface SearchEvent {
  id: number;
  name: string;
  nameKo: string | null;
  eventDate: string | null;
  venue: string | null;
  venueKo: string | null;
  href: string;
}

interface SearchWeight {
  name: string;
  href: string;
}

interface SearchResponse {
  data: {
    fighters: SearchFighter[];
    events: SearchEvent[];
    weights: SearchWeight[];
  };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 px-1 text-[11px] font-bold uppercase text-muted">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export default function GlobalSearchPalette({
  variant,
}: {
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [data, setData] = useState<SearchResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (variant !== "desktop") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [variant]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open || debouncedQuery.length < 1) {
      setData(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=6`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((json: SearchResponse) => {
        setData(json.data);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setData(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, open]);

  const totalResults = useMemo(() => {
    if (!data) return 0;
    return data.fighters.length + data.events.length + data.weights.length;
  }, [data]);

  return (
    <>
      {variant === "desktop" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span>검색</span>
          <span className="rounded border border-border px-1 text-[10px] text-muted">⌘K</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="통합 검색 열기"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-surface/80 text-muted"
        >
          <Search className="h-4 w-4" />
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/60 px-3 py-16 backdrop-blur-sm md:py-24">
          <div className="mx-auto max-w-xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-3 py-3">
              <Search className="h-4 w-4 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="선수, 이벤트, 체급 검색..."
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="검색 닫기"
                className="rounded-md p-1 text-muted hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {debouncedQuery.length < 1 ? (
                <div className="py-8 text-center text-sm text-muted">
                  Cmd/Ctrl+K로 열고 바로 검색하세요.
                </div>
              ) : totalResults === 0 && !loading ? (
                <div className="py-8 text-center text-sm text-muted">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {data?.fighters.length ? (
                    <ResultGroup title="선수">
                      {data.fighters.map((fighter) => (
                        <Link
                          key={`fighter-${fighter.id}`}
                          href={fighter.href}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface"
                        >
                          <UserRound className="h-4 w-4 shrink-0 text-primary" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">
                              {formatNameKoEn(fighter.nameKo, fighter.name)}
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {fighter.nicknameKo || fighter.nickname || (fighter.weightClass ? weightKo(fighter.weightClass) : fighter.name)}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </ResultGroup>
                  ) : null}

                  {data?.events.length ? (
                    <ResultGroup title="이벤트">
                      {data.events.map((event) => (
                        <Link
                          key={`event-${event.id}`}
                          href={event.href}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface"
                        >
                          <Calendar className="h-4 w-4 shrink-0 text-accent" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">
                              {formatNameKoEn(event.nameKo, event.name)}
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {formatDate(event.eventDate)} · {event.venueKo || event.venue || "-"}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </ResultGroup>
                  ) : null}

                  {data?.weights.length ? (
                    <ResultGroup title="체급">
                      {data.weights.map((weight) => (
                        <Link
                          key={`weight-${weight.name}`}
                          href={weight.href}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface"
                        >
                          <Dumbbell className="h-4 w-4 shrink-0 text-muted" />
                          <span className="text-sm font-semibold text-foreground">
                            {weightKo(weight.name)}
                          </span>
                        </Link>
                      ))}
                    </ResultGroup>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted">
              <span>Enter로 이동</span>
              <span>Esc로 닫기</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
