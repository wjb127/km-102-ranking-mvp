import { NextRequest, NextResponse } from "next/server";

// ── API 원본 데이터를 그대로 반환하는 디버그용 엔드포인트 ──

const BASE_URL = "https://api.balldontlie.io/mma/v1";
const API_KEY = process.env.BALLDONTLIE_API_KEY ?? "";

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
  const endpoint = req.nextUrl.searchParams.get("endpoint") ?? "fighters";
  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const perPage = req.nextUrl.searchParams.get("per_page") ?? "25";
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const year = req.nextUrl.searchParams.get("year") ?? undefined;

  const params: Record<string, string> = { per_page: perPage };
  if (search) params.search = search;
  if (cursor) params.cursor = cursor;
  if (year) params.year = year;

  const result = await fetchRaw(`/${endpoint}`, params);

  return NextResponse.json({
    _info: {
      endpoint: `/${endpoint}`,
      params,
      api_key_set: !!API_KEY,
      timestamp: new Date().toISOString(),
    },
    ...result,
  });
}
