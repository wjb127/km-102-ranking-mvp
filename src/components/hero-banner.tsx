"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Trophy,
  Flame,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── 슬라이드 타입 정의 ──
type SlideType = "notice" | "event" | "hot" | "new" | "community";

interface Slide {
  type: SlideType;
  title: string;
  subtitle: string;
  bgGradient: string;
  href: string;
}

// ── 슬라이드 데이터 (정적, 날짜/대진 무관 일반 문구) ──
const SLIDES: Slide[] = [
  {
    type: "notice",
    title: "다가오는 경기 일정 확인",
    subtitle: "UFC · ONE · PFL 등 주요 단체 일정 한눈에",
    bgGradient: "from-red-900 via-red-700 to-orange-600",
    href: "/events",
  },
  {
    type: "event",
    title: "GOAT 투표 진행중",
    subtitle: "역대 최고의 파이터를 뽑아주세요",
    bgGradient: "from-yellow-700 via-orange-700 to-red-800",
    href: "/vote",
  },
  {
    type: "hot",
    title: "선수 검색 · 전적 조회",
    subtitle: "8000명 이상 MMA 선수 데이터베이스",
    bgGradient: "from-purple-900 via-indigo-800 to-blue-900",
    href: "/fighters",
  },
  {
    type: "new",
    title: "선수 DB 자동 업데이트",
    subtitle: "외부 API 연동으로 최신 전적 반영",
    bgGradient: "from-slate-800 via-gray-800 to-zinc-900",
    href: "/fighters",
  },
  {
    type: "community",
    title: "MMA 커뮤니티",
    subtitle: "분석 · 토론 · 자유 게시판에서 소통하세요",
    bgGradient: "from-emerald-900 via-teal-800 to-cyan-900",
    href: "/board",
  },
];

// ── 슬라이드 타입별 라벨 배지 텍스트 ──
const BADGE_LABEL: Record<SlideType, string> = {
  notice: "공지",
  event: "이벤트",
  hot: "HOT",
  new: "NEW",
  community: "커뮤니티",
};

// ── 슬라이드 타입별 아이콘 컴포넌트 ──
const SLIDE_ICON: Record<SlideType, React.ElementType> = {
  notice: Megaphone,
  event: Trophy,
  hot: Flame,
  new: Sparkles,
  community: Users,
};

// ── Framer Motion 슬라이드 변형 ──
const variants = {
  enter: { opacity: 0, scale: 1.03 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

// ── 공지 띠 컴포넌트 ──
export function NoticeBanner() {
  return (
    <div className="flex items-center gap-3 h-10 bg-primary/10 border border-primary/20 rounded-lg px-4 mb-3">
      {/* 왼쪽: 아이콘 + 공지 텍스트 */}
      <Megaphone className="h-4 w-4 text-primary shrink-0" />
      <p className="flex-1 text-sm text-foreground/80 truncate">
        <span className="font-semibold text-primary mr-2">📢 안내</span>
        선수 정보와 경기 일정은 매일 자동 동기화됩니다
      </p>
      {/* 오른쪽: 게시판 바로가기 */}
      <Link
        href="/board"
        className="shrink-0 text-xs text-primary hover:text-accent transition-colors whitespace-nowrap"
      >
        게시판 보기 &gt;
      </Link>
    </div>
  );
}

// ── 히어로 배너 슬라이더 컴포넌트 ──
export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 다음 슬라이드로 이동
  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  // 이전 슬라이드로 이동
  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // 자동 전환 (4초, 호버 시 일시정지)
  useEffect(() => {
    if (isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(next, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, next]);

  const slide = SLIDES[current];
  const Icon = SLIDE_ICON[slide.type];

  return (
    <div
      className="relative rounded-xl overflow-hidden h-[120px] md:h-[200px] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── 슬라이드 애니메이션 ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: "easeOut" as const }}
          className="absolute inset-0"
        >
          {/* 배경 그라디언트 */}
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgGradient}`} />

          {/* 슬라이드 내부 콘텐츠 */}
          <Link href={slide.href} className="absolute inset-0 p-6 md:p-8 flex items-center">
            {/* 왼쪽: 배지 + 제목 + 부제목 */}
            <div className="flex-1 min-w-0 z-10">
              {/* 타입 배지 */}
              <span className="inline-block mb-2 md:mb-3 rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-[10px] md:text-xs font-bold text-white/90 tracking-wider">
                {BADGE_LABEL[slide.type]}
              </span>
              {/* 제목 */}
              <h2 className="text-[18px] md:text-[26px] font-black text-white/90 leading-tight truncate">
                {slide.title}
              </h2>
              {/* 부제목 */}
              <p className="mt-1 text-[12px] md:text-sm text-white/70 truncate">
                {slide.subtitle}
              </p>
            </div>

            {/* 오른쪽: 배경 아이콘 (장식용) */}
            <div className="shrink-0 ml-4 flex items-center justify-center">
              <Icon className="h-16 w-16 md:h-28 md:w-28 text-white opacity-20" />
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* ── 좌우 화살표 (데스크탑 hover 시 표시) ── */}
      <button
        onClick={prev}
        aria-label="이전 슬라이드"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="다음 슬라이드"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* ── 하단 인디케이터 (5개 점) ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`슬라이드 ${i + 1}로 이동`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-5 h-1.5 bg-white"
                : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
