/** 목 데이터 — 실제 DB 연결 전 시뮬레이션용 */

export interface MockCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  totalVotes: number;
  personCount: number;
}

export interface MockPerson {
  id: number;
  categoryId: number;
  name: string;
  photoUrl: string;
  nationality: string;
  description: string;
  voteCount: number;
}

export const mockCategories: MockCategory[] = [
  {
    id: 1,
    name: "최고의 축구선수",
    slug: "best-football-player",
    description: "역대 최고의 축구선수는 누구인가? 당신의 한 표가 결정합니다.",
    thumbnailUrl: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&h=300&fit=crop",
    totalVotes: 45_832,
    personCount: 10,
  },
  {
    id: 2,
    name: "K-POP 최고의 보이그룹",
    slug: "best-kpop-boygroup",
    description: "전 세계를 사로잡은 K-POP 보이그룹, 당신의 원픽은?",
    thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    totalVotes: 128_491,
    personCount: 10,
  },
  {
    id: 3,
    name: "할리우드 레전드 배우",
    slug: "hollywood-legend-actors",
    description: "은막을 빛낸 전설적인 배우들, 최고의 배우에게 투표하세요.",
    thumbnailUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop",
    totalVotes: 67_215,
    personCount: 10,
  },
  {
    id: 4,
    name: "최고의 NBA 선수",
    slug: "best-nba-player",
    description: "농구 역사상 가장 위대한 선수는? GOAT 논쟁에 참여하세요.",
    thumbnailUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop",
    totalVotes: 34_102,
    personCount: 10,
  },
  {
    id: 5,
    name: "K-드라마 베스트 배우",
    slug: "best-kdrama-actor",
    description: "안방극장을 사로잡은 최고의 한국 배우를 뽑아주세요.",
    thumbnailUrl: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=300&fit=crop",
    totalVotes: 52_340,
    personCount: 10,
  },
  {
    id: 6,
    name: "세계 최고의 셰프",
    slug: "best-world-chef",
    description: "미식의 세계를 이끄는 최고의 셰프에게 투표하세요.",
    thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop",
    totalVotes: 18_764,
    personCount: 10,
  },
  {
    id: 7,
    name: "IT 업계 레전드",
    slug: "it-industry-legends",
    description: "기술의 역사를 바꾼 IT 거인들, 가장 영향력 있는 인물은?",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop",
    totalVotes: 29_887,
    personCount: 10,
  },
  {
    id: 8,
    name: "K-POP 최고의 걸그룹",
    slug: "best-kpop-girlgroup",
    description: "글로벌 무대를 점령한 걸그룹, 최고의 그룹은?",
    thumbnailUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
    totalVotes: 142_103,
    personCount: 10,
  },
  {
    id: 9,
    name: "2024 올해의 영화",
    slug: "best-movie-2024",
    description: "올해 가장 기억에 남는 영화에 투표하세요.",
    thumbnailUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=300&fit=crop",
    totalVotes: 21_456,
    personCount: 10,
  },
];

