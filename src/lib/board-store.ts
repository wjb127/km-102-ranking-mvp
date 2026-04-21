// ── 게시판 In-Memory Store (MVP용) ──
// 서버 재시작 시 초기화됨

export interface BoardPost {
  id: number;
  category: "분석" | "토론" | "자유";
  title: string;
  content: string;
  author: string;
  hasImage: boolean;
  views: number;
  likes: number;
  commentCount: number;
  createdAt: Date;
}

let nextId = 131;

// 기준 시각: 2026-04-21 (현재 날짜)
const NOW = new Date("2026-04-21T15:00:00");
const mins = (n: number) => new Date(NOW.getTime() - n * 60 * 1000);
const hrs = (n: number) => new Date(NOW.getTime() - n * 60 * 60 * 1000);
const days = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);

// 초기 더미 데이터 (30개)
const posts: BoardPost[] = [
  // ── 분석 10개 ──
  {
    id: 130,
    category: "분석",
    title: "맥그리거 vs 게이치 3차전 성사되면 누가 이김",
    content: "1차 맥그리거 KO 당한 이후 핸드 파워가 예전 같지 않음. 게이치는 그사이 헤비급 상대로 KO 2개 추가. 체급 이점 + 경험치 합산하면 게이치가 -250 이하로 페이버.",
    author: "옥타곤분석러",
    hasImage: false,
    views: 4821,
    likes: 312,
    commentCount: 87,
    createdAt: mins(20),
  },
  {
    id: 129,
    category: "분석",
    title: "존 존스 헤비급 커리어 평가 - 역대 최고인가",
    content: "라이트헤비급 11년 + 헤비급 타이틀까지. 피니시율, 체급 지배력, 통산 전적 모두 역사적 수준. 다만 약물 이슈 빼놓으면 논쟁이 없음.",
    author: "PFP랭커",
    hasImage: true,
    views: 6230,
    likes: 445,
    commentCount: 134,
    createdAt: mins(45),
  },
  {
    id: 128,
    category: "분석",
    title: "최근 1라운드 KO 늘어난 이유 데이터로 분석해봄",
    content: "2023~2025 UFC 전체 피니시 통계 뽑아봤는데 1R KO 비율이 38%→51%로 늘었음. 주요 원인: 그라운드 시간 감소, 타격 볼륨 증가, 선수 피지컬 향상.",
    author: "데이터맨",
    hasImage: true,
    views: 3441,
    likes: 198,
    commentCount: 52,
    createdAt: hrs(2),
  },
  {
    id: 127,
    category: "분석",
    title: "마카체프 vs 볼카노프스키 3차전 예측",
    content: "2차전은 마카체프가 판정승. 볼카가 체급 올려서 따라온 거라 기본 체격 핸디캡이 있음. 3차전은 라이트급에서 하면 결과 달라질 수 있음.",
    author: "격투기분석가",
    hasImage: false,
    views: 5102,
    likes: 287,
    commentCount: 91,
    createdAt: hrs(3),
  },
  {
    id: 126,
    category: "분석",
    title: "UFC 체급별 현 챔피언 전력 비교 (2026 기준)",
    content: "라이트급 마카체프, 웰터급 에드워즈, 미들급 드리쿠스, 헤비급 존스. 순수 전력 기준 존스 > 마카체프 > 드리쿠스 > 에드워즈 순으로 봄.",
    author: "UFC매니아",
    hasImage: true,
    views: 2877,
    likes: 156,
    commentCount: 63,
    createdAt: hrs(5),
  },
  {
    id: 125,
    category: "분석",
    title: "김동현 프라임 vs 라울러 가정매치업",
    content: "킹동 레슬링 기반 + 라울러 카운터 타격. 테이크다운 성공하면 킹동, 스탠딩 유지하면 라울러. 확률 6:4로 킹동 우세 봄.",
    author: "코리안좀비팬",
    hasImage: false,
    views: 1654,
    likes: 78,
    commentCount: 29,
    createdAt: hrs(8),
  },
  {
    id: 124,
    category: "분석",
    title: "이슬람 마카체프 약점 분석 - 카운터펀처 상대로 취약함",
    content: "레슬링이 최강이지만 타격 교환에서 카운터에 한두 번 흔들리는 장면 있었음. 볼카 1차전, 무사시 경기에서 관찰됨. 순수 타격 파이터가 아니라 이 부분이 변수.",
    author: "전술분석러",
    hasImage: false,
    views: 3920,
    likes: 201,
    commentCount: 74,
    createdAt: days(1),
  },
  {
    id: 123,
    category: "분석",
    title: "맥그리거 웰터급 컴백 가능성 - 체급별 매치업 정리",
    content: "라이트급 컷은 이제 현실적으로 불가능. 웰터급에서 가능한 상대 추려봄: 차마에프 NO, 무사시 가능, 에드워즈 NO. 복귀 자체가 홍보성일 가능성 높음.",
    author: "MMA전문가",
    hasImage: true,
    views: 7340,
    likes: 389,
    commentCount: 112,
    createdAt: days(1),
  },
  {
    id: 122,
    category: "분석",
    title: "하빕 은퇴 이후 라이트급 계보 정리",
    content: "하빕→개제→마카체프로 이어지는 킬러 라인. 다게스탄 팩토리가 체급 하나를 완전히 장악한 셈. 당분간 깨지기 어려운 구조임.",
    author: "라이트급팬",
    hasImage: false,
    views: 2103,
    likes: 133,
    commentCount: 41,
    createdAt: days(2),
  },
  {
    id: 121,
    category: "분석",
    title: "판토자 vs 에르칸 타이틀 방어전 프리뷰",
    content: "판토자의 그라운드 제압력 vs 에르칸의 화끈한 타격. 테이크다운 성공률 차이가 30%p 이상. 2R 이후 그라운드 싸움으로 가면 판토자 판정 유력.",
    author: "플라이급워치",
    hasImage: false,
    views: 1477,
    likes: 88,
    commentCount: 27,
    createdAt: days(3),
  },

  // ── 토론 10개 ──
  {
    id: 120,
    category: "토론",
    title: "솔직히 이슬람 마카체프 과대평가 아님?",
    content: "레슬링이 강한건 인정하는데 타격 클래스가 탑5 수준이냐는 의문. 순수 스트라이커 한 명만 제대로 붙어봐라.",
    author: "ㅇㅇ",
    hasImage: false,
    views: 5543,
    likes: 234,
    commentCount: 198,
    createdAt: mins(10),
  },
  {
    id: 119,
    category: "토론",
    title: "UFC 2026 최고 경기 TOP5 뽑아봄",
    content: "1. 마카체프 vs 차루키안 2차 / 2. 존스 vs 아스피날 / 3. 볼카 vs 차마에프 / 4. 페레이라 vs 프로하스카 3차 / 5. 드리쿠스 vs 로마노프. 의견?",
    author: "갤로그익명",
    hasImage: false,
    views: 3211,
    likes: 178,
    commentCount: 143,
    createdAt: mins(35),
  },
  {
    id: 118,
    category: "토론",
    title: "타이틀 샷 다음 차례 라이트급에서 누구임?",
    content: "차루키안은 이미 도전함. 개제는 계속 이기는 중. 무바라크 새로 떠오름. 여론은 개제 우세인데 UFC가 새 얼굴 밀 것 같기도 함.",
    author: "UFC매니아",
    hasImage: false,
    views: 2897,
    likes: 112,
    commentCount: 89,
    createdAt: hrs(1),
  },
  {
    id: 117,
    category: "토론",
    title: "페레이라 vs 존스 슈퍼파이트 성사 가능할까",
    content: "체급 차이 있지만 둘 다 헤비급 뛸 수 있음. 흥행은 역대급. UFC가 판 깔면 성사 못 할 이유 없음. 근데 존스가 싫어할 것 같음.",
    author: "격투팬1",
    hasImage: false,
    views: 6712,
    likes: 401,
    commentCount: 217,
    createdAt: hrs(2),
  },
  {
    id: 116,
    category: "토론",
    title: "UFC vs ONE 체급별 1위 맞붙이면 어느 단체가 이김",
    content: "스탬프 vs 발라나, 아디 vs 마틴, 모라에스 vs 판토자 등 가상 매치업. ONE 스탠딩 강자 많지만 레슬링 깊이는 UFC가 우위.",
    author: "MMA워치",
    hasImage: false,
    views: 4021,
    likes: 189,
    commentCount: 96,
    createdAt: hrs(4),
  },
  {
    id: 115,
    category: "토론",
    title: "차마에프가 챔피언 못 된 이유가 뭔지 진짜 모르겠음",
    content: "전적 보면 탑급 다 이겼는데 왜 이렇게 오래 걸림? 매치메이킹 문제냐 UFC 정치냐 본인 문제냐. 각자 의견 써라.",
    author: "ㅋㅋㅋ",
    hasImage: false,
    views: 3344,
    likes: 165,
    commentCount: 107,
    createdAt: hrs(6),
  },
  {
    id: 114,
    category: "토론",
    title: "역대 파운드포파운드 1위: 존 존스 vs 하빕 vs 앤더슨실바",
    content: "실바 무패 16연승 + 존스 체급 두 개 제패 + 하빕 무패 은퇴. 세 가지 기준 다 다름. 개인적으로는 실바 > 존스 > 하빕.",
    author: "나그네123",
    hasImage: false,
    views: 4590,
    likes: 256,
    commentCount: 134,
    createdAt: days(1),
  },
  {
    id: 113,
    category: "토론",
    title: "복싱 강자가 MMA 오면 통할 수 있을까",
    content: "캐노 알바레스, 테렌스 크로퍼드 같은 복서가 MMA로 전향하면? 타격은 당연히 최상위급이지만 레슬링 없으면 첫 테이크다운에 무너짐.",
    author: "쪼르바",
    hasImage: false,
    views: 2130,
    likes: 87,
    commentCount: 44,
    createdAt: days(2),
  },
  {
    id: 112,
    category: "토론",
    title: "아테바고티에 타이틀 샷 언제 줌? 이미 자격 충분하지 않냐",
    content: "최근 5연승 + 피니시 4개. 이 정도면 충분하지 않음? UFC가 왜 계속 미루는지 이해 못 하겠음.",
    author: "유튭이",
    hasImage: false,
    views: 1823,
    likes: 94,
    commentCount: 58,
    createdAt: days(2),
  },
  {
    id: 111,
    category: "토론",
    title: "여성 스트로급 최강자 논쟁 장샨리 vs 카를라 에스파르자",
    content: "장샨리 타격 클래스가 한 수 위. 에스파르자 레슬링이 역대급. 근데 체격 차이 나서 장샨리가 체급 올려야 되는 구조임.",
    author: "WMMA팬",
    hasImage: false,
    views: 987,
    likes: 42,
    commentCount: 21,
    createdAt: days(3),
  },

  // ── 자유 10개 ──
  {
    id: 110,
    category: "자유",
    title: "강남에서 UFC 같이 볼 사람 구함",
    content: "이번 주말 카드 좋은데 혼자 보기 아깝다. 강남역 근처 스포츠바에서 볼 사람 있으면 댓글 ㄱㄱ",
    author: "격투기팬123",
    hasImage: false,
    views: 621,
    likes: 18,
    commentCount: 14,
    createdAt: mins(5),
  },
  {
    id: 109,
    category: "자유",
    title: "어제 경기 보다가 잠들어버림 ㅋㅋ",
    content: "메인카드 시작이 새벽 1시잖아 진짜. 코파이벤트 보고 눈 감았다가 일어났더니 이미 끝남. 결과 스포당해서 더 억울",
    author: "ㅇㅇ",
    hasImage: false,
    views: 1830,
    likes: 67,
    commentCount: 43,
    createdAt: mins(15),
  },
  {
    id: 108,
    category: "자유",
    title: "진짜 개인 생각인데 UFC 해설이 너무 편파적임",
    content: "미국 선수 나오면 갑자기 열정 2배 됨. 한국 선수 경기는 건조하게 넘어가고. 원래 그런 거긴 한데 좀 심함.",
    author: "뷰어1234",
    hasImage: false,
    views: 2445,
    likes: 134,
    commentCount: 76,
    createdAt: hrs(1),
  },
  {
    id: 107,
    category: "자유",
    title: "격투기 입문자한테 추천할 경기 뭐 있음",
    content: "친구가 UFC 처음 보는데 입문용으로 뭐 추천해줄까. 재밌고 이해하기 쉬운 명경기로. 맥그리거 알도 1라운드는 너무 짧으려나",
    author: "루터",
    hasImage: false,
    views: 3102,
    likes: 145,
    commentCount: 67,
    createdAt: hrs(3),
  },
  {
    id: 106,
    category: "자유",
    title: "MMA 도장 다니는 사람들 운동 루틴 공유해봐",
    content: "요즘 복싱 + BJJ 병행 중인데 체력이 딸림. 주 4회가 한계. 다들 어떻게 관리하냐",
    author: "격투수련자",
    hasImage: false,
    views: 876,
    likes: 29,
    commentCount: 22,
    createdAt: hrs(5),
  },
  {
    id: 105,
    category: "자유",
    title: "UFC 예측 적중률 관리하는 사람 있냐",
    content: "나는 시트에 매 경기 픽 기록하는데 연간 57% 정도 나옴. 이게 평균인지 잘 모르겠음. 다들 몇 프로 맞춤?",
    author: "픽쟁이",
    hasImage: false,
    views: 1243,
    likes: 51,
    commentCount: 38,
    createdAt: hrs(7),
  },
  {
    id: 104,
    category: "자유",
    title: "요즘 UFC PPV 가격 진짜 너무 올랐다",
    content: "작년보다 또 올랐음. 이제 친구들이랑 나눠서 보는 것도 눈치 보임. 파이트패스로 버티고 있긴 한데.",
    author: "나그네123",
    hasImage: false,
    views: 4211,
    likes: 223,
    commentCount: 91,
    createdAt: days(1),
  },
  {
    id: 103,
    category: "자유",
    title: "UFC 한국 개최 또 안 하나 ㅠㅠ",
    content: "2022년 서울 카드 이후로 소식이 없음. 일본은 매년 하는데 한국은 왜 안 옴. 팬베이스 충분하지 않냐",
    author: "서울팬",
    hasImage: false,
    views: 3560,
    likes: 187,
    commentCount: 64,
    createdAt: days(2),
  },
  {
    id: 102,
    category: "자유",
    title: "경기 보다 보면 선수들 체력이 진짜 신기함",
    content: "5라운드 25분 내내 타격 교환하는 거 보면 그냥 별종들임. 나는 3분만 스파링해도 다리 풀리는데",
    author: "ㅋㅋㅋ",
    hasImage: false,
    views: 2034,
    likes: 98,
    commentCount: 35,
    createdAt: days(3),
  },
  {
    id: 101,
    category: "자유",
    title: "낚시 오지네 ㅋㅋㅋ 이 갤 수준이 이 정도냐",
    content: "아까 그 글 봤는데 진짜 낚시 오지더라 ㅋㅋ 제목 보고 들어갔다가 어이없어서 나옴",
    author: "루터",
    hasImage: false,
    views: 891,
    likes: 11,
    commentCount: 7,
    createdAt: days(4),
  },
];

// ── CRUD 함수 ──

export function getBoardPosts(category?: string): BoardPost[] {
  const filtered = category && category !== "전체"
    ? posts.filter((p) => p.category === category)
    : posts;
  return [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getBoardPostById(id: number): BoardPost | undefined {
  return posts.find((p) => p.id === id);
}

export function addBoardPost(
  data: Pick<BoardPost, "category" | "title" | "content" | "author">
): BoardPost {
  const post: BoardPost = {
    ...data,
    id: nextId++,
    hasImage: false,
    views: 0,
    likes: 0,
    commentCount: 0,
    createdAt: new Date(),
  };
  posts.unshift(post);
  return post;
}

export function incrementViews(id: number): void {
  const post = posts.find((p) => p.id === id);
  if (post) post.views++;
}

export function toggleLike(id: number, add: boolean): number {
  const post = posts.find((p) => p.id === id);
  if (!post) return 0;
  post.likes += add ? 1 : -1;
  if (post.likes < 0) post.likes = 0;
  return post.likes;
}
