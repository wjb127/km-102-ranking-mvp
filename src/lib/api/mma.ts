// ── balldontlie MMA API 래퍼 ──
// 무료 플랜: 5회/분 제한. 서버사이드에서 캐싱 필수.

const BASE_URL = "https://api.balldontlie.io/mma/v1";
const API_KEY = process.env.BALLDONTLIE_API_KEY ?? "";

// ── 타입 정의 ──

export interface MmaFighter {
  id: number;
  name: string;
  nickname: string | null;
  nationality: string | null;
  height_inches: number | null;
  reach_inches: number | null;
  weight_lbs: number | null;
  stance: string | null;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  record_no_contests: number;
  active: boolean;
  weight_class: string | null;
}

export interface MmaEvent {
  id: number;
  name: string;
  date: string;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  status: string;
  league: { id: number; name: string; abbreviation: string } | null;
}

export interface MmaPaginatedResponse<T> {
  data: T[];
  meta: {
    next_cursor: number | null;
    per_page: number;
  };
}

// ── API 호출 유틸 ──

async function mmaFetch<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
  revalidate = 3600
): Promise<T | null> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    });
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: API_KEY },
      next: { revalidate },
    });

    if (!res.ok) {
      console.error(`[MMA API] ${res.status} ${res.statusText} — ${endpoint}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (err) {
    console.error(`[MMA API] fetch error — ${endpoint}`, err);
    return null;
  }
}

// ── 공개 함수 ──

/** 선수 검색 / 목록 */
export async function getFighters(search?: string, cursor?: number) {
  return mmaFetch<MmaPaginatedResponse<MmaFighter>>("/fighters", {
    search,
    cursor: cursor,
    per_page: 25,
  });
}

/** 선수 상세 */
export async function getFighterById(id: string | number) {
  return mmaFetch<{ data: MmaFighter }>(`/fighters/${id}`, undefined, 3600);
}

/** 이벤트(경기) 목록 */
export async function getEvents(year?: number) {
  return mmaFetch<MmaPaginatedResponse<MmaEvent>>("/events", {
    year,
    per_page: 25,
  });
}

/** 이벤트 상세 */
export async function getEventById(id: string | number) {
  return mmaFetch<{ data: MmaEvent }>(`/events/${id}`, undefined, 3600);
}

// ── Mock / Fallback 데이터 ──

export const FALLBACK_FIGHTERS: MmaFighter[] = [
  { id: 1, name: "Conor McGregor", nickname: "The Notorious", nationality: "Ireland", height_inches: 69, reach_inches: 74, weight_lbs: 155, stance: "Southpaw", record_wins: 22, record_losses: 6, record_draws: 0, record_no_contests: 0, active: true, weight_class: "Lightweight" },
  { id: 2, name: "Khabib Nurmagomedov", nickname: "The Eagle", nationality: "Russia", height_inches: 70, reach_inches: 70, weight_lbs: 155, stance: "Orthodox", record_wins: 29, record_losses: 0, record_draws: 0, record_no_contests: 0, active: false, weight_class: "Lightweight" },
  { id: 3, name: "Jon Jones", nickname: "Bones", nationality: "USA", height_inches: 76, reach_inches: 84, weight_lbs: 248, stance: "Orthodox", record_wins: 27, record_losses: 1, record_draws: 0, record_no_contests: 1, active: true, weight_class: "Heavyweight" },
  { id: 4, name: "Israel Adesanya", nickname: "The Last Stylebender", nationality: "New Zealand", height_inches: 76, reach_inches: 80, weight_lbs: 185, stance: "Southpaw", record_wins: 24, record_losses: 3, record_draws: 0, record_no_contests: 0, active: true, weight_class: "Middleweight" },
  { id: 5, name: "Amanda Nunes", nickname: "The Lioness", nationality: "Brazil", height_inches: 68, reach_inches: 69, weight_lbs: 135, stance: "Orthodox", record_wins: 22, record_losses: 5, record_draws: 0, record_no_contests: 0, active: false, weight_class: "Bantamweight" },
  { id: 6, name: "Alexander Volkanovski", nickname: "The Great", nationality: "Australia", height_inches: 66, reach_inches: 71, weight_lbs: 145, stance: "Orthodox", record_wins: 26, record_losses: 4, record_draws: 0, record_no_contests: 0, active: true, weight_class: "Featherweight" },
  { id: 7, name: "Charles Oliveira", nickname: "Do Bronx", nationality: "Brazil", height_inches: 70, reach_inches: 74, weight_lbs: 155, stance: "Orthodox", record_wins: 34, record_losses: 10, record_draws: 0, record_no_contests: 1, active: true, weight_class: "Lightweight" },
  { id: 8, name: "Kamaru Usman", nickname: "The Nigerian Nightmare", nationality: "Nigeria", height_inches: 72, reach_inches: 76, weight_lbs: 170, stance: "Orthodox", record_wins: 20, record_losses: 4, record_draws: 0, record_no_contests: 0, active: true, weight_class: "Welterweight" },
  { id: 9, name: "Max Holloway", nickname: "Blessed", nationality: "USA", height_inches: 71, reach_inches: 69, weight_lbs: 145, stance: "Orthodox", record_wins: 25, record_losses: 7, record_draws: 0, record_no_contests: 0, active: true, weight_class: "Featherweight" },
  { id: 10, name: "Zhang Weili", nickname: "Magnum", nationality: "China", height_inches: 64, reach_inches: 63, weight_lbs: 115, stance: "Orthodox", record_wins: 24, record_losses: 3, record_draws: 0, record_no_contests: 0, active: true, weight_class: "Strawweight" },
];

export const FALLBACK_EVENTS: MmaEvent[] = [
  { id: 1, name: "UFC 310: Pantoja vs. Asakura", date: "2026-04-12", venue_name: "T-Mobile Arena", venue_city: "Las Vegas", venue_state: "NV", status: "upcoming", league: { id: 1, name: "Ultimate Fighting Championship", abbreviation: "UFC" } },
  { id: 2, name: "UFC Fight Night: Holloway vs. Allen", date: "2026-04-19", venue_name: "UFC APEX", venue_city: "Las Vegas", venue_state: "NV", status: "upcoming", league: { id: 1, name: "Ultimate Fighting Championship", abbreviation: "UFC" } },
  { id: 3, name: "UFC 311: Makhachev vs. Tsarukyan 2", date: "2026-04-26", venue_name: "Intuit Dome", venue_city: "Inglewood", venue_state: "CA", status: "upcoming", league: { id: 1, name: "Ultimate Fighting Championship", abbreviation: "UFC" } },
  { id: 4, name: "UFC Fight Night: Moreno vs. Royval 2", date: "2026-03-29", venue_name: "Mexico City Arena", venue_city: "Mexico City", venue_state: null, status: "completed", league: { id: 1, name: "Ultimate Fighting Championship", abbreviation: "UFC" } },
  { id: 5, name: "UFC 309: Jones vs. Miocic", date: "2026-03-15", venue_name: "Madison Square Garden", venue_city: "New York", venue_state: "NY", status: "completed", league: { id: 1, name: "Ultimate Fighting Championship", abbreviation: "UFC" } },
];
