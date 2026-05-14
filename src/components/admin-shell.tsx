"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  Dumbbell,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  Shield,
  Swords,
  Users as UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminTab = "dashboard" | "reports" | "posts" | "users";

const MAIN_ITEMS: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { key: "reports", label: "신고 댓글", icon: Flag },
  { key: "posts", label: "게시글 관리", icon: FileText },
  { key: "users", label: "사용자 목록", icon: UsersIcon },
];

const LINK_ITEMS = [
  { href: "/admin/fighters", label: "선수 수정", icon: Dumbbell },
  { href: "/admin/fights", label: "경기 보정", icon: Swords },
  { href: "/admin/overrides", label: "보정 이력", icon: AlertCircle },
];

function isLinkActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({
  children,
  activeTab,
  onTabChange,
}: {
  children: React.ReactNode;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}) {
  const pathname = usePathname();
  const canSwitchTabs = Boolean(activeTab && onTabChange);

  const mainTabClass = (isActive: boolean) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
      isActive
        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
        : "text-[var(--muted)] hover:bg-[var(--border)]/40 hover:text-[var(--foreground)]"
    );

  const mobileTabClass = (isActive: boolean) =>
    cn(
      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium",
      isActive ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted)]"
    );

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
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
          {MAIN_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === "/admin" && activeTab === item.key;
            if (canSwitchTabs) {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onTabChange?.(item.key)}
                  className={mainTabClass(isActive)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              );
            }
            return (
              <Link key={item.key} href="/admin" className={mainTabClass(false)}>
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
              </Link>
            );
          })}

          {LINK_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isLinkActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={mainTabClass(isActive)}
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

      <div className="md:hidden fixed top-11 inset-x-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] overflow-x-auto">
        <div className="flex gap-1 px-3 py-2 whitespace-nowrap">
          {MAIN_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === "/admin" && activeTab === item.key;
            if (canSwitchTabs) {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onTabChange?.(item.key)}
                  className={mobileTabClass(isActive)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            }
            return (
              <Link key={item.key} href="/admin" className={mobileTabClass(false)}>
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}

          {LINK_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = isLinkActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={mobileTabClass(isActive)}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 md:ml-60 px-4 py-6 md:px-8 md:py-8 mt-24 md:mt-0">
        {children}
      </main>
    </div>
  );
}
