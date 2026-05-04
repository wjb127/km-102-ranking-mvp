import { NextRequest, NextResponse } from "next/server";
import { runMmaSync } from "@/lib/mma-sync";

// Vercel Cron 실행 시 자동으로 Authorization: Bearer ${CRON_SECRET} 헤더 부여
// 외부에서 CRON_SECRET 없이는 호출 불가
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET?.trim();

  if (!expected) {
    console.error("[cron/sync-mma] CRON_SECRET 환경변수 없음");
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

  // maxPages=5 -> 최신 페이지만 부분 동기화 (rate limit 13s × 페이지 수 고려)
  // fighters 5p + events 5p + 페이지 간 sleep ≈ 130초 < 300초
  const lines: string[] = [];
  const log = (msg: string) => {
    lines.push(msg);
    console.log(msg);
  };

  try {
    const summary = await runMmaSync({
      fighters: true,
      events: true,
      maxPages: 5,
      perPage: 100,
      log,
    });

    return NextResponse.json({
      success: true,
      summary,
      logs: lines,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[cron/sync-mma] 실패", error);
    return NextResponse.json(
      { success: false, error: msg, logs: lines },
      { status: 500 }
    );
  }
}
