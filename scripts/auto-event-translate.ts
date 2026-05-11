/**
 * 이벤트 이름을 fighters.full_name_ko 매핑 기반으로 자동 변환.
 * "UFC XXX: A vs. B" / "UFC Fight Night: A vs. B" 패턴 처리.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();
import { sql } from "drizzle-orm";
import { db } from "../src/db";

// 추가 라스트네임 → 한글 매핑 (이벤트 타이틀에서 성만 노출되는 경우)
const LAST_NAME_KO: Record<string, string> = {
  "Muhammad": "무함마드",
  "Della Maddalena": "델라 마달레나",
  "Makhachev": "마카체프",
  "Moicano": "모이카노",
  "Du Plessis": "두 플레시스",
  "Strickland": "스트릭랜드",
  "Pereira": "페레이라",
  "Ankalaev": "안칼라예프",
  "Volkanovski": "볼카노프스키",
  "Lopes": "로페스",
  "Dvalishvili": "드발리시빌리",
  "O'Malley": "오말리",
  "Topuria": "토푸리아",
  "Oliveira": "올리베이라",
  "Holloway": "할로웨이",
  "Poirier": "포이리에",
  "Chimaev": "치마예프",
  "Aspinall": "아스피널",
  "Gane": "간",
  "Sandhagen": "샌드해이건",
  "Prates": "프라치스",
  "Pantoja": "판토자",
  "Asakura": "아사쿠라",
  "Royval": "로이발",
  "Whittaker": "휘태커",
  "De Ridder": "데 리더",
  "Cannonier": "캐노니어",
  "Imavov": "이마보프",
  "Costa": "코스타",
  "Borralho": "보랄류",
  "Allen": "앨런",
  "Craig": "크레이그",
  "Hill": "힐",
  "Walker": "워커",
  "Magny": "매그니",
  "Garry": "개리",
  "Brady": "브래디",
  "Edwards": "에드워즈",
  "Covington": "코빙턴",
  "Burns": "번스",
  "Neal": "닐",
  "Ferguson": "퍼거슨",
  "Pimblett": "핌블렛",
  "Chandler": "챈들러",
  "Gaethje": "게이치",
  "Tsarukyan": "차루키안",
  "Hooker": "후커",
  "Fiziev": "피지에프",
  "Dariush": "다리우시",
  "Holland": "홀랜드",
  "Gamrot": "감롯",
  "Lemos": "레모스",
  "Suarez": "수아레스",
  "Esparza": "에스파르자",
  "Namajunas": "나마유나스",
  "Jandiroba": "잔디로바",
  "Dern": "던",
  "Andrade": "안드라데",
  "Xiaonan": "샤오난",
  "Weili": "웨이리",
  "Grasso": "그라소",
  "Shevchenko": "셰브첸코",
  "Fiorot": "피오로",
  "Blanchfield": "블랜치필드",
  "Pena": "페나",
  "Nunes": "누니스",
  "Aldana": "알다나",
  "Pennington": "페닝턴",
  "Vieira": "비에이라",
  "Cejudo": "세후도",
  "Yan": "얀",
  "Vera": "베라",
  "Font": "폰트",
  "Cruz": "크루즈",
  "Garbrandt": "가브랜트",
  "Sterling": "스털링",
  "Munhoz": "무뇨스",
  "Rodriguez": "로드리게스",
  "Lewis": "루이스",
  "Pavlovich": "파블로비치",
  "Tuivasa": "투이바사",
  "Volkov": "볼코프",
  "Rozenstruik": "로젠스트루이크",
  "Tybura": "티부라",
  "Spivac": "스피박",
  "Almeida": "알메이다",
  "Cortes-Acosta": "코르테스-아코스타",
  "Hardy": "하디",
  "Sherman": "셔먼",
  "Adams": "애덤스",
  "Ngannou": "응가누",
  "Miocic": "미오치치",
  "Velasquez": "벨라스케즈",
  "Werdum": "베르둠",
  "Cormier": "코미어",
  "Jones": "존스",
  "Bader": "베이더",
  "Reyes": "레예스",
  "Smith": "스미스",
  "Santos": "산토스",
  "Teixeira": "테세이라",
  "Prochazka": "프로하스카",
  "Rakic": "라키치",
  "Ulberg": "울버그",
  "Menifield": "메니필드",
  "Ribas": "리바스",
  "Fontes": "폰테스",
  "Sakai": "사카이",
  "Adesanya": "아데산야",
  "Vettori": "베토리",
  "The Korean Zombie": "코리안 좀비",
  "Ige": "이게",
  "McGregor": "맥그리거",
  "Moises": "모이세스",
  "Hall": "홀",
  "Gastelum": "가스텔룸",
  "Barboza": "바르보자",
  "Chikadze": "치카제",
  "Brunson": "브런슨",
  "Till": "틸",
  "Spann": "스팬",
  "Ortega": "오르테가",
  "Ladd": "래드",
  "Dumont": "두몬트",
  "Blachowicz": "블라호비치",
  "Usman": "우스만",
  "Tate": "테이트",
  "Aldo": "알도",
  "Daukaus": "다우카우스",
  "Kattar": "카타르",
  "Hermansson": "헤르만손",
  "Green": "그린",
  "Masvidal": "마스비달",
  "Blaydes": "블레이즈",
  "Luque": "루케",
  "Holm": "홈",
  "Procházka": "프로하스카",
  "Ferreira": "페헤이라",
  "Cyborg": "사이보그",
  "Rountree": "라운트리",
  "Dawson": "도슨",
  "Garcia": "가르시아",
  "Kara-France": "카라프랑스",
  "Albazi": "알바지",
  "Mokaev": "모카예프",
  "Almabayev": "알마바예프",
  "Pyfer": "파이퍼",
  "Hernandez": "에르난데스",
  "Miller": "밀러",
  "Wood": "우드",
  "Cifers": "사이퍼스",
  "Nicolau": "니콜라우",
  "Erceg": "에르체그",
  "Perez": "페레스",
  "Schnell": "슈넬",
  "Magomedov": "마고메도프",
  "Yusupov": "유수포프",
  "Jingliang": "징량",
  "Nuerdanbieke": "누르단비예케",
  "Wonderboy": "원더보이",
  "Thompson": "톰슨",
  "Anik": "아닉",
  "Means": "민스",
  "Brown": "브라운",
  "Jung": "정",
  "Choi": "최",
  "Kim": "김",
  "Lee": "리",
  "Saint Denis": "생드니",
  "Fialho": "피알류",
  "Dolidze": "돌리제",
  "Hadzovic": "하조비치",
  "Quarantillo": "콰란틸로",
  "Buckley": "버클리",
  "Hubbard": "허버드",
  "Tafa": "타파",
  "Dillashaw": "딜라쇼",
  "Emmett": "에밋",
  "Dos Anjos": "도스 안호스",
  "Peña": "페나",
  "Diaz": "디아즈",
  "Song": "송",
  "Araujo": "아라우조",
  "Nzechukwu": "느제추쿠",
  "Cutelaba": "쿠텔라바",
  "Muniz": "무니즈",
  "Simon": "사이먼",
  "Bueno Silva": "부에노 실바",
  "Yusuff": "유서프",
  "Gutierrez": "구티에레스",
  "Moreno": "모레노",
  "Gaziev": "가지에프",
  "Curtis": "커티스",
  "Nascimento": "나시멘토",
  "Taira": "타이라",
  "Aliskerov": "알리스케로프",
  "Cortez": "코르테스",
  "Nurmagomedov": "누르마고메도프",
  "Rountree Jr.": "라운트리 주니어",
  "Figueiredo": "피게이레두",
  "Rodrigues": "호드리게스",
  "Kape": "카페",
  "Tukhugov": "투쿠고프",
  "Lima": "리마",
  "Ricci": "리치",
  "Petrosyan": "페트로시안",
  "Stamann": "스타만",
  "Ware": "웨어",
  "Mitchell": "미첼",
  "Pico": "피코",
  "Erslan": "에르슬란",
  "Tabatabaee": "타바타바이",
  "Pichel": "피첼",
  "Maverick": "매버릭",
  "Sayles": "세일즈",
  "Cannetti": "카네티",
  "Pacio": "파시오",
  "Hyder": "하이더",
  "Henderson": "핸더슨",
  "Bahamondes": "바하몬데스",
  "Bachmier": "바흐미어",
  "Jacoby": "제이코비",
  "Anders": "앤더스",
  "Algeo": "알지오",
  "Murphy": "머피",
  "Morales": "모랄레스",
  "Barber": "바버",
  "Zhang": "장",
  "Onama": "오나마",
  "Bonfim": "본핌",
  "Bautista": "바티스타",
  "Kavanagh": "카바나",
  "Vallejos": "바예호스",
  "Evloev": "에블로예프",
  "Machado Garry": "마차도 개리",
  "de Ridder": "데 리더",
  "Park": "박",
  "Duncan": "던컨",
  "Malott": "맬럿",
  "Zalal": "잘랄",
};

function norm(s: string): string {
  return s.replace(/[\u2018\u2019]/g, "'").trim();
}

// "vs." / "vs" / "Vs" / "VS" / "versus" / "v." / "v" — 모두 허용
const VS_RX = String.raw`(?:vs\.?|versus|v\.?)`;

function translateTitle(name: string): string | null {
  // 특수 케이스: "UFC 306 – Riyadh Season Noche UFC: O'Malley vs. Dvalishvili"
  const sp = name.match(new RegExp(`^(UFC\\s+\\d+)\\s+[–-]\\s+(.+?):\\s*(.+?)\\s+${VS_RX}\\s+(.+?)\\s*(\\d+)?$`, "i"));
  if (sp) {
    const [, prefix, sub, a, b, suffix] = sp;
    const aKo = LAST_NAME_KO[norm(a)];
    const bKo = LAST_NAME_KO[norm(b)];
    if (aKo && bKo) {
      const subKo = sub
        .replace(/Riyadh\s+Season/i, "리야드 시즌")
        .replace(/Noche\s+UFC/i, "노체 UFC");
      return `${prefix} – ${subKo}: ${aKo} vs ${bKo}${suffix ? " " + suffix : ""}`;
    }
  }
  // 지원 prefix:
  //   UFC NNN
  //   UFC Fight Night [NNN]
  //   UFC Freedom NNN
  //   UFC on ESPN [NNN] / UFC on FOX [NNN] / UFC on ABC [NNN] (\w+\s+\d* 형태)
  const m = name.match(new RegExp(
    `^(UFC(?:\\s+\\d+|\\s+Fight\\s+Night(?:\\s+\\d+)?|\\s+Freedom\\s+\\d+)?(?:\\s+on\\s+\\w+(?:\\s+\\d+)?)?):\\s*(.+?)\\s+${VS_RX}\\s+(.+?)\\s*(\\d+)?$`,
    "i"
  ));
  if (!m) return null;
  const [, prefix, a, b, suffix] = m;
  const aKo = LAST_NAME_KO[norm(a)];
  const bKo = LAST_NAME_KO[norm(b)];
  if (!aKo || !bKo) return null;
  const prefixKo = prefix
    .replace(/UFC\s+Fight\s+Night(\s+\d+)?/i, (_, n) => `UFC 파이트 나이트${n ?? ""}`)
    .replace(/UFC\s+Freedom\s+(\d+)/i, (_, n) => `UFC 프리덤 ${n}`)
    .replace(/^UFC(\s+\d+)$/i, (_, n) => `UFC${n}`);
  return `${prefixKo}: ${aKo} vs ${bKo}${suffix ? " " + suffix : ""}`;
}

async function run() {
  const rows = await db.execute(sql`
    SELECT id, name, name_ko FROM events
    WHERE name ILIKE 'UFC%'
      AND (name ILIKE '%vs%' OR name ILIKE '%versus%' OR name ~* '\\sv\\.?\\s')
      AND (name_ko = name OR name_ko ILIKE '%vs%' OR name_ko LIKE '%대%')
    ORDER BY id DESC LIMIT 500
  `);
  let updated = 0;
  const unmapped: { id: number; name: string }[] = [];
  const rs = ((rows as unknown as { rows?: unknown[] }).rows ?? rows) as { id: number; name: string; name_ko: string }[];
  for (const r of rs) {
    const t = translateTitle(r.name);
    if (!t) {
      unmapped.push({ id: r.id, name: r.name });
      continue;
    }
    if (t === r.name_ko) continue;
    await db.execute(sql`UPDATE events SET name_ko = ${t} WHERE id = ${r.id}`);
    console.log(`✓ ${r.name} → ${t}`);
    updated++;
  }
  console.log(`\n갱신 ${updated}건. 매핑 실패 ${unmapped.length}건:`);
  unmapped.slice(0, 30).forEach(u => console.log(`  · ${u.name}`));
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
