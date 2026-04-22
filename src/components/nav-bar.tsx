"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Swords, Search, Calendar, Trophy, MessageSquare, User, LogIn } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface CurrentUser {
  id: string;
  email: string;
  nickname: string;
  role: "user" | "admin";
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
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setUser(json?.data ?? null);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // pathname 변경 시 재조회 (로그인/로그아웃 후 새로고침 반영)
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
    router.push("/");
  }

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

          {/* 로그인 / 유저 메뉴 */}
          <div className="flex items-center gap-2 text-sm">
            {!loaded ? (
              <span className="text-xs text-muted">···</span>
            ) : user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="px-2 py-1 text-xs font-semibold text-red-600 border border-red-300 rounded hover:bg-red-50"
                  >
                    관리자
                  </Link>
                )}
                <Link
                  href="/messages"
                  className="px-2 py-1 text-xs text-muted hover:text-foreground"
                >
                  쪽지
                </Link>
                <span className="text-xs text-foreground font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {user.nickname}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 text-xs text-muted hover:text-foreground border border-border rounded"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2 py-1 text-xs text-muted hover:text-foreground flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1 text-xs font-semibold text-white bg-primary rounded hover:opacity-90"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
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

      {/* ── 모바일: 상단 로그인/유저 바 ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-b border-border">
        <div className="h-11 px-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-foreground">
            MMA 분석 커뮤니티
          </Link>
          <div className="flex items-center gap-2 text-xs">
            {!loaded ? (
              <span className="text-muted">···</span>
            ) : user ? (
              <>
                <span className="text-foreground font-semibold">{user.nickname}</span>
                <button
                  onClick={handleLogout}
                  className="px-2 py-0.5 text-muted border border-border rounded"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-muted">
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="px-2 py-0.5 text-white bg-primary rounded font-semibold"
                >
                  가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
