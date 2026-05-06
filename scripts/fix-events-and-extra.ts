import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db";
import { fighters, mmaEvents } from "../src/db/schema";

// 추가 선수 매핑 (피드백 / 누락)
const EXTRA_FIGHTERS: Record<string, string> = {
  "Carlos Prates": "카를루스 프라치스",
  "Jack Della Maddalena": "잭 델라 마달레나",
  "Geraldo de Freitas": "제랄도 데 프레이타스",
  "Rafael Freitas": "하파엘 프레이타스",
  "Ali Mohammad Reza": "알리 모하마드 레자",
  "Andre Amado": "안드레 아마도",
};

// 이벤트 이름 한글 표기 (UFC vs 패턴 — "대" 대신 "vs" 사용)
const EVENT_MAP: Record<string, string> = {
  "UFC 315: Muhammad vs. Della Maddalena": "UFC 315: 무함마드 vs 델라 마달레나",
  "UFC 322: Della Maddalena vs. Makhachev": "UFC 322: 델라 마달레나 vs 마카체프",
  "UFC Fight Night: Della Maddalena vs. Prates": "UFC 파이트 나이트: 델라 마달레나 vs 프라치스",
  "UFC 311: Makhachev vs. Moicano": "UFC 311: 마카체프 vs 모이카노",
  "UFC 312: Du Plessis vs. Strickland 2": "UFC 312: 두 플레시스 vs 스트릭랜드 2",
  "UFC 313: Pereira vs. Ankalaev": "UFC 313: 페레이라 vs 안칼라예프",
  "UFC 314: Volkanovski vs. Lopes": "UFC 314: 볼카노프스키 vs 로페스",
  "UFC 316: Dvalishvili vs. O'Malley 2": "UFC 316: 드발리시빌리 vs 오말리 2",
  "UFC 317: Topuria vs. Oliveira": "UFC 317: 토푸리아 vs 올리베이라",
  "UFC 318: Holloway vs. Poirier 3": "UFC 318: 할로웨이 vs 포이리에 3",
  "UFC 319: Du Plessis vs. Chimaev": "UFC 319: 두 플레시스 vs 치마예프",
  "UFC 320: Ankalaev vs. Pereira 2": "UFC 320: 안칼라예프 vs 페레이라 2",
  "UFC 321: Aspinall vs. Gane": "UFC 321: 아스피널 vs 간",
  "UFC 323: Dvalishvili vs. Sandhagen": "UFC 323: 드발리시빌리 vs 샌드해이건",
};

async function run() {
  let f = 0, e = 0, skip = 0;

  for (const [en, ko] of Object.entries(EXTRA_FIGHTERS)) {
    const r = await db
      .update(fighters)
      .set({ fullNameKo: ko })
      .where(eq(fighters.fullName, en))
      .returning({ id: fighters.id });
    if (r.length) { f += r.length; console.log(`✓ fighter ${en} → ${ko}`); }
    else { skip++; console.log(`· skip fighter ${en}`); }
  }

  for (const [en, ko] of Object.entries(EVENT_MAP)) {
    const r = await db
      .update(mmaEvents)
      .set({ nameKo: ko })
      .where(eq(mmaEvents.name, en))
      .returning({ id: mmaEvents.id });
    if (r.length) { e += r.length; console.log(`✓ event ${en} → ${ko}`); }
    else { skip++; console.log(`· skip event ${en}`); }
  }

  // venue 한글 (가장 자주 노출되는 곳)
  const venueMap: Record<string, string> = {
    "T-Mobile Arena, Las Vegas, NV": "T-모바일 아레나, 라스베이거스",
    "UFC Apex, Las Vegas, NV": "UFC 에이펙스, 라스베이거스",
    "Bell Centre, Montreal, PQ": "벨 센터, 몬트리올",
    "Madison Square Garden, New York, NY": "매디슨 스퀘어 가든, 뉴욕",
    "RAC Arena (AUS), Perth, WA": "RAC 아레나, 퍼스",
    "Etihad Arena, Abu Dhabi": "에티하드 아레나, 아부다비",
    "Honda Center, Anaheim, CA": "혼다 센터, 애너하임",
    "Kaseya Center, Miami, FL": "카세야 센터, 마이애미",
    "Intuit Dome, Inglewood, CA": "인튜이트 돔, 잉글우드",
    "O2 Arena, London": "O2 아레나, 런던",
    "Accor Arena, Paris": "아코르 아레나, 파리",
  };
  let v = 0;
  for (const [en, ko] of Object.entries(venueMap)) {
    const r = await db.execute(sql`
      UPDATE events SET venue_ko = ${ko} WHERE venue = ${en}
      RETURNING id
    `);
    const cnt = (((r as unknown as { rows?: unknown[] }).rows ?? r) as unknown[]).length;
    v += cnt;
    if (cnt) console.log(`✓ venue ${en} → ${ko} (${cnt}건)`);
  }

  console.log(`\nfighters ${f}건, events ${e}건, venues ${v}건, skipped ${skip}건`);
  process.exit(0);
}
run().catch((err) => { console.error(err); process.exit(1); });
