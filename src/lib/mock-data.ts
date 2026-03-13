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
    personCount: 12,
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
    personCount: 15,
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
    personCount: 12,
  },
  {
    id: 6,
    name: "세계 최고의 셰프",
    slug: "best-world-chef",
    description: "미식의 세계를 이끄는 최고의 셰프에게 투표하세요.",
    thumbnailUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop",
    totalVotes: 18_764,
    personCount: 8,
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
    personCount: 8,
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
};

/** 기본 인물 생성 (데이터가 없는 카테고리용) */
function generateDefaultPersons(category: MockCategory): MockPerson[] {
  const names = ["참가자 1", "참가자 2", "참가자 3", "참가자 4", "참가자 5", "참가자 6", "참가자 7", "참가자 8", "참가자 9", "참가자 10"];
  return names.map((name, i) => ({
    id: category.id * 100 + i,
    categoryId: category.id,
    name,
    photoUrl: "",
    nationality: "",
    description: "",
    voteCount: Math.floor(Math.random() * 5000) + 100,
  }));
}

/** 카테고리 slug로 인물 목록 조회 */
export function getPersonsBySlug(slug: string): MockPerson[] {
  if (personsByCategory[slug]) {
    return personsByCategory[slug];
  }
  const cat = mockCategories.find((c) => c.slug === slug);
  if (!cat) return [];
  const generated = generateDefaultPersons(cat);
  personsByCategory[slug] = generated;
  return generated;
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
export function simulateVote(slug: string, personId: number): MockPerson | null {
  const persons = getPersonsBySlug(slug);
  const person = persons.find((p) => p.id === personId);
  if (!person) return null;
  person.voteCount += 1;
  // 카테고리 total도 업데이트
  const cat = mockCategories.find((c) => c.slug === slug);
  if (cat) cat.totalVotes += 1;
  return person;
}
