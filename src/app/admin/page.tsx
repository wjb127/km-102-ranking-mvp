"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Flag,
  FileText,
  Users as UsersIcon,
  UserCheck,
  Dumbbell,
  LogOut,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Ban,
  Swords,
  Calendar,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── 타입 정의 ──

type Tab = "dashboard" | "reports" | "posts" | "users";

interface Stats {
  fighters: number;
  events: number;
  posts: number;
  comments: number;
  users: number;
  pendingReports: number;
}

interface ReportRow {
  id: number;
  commentId: number;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
  comment: {
    id: number;
    content: string;
    authorNickname: string;
    isDeleted: boolean;
    targetType: string;
    targetId: number;
  };
}

interface PostRow {
  id: number;
  authorNickname: string;
  category: string;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isDeleted: boolean;
  hiddenByAdmin: boolean;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  nickname: string;
  role: "user" | "admin";
  isBanned: boolean;
  createdAt: string;
  postCount: number;
  commentCount: number;
}

// ── 사이드바 메뉴 ──

const SIDEBAR_ITEMS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { key: "reports", label: "신고 댓글", icon: Flag },
  { key: "posts", label: "게시글 관리", icon: FileText },
  { key: "users", label: "사용자 목록", icon: UsersIcon },
];

// ── 메인 컴포넌트 ──

export default function AdminPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  // 인증/권한 체크
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

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted)]">권한 확인 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-60 md:flex-col md:border-r md:border-[var(--border)] md:bg-[var(--surface)]">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10">
            <Shield className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--foreground)]">관리자 콘솔</h1>
            <p className="text-[11px] text-[var(--muted)]">MMA 커뮤니티</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted)] hover:bg-[var(--border)]/40 hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
          <Link
            href="/admin/fighters"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-all hover:bg-[var(--border)]/40 hover:text-[var(--foreground)]"
          >
            <Dumbbell className="h-4 w-4" />
            <span className="flex-1 text-left">선수 수정</span>
          </Link>
          <Link
            href="/admin/overrides"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-all hover:bg-[var(--border)]/40 hover:text-[var(--foreground)]"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="flex-1 text-left">보정 이력</span>
          </Link>
        </nav>

        <div className="border-t border-[var(--border)] px-3 py-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--muted)] transition-all hover:bg-[var(--border)]/40 hover:text-[var(--foreground)]"
          >
            <LogOut className="h-4 w-4" />
            서비스로 돌아가기
          </Link>
        </div>
      </aside>

      {/* 모바일 상단 탭 */}
      <div className="md:hidden fixed top-11 inset-x-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] overflow-x-auto">
        <div className="flex gap-1 px-3 py-2 whitespace-nowrap">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
          <Link
            href="/admin/fighters"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--muted)]"
          >
            <Dumbbell className="h-3.5 w-3.5" />
            선수 수정
          </Link>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 md:ml-60 px-4 py-6 md:px-8 md:py-8 mt-24 md:mt-0">
        {tab === "dashboard" && <DashboardView />}
        {tab === "reports" && <ReportsView />}
        {tab === "posts" && <PostsView />}
        {tab === "users" && <UsersView />}
      </main>
    </div>
  );
}

// ── 대시보드 뷰 ──

