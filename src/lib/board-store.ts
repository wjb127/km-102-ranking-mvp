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

let nextId = 101;

// 초기 더미 데이터
const posts: BoardPost[] = [
  { id: 100, category: "분석", title: "UFC 310 메인이벤트 판토자 vs 아사쿠라 분석", content: "판토자가 그라운드에서 압도적인 우위를 보일 것으로 예상합니다. 아사쿠라는 스탠딩에서 승부를 봐야 합니다.\n\n판토자의 테이크다운 성공률이 60%를 넘기 때문에 아사쿠라가 이를 방어하지 못하면 힘든 경기가 될 것 같습니다.", author: "격투기분석가", hasImage: false, views: 1254, likes: 89, commentCount: 23, createdAt: new Date("2026-04-03T14:30:00") },
  { id: 99, category: "토론", title: "역대 파운드 포 파운드 1위는 누구? 존 존스 vs 하빕", content: "존 존스는 헤비급까지 올라가서 챔피언이 됐고, 하빕은 무패 은퇴. 과연 누가 더 위대한 파이터일까요?", author: "UFC매니아", hasImage: false, views: 2341, likes: 156, commentCount: 67, createdAt: new Date("2026-04-03T12:15:00") },
  { id: 98, category: "자유", title: "이번 주말 UFC 같이 볼 사람?", content: "서울 강남 쪽에서 같이 볼 분 있으면 연락주세요!", author: "격투기팬123", hasImage: false, views: 342, likes: 12, commentCount: 8, createdAt: new Date("2026-04-03T10:00:00") },
  { id: 97, category: "분석", title: "맥그리거 컴백 가능성 분석 - 체급별 매치업", content: "맥그리거가 복귀한다면 웰터급이 현실적입니다. 라이트급 컷은 이제 힘들어 보이고, 웰터급에서의 매치업을 분석해봤습니다.", author: "MMA전문가", hasImage: true, views: 3892, likes: 234, commentCount: 45, createdAt: new Date("2026-04-02T22:00:00") },
  { id: 96, category: "토론", title: "아테바고티에는 존나쌘데 왜 약한애들만 계속 붙이나", content: "타이틀 기회 줘야하는 거 아님? UFC 매치메이킹 진짜 이해 안 됨", author: "유튭이", hasImage: false, views: 891, likes: 58, commentCount: 19, createdAt: new Date("2026-04-02T20:30:00") },
  { id: 95, category: "자유", title: "낚시 오지네 ㅋㅋㅋㅋ", content: "아까 그 글 봤는데 진짜 낚시 오지더라 ㅋㅋ", author: "루터", hasImage: false, views: 445, likes: 7, commentCount: 3, createdAt: new Date("2026-04-02T18:16:00") },
  { id: 94, category: "분석", title: "김동현이 전성기때 라울러는 이겼을거 같음", content: "킹동이 프라임 시절 레슬링이면 라울러 잡을 수 있었을 것 같은데 의견 공유합니다.", author: "유튭이", hasImage: false, views: 621, likes: 31, commentCount: 11, createdAt: new Date("2026-04-02T16:00:00") },
  { id: 93, category: "분석", title: "최근 UFC 체급별 챔피언 전력 비교", content: "현 챔피언들의 최근 5경기 성적과 피니시율을 비교 분석했습니다. 라이트급이 가장 치열합니다.", author: "데이터맨", hasImage: true, views: 1832, likes: 142, commentCount: 38, createdAt: new Date("2026-04-02T14:00:00") },
  { id: 92, category: "토론", title: "넷에서 본격적으로 복싱이트 mma로 해버리면", content: "복싱이 MMA에 편입되면 어떻게 될까? 순수 복서들이 MMA에서 통할 수 있을지 토론합시다.", author: "쪼르바", hasImage: false, views: 556, likes: 29, commentCount: 7, createdAt: new Date("2026-04-02T12:00:00") },
  { id: 91, category: "자유", title: "경기를 왜 기대하는지 모르겠음", content: "솔직히 요즘 카드가 좀 약한 것 같은데.. 다들 기대하는 경기 있으면 추천 좀", author: "격투팬", hasImage: false, views: 287, likes: 5, commentCount: 4, createdAt: new Date("2026-04-02T10:00:00") },
  { id: 90, category: "분석", title: "마카체프 vs 차루키안 2차전 프리뷰", content: "1차전에서 마카체프가 판정승을 거뒀지만, 차루키안은 그 이후 엄청난 성장을 보여줬습니다. 이번에는 다를 수 있습니다.", author: "격투기분석가", hasImage: true, views: 2145, likes: 187, commentCount: 52, createdAt: new Date("2026-04-01T20:00:00") },
  { id: 89, category: "토론", title: "UFC vs 벨라토르 vs ONE 어디가 수준 높음?", content: "단체별 파이터 수준 비교 토론합시다. 저는 UFC > ONE > 벨라토르 순이라고 봅니다.", author: "MMA워치", hasImage: false, views: 1678, likes: 98, commentCount: 41, createdAt: new Date("2026-04-01T16:00:00") },
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
