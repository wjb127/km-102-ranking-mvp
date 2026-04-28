import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getCurrentSession } from "@/lib/auth/session";

// ── POST /api/upload ──
// Cloudinary 시그니처 생성. 클라이언트가 이 값을 받아 바로 Cloudinary로 업로드.
//
// 응답:
//   { success, data: { cloudName, apiKey, timestamp, signature, folder } }
//
// 필요한 환경변수:
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
//
// 클라이언트 업로드 예:
//   const fd = new FormData();
//   fd.append("file", file);
//   fd.append("api_key", apiKey);
//   fd.append("timestamp", String(timestamp));
//   fd.append("signature", signature);
//   fd.append("folder", folder);
//   fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });

function normalizeFolderSegment(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  const body = await req.json().catch(() => ({}));
  const fingerprintRaw =
    typeof body.fingerprint === "string" ? body.fingerprint.trim() : "";

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Cloudinary 환경변수(CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)가 설정되지 않았습니다.",
      },
      { status: 501 }
    );
  }

  // 폴더는 역할 기반 분리
  // - admin: 선수/운영 이미지
  // - login user: 사용자별 폴더
  // - anon: 익명 글 첨부용 폴더
  const folder = session?.role === "admin"
    ? "mma/fighters"
    : session
      ? `mma/users/${normalizeFolderSegment(session.sub)}`
      : `mma/anonymous/${normalizeFolderSegment(fingerprintRaw || `anon_${Date.now()}`)}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary signature: 파라미터를 key=value 로 정렬하여 연결 + api_secret sha1
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return NextResponse.json({
    success: true,
    data: {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    },
  });
}
