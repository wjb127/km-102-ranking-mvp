"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 초기 테마 로드
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) document.documentElement.classList.add("dark");
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
        "fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-surface/80 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:border-primary/40",
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
