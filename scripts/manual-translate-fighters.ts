/**
 * 수기 번역 매핑 — 팬들이 아는 한국어 표기로 fighters.full_name_ko 일괄 갱신.
 * 실행: pnpm tsx scripts/manual-translate-fighters.ts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { fighters } from "../src/db/schema";

// 영문 fullName → 한국어 표기 (팬 통용 표기 우선)
const NAME_MAP: Record<string, string> = {
  // ── UFC GOAT/탑 랭커 ──
  "Conor McGregor": "코너 맥그리거",
  "Khabib Nurmagomedov": "하빕 누르마고메도프",
  "Jon Jones": "존 존스",
  "Anderson Silva": "앤더슨 실바",
  "Georges St-Pierre": "조르주 생피에르",
  "Israel Adesanya": "이스라엘 아데산야",
  "Kamaru Usman": "카마루 우스만",
  "Francis Ngannou": "프랜시스 응가누",
  "Stipe Miocic": "스티페 미오치치",
  "Daniel Cormier": "다니엘 코미어",
  "Brock Lesnar": "브록 레스너",
  "Cain Velasquez": "케인 벨라스케즈",
  "Fedor Emelianenko": "표도르 예멜리야넨코",
  "Demetrious Johnson": "디미트리어스 존슨",
  "Henry Cejudo": "헨리 세후도",
  "Dustin Poirier": "더스틴 포이리에",
  "Justin Gaethje": "저스틴 게이치",
  "Charles Oliveira": "찰스 올리베이라",
  "Islam Makhachev": "이슬람 마카체프",
  "Max Holloway": "맥스 할로웨이",
  "Alexander Volkanovski": "알렉산더 볼카노프스키",
  "Tony Ferguson": "토니 퍼거슨",
  "Nate Diaz": "네이트 디아즈",
  "Nick Diaz": "닉 디아즈",
  "Donald Cerrone": "도날드 세로니",
  "Jose Aldo": "조제 알도",
  "TJ Dillashaw": "TJ 딜라쇼",
  "Dominick Cruz": "도미닉 크루즈",
  "Sean O'Malley": "션 오말리",
  "Aljamain Sterling": "알자메인 스털링",
  "Marlon Vera": "말론 베라",
  "Cory Sandhagen": "코리 샌드해이건",
  "Petr Yan": "페트르 얀",
  "Merab Dvalishvili": "메랍 드발리시빌리",
  "Robert Whittaker": "로버트 휘태커",
  "Yoel Romero": "요엘 로메로",
  "Luke Rockhold": "루크 록홀드",
  "Chris Weidman": "크리스 와이드먼",
  "Michael Bisping": "마이클 비스핑",
  "Vitor Belfort": "비토르 벨포트",
  "Wanderlei Silva": "완덜레이 실바",
  "Mauricio Rua": "마우리시오 후아",
  "Lyoto Machida": "료토 마치다",
  "Forrest Griffin": "포레스트 그리핀",
  "Tito Ortiz": "티토 오티즈",
  "Chuck Liddell": "척 리델",
  "Quinton Jackson": "퀸튼 잭슨",
  "Rampage Jackson": "램페이지 잭슨",
  "Rashad Evans": "래쇼드 에반스",
  "Glover Teixeira": "글로버 테세이라",
  "Jiri Prochazka": "이리 프로하스카",
  "Jamahal Hill": "자말 힐",
  "Magomed Ankalaev": "마고메드 안칼라예프",
  "Alex Pereira": "알렉스 페레이라",
  "Sean Strickland": "션 스트릭랜드",
  "Dricus Du Plessis": "드리커스 두 플레시스",
  "Khamzat Chimaev": "함자트 치마예프",
  "Belal Muhammad": "벨랄 무함마드",
  "Leon Edwards": "레온 에드워즈",
  "Colby Covington": "콜비 코빙턴",
  "Jorge Masvidal": "호르헤 마스비달",
  "Stephen Thompson": "스티븐 톰슨",
  "Tyron Woodley": "타이론 우들리",
  "Robbie Lawler": "로비 롤러",
  "Carlos Condit": "카를로스 콘딧",
  "Anthony Pettis": "앤서니 페티스",
  "Rafael Dos Anjos": "하파엘 도스 안호스",
  "Eddie Alvarez": "에디 알바레즈",
  "Frankie Edgar": "프랭키 에드가",
  "Benson Henderson": "벤슨 핸더슨",
  "Gilbert Melendez": "길버트 멜렌데즈",
  "B.J. Penn": "BJ 펜",
  "BJ Penn": "BJ 펜",
  "Matt Hughes": "맷 휴즈",
  "Randy Couture": "랜디 커처",
  "Mark Hunt": "마크 헌트",
  "Junior Dos Santos": "주니오르 도스 산토스",
  "Curtis Blaydes": "커티스 블레이즈",
  "Derrick Lewis": "데릭 루이스",
  "Tom Aspinall": "톰 아스피널",
  "Sergei Pavlovich": "세르게이 파블로비치",
  "Ciryl Gane": "시릴 간",
  "Tai Tuivasa": "타이 투이바사",
  "Chael Sonnen": "채일 소넨",
  "Royce Gracie": "호이스 그레이시",
  "Mark Coleman": "마크 콜먼",
  "Don Frye": "돈 프라이",
  "Fabricio Werdum": "파브리시오 베르둠",
  "Antonio Rodrigo Nogueira": "안토니오 호드리고 노게이라",
  "Antonio Rogerio Nogueira": "안토니오 호제리오 노게이라",
  "Bas Rutten": "바스 루튼",
  "Ken Shamrock": "켄 샴록",
  "Frank Shamrock": "프랭크 샴록",
  "Tito Belfort": "티토 벨포트",
  "Rich Franklin": "리치 프랭클린",
  "Kenny Florian": "케니 플로리언",
  "Diego Sanchez": "디에고 산체스",
  "Joe Lauzon": "조 라우즌",
  "Jim Miller": "짐 밀러",
  "Yair Rodriguez": "야이르 로드리게스",
  "Brian Ortega": "브라이언 오르테가",
  "Korean Zombie": "코리안 좀비",
  "Chan Sung Jung": "정찬성",

  // ── 여성 ──
  "Ronda Rousey": "론다 로우지",
  "Amanda Nunes": "아만다 누니스",
  "Valentina Shevchenko": "발렌티나 셰브첸코",
  "Joanna Jedrzejczyk": "요안나 옌제이치크",
  "Holly Holm": "홀리 홈",
  "Cris Cyborg": "크리스 사이보그",
  "Cristiane Justino": "크리스 사이보그",
  "Miesha Tate": "미샤 테이트",
  "Rose Namajunas": "로즈 나마유나스",
  "Zhang Weili": "장 웨이리",
  "Carla Esparza": "칼라 에스파르자",
  "Mackenzie Dern": "매켄지 던",
  "Tatiana Suarez": "타티아나 수아레스",
  "Marina Rodriguez": "마리나 호드리게스",
  "Yan Xiaonan": "얀 샤오난",
  "Tecia Torres": "테시아 토레스",
  "Jessica Andrade": "제시카 안드라데",
  "Karolina Kowalkiewicz": "카롤리나 코발키예비치",
  "Polyana Viana": "폴리아나 비아나",
  "Virna Jandiroba": "비르나 잔디로바",
  "Erin Blanchfield": "에린 블랜치필드",
  "Manon Fiorot": "마농 피오로",
  "Maycee Barber": "메이시 바버",
  "Katlyn Chookagian": "캐틀린 추카기언",
  "Jessica Eye": "제시카 아이",
  "Taila Santos": "타일라 산토스",
  "Alexa Grasso": "알렉사 그라소",
  "Julianna Pena": "줄리아나 페나",
  "Ketlen Vieira": "케틀렌 비에이라",
  "Raquel Pennington": "라켈 페닝턴",
  "Irene Aldana": "아이린 알다나",

  // ── 한국 파이터 ──
  "Dong Hyun Kim": "김동현",
  "Doo Ho Choi": "최두호",
  "Beneil Dariush": "베닐 다리우시",
  "Awesol Kwon": "권아솔",
  "Da Woon Jung": "정다운",
  "Hyun Gyu Lim": "임현규",
  "Sung Jong Lee": "이성종",
  "Kyung Ho Kang": "강경호",
  "Seung Woo Choi": "최승우",

  // ── PFL/Bellator/ONE ──
  "Patricio Pitbull": "파트리시오 피트불",
  "Patricky Pitbull": "파트리키 피트불",
  "Michael Chandler": "마이클 챈들러",
  "Douglas Lima": "더글라스 리마",
  "Rory MacDonald": "로리 맥도널드",
  "AJ McKee": "AJ 맥키",
  "Ryan Bader": "라이언 베이더",
  "Christian Lee": "크리스천 리",
  "Eduard Folayang": "에두아드 폴라양",

  // ── 기타 자주 노출 ──
  "Gleison Tibau": "글레이손 티바우",
  "Joseph Benavidez": "조셉 베나비데즈",
  "John Dodson": "존 도드슨",
  "Brandon Moreno": "브랜든 모레노",
  "Deiveson Figueiredo": "데이베손 피게이레두",
  "Brandon Royval": "브랜든 로이발",
  "Alexandre Pantoja": "알렉산드레 판토자",
  "Kai Kara-France": "카이 카라프랑스",
  "Cody Garbrandt": "코디 가브랜트",
  "Raphael Assuncao": "하파엘 아순상",
  "Bryan Caraway": "브라이언 캐러웨이",
  "Renan Barao": "헤난 바라오",
  "Urijah Faber": "유라이아 페이버",
  "Frankie Saenz": "프랭키 사엔즈",
  "Marlon Moraes": "말론 모라이스",
  "Pedro Munhoz": "페드로 무뇨스",
  "Rob Font": "롭 폰트",
  "Jose Caceres": "호세 카세레스",
  "Yves Edwards": "이브 에드워즈",
  "Vinicius Castro": "비니시우스 카스트로",
  "Dan Severn": "댄 세번",
  "Jeremy Horn": "제레미 혼",
  "Travis Fulton": "트래비스 풀턴",
  "Travis Wiuff": "트래비스 위프",
  "Luis Santos": "루이스 산토스",
  "Ben Rothwell": "벤 로스웰",
  "Alexander Volkov": "알렉산더 볼코프",
  "Alexey Oleinik": "알렉세이 올레이닉",
  "Alistair Overeem": "알리스테어 오버임",
  "Antoni Hardonk": "안토니 하르동크",
  "Andrei Arlovski": "안드레이 아를롭스키",
  "Tim Sylvia": "팀 실비아",
  "Pat Barry": "팻 배리",
  "Roy Nelson": "로이 넬슨",
  "Shane Carwin": "셰인 카윈",
  "Frank Mir": "프랭크 미어",

  // ── 마달레나 vs 프레이츠 (피드백) ──
  // 정확한 영문명 미상 — 탐색 후 확정 필요. 임시 후보:
  "Maddalena Quaglia": "마달레나 콸리아",
};

async function run() {
  let updated = 0;
  let skipped = 0;
  for (const [enName, koName] of Object.entries(NAME_MAP)) {
    const rows = await db
      .update(fighters)
      .set({ fullNameKo: koName })
      .where(eq(fighters.fullName, enName))
      .returning({ id: fighters.id, fullName: fighters.fullName });
    if (rows.length > 0) {
      updated += rows.length;
      console.log(`✓ ${enName} → ${koName} (${rows.length}건)`);
    } else {
      skipped += 1;
      console.log(`· skip ${enName} (DB 미존재)`);
    }
  }
  console.log(`\n갱신 ${updated}건, 미존재 ${skipped}건`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
