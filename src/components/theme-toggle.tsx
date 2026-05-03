"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 초기 테마 로드
  useEffect(() => {
    // layout.tsx 인라인 스크립트와 동일 로직: 명시적 "light" 아니면 다크
    const stored = localStorage.getItem("theme");
    const isDark = stored !== "light";
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  // SSR hydration 불일치 방지
  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-surface/80 shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:border-primary/40",
        className
      )}
    >
      {dark ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-muted" />
      )}
    </button>
  );
}
