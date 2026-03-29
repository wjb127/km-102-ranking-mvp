"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Shield,
  Zap,
  Rocket,
  Check,
  Users,
  MessageSquare,
  Trophy,
  Calendar,
  Search,
  Mail,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

// ── 시나리오 데이터 ──

const scenarios = [
  {
    id: "A",
    name: "수동 운영형",
    icon: Shield,
    price: "200만원",
    duration: "3주",
    color: "from-blue-500 to-blue-600",
    colorLight: "blue",
    desc: "관리자가 직접 선수·경기 정보를 등록하는 기본형",
    features: [
      { label: "역대 1위 투표", included: true },
      { label: "선수 검색 + 정보 + 댓글", included: true },
      { label: "경기 일정 + 댓글", included: true, note: "관리자 수동 등록" },
      { label: "게시판 (분석/토론/자유)", included: true },
      { label: "회원가입 / 로그인", included: true },
      { label: "회원간 쪽지", included: true, note: "기본형" },
      { label: "선수 데이터", included: true, note: "엑셀 일괄 업로드" },
    ],
    maintenance: "월 ~3.5만원 (Supabase Pro)",
  },
  {
    id: "B",
    name: "일정 API 연동형",
    icon: Zap,
    price: "240만원",
    duration: "3~4주",
    color: "from-violet-500 to-purple-600",
    colorLight: "violet",
    recommended: true,
    desc: "경기 일정을 외부 API로 자동 연동하는 확장형",
    features: [
      { label: "역대 1위 투표", included: true },
      { label: "선수 검색 + 정보 + 댓글", included: true },
      { label: "경기 일정 + 댓글", included: true, note: "외부 API 자동 연동" },
      { label: "게시판 (분석/토론/자유)", included: true },
      { label: "회원가입 / 로그인", included: true },
      { label: "회원간 쪽지", included: true, note: "기본형" },
      { label: "선수 데이터", included: true, note: "엑셀 일괄 업로드" },
    ],
    maintenance: "월 ~3.5만원 + 외부 API 사용료 별도",
  },
  {
    id: "C",
    name: "API 통합형",
    icon: Rocket,
    price: "280만원",
    duration: "4~5주",
    color: "from-amber-500 to-orange-600",
    colorLight: "amber",
    desc: "경기 일정 + 선수 프로필 모두 API 자동 연동",
    features: [
      { label: "역대 1위 투표", included: true },
      { label: "선수 검색 + 정보 + 댓글", included: true },
      { label: "경기 일정 + 댓글", included: true, note: "외부 API 자동 연동" },
      { label: "게시판 (분석/토론/자유)", included: true },
      { label: "회원가입 / 로그인", included: true },
      { label: "회원간 쪽지", included: true, note: "기본형" },
      { label: "선수 데이터", included: true, note: "API 연동 + 자동 동기화" },
    ],
    maintenance: "월 ~3.5만원 + 외부 API 사용료 별도",
  },
];

const commonFeatures = [
  { icon: Trophy, label: "역대 1위 투표", desc: "MMA 선수 인기투표" },
  { icon: Search, label: "선수 검색 + 정보", desc: "프로필 · 전적 · 댓글" },
  { icon: Calendar, label: "경기 일정", desc: "일정 표시 + 경기별 댓글" },
  { icon: MessageSquare, label: "게시판 3종", desc: "분석 · 토론 · 자유" },
  { icon: Users, label: "회원 시스템", desc: "가입 · 로그인 · 프로필" },
  { icon: Mail, label: "회원간 쪽지", desc: "1:1 메시지 송수신" },
];

// ── 메인 컴포넌트 ──

