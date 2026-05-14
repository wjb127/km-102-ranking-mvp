"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Flag,
  FileText,
  Users as UsersIcon,
  Dumbbell,
  LogOut,
  Swords,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 대시보드 내부 탭 (메인 admin/page.tsx 에서만 의미 있음 — 다른 라우트는 가리지 않고 단순 노출)
type DashboardTab = "dashboard" | "reports" | "posts" | "users";

const DASHBOARD_TABS: { key: DashboardTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { key: "reports", label: "신고 댓글", icon: Flag },
  { key: "posts", label: "게시글 관리", icon: FileText },
  { key: "users", label: "사용자 목록", icon: UsersIcon },
];

const SUB_ROUTES: { href: string; label: string; icon: typeof Dumbbell }[] = [
  { href: "/admin/fighters", label: "선수 수정", icon: Dumbbell },
  { href: "/admin/fights", label: "경기 보정", icon: Swords },
  { href: "/admin/overrides", label: "보정 이력", icon: AlertCircle },
];

// 관리자 라우트 공통 쉘 — 좌측 사이드바 + 모바일 상단 탭 + 권한 검증
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!json?.data || json.data.role !== "admin") {
          router.replace("/");
          return;
        }
        setAuthChecked(true);
      } catch {
        if (!cancelled) router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted)]">권한 확인 중...</p>
      </div>
    );
  }

  const isDashboardRoute = pathname === "/admin";
  const currentTab = (searchParams?.get("tab") as DashboardTab | null) ?? "dashboard";

  function tabHref(key: DashboardTab) {
    return key === "dashboard" ? "/admin" : `/admin?tab=${key}`;
  }

  function isSubRouteActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
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
          {DASHBOARD_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = isDashboardRoute && currentTab === item.key;
            return (
              <Link
                key={item.key}
                href={tabHref(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted)] hover:bg-[var(--border)]/40 hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
              </Link>
            );
          })}
          {SUB_ROUTES.map((item) => {
            const Icon = item.icon;
            const isActive = isSubRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted)] hover:bg-[var(--border)]/40 hover:text-[var(--foreground)]"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
              </Link>
            );
          })}
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

      {/* 모바일 상단 탭 — 글로벌 모바일 헤더(h-11) 아래 고정 */}
      <div className="md:hidden fixed top-11 inset-x-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] overflow-x-auto">
        <div className="flex gap-1 px-3 py-2 whitespace-nowrap">
          {DASHBOARD_TABS.map((item) => {
            const Icon = item.icon;
            const isActive = isDashboardRoute && currentTab === item.key;
            return (
              <Link
                key={item.key}
                href={tabHref(item.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
          {SUB_ROUTES.map((item) => {
            const Icon = item.icon;
            const isActive = isSubRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 메인 콘텐츠 — 데스크탑은 사이드바 폭만큼 좌측 패딩만, 상하 패딩은 각 라우트가 직접 관리 */}
      <main className="flex-1 md:ml-60">{children}</main>
    </div>
  );
}
