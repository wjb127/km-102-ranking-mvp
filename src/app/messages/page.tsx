"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, Trash2, RefreshCw } from "lucide-react";

type Box = "inbox" | "sent";

interface MessageRow {
  id: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  counterpart: { id: string; nickname: string };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString("ko-KR");
}

export default function MessagesPage() {
  const router = useRouter();
  const [box, setBox] = useState<Box>("inbox");
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  // 작성 폼
  const [showCompose, setShowCompose] = useState(false);
  const [toNickname, setToNickname] = useState("");
  const [composeText, setComposeText] = useState("");
  const [composeLoading, setComposeLoading] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);

  // 상세 모달
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<(MessageRow & { direction: Box }) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?box=${box}`, { cache: "no-store" });
      if (res.status === 401) {
        setAuthError(true);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setRows(json.data ?? []);
        if (box === "inbox") setUnread(json.unread ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [box]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(id: number) {
    setOpenId(id);
    setDetail(null);
    const res = await fetch(`/api/messages/${id}`, { cache: "no-store" });
    const json = await res.json();
    if (json.success) {
      setDetail(json.data);
      // 읽음 처리됐으니 목록 갱신
      if (box === "inbox") load();
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("삭제하시겠습니까?")) return;
    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setOpenId(null);
      setDetail(null);
      load();
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setComposeError(null);
    setComposeLoading(true);
    try {
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverNickname: toNickname, content: composeText }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setComposeError(json.error ?? "전송 실패");
        return;
      }
      setShowCompose(false);
      setToNickname("");
      setComposeText("");
      if (box === "sent") load();
    } finally {
      setComposeLoading(false);
    }
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-gray-700 mb-4">쪽지함은 로그인 후 이용할 수 있습니다.</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20 pb-24 md:pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5" /> 쪽지함
            {unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="p-2 text-gray-500 hover:text-gray-900"
              aria-label="새로고침"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCompose(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" /> 쪽지 쓰기
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setBox("inbox")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${
              box === "inbox"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            받은편지함
          </button>
          <button
            onClick={() => setBox("sent")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${
              box === "sent"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            보낸편지함
          </button>
        </div>

        {/* 목록 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-500">불러오는 중...</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              {box === "inbox" ? "받은 쪽지가 없습니다." : "보낸 쪽지가 없습니다."}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => openDetail(r.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-sm font-semibold ${
                            box === "inbox" && !r.isRead ? "text-blue-700" : "text-gray-900"
                          }`}
                        >
                          {box === "inbox" ? "받음" : "→"} {r.counterpart.nickname}
                        </span>
                        {box === "inbox" && !r.isRead && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">{r.content}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">
                      {formatTime(r.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {openId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => {
            setOpenId(null);
            setDetail(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-lg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            {!detail ? (
              <div className="py-8 text-center text-sm text-gray-500">불러오는 중...</div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {detail.direction === "inbox" ? "보낸 사람" : "받는 사람"}:{" "}
                    {detail.counterpart.nickname}
                  </span>
                  <span className="text-[11px] text-gray-400">{formatTime(detail.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap mb-4 py-3 border-t border-b border-gray-100">
                  {detail.content}
                </p>
                <div className="flex justify-between items-center">
                  {detail.direction === "inbox" && (
                    <button
                      onClick={() => {
                        setToNickname(detail.counterpart.nickname);
                        setShowCompose(true);
                        setOpenId(null);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      답장하기
                    </button>
                  )}
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => handleDelete(detail.id)}
                      className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded flex items-center gap-1 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 삭제
                    </button>
                    <button
                      onClick={() => {
                        setOpenId(null);
                        setDetail(null);
                      }}
                      className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 쪽지 쓰기 모달 */}
      {showCompose && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => setShowCompose(false)}
        >
          <form
            onSubmit={handleSend}
            className="w-full max-w-md bg-white rounded-lg p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900">쪽지 쓰기</h2>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">받는 사람 닉네임</label>
              <input
                type="text"
                value={toNickname}
                onChange={(e) => setToNickname(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                내용 ({composeText.length}/1000)
              </label>
              <textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                required
                maxLength={1000}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            {composeError && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {composeError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={composeLoading}
                className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
              >
                {composeLoading ? "전송 중..." : "보내기"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