/** 카테고리별 인물 목 데이터 */
const personsByCategory: Record<string, MockPerson[]> = {
  "best-football-player": [
    { id: 1, categoryId: 1, name: "리오넬 메시", photoUrl: "", nationality: "아르헨티나", description: "역대 최다 발롱도르 수상자", voteCount: 12_450 },
    { id: 2, categoryId: 1, name: "크리스티아누 호날두", photoUrl: "", nationality: "포르투갈", description: "통산 최다 골 기록 보유자", voteCount: 11_200 },
    { id: 3, categoryId: 1, name: "네이마르", photoUrl: "", nationality: "브라질", description: "브라질의 간판 스타", voteCount: 5_300 },
    { id: 4, categoryId: 1, name: "킬리안 음바페", photoUrl: "", nationality: "프랑스", description: "차세대 축구 황제", voteCount: 4_800 },
    { id: 5, categoryId: 1, name: "엘링 홀란드", photoUrl: "", nationality: "노르웨이", description: "골 머신", voteCount: 3_900 },
    { id: 6, categoryId: 1, name: "펠레", photoUrl: "", nationality: "브라질", description: "축구의 왕", voteCount: 2_800 },
    { id: 7, categoryId: 1, name: "디에고 마라도나", photoUrl: "", nationality: "아르헨티나", description: "신의 손", voteCount: 2_200 },
    { id: 8, categoryId: 1, name: "지네딘 지단", photoUrl: "", nationality: "프랑스", description: "우아한 플레이메이커", voteCount: 1_500 },
    { id: 9, categoryId: 1, name: "로나우지뉴", photoUrl: "", nationality: "브라질", description: "즐거운 축구의 대명사", voteCount: 1_100 },
    { id: 10, categoryId: 1, name: "손흥민", photoUrl: "", nationality: "대한민국", description: "아시아 최고의 공격수", voteCount: 582 },
  ],
  "best-kpop-boygroup": [
    { id: 11, categoryId: 2, name: "BTS", photoUrl: "", nationality: "대한민국", description: "글로벌 K-POP 아이콘", voteCount: 45_200 },
    { id: 12, categoryId: 2, name: "Stray Kids", photoUrl: "", nationality: "대한민국", description: "자체 프로듀싱 그룹", voteCount: 22_100 },
    { id: 13, categoryId: 2, name: "SEVENTEEN", photoUrl: "", nationality: "대한민국", description: "자체 제작 아이돌", voteCount: 18_500 },
    { id: 14, categoryId: 2, name: "NCT", photoUrl: "", nationality: "대한민국", description: "무한 확장 유닛 시스템", voteCount: 12_300 },
    { id: 15, categoryId: 2, name: "TXT", photoUrl: "", nationality: "대한민국", description: "4세대 대표 그룹", voteCount: 9_800 },
    { id: 16, categoryId: 2, name: "ATEEZ", photoUrl: "", nationality: "대한민국", description: "퍼포먼스 강자", voteCount: 7_200 },
    { id: 17, categoryId: 2, name: "ENHYPEN", photoUrl: "", nationality: "대한민국", description: "글로벌 신예", voteCount: 5_600 },
    { id: 18, categoryId: 2, name: "EXO", photoUrl: "", nationality: "대한민국", description: "3세대 레전드", voteCount: 4_291 },
    { id: 19, categoryId: 2, name: "BIGBANG", photoUrl: "", nationality: "대한민국", description: "K-POP의 시작", voteCount: 2_000 },
    { id: 20, categoryId: 2, name: "SHINee", photoUrl: "", nationality: "대한민국", description: "아이돌의 아이돌", voteCount: 1_491 },
  ],
  "hollywood-legend-actors": [
    { id: 21, categoryId: 3, name: "레오나르도 디카프리오", photoUrl: "", nationality: "미국", description: "타이타닉부터 오스카까지, 할리우드의 전설", voteCount: 15_800 },
    { id: 22, categoryId: 3, name: "톰 행크스", photoUrl: "", nationality: "미국", description: "미국의 국민 배우, 연기의 교과서", voteCount: 12_400 },
    { id: 23, categoryId: 3, name: "로버트 다우니 주니어", photoUrl: "", nationality: "미국", description: "아이언맨 그 자체", voteCount: 11_200 },
    { id: 24, categoryId: 3, name: "브래드 피트", photoUrl: "", nationality: "미국", description: "할리우드 황금기의 아이콘", voteCount: 7_300 },
    { id: 25, categoryId: 3, name: "조니 뎁", photoUrl: "", nationality: "미국", description: "카멜레온 같은 변신의 귀재", voteCount: 5_900 },
    { id: 26, categoryId: 3, name: "모건 프리먼", photoUrl: "", nationality: "미국", description: "신의 목소리를 가진 배우", voteCount: 4_600 },
    { id: 27, categoryId: 3, name: "알 파치노", photoUrl: "", nationality: "미국", description: "대부의 마이클 콜레오네", voteCount: 3_800 },
    { id: 28, categoryId: 3, name: "덴젤 워싱턴", photoUrl: "", nationality: "미국", description: "할리우드 최고의 연기파 배우", voteCount: 2_900 },
    { id: 29, categoryId: 3, name: "키아누 리브스", photoUrl: "", nationality: "캐나다", description: "매트릭스의 네오, 할리우드의 착한 남자", voteCount: 1_815 },
    { id: 30, categoryId: 3, name: "윌 스미스", photoUrl: "", nationality: "미국", description: "액션과 코미디를 넘나드는 스타", voteCount: 1_500 },
  ],
  "best-nba-player": [
    { id: 31, categoryId: 4, name: "마이클 조던", photoUrl: "", nationality: "미국", description: "농구의 신, 6회 NBA 챔피언", voteCount: 9_800 },
    { id: 32, categoryId: 4, name: "르브론 제임스", photoUrl: "", nationality: "미국", description: "역대 최다 득점왕, 킹 제임스", voteCount: 8_200 },
    { id: 33, categoryId: 4, name: "스테판 커리", photoUrl: "", nationality: "미국", description: "3점슛 혁명의 주인공", voteCount: 5_400 },
    { id: 34, categoryId: 4, name: "코비 브라이언트", photoUrl: "", nationality: "미국", description: "맘바 멘탈리티의 전설", voteCount: 4_100 },
    { id: 35, categoryId: 4, name: "매직 존슨", photoUrl: "", nationality: "미국", description: "쇼타임 레이커스의 마법사", voteCount: 2_200 },
    { id: 36, categoryId: 4, name: "래리 버드", photoUrl: "", nationality: "미국", description: "보스턴의 전설, 래리 레전드", voteCount: 1_500 },
    { id: 37, categoryId: 4, name: "샤킬 오닐", photoUrl: "", nationality: "미국", description: "역대 최강 센터", voteCount: 1_200 },
    { id: 38, categoryId: 4, name: "팀 던컨", photoUrl: "", nationality: "미국", description: "빅 펀더멘탈, 조용한 리더", voteCount: 800 },
    { id: 39, categoryId: 4, name: "케빈 듀란트", photoUrl: "", nationality: "미국", description: "스코어링 머신", voteCount: 550 },
    { id: 40, categoryId: 4, name: "야니스 아데토쿤보", photoUrl: "", nationality: "그리스", description: "그릭 프릭, 현역 최강자", voteCount: 352 },
  ],
  "best-kdrama-actor": [
    { id: 41, categoryId: 5, name: "이병헌", photoUrl: "", nationality: "대한민국", description: "한국 영화계의 카멜레온", voteCount: 12_100 },
    { id: 42, categoryId: 5, name: "송강호", photoUrl: "", nationality: "대한민국", description: "기생충의 주인공, 국민 배우", voteCount: 10_500 },
    { id: 43, categoryId: 5, name: "이정재", photoUrl: "", nationality: "대한민국", description: "오징어 게임으로 세계를 사로잡다", voteCount: 8_900 },
    { id: 44, categoryId: 5, name: "마동석", photoUrl: "", nationality: "대한민국", description: "주먹이 곧 정의, 범죄도시의 히어로", voteCount: 6_800 },
    { id: 45, categoryId: 5, name: "현빈", photoUrl: "", nationality: "대한민국", description: "사랑의 불시착, 한류 톱스타", voteCount: 5_200 },
    { id: 46, categoryId: 5, name: "공유", photoUrl: "", nationality: "대한민국", description: "도깨비, 한류의 아이콘", voteCount: 3_800 },
    { id: 47, categoryId: 5, name: "박서준", photoUrl: "", nationality: "대한민국", description: "로맨스부터 액션까지", voteCount: 2_400 },
    { id: 48, categoryId: 5, name: "송중기", photoUrl: "", nationality: "대한민국", description: "태양의 후예, 국민 남편", voteCount: 1_500 },
    { id: 49, categoryId: 5, name: "이도현", photoUrl: "", nationality: "대한민국", description: "차세대 연기파 배우", voteCount: 740 },
    { id: 50, categoryId: 5, name: "변우석", photoUrl: "", nationality: "대한민국", description: "선재 업고 튀어로 떠오른 신예", voteCount: 400 },
  ],
  "best-world-chef": [
    { id: 61, categoryId: 6, name: "백종원", photoUrl: "", nationality: "대한민국", description: "한국의 국민 셰프, 요리연구가", voteCount: 5_800 },
    { id: 62, categoryId: 6, name: "고든 램지", photoUrl: "", nationality: "영국", description: "헬스 키친의 전설, 미슐랭 스타 셰프", voteCount: 4_200 },
    { id: 63, categoryId: 6, name: "마시모 보투라", photoUrl: "", nationality: "이탈리아", description: "세계 최고의 레스토랑 오스테리아 프란체스카나", voteCount: 2_100 },
    { id: 64, categoryId: 6, name: "르네 레드제피", photoUrl: "", nationality: "덴마크", description: "노마의 창시자, 뉴 노르딕 퀴진의 선구자", voteCount: 1_800 },
    { id: 65, categoryId: 6, name: "조엘 로뷔숑", photoUrl: "", nationality: "프랑스", description: "역대 최다 미슐랭 스타 보유 셰프", voteCount: 1_400 },
    { id: 66, categoryId: 6, name: "이연복", photoUrl: "", nationality: "대한민국", description: "한국 중식의 대가", voteCount: 1_200 },
    { id: 67, categoryId: 6, name: "제이미 올리버", photoUrl: "", nationality: "영국", description: "건강한 요리의 전도사", voteCount: 980 },
    { id: 68, categoryId: 6, name: "앨리스 워터스", photoUrl: "", nationality: "미국", description: "팜투테이블 운동의 어머니", voteCount: 620 },
    { id: 69, categoryId: 6, name: "최현석", photoUrl: "", nationality: "대한민국", description: "냉장고를 부탁해의 스타 셰프", voteCount: 400 },
    { id: 70, categoryId: 6, name: "에메릴 라가시", photoUrl: "", nationality: "미국", description: "BAM! 크레올 퀴진의 마스터", voteCount: 264 },
  ],
  "it-industry-legends": [
    { id: 71, categoryId: 7, name: "스티브 잡스", photoUrl: "", nationality: "미국", description: "애플의 창업자, 혁신의 아이콘", voteCount: 8_200 },
    { id: 72, categoryId: 7, name: "일론 머스크", photoUrl: "", nationality: "미국", description: "테슬라, 스페이스X의 CEO", voteCount: 6_500 },
    { id: 73, categoryId: 7, name: "빌 게이츠", photoUrl: "", nationality: "미국", description: "마이크로소프트 창업자, 자선사업가", voteCount: 4_800 },
    { id: 74, categoryId: 7, name: "마크 저커버그", photoUrl: "", nationality: "미국", description: "페이스북(메타)의 창업자", voteCount: 3_200 },
    { id: 75, categoryId: 7, name: "제프 베이조스", photoUrl: "", nationality: "미국", description: "아마존의 창업자", voteCount: 2_400 },
    { id: 76, categoryId: 7, name: "젠슨 황", photoUrl: "", nationality: "미국", description: "엔비디아 CEO, AI 칩의 황제", voteCount: 1_900 },
    { id: 77, categoryId: 7, name: "팀 쿡", photoUrl: "", nationality: "미국", description: "애플의 현 CEO", voteCount: 1_200 },
    { id: 78, categoryId: 7, name: "사티아 나델라", photoUrl: "", nationality: "인도", description: "마이크로소프트 CEO, 클라우드 혁신가", voteCount: 800 },
    { id: 79, categoryId: 7, name: "리누스 토르발스", photoUrl: "", nationality: "핀란드", description: "리눅스 커널의 창시자", voteCount: 537 },
    { id: 80, categoryId: 7, name: "샘 알트먼", photoUrl: "", nationality: "미국", description: "OpenAI CEO, AI 시대의 선두주자", voteCount: 350 },
  ],
  "best-kpop-girlgroup": [
    { id: 51, categoryId: 8, name: "BLACKPINK", photoUrl: "", nationality: "대한민국", description: "글로벌 걸그룹의 정점", voteCount: 48_300 },
    { id: 52, categoryId: 8, name: "aespa", photoUrl: "", nationality: "대한민국", description: "메타버스 걸그룹", voteCount: 25_100 },
    { id: 53, categoryId: 8, name: "NewJeans", photoUrl: "", nationality: "대한민국", description: "Y2K 감성의 아이콘", voteCount: 22_800 },
    { id: 54, categoryId: 8, name: "IVE", photoUrl: "", nationality: "대한민국", description: "4세대 대표 걸그룹", voteCount: 15_200 },
    { id: 55, categoryId: 8, name: "LE SSERAFIM", photoUrl: "", nationality: "대한민국", description: "퍼포먼스의 완성", voteCount: 10_400 },
    { id: 56, categoryId: 8, name: "TWICE", photoUrl: "", nationality: "대한민국", description: "국민 걸그룹", voteCount: 8_100 },
    { id: 57, categoryId: 8, name: "(G)I-DLE", photoUrl: "", nationality: "대한민국", description: "자체 프로듀싱", voteCount: 5_200 },
    { id: 58, categoryId: 8, name: "ITZY", photoUrl: "", nationality: "대한민국", description: "에너지 넘치는 퍼포먼스", voteCount: 3_803 },
    { id: 59, categoryId: 8, name: "Red Velvet", photoUrl: "", nationality: "대한민국", description: "레드와 벨벳의 조화", voteCount: 2_100 },
    { id: 60, categoryId: 8, name: "MAMAMOO", photoUrl: "", nationality: "대한민국", description: "실력파 걸그룹", voteCount: 1_100 },
  ],
  "best-movie-2024": [
    { id: 81, categoryId: 9, name: "듄: 파트 2", photoUrl: "", nationality: "미국", description: "드니 빌뇌브 감독의 SF 대서사시", voteCount: 5_200 },
    { id: 82, categoryId: 9, name: "인사이드 아웃 2", photoUrl: "", nationality: "미국", description: "픽사의 감정 탐험 속편", voteCount: 4_800 },
    { id: 83, categoryId: 9, name: "데드풀과 울버린", photoUrl: "", nationality: "미국", description: "마블의 R등급 히어로 콤비", voteCount: 3_600 },
    { id: 84, categoryId: 9, name: "파묘", photoUrl: "", nationality: "대한민국", description: "천만 관객 오컬트 스릴러", voteCount: 2_900 },
    { id: 85, categoryId: 9, name: "오펜하이머", photoUrl: "", nationality: "미국", description: "크리스토퍼 놀란의 역사 드라마", voteCount: 1_800 },
    { id: 86, categoryId: 9, name: "글래디에이터 2", photoUrl: "", nationality: "미국", description: "리들리 스콧의 역사 액션 속편", voteCount: 1_200 },
    { id: 87, categoryId: 9, name: "범죄도시 4", photoUrl: "", nationality: "대한민국", description: "마동석의 시그니처 액션", voteCount: 900 },
    { id: 88, categoryId: 9, name: "위키드", photoUrl: "", nationality: "미국", description: "브로드웨이 뮤지컬의 영화화", voteCount: 550 },
    { id: 89, categoryId: 9, name: "베테랑 2", photoUrl: "", nationality: "대한민국", description: "황정민 주연 액션 스릴러", voteCount: 300 },
    { id: 90, categoryId: 9, name: "에이리언: 로물루스", photoUrl: "", nationality: "미국", description: "에이리언 프랜차이즈의 부활", voteCount: 206 },
  ],
};

/** 카테고리 slug로 인물 목록 조회 */
export function getPersonsBySlug(slug: string): MockPerson[] {
  if (personsByCategory[slug]) {
    return personsByCategory[slug];
  }
  return [];
}

/** 실시간 시뮬레이션: 투표수에 랜덤 변동을 줌 */
export function getPersonsWithJitter(slug: string): MockPerson[] {
  const persons = getPersonsBySlug(slug);
  return persons.map((p) => ({
    ...p,
    voteCount: p.voteCount + Math.floor(Math.random() * 10) - 3,
  }));
}

/** 투표 시뮬레이션 */
export function simulateVote(slug: string, personId: number, delta: number = 1): MockPerson | null {
  const persons = getPersonsBySlug(slug);
  const person = persons.find((p) => p.id === personId);
  if (!person) return null;
  person.voteCount += delta;
  // 카테고리 total도 업데이트
  const cat = mockCategories.find((c) => c.slug === slug);
  if (cat) cat.totalVotes += delta;
  return person;
}
