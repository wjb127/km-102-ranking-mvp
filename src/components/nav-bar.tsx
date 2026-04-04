"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Search, Calendar, Trophy, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** 네비게이션 아이템 목록 (/estimate는 내부용이라 제외) */
const NAV_ITEMS: NavItem[] = [
  { label: "홈", href: "/", icon: Swords },
  { label: "선수", href: "/fighters", icon: Search },
  { label: "일정", href: "/events", icon: Calendar },
  { label: "투표", href: "/vote", icon: Trophy },
  { label: "게시판", href: "/board", icon: MessageSquare },
];

/** 현재 경로가 해당 네비 아이템과 일치하는지 판별 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── 데스크탑: 상단 고정 바 (md 이상) ── */}
      <header className="hidden md:block fixed top-0 inset-x-0 z-50 bg-surface/95 backdrop-blur border-b border-border">
        <nav className="max-w-6xl mx-auto h-16 px-6 flex items-center justify-between">
          {/* 로고 / 사이트명 */}
          <Link
            href="/"
            className="text-lg font-bold text-foreground hover:text-primary transition-colors"
          >
            MMA 분석 커뮤니티
          </Link>

          {/* 네비 링크 (홈 제외 — 로고가 홈 역할) */}
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.filter((item) => item.href !== "/").map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${
                        active
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted hover:text-foreground"
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {/* ── 모바일: 하단 고정 탭바 (md 미만) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
        <ul className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex flex-col items-center gap-1 px-3 py-1 transition-colors
                    ${active ? "text-primary" : "text-muted"}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