function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        const json = await res.json();
        if (json?.success) setStats(json.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">대시보드</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          MMA 커뮤니티 서비스 현황을 한눈에 확인하세요.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">불러오는 중...</p>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={<Swords className="h-5 w-5" />} label="선수" value={stats.fighters} color="primary" />
          <StatCard icon={<Calendar className="h-5 w-5" />} label="이벤트" value={stats.events} color="accent" />
          <StatCard icon={<FileText className="h-5 w-5" />} label="게시글" value={stats.posts} color="foreground" />
          <StatCard icon={<MessageSquare className="h-5 w-5" />} label="댓글" value={stats.comments} color="foreground" />
          <StatCard icon={<UsersIcon className="h-5 w-5" />} label="사용자" value={stats.users} color="success" />
          <StatCard icon={<Flag className="h-5 w-5" />} label="신고 대기" value={stats.pendingReports} color="danger" />
        </div>
      ) : (
        <p className="text-sm text-[var(--danger)]">통계를 불러오지 못했습니다.</p>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "primary" | "accent" | "success" | "danger" | "foreground";
}) {
  const colorClass: Record<string, string> = {
    primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
    accent: "bg-[var(--accent)]/10 text-[var(--accent)]",
    success: "bg-[var(--success)]/10 text-[var(--success)]",
    danger: "bg-[var(--danger)]/10 text-[var(--danger)]",
    foreground: "bg-[var(--foreground)]/5 text-[var(--foreground)]",
  };
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-lg", colorClass[color])}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}

// ── 신고 댓글 뷰 ──

function ReportsView() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "resolved" | "dismissed">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}`, { cache: "no-store" });
      const json = await res.json();
      if (json?.success) setRows(json.data);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(id: number, action: "resolve_hide" | "dismiss") {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (!json?.success) {
      alert(json?.error ?? "처리 실패");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">신고 댓글</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            신고된 댓글을 확인하고 처리합니다.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1">
          {(["pending", "resolved", "dismissed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                status === s
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {s === "pending" ? "대기" : s === "resolved" ? "처리됨" : "무시됨"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">불러오는 중...</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <CheckCircle2 className="h-10 w-10 text-[var(--success)]/40" />
            <p className="text-sm text-[var(--muted)]">표시할 신고가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]/60">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span className="font-semibold text-[var(--foreground)]">
                      {r.comment.authorNickname || "(알 수 없음)"}
                    </span>
                    <span>·</span>
                    <span>{r.comment.targetType} #{r.comment.targetId}</span>
                    <span>·</span>
                    <span>{new Date(r.createdAt).toLocaleString("ko-KR")}</span>
                    {r.comment.isDeleted && (
                      <span className="rounded-full bg-[var(--muted)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                        이미 삭제
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      r.comment.isDeleted
                        ? "border-[var(--border)]/40 bg-[var(--background)]/50 text-[var(--muted)] line-through"
                        : "border-[var(--danger)]/20 bg-[var(--danger)]/5 text-[var(--foreground)]"
                    )}
                  >
                    {r.comment.content || "(내용 없음)"}
                  </p>
                  {r.reason && (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      <span className="font-semibold">사유:</span> {r.reason}
                    </p>
                  )}
                </div>
                {r.status === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleAction(r.id, "resolve_hide")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--danger)]/10 px-3 py-2 text-xs font-semibold text-[var(--danger)] transition-all hover:bg-[var(--danger)]/20"
                    >
                      <EyeOff className="h-3.5 w-3.5" /> 숨김 처리
                    </button>
                    <button
                      onClick={() => handleAction(r.id, "dismiss")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--muted)] transition-all hover:bg-[var(--border)]/40"
                    >
                      <XCircle className="h-3.5 w-3.5" /> 무시
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 게시글 관리 뷰 ──

function PostsView() {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts?page=${page}&limit=${limit}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.success) {
        setRows(json.data);
        setTotal(Number(json.total ?? 0));
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleHidden(id: number, hidden: boolean) {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden }),
    });
    const json = await res.json();
    if (!json?.success) {
      alert(json?.error ?? "실패");
      return;
    }
    await load();
  }

  async function removePost(id: number) {
    if (!confirm("이 게시글을 삭제 처리하시겠어요? (소프트 삭제)")) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!json?.success) {
      alert(json?.error ?? "실패");
      return;
    }
    await load();
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">게시글 관리</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          전체 게시글 목록입니다. 관리자 숨김 또는 삭제 처리할 수 있습니다.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">불러오는 중...</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                  제목
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                  카테고리
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                  작성자
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                  추천
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                  상태
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)]/60 last:border-0">
                  <td className="max-w-[280px] truncate px-4 py-3">
                    <Link
                      href={`/board/${p.id}`}
                      className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)]"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{p.category}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{p.authorNickname}</td>
                  <td className="px-4 py-3 text-right text-[var(--foreground)]">{p.likeCount}</td>
                  <td className="px-4 py-3">
                    {p.isDeleted ? (
                      <span className="rounded-full bg-[var(--danger)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--danger)]">
                        삭제됨
                      </span>
                    ) : p.hiddenByAdmin ? (
                      <span className="rounded-full bg-[var(--muted)]/15 px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]">
                        숨김
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--success)]">
                        노출
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => toggleHidden(p.id, !p.hiddenByAdmin)}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)] hover:bg-[var(--border)]/40"
                      >
                        {p.hiddenByAdmin ? (
                          <>
                            <Eye className="h-3 w-3" /> 복원
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> 숨김
                          </>
                        )}
                      </button>
                      {!p.isDeleted && (
                        <button
                          onClick={() => removePost(p.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-[var(--danger)]/10 px-2 py-1 text-[11px] font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/20"
                        >
                          <Trash2 className="h-3 w-3" /> 삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                    게시글이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
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
  );
}

// ── 사용자 목록 뷰 ──

function UsersView() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=${limit}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.success) {
        setRows(json.data);
        setTotal(Number(json.total ?? 0));
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBan(id: string, isBanned: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned }),
    });
    const json = await res.json();
    if (!json?.success) {
      alert(json?.error ?? "실패");
      return;
    }
    await load();
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">사용자 목록</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          가입된 사용자를 확인하고 밴/해제 처리합니다.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">불러오는 중...</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                  닉네임
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                  이메일
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                  역할
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                  가입일
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                  글/댓글
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">
                  상태
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">
                  액션
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)]/60 last:border-0">
                  <td className="px-4 py-3 font-semibold text-[var(--foreground)]">{u.nickname}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                        <UserCheck className="h-3 w-3" /> admin
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">user</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--foreground)]">
                    {u.postCount}/{u.commentCount}
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <span className="rounded-full bg-[var(--danger)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--danger)]">
                        밴
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--success)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--success)]">
                        활성
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => toggleBan(u.id, !u.isBanned)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold",
                          u.isBanned
                            ? "bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20"
                            : "bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20"
                        )}
                      >
                        <Ban className="h-3 w-3" />
                        {u.isBanned ? "밴 해제" : "밴"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                    사용자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">
            총 {total}명 · {page}/{totalPages} 페이지
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
  );
}