export default function EstimatePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16">
        {/* 배경 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/3 -left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-1/3 -right-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" as const }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              📋 수정 견적서
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
              MMA 분석 커뮤니티
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-base text-muted md:text-lg">
              시나리오별 예상 견적안입니다.<br className="hidden md:block" />
              최종 금액은 상세 기능 범위 확정 후 안내드리겠습니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 공통 기능 요약 ── */}
      <section className="mx-auto max-w-5xl px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
        >
          <h2 className="mb-6 text-center text-lg font-bold text-foreground md:text-xl">
            전체 시나리오 공통 기능
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {commonFeatures.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" as const }}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4 text-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-bold text-foreground">{f.label}</span>
                <span className="text-[11px] text-muted leading-tight">{f.desc}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── 시나리오 카드 ── */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="mb-8 text-center text-lg font-bold text-foreground md:text-xl">
          시나리오별 견적
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: "easeOut" as const }}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-surface transition-shadow hover:shadow-lg",
                s.recommended
                  ? "border-primary shadow-md shadow-primary/10"
                  : "border-border"
              )}
            >
              {/* 추천 뱃지 */}
              {s.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-white">
                  RECOMMENDED
                </div>
              )}

              {/* 헤더 */}
              <div className={cn(
                "rounded-t-2xl bg-gradient-to-r px-5 py-5 text-white",
                s.color
              )}>
                <div className="flex items-center gap-2">
                  <s.icon className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    시나리오 {s.id}
                  </span>
                </div>
                <h3 className="mt-1 text-xl font-extrabold">{s.name}</h3>
                <p className="mt-1 text-sm opacity-80">{s.desc}</p>
              </div>

              {/* 가격 */}
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-foreground">{s.price}</span>
                  <span className="text-sm text-muted">VAT 별도</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Calendar className="h-3.5 w-3.5" />
                  예상 기간: <span className="font-semibold text-foreground">{s.duration}</span>
                </div>
              </div>

              {/* 기능 목록 */}
              <div className="flex-1 px-5 py-4">
                <ul className="space-y-2.5">
                  {s.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <div>
                        <span className="text-foreground">{f.label}</span>
                        {f.note && (
                          <span className={cn(
                            "ml-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            f.note.includes("API") || f.note.includes("자동")
                              ? "bg-primary/10 text-primary"
                              : "bg-border/50 text-muted"
                          )}>
                            {f.note}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 유지비 */}
              <div className="border-t border-border px-5 py-3">
                <p className="text-xs text-muted">
                  <span className="font-semibold text-foreground/70">월 유지비:</span>{" "}
                  {s.maintenance}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 시나리오 차이 요약 ── */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
        >
          <h2 className="mb-6 text-center text-lg font-bold text-foreground md:text-xl">
            시나리오 차이 한눈에 보기
          </h2>

          {/* 모바일: 카드 형태 */}
          <div className="space-y-3 md:hidden">
            {[
              { label: "경기 일정", a: "관리자 수동 등록", b: "외부 API 자동", c: "외부 API 자동" },
              { label: "선수 프로필", a: "엑셀 일괄 업로드", b: "엑셀 일괄 업로드", c: "API 자동 동기화" },
              { label: "견적", a: "200만원", b: "240만원", c: "280만원" },
              { label: "기간", a: "3주", b: "3~4주", c: "4~5주" },
            ].map((row) => (
              <div key={row.label} className="rounded-xl border border-border bg-surface p-4">
                <p className="mb-2 text-xs font-bold text-muted uppercase tracking-wider">{row.label}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-blue-500">A</p>
                    <p className="text-foreground">{row.a}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-violet-500">B</p>
                    <p className="text-foreground">{row.b}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-500">C</p>
                    <p className="text-foreground">{row.c}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 데스크탑: 테이블 */}
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface">
                  <th className="px-5 py-3 text-left font-bold text-muted"></th>
                  <th className="px-5 py-3 text-center font-bold text-blue-500">A. 수동 운영</th>
                  <th className="border-x border-primary/20 bg-primary/5 px-5 py-3 text-center font-bold text-primary">B. API 연동</th>
                  <th className="px-5 py-3 text-center font-bold text-amber-600">C. 통합형</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "경기 일정", a: "수동 등록", b: "API 자동", c: "API 자동" },
                  { label: "선수 프로필", a: "엑셀 업로드", b: "엑셀 업로드", c: "API 자동 동기화" },
                  { label: "견적", a: "200만원", b: "240만원", c: "280만원" },
                  { label: "기간", a: "3주", b: "3~4주", c: "4~5주" },
                  { label: "월 유지비", a: "~3.5만원", b: "~3.5만원 + API", c: "~3.5만원 + API" },
                ].map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-surface"}>
                    <td className="px-5 py-3 font-semibold text-foreground">{row.label}</td>
                    <td className="px-5 py-3 text-center text-foreground">{row.a}</td>
                    <td className="border-x border-primary/20 bg-primary/5 px-5 py-3 text-center font-medium text-foreground">{row.b}</td>
                    <td className="px-5 py-3 text-center text-foreground">{row.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* ── 참고사항 ── */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="space-y-4"
        >
          <h2 className="mb-6 text-center text-lg font-bold text-foreground md:text-xl">
            참고사항
          </h2>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                </div>
                비용
              </h3>
              <ul className="space-y-1.5 text-sm text-muted">
                <li className="flex items-start gap-2"><span className="text-border">·</span>상기 금액은 VAT 별도</li>
                <li className="flex items-start gap-2"><span className="text-border">·</span>계약금 30% / 중도금 40% / 잔금 30%</li>
                <li className="flex items-start gap-2"><span className="text-border">·</span>기획 변경 시 추가 비용 발생 가능</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                  <ChevronRight className="h-4 w-4 text-violet-500" />
                </div>
                일정
              </h3>
              <ul className="space-y-1.5 text-sm text-muted">
                <li className="flex items-start gap-2"><span className="text-border">·</span>기획 확정 후 착수</li>
                <li className="flex items-start gap-2"><span className="text-border">·</span>주 단위 진행 보고</li>
                <li className="flex items-start gap-2"><span className="text-border">·</span>QA 기간 포함</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
                  <ChevronRight className="h-4 w-4 text-green-500" />
                </div>
                포함 범위
              </h3>
              <ul className="space-y-1.5 text-sm text-muted">
                <li className="flex items-start gap-2"><span className="text-border">·</span>프론트엔드 + 백엔드 풀스택 개발</li>
                <li className="flex items-start gap-2"><span className="text-border">·</span>DB 설계 + 반응형 + 배포</li>
                <li className="flex items-start gap-2"><span className="text-border">·</span>소스코드 + 소유권 완전 이전</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <ChevronRight className="h-4 w-4 text-amber-500" />
                </div>
                유지보수
              </h3>
              <ul className="space-y-1.5 text-sm text-muted">
                <li className="flex items-start gap-2"><span className="text-border">·</span>런칭 후 1개월 무상 버그 수정</li>
                <li className="flex items-start gap-2"><span className="text-border">·</span>이후 유지보수 별도 협의</li>
                <li className="flex items-start gap-2"><span className="text-border">·</span>기능 추가는 별도 견적</li>
              </ul>
            </div>
          </div>

          {/* 선수 데이터 안내 */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-bold text-foreground">선수 데이터 & API 관련</p>
                <p className="mt-1 text-muted leading-relaxed">
                  선수 프로필 데이터는 엑셀로 정리해주시면 일괄 업로드 가능합니다.
                  경기 정보 API가 확인되면 자동 연동도 가능하며, API 스펙 확인 후 최종 견적이 확정됩니다.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-border bg-surface py-8 text-center">
        <p className="text-xs text-muted">
          본 견적서는 고객 요청 기반으로 작성되었으며, 상세 기획 확정 시 변동될 수 있습니다.
        </p>
        <p className="mt-1 text-xs text-muted/60">작성일: 2026.03.29</p>
      </footer>
    </div>
  );
}
