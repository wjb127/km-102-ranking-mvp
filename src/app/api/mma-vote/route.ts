import { NextRequest, NextResponse } from "next/server";

// ── 타입 ──

interface MmaFighterVote {
  id: string; // 카테고리 내 유니크 식별자 (category_name 조합)
  fighterId: number;
  name: string;
  voteCount: number;
}

interface CategoryData {
  label: string;
  description: string;
  fighters: MmaFighterVote[];
}

// ── 카테고리별 초기 데이터 ──

const CATEGORIES: Record<string, CategoryData> = {
  "pound-for-pound": {
    label: "파운드 포 파운드",
    description: "역대 파운드 포 파운드 최강자는?",
    fighters: [
      { id: "pfp-jones", fighterId: 3, name: "Jon Jones", voteCount: 2847 },
      { id: "pfp-khabib", fighterId: 2, name: "Khabib Nurmagomedov", voteCount: 2534 },
      { id: "pfp-silva", fighterId: 100, name: "Anderson Silva", voteCount: 1876 },
      { id: "pfp-gsp", fighterId: 101, name: "Georges St-Pierre", voteCount: 2102 },
      { id: "pfp-dj", fighterId: 102, name: "Demetrious Johnson", voteCount: 1245 },
    ],
  },
  heavyweight: {
    label: "헤비급",
    description: "역대 최강 헤비급 파이터는?",
    fighters: [
      { id: "hw-jones", fighterId: 3, name: "Jon Jones", voteCount: 3201 },
      { id: "hw-stipe", fighterId: 103, name: "Stipe Miocic", voteCount: 1876 },
      { id: "hw-fedor", fighterId: 104, name: "Fedor Emelianenko", voteCount: 2345 },
      { id: "hw-cain", fighterId: 105, name: "Cain Velasquez", voteCount: 987 },
    ],
  },
  lightweight: {
    label: "라이트급",
    description: "역대 최강 라이트급 파이터는?",
    fighters: [
      { id: "lw-khabib", fighterId: 2, name: "Khabib Nurmagomedov", voteCount: 3456 },
      { id: "lw-oliveira", fighterId: 7, name: "Charles Oliveira", voteCount: 1234 },
      { id: "lw-bjpenn", fighterId: 106, name: "BJ Penn", voteCount: 876 },
      { id: "lw-conor", fighterId: 1, name: "Conor McGregor", voteCount: 2109 },
    ],
  },
  "knockout-artist": {
    label: "KO 아티스트",
    description: "최고의 KO 아티스트는?",
    fighters: [
      { id: "ko-conor", fighterId: 1, name: "Conor McGregor", voteCount: 2345 },
      { id: "ko-lewis", fighterId: 107, name: "Derrick Lewis", voteCount: 1567 },
      { id: "ko-hunt", fighterId: 108, name: "Mark Hunt", voteCount: 1890 },
      { id: "ko-ngannou", fighterId: 109, name: "Francis Ngannou", voteCount: 2678 },
    ],
  },
  "submission-artist": {
    label: "서브미션 아티스트",
    description: "최고의 서브미션 아티스트는?",
    fighters: [
      { id: "sub-oliveira", fighterId: 7, name: "Charles Oliveira", voteCount: 3012 },
      { id: "sub-maia", fighterId: 110, name: "Demian Maia", voteCount: 1456 },
      { id: "sub-khabib", fighterId: 2, name: "Khabib Nurmagomedov", voteCount: 2234 },
      { id: "sub-gracie", fighterId: 111, name: "Royce Gracie", voteCount: 1789 },
    ],
  },
};

// ── 서버 메모리 투표 저장소 ──
// category_fighterId_fingerprint → 중복 투표 방지
const votedSet = new Set<string>();

/** 투표 키 생성 */
function voteKey(category: string, fighterId: string, fingerprint: string) {
  return `${category}_${fighterId}_${fingerprint}`;
}

// ── GET: 카테고리별 투표 현황 ──
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const fingerprint = searchParams.get("fingerprint") ?? "";

  // 특정 카테고리 조회
  if (category) {
    const data = CATEGORIES[category];
    if (!data) {
      return NextResponse.json(
        { success: false, error: "존재하지 않는 카테고리입니다." },
        { status: 404 }
      );
    }

    // 투표 현황 + 내가 투표한 선수 표시
    const fighters = data.fighters
      .map((f) => ({
        ...f,
        voted: fingerprint
          ? votedSet.has(voteKey(category, f.id, fingerprint))
          : false,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);

    const totalVotes = fighters.reduce((sum, f) => sum + f.voteCount, 0);

    return NextResponse.json({
      success: true,
      data: {
        category,
        label: data.label,
        description: data.description,
        fighters,
        totalVotes,
      },
    });
  }

  // 전체 카테고리 목록
  const categories = Object.entries(CATEGORIES).map(([slug, data]) => {
    const totalVotes = data.fighters.reduce((sum, f) => sum + f.voteCount, 0);
    return {
      slug,
      label: data.label,
      description: data.description,
      fighterCount: data.fighters.length,
      totalVotes,
    };
  });

  return NextResponse.json({ success: true, data: categories });
}

// ── POST: 투표 (토글 방식) ──
export async function POST(req: NextRequest) {
  try {
    const { category, fighterId, fingerprint } = await req.json();

    if (!category || !fighterId || !fingerprint) {
      return NextResponse.json(
        { success: false, error: "category, fighterId, fingerprint가 필요합니다." },
        { status: 400 }
      );
    }

    const data = CATEGORIES[category];
    if (!data) {
      return NextResponse.json(
        { success: false, error: "존재하지 않는 카테고리입니다." },
        { status: 404 }
      );
    }

    const fighter = data.fighters.find((f) => f.id === fighterId);
    if (!fighter) {
      return NextResponse.json(
        { success: false, error: "해당 카테고리에 존재하지 않는 선수입니다." },
        { status: 404 }
      );
    }

    const key = voteKey(category, fighterId, fingerprint);
    const alreadyVoted = votedSet.has(key);

    if (alreadyVoted) {
      // 투표 취소
      votedSet.delete(key);
      fighter.voteCount = Math.max(0, fighter.voteCount - 1);

      return NextResponse.json({
        success: true,
        voted: false,
        fighter: { ...fighter, voted: false },
      });
    } else {
      // 같은 카테고리 내 다른 선수에게 투표한 적 있으면 그 투표 취소
      for (const f of data.fighters) {
        const otherKey = voteKey(category, f.id, fingerprint);
        if (votedSet.has(otherKey)) {
          votedSet.delete(otherKey);
          f.voteCount = Math.max(0, f.voteCount - 1);
        }
      }

      // 새 투표
      votedSet.add(key);
      fighter.voteCount += 1;

      return NextResponse.json({
        success: true,
        voted: true,
        fighter: { ...fighter, voted: true },
      });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }
}
