import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";

// 관리자 전용 디버그 프록시 (외부 API 원본 응답 확인용).
// 무료 플랜 쿼터 소모 + 외부에 키 위임 위험이 있어 admin 가드 필수.

const BASE_URL = "https://api.balldontlie.io/mma/v1";
const API_KEY = process.env.BALLDONTLIE_API_KEY ?? "";

// 외부 입력으로 임의 endpoint 호출 방지
const ALLOWED_ENDPOINTS = new Set([
  "fighters",
  "events",
  "fights",
  "organizations",
  "rankings",
]);
const MAX_PER_PAGE = 100;

async function fetchRaw(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: API_KEY },
  });

  if (!res.ok) {
    return { error: `${res.status} ${res.statusText}`, endpoint, paid: res.status === 401 };
  }

  return await res.json();
}

export async function GET(req: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const endpointParam = (req.nextUrl.searchParams.get("endpoint") ?? "fighters").trim();
  if (!ALLOWED_ENDPOINTS.has(endpointParam)) {
    return NextResponse.json(
      { success: false, error: `허용되지 않은 endpoint: ${endpointParam}` },
      { status: 400 }
    );
  }

  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const perPageRaw = parseInt(req.nextUrl.searchParams.get("per_page") ?? "25", 10);
  const perPage = String(
    Math.min(Math.max(isNaN(perPageRaw) ? 25 : perPageRaw, 1), MAX_PER_PAGE)
  );
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const year = req.nextUrl.searchParams.get("year") ?? undefined;

  const params: Record<string, string> = { per_page: perPage };
  if (search) params.search = search;
  if (cursor) params.cursor = cursor;
  if (year) params.year = year;

  const result = await fetchRaw(`/${endpointParam}`, params);

  return NextResponse.json({
    _info: {
      endpoint: `/${endpointParam}`,
      params,
      api_key_set: !!API_KEY,
      timestamp: new Date().toISOString(),
    },
    ...result,
  });
}
