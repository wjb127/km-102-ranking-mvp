"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Shield,
  FileText,
  MessageSquare,
  AlertTriangle,
  KeyRound,
  Bookmark,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MyProfile {
  id: string;
  email: string;
  nickname: string;
  role: "user" | "admin";
  createdAt: string;
}

interface MyPost {
  id: number;
  category: string;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface MyComment {
  id: number;
  targetType: string;
  targetId: number;
  content: string;
  createdAt: string;
}

interface MyBookmark {
  bookmarkId: number;
  createdAt: string;
  fighter: {
    id: number;
    fullName: string;
    fullNameKo: string | null;
    nickname: string | null;
    nicknameKo: string | null;
    weightClass: string | null;
    nationality: string | null;
    nationalityKo: string | null;
    careerWins: number;
    careerLosses: number;
    careerDraws: number;
    imageUrl: string | null;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);

  // 닉네임 변경
  const [newNickname, setNewNickname] = useState("");
  const [nicknameMsg, setNicknameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [nicknameBusy, setNicknameBusy] = useState(false);

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  // 내 글/댓글
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [myComments, setMyComments] = useState<MyComment[]>([]);

  // 북마크 선수
  const [bookmarks, setBookmarks] = useState<MyBookmark[]>([]);

  // 탈퇴 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/profile", { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/login");
      return null;
    }
    const json = await res.json();
    if (json?.success) {
      setProfile(json.data);
      setNewNickname(json.data.nickname);
      return json.data as MyProfile;
    }
    return null;
  }, [router]);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (p) {
        // 내 글/댓글/북마크 병렬 조회
        const [postsRes, commentsRes, bookmarksRes] = await Promise.all([
          fetch("/api/profile/posts?limit=10", { cache: "no-store" }),
          fetch("/api/profile/comments?limit=10", { cache: "no-store" }),
          fetch("/api/fighter-bookmarks", { cache: "no-store" }),
        ]);
        const postsJson = await postsRes.json();
        const commentsJson = await commentsRes.json();
        const bookmarksJson = await bookmarksRes.json();
        if (postsJson?.success) setMyPosts(postsJson.data);
        if (commentsJson?.success) setMyComments(commentsJson.data);
        if (bookmarksJson?.success) setBookmarks(bookmarksJson.data);
      }
      setLoaded(true);
    })();
  }, [loadProfile]);

  async function handleNicknameChange(e: React.FormEvent) {
    e.preventDefault();
    setNicknameMsg(null);
    const trimmed = newNickname.trim();
    if (!trimmed) {
      setNicknameMsg({ type: "err", text: "닉네임을 입력해주세요." });
      return;
    }
    if (trimmed === profile?.nickname) {
      setNicknameMsg({ type: "err", text: "현재 닉네임과 같습니다." });
      return;
    }
    setNicknameBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setNicknameMsg({ type: "err", text: json?.error ?? "변경 실패" });
        return;
      }
      setProfile(json.data);
      setNicknameMsg({ type: "ok", text: "닉네임이 변경되었습니다." });
    } finally {
      setNicknameBusy(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (!currentPassword || !newPassword) {
      setPwMsg({ type: "err", text: "현재 비밀번호와 새 비밀번호를 입력해주세요." });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "새 비밀번호는 8자 이상이어야 합니다." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "err", text: "새 비밀번호 확인이 일치하지 않습니다." });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        setPwMsg({ type: "err", text: json?.error ?? "변경 실패" });
        return;
      }
      setPwMsg({ type: "ok", text: "비밀번호가 변경되었습니다." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPwBusy(false);
    }
  }

  async function handleRemoveBookmark(fighterId: number) {
    const prev = bookmarks;
    setBookmarks((list) => list.filter((b) => b.fighter.id !== fighterId));
    try {
      const res = await fetch(`/api/fighter-bookmarks?fighterId=${fighterId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setBookmarks(prev);
    }
  }

  async function handleDeleteAccount() {
    setDeleteBusy(true);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        alert(json?.error ?? "탈퇴 실패");
        return;
      }
      alert("탈퇴 처리되었습니다.");
      router.replace("/");
      router.refresh();
    } finally {
      setDeleteBusy(false);
      setShowDeleteModal(false);
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-sm text-[var(--muted)]">불러오는 중...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16 md:pt-20 pb-24 md:pb-8">
      <div className="mx-auto max-w-4xl px-4 md:px-6 space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">내 프로필</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            계정 정보를 관리하고 내가 작성한 글과 댓글을 확인하세요.
          </p>
        </div>

        {/* 내 정보 카드 */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
              <UserIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--foreground)]">{profile.nickname}</h2>
                {profile.role === "admin" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--primary)]">
                    <Shield className="h-3 w-3" /> 관리자
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <Calendar className="h-3.5 w-3.5" />
                가입일 {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>
        </section>

        {/* 닉네임 변경 */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
            <UserIcon className="h-4 w-4 text-[var(--primary)]" /> 닉네임 변경
          </h3>
          <form onSubmit={handleNicknameChange} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                현재 닉네임
              </label>
              <input
                value={profile.nickname}
                disabled
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)]/40 px-3 py-2 text-sm text-[var(--muted)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                새 닉네임
              </label>
              <input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                placeholder="2~20자"
              />
            </div>
            {nicknameMsg && (
              <p
                className={cn(
                  "text-xs",
                  nicknameMsg.type === "ok" ? "text-[var(--success)]" : "text-[var(--danger)]"
                )}
              >
                {nicknameMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={nicknameBusy}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {nicknameBusy ? "변경 중..." : "닉네임 변경"}
            </button>
          </form>
        </section>

        {/* 비밀번호 변경 */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
            <KeyRound className="h-4 w-4 text-[var(--primary)]" /> 비밀번호 변경
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                현재 비밀번호
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                새 비밀번호
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                placeholder="8자 이상"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted)]">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                autoComplete="new-password"
              />
            </div>
            {pwMsg && (
              <p
                className={cn(
                  "text-xs",
                  pwMsg.type === "ok" ? "text-[var(--success)]" : "text-[var(--danger)]"
                )}
              >
                {pwMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwBusy}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {pwBusy ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        </section>

        {/* 즐겨찾기 선수 */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
            <Bookmark className="h-4 w-4 text-[var(--primary)]" /> 즐겨찾기 선수
            <span className="text-xs font-normal text-[var(--muted)]">({bookmarks.length}명)</span>
          </h3>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              아직 즐겨찾기에 추가한 선수가 없습니다. 선수 프로필에서 &quot;즐겨찾기&quot; 버튼으로 추가해보세요.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {bookmarks.map((b) => {
                const name = b.fighter.fullNameKo || b.fighter.fullName;
                const sub = b.fighter.fullNameKo ? b.fighter.fullName : null;
                const nat = b.fighter.nationalityKo || b.fighter.nationality;
                return (
                  <div
                    key={b.bookmarkId}
                    className="group relative flex items-center gap-3 rounded-lg border border-[var(--border)]/60 bg-[var(--background)]/30 p-3 transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5"
                  >
                    <Link
                      href={`/fighters/${b.fighter.id}`}
                      className="flex flex-1 items-center gap-3 min-w-0"
                    >
                      {b.fighter.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={b.fighter.imageUrl}
                          alt={name}
                          className="h-10 w-10 rounded-full object-cover border border-[var(--border)]/60"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[var(--border)]/40 flex items-center justify-center text-xs text-[var(--muted)]">
                          {name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                          {name}
                        </p>
                        <p className="truncate text-[11px] text-[var(--muted)]">
                          {b.fighter.careerWins}승 {b.fighter.careerLosses}패 {b.fighter.careerDraws}무
                          {nat ? ` · ${nat}` : ""}
                          {sub ? ` · ${sub}` : ""}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(b.fighter.id)}
                      className="flex-shrink-0 rounded-md p-1.5 text-[var(--muted)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] transition-colors"
                      aria-label="즐겨찾기에서 제거"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 내 게시글 */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
            <FileText className="h-4 w-4 text-[var(--primary)]" /> 내 게시글
            <span className="text-xs font-normal text-[var(--muted)]">({myPosts.length}건)</span>
          </h3>
          {myPosts.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">작성한 게시글이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {myPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/board/${p.id}`}
                  className="block rounded-lg border border-[var(--border)]/60 bg-[var(--background)]/30 p-3 transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5"
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px]">
                    <span className="rounded bg-[var(--accent)]/10 px-1.5 py-0.5 font-bold text-[var(--accent)]">
                      {p.category}
                    </span>
                    <span className="text-[var(--muted)]">
                      {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{p.title}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    조회 {p.viewCount} · 추천 {p.likeCount} · 댓글 {p.commentCount}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 내 댓글 */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
            <MessageSquare className="h-4 w-4 text-[var(--primary)]" /> 내 댓글
            <span className="text-xs font-normal text-[var(--muted)]">({myComments.length}건)</span>
          </h3>
          {myComments.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">작성한 댓글이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {myComments.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-[var(--border)]/60 bg-[var(--background)]/30 p-3"
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                    <span className="rounded bg-[var(--accent)]/10 px-1.5 py-0.5 font-bold text-[var(--accent)]">
                      {c.targetType} #{c.targetId}
                    </span>
                    <span>{new Date(c.createdAt).toLocaleString("ko-KR")}</span>
                  </div>
                  <p className="line-clamp-3 text-sm text-[var(--foreground)]">{c.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 회원 탈퇴 */}
        <section className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--danger)]">
            <AlertTriangle className="h-4 w-4" /> 회원 탈퇴
          </h3>
          <p className="mb-4 text-xs text-[var(--muted)]">
            탈퇴 시 계정은 비활성화되며, 이후 동일 이메일로 로그인할 수 없습니다. 작성한 게시글과
            댓글은 유지됩니다.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-4 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/20"
          >
            회원 탈퇴
          </button>
        </section>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[var(--danger)]">
              <AlertTriangle className="h-5 w-5" /> 정말 탈퇴하시겠어요?
            </h3>
            <p className="mb-5 text-sm text-[var(--muted)]">
              이 작업은 되돌릴 수 없습니다. 계정이 비활성화되고 즉시 로그아웃됩니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteBusy}
                className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--border)]/40"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteBusy}
                className="rounded-md bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {deleteBusy ? "처리 중..." : "탈퇴 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
