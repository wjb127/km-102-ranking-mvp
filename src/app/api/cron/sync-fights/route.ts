import { NextRequest, NextResponse } from "next/server";
import { runMmaSync } from "@/lib/mma-sync";

// 주간 fights 동기화 (Vercel Cron 호출 전용).
// 최근 페이지만 부분 동기화 후 전적 재계산. 풀 sync는 관리자가 수동 트리거.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET?.trim();

  if (!expected) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const lines: string[] = [];
  const log = (msg: string) => {
    lines.push(msg);
    console.log(msg);
  };

  try {
    const summary = await runMmaSync({
      fights: true,
      maxPages: 5,
      perPage: 100,
      allowPartialFights: true,
      log,
    });
    return NextResponse.json({ success: true, summary, logs: lines });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/sync-fights] 실패", error);
    return NextResponse.json(
      { success: false, error: msg, logs: lines },
      { status: 500 }
    );
  }
}
