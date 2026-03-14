"use client";

import { useState } from "react";
import {
  Shield,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Vote,
  FolderPlus,
  UserPlus,
  Flag,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  TrendingUp,
  MessageCircle,
  ChevronRight,
  LayoutDashboard,
  ClipboardList,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── 타입 ──

type Tab = "dashboard" | "approvals" | "reports";

interface PendingCategory {
  id: number;
  name: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

interface PendingPerson {
  id: number;
  name: string;
  category: string;
  nationality: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

interface ReportedComment {
  id: number;
  category: string;
  nickname: string;
  content: string;
  reportCount: number;
  reasons: string[];
  createdAt: string;
  isHidden: boolean;
}

// ── 더미 데이터 ──

const initialPendingCategories: PendingCategory[] = [
  { id: 101, name: "2025 올해의 드라마", description: "2025년 방영된 최고의 드라마를 뽑아주세요.", submittedBy: "드라마팬", submittedAt: "2026-03-13", status: "pending" },
  { id: 102, name: "역대 최고의 애니메이션", description: "일본 애니메이션부터 디즈니까지, 최고의 작품은?", submittedBy: "오타쿠킹", submittedAt: "2026-03-12", status: "pending" },
  { id: 103, name: "최고의 유튜버", description: "가장 영향력 있는 유튜브 크리에이터에게 투표하세요.", submittedBy: "구독자1호", submittedAt: "2026-03-11", status: "pending" },
];

const initialPendingPersons: PendingPerson[] = [
  { id: 201, name: "비니시우스 주니오르", category: "최고의 축구선수", nationality: "브라질", description: "레알 마드리드의 간판 윙어", submittedBy: "축구매니아", submittedAt: "2026-03-14", status: "pending" },
  { id: 202, name: "RIIZE", category: "K-POP 최고의 보이그룹", nationality: "대한민국", description: "SM 신인 보이그룹", submittedBy: "케이팝러버", submittedAt: "2026-03-13", status: "pending" },
  { id: 203, name: "티모시 샬라메", category: "할리우드 레전드 배우", nationality: "미국", description: "듄 시리즈의 주인공", submittedBy: "영화덕후", submittedAt: "2026-03-13", status: "pending" },
  { id: 204, name: "BABYMONSTER", category: "K-POP 최고의 걸그룹", nationality: "대한민국", description: "YG 신인 걸그룹", submittedBy: "아이돌팬", submittedAt: "2026-03-12", status: "pending" },
  { id: 205, name: "니콜라 요키치", category: "최고의 NBA 선수", nationality: "세르비아", description: "덴버 너기츠의 MVP 센터", submittedBy: "농구팬", submittedAt: "2026-03-11", status: "pending" },
];

const initialReportedComments: ReportedComment[] = [
  { id: 301, category: "최고의 축구선수", nickname: "ㅋㅋ유저", content: "메시 팬들 다 뇌 없음 ㅋㅋ 호날두가 진짜 GOAT임", reportCount: 5, reasons: ["욕설/비방", "욕설/비방", "허위 정보", "욕설/비방", "스팸/광고"], createdAt: "2026-03-14", isHidden: true },
  { id: 302, category: "K-POP 최고의 보이그룹", nickname: "홍보봇", content: "✅ 돈 벌고 싶으면 여기 클릭 → bit.ly/xxxxx 하루 50만원 가능!!", reportCount: 4, reasons: ["스팸/광고", "스팸/광고", "스팸/광고", "스팸/광고"], createdAt: "2026-03-13", isHidden: true },
  { id: 303, category: "할리우드 레전드 배우", nickname: "까칠한비평가", content: "레오나르도 디카프리오 연기 못하는데 왜 1위임? 팬덤 투표겠네", reportCount: 2, reasons: ["욕설/비방", "허위 정보"], createdAt: "2026-03-13", isHidden: false },
  { id: 304, category: "K-POP 최고의 걸그룹", nickname: "안티123", content: "뉴진스 해체하면 좋겠다 진심으로", reportCount: 3, reasons: ["욕설/비방", "욕설/비방", "욕설/비방"], createdAt: "2026-03-12", isHidden: true },
  { id: 305, category: "최고의 NBA 선수", nickname: "점쟁이", content: "르브론 은퇴하면 NBA 망함 ㅇㅇ 볼 가치가 없어짐", reportCount: 1, reasons: ["허위 정보"], createdAt: "2026-03-11", isHidden: false },
];

// ── 사이드바 메뉴 ──

const SIDEBAR_ITEMS = [
  { key: "dashboard" as Tab, label: "대시보드", icon: LayoutDashboard },
  { key: "approvals" as Tab, label: "승인 관리", icon: ClipboardList },
  { key: "reports" as Tab, label: "신고 관리", icon: ShieldAlert },
];

// ── 메인 컴포넌트 ──

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [categories, setCategories] = useState(initialPendingCategories);
  const [persons, setPersons] = useState(initialPendingPersons);
  const [comments, setComments] = useState(initialReportedComments);

  // 통계
  const totalVotes = 539_190;
  const pendingCategoryCount = categories.filter((c) => c.status === "pending").length;
  const pendingPersonCount = persons.filter((p) => p.status === "pending").length;
  const newReportCount = comments.filter((c) => !c.isHidden && c.reportCount > 0).length;

  // 승인/거절 핸들러
  const handleCategoryAction = (id: number, action: "approved" | "rejected") => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, status: action } : c)));
  };
  const handlePersonAction = (id: number, action: "approved" | "rejected") => {
    setPersons((prev) => prev.map((p) => (p.id === id ? { ...p, status: action } : p)));
  };

  // 댓글 숨김/삭제
  const handleCommentHide = (id: number) => {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, isHidden: !c.isHidden } : c)));
  };
  const handleCommentDelete = (id: number) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── 사이드바 ── */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface">
        {/* 로고 */}
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">관리자 콘솔</h1>
            <p className="text-[11px] text-muted">인기투표 랭킹</p>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.key;
            const badge =
              item.key === "approvals"
                ? pendingCategoryCount + pendingPersonCount
                : item.key === "reports"
                ? newReportCount
                : 0;

            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-border/40 hover:text-foreground"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                    isActive ? "bg-primary text-white" : "bg-danger/10 text-danger"
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* 하단 */}
        <div className="border-t border-border px-3 py-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-all hover:bg-border/40 hover:text-foreground"
          >
            <LogOut className="h-4.5 w-4.5" />
            서비스로 돌아가기
          </Link>
        </div>
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <main className="ml-64 flex-1 p-6 lg:p-8">
        {/* 대시보드 탭 */}
        {tab === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">대시보드</h2>
              <p className="mt-1 text-sm text-muted">서비스 현황을 한눈에 확인하세요.</p>
            </div>

            {/* 요약 카드 4개 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                icon={<TrendingUp className="h-5 w-5" />}
                iconBg="bg-primary/10 text-primary"
                label="총 누적 투표수"
                value={totalVotes.toLocaleString()}
                sub="+2,847 (오늘)"
                subColor="text-success"
              />
              <SummaryCard
                icon={<FolderPlus className="h-5 w-5" />}
                iconBg="bg-warning/10 text-warning"
                label="승인 대기 카테고리"
                value={String(pendingCategoryCount)}
                sub="신규 신청"
                subColor="text-warning"
              />
              <SummaryCard
                icon={<UserPlus className="h-5 w-5" />}
                iconBg="bg-accent/10 text-accent"
                label="승인 대기 인물"
                value={String(pendingPersonCount)}
                sub="등록 신청"
                subColor="text-accent"
              />
              <SummaryCard
                icon={<Flag className="h-5 w-5" />}
                iconBg="bg-danger/10 text-danger"
                label="신규 신고 접수"
                value={String(newReportCount)}
                sub="처리 필요"
                subColor="text-danger"
              />
            </div>

            {/* 빠른 액세스 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* 최근 승인 대기 */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">최근 승인 대기</h3>
                  <button
                    onClick={() => setTab("approvals")}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    전체 보기 <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {[...persons.filter((p) => p.status === "pending")].slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                        <Users className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="text-xs text-muted">{p.category}</p>
                      </div>
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">대기</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 최근 신고 */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">최근 신고 접수</h3>
                  <button
                    onClick={() => setTab("reports")}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    전체 보기 <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-3">
                  {comments.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        c.isHidden ? "bg-muted/10" : "bg-danger/10"
                      )}>
                        <MessageCircle className={cn("h-4 w-4", c.isHidden ? "text-muted" : "text-danger")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{c.content}</p>
                        <p className="text-xs text-muted">{c.nickname} · 신고 {c.reportCount}건</p>
                      </div>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        c.isHidden ? "bg-muted/10 text-muted" : "bg-danger/10 text-danger"
                      )}>
                        {c.isHidden ? "숨김" : "노출 중"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 서비스 현황 */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-4 text-sm font-bold text-foreground">서비스 현황</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatItem label="운영 카테고리" value="9개" />
                <StatItem label="등록 인물" value="90명" />
                <StatItem label="총 댓글" value="1,247개" />
                <StatItem label="일일 방문자" value="3,582명" />
              </div>
            </div>
          </div>
        )}

        {/* 승인 관리 탭 */}
        {tab === "approvals" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">승인 관리</h2>
              <p className="mt-1 text-sm text-muted">사용자가 신청한 카테고리와 인물을 승인 또는 거절합니다.</p>
            </div>

            {/* 카테고리 승인 */}
            <div className="rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <FolderPlus className="h-4.5 w-4.5 text-warning" />
                <h3 className="text-sm font-bold text-foreground">카테고리 등록 신청</h3>
                <span className="ml-auto rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                  {categories.filter((c) => c.status === "pending").length}건 대기
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">카테고리명</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">설명</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">신청자</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">신청일</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">상태</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr key={cat.id} className="border-b border-border/50 last:border-0">
                        <td className="px-5 py-3.5 font-semibold text-foreground">{cat.name}</td>
                        <td className="max-w-48 truncate px-5 py-3.5 text-muted">{cat.description}</td>
                        <td className="px-5 py-3.5 text-muted">{cat.submittedBy}</td>
                        <td className="px-5 py-3.5 text-muted">{cat.submittedAt}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={cat.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {cat.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleCategoryAction(cat.id, "approved")}
                                className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition-all hover:bg-success/20"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> 승인
                              </button>
                              <button
                                onClick={() => handleCategoryAction(cat.id, "rejected")}
                                className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-all hover:bg-danger/20"
                              >
                                <XCircle className="h-3.5 w-3.5" /> 거절
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">처리 완료</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 인물 승인 */}
            <div className="rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <UserPlus className="h-4.5 w-4.5 text-accent" />
                <h3 className="text-sm font-bold text-foreground">인물 등록 신청</h3>
                <span className="ml-auto rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                  {persons.filter((p) => p.status === "pending").length}건 대기
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">이름</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">카테고리</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">국적</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">설명</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">신청자</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">상태</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {persons.map((person) => (
                      <tr key={person.id} className="border-b border-border/50 last:border-0">
                        <td className="px-5 py-3.5 font-semibold text-foreground">{person.name}</td>
                        <td className="px-5 py-3.5 text-muted">{person.category}</td>
                        <td className="px-5 py-3.5 text-muted">{person.nationality}</td>
                        <td className="max-w-40 truncate px-5 py-3.5 text-muted">{person.description}</td>
                        <td className="px-5 py-3.5 text-muted">{person.submittedBy}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={person.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {person.status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handlePersonAction(person.id, "approved")}
                                className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success transition-all hover:bg-success/20"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> 승인
                              </button>
                              <button
                                onClick={() => handlePersonAction(person.id, "rejected")}
                                className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-all hover:bg-danger/20"
                              >
                                <XCircle className="h-3.5 w-3.5" /> 거절
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">처리 완료</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 신고 관리 탭 */}
        {tab === "reports" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">신고 관리</h2>
              <p className="mt-1 text-sm text-muted">신고된 댓글을 확인하고 숨김 또는 삭제 처리합니다.</p>
            </div>

            <div className="rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <AlertTriangle className="h-4.5 w-4.5 text-danger" />
                <h3 className="text-sm font-bold text-foreground">신고된 댓글</h3>
                <span className="ml-auto rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
                  총 {comments.length}건
                </span>
              </div>

              {comments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <CheckCircle2 className="h-10 w-10 text-success/40" />
                  <p className="text-sm text-muted">처리할 신고가 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {comments.map((comment) => (
                    <div key={comment.id} className="px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          comment.isHidden ? "bg-muted/10" : "bg-danger/10"
                        )}>
                          <Flag className={cn("h-5 w-5", comment.isHidden ? "text-muted/50" : "text-danger")} />
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* 메타 정보 */}
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{comment.nickname}</span>
                            <span className="text-xs text-muted">{comment.category}</span>
                            <span className="text-xs text-muted">·</span>
                            <span className="text-xs text-muted">{comment.createdAt}</span>
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-bold",
                              comment.isHidden ? "bg-muted/10 text-muted" : "bg-danger/10 text-danger"
                            )}>
                              {comment.isHidden ? "숨김 처리됨" : "노출 중"}
                            </span>
                          </div>

                          {/* 댓글 내용 */}
                          <p className={cn(
                            "mb-2 rounded-lg border px-3 py-2 text-sm",
                            comment.isHidden
                              ? "border-border/40 bg-background/50 text-muted line-through"
                              : "border-danger/20 bg-danger/5 text-foreground"
                          )}>
                            {comment.content}
                          </p>

                          {/* 신고 사유 태그 */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-medium text-muted">신고 사유:</span>
                            {[...new Set(comment.reasons)].map((reason) => {
                              const count = comment.reasons.filter((r) => r === reason).length;
                              return (
                                <span key={reason} className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted">
                                  {reason} {count > 1 && `×${count}`}
                                </span>
                              );
                            })}
                            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-bold text-danger">
                              총 {comment.reportCount}건
                            </span>
                          </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => handleCommentHide(comment.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                              comment.isHidden
                                ? "bg-success/10 text-success hover:bg-success/20"
                                : "bg-warning/10 text-warning hover:bg-warning/20"
                            )}
                          >
                            {comment.isHidden ? (
                              <><Eye className="h-3.5 w-3.5" /> 복원</>
                            ) : (
                              <><EyeOff className="h-3.5 w-3.5" /> 숨김</>
                            )}
                          </button>
                          <button
                            onClick={() => handleCommentDelete(comment.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-danger/10 px-3 py-2 text-xs font-semibold text-danger transition-all hover:bg-danger/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> 삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── 서브 컴포넌트 ──

function SummaryCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  subColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
  subColor: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted">{label}</p>
      <p className={cn("mt-2 text-xs font-semibold", subColor)}>{sub}</p>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 px-4 py-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success">
        <CheckCircle2 className="h-3 w-3" /> 승인됨
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-[11px] font-semibold text-danger">
        <XCircle className="h-3 w-3" /> 거절됨
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-[11px] font-semibold text-warning">
      <Clock className="h-3 w-3" /> 대기 중
    </span>
  );
}
