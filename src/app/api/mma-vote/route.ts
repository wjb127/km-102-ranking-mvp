import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { fighters as fightersTbl, goatVotes } from "@/db/schema";

// ── 카테고리별 후보 선수 목록 (UI 고정) + baseCount (초기 누적 표시값)
//    실제 투표는 goat_votes 테이블에 기록되며, 표시값은 baseCount + DB 투표수

interface CandidateConfig {
  slugId: string;          // UI 식별자 (예: "pfp-jones")
  externalId: number;      // fighters.external_id
  name: string;
  baseCount: number;
}

interface CategoryConfig {
  label: string;
  description: string;
  fighters: CandidateConfig[];
}

const CATEGORIES: Record<string, CategoryConfig> = {
  "pound-for-pound": {
    label: "파운드 포 파운드",
    description: "역대 파운드 포 파운드 최강자는?",
    fighters: [
      { slugId: "pfp-jones",  externalId: 1001, name: "Jon Jones",             baseCount: 2847 },
      { slugId: "pfp-khabib", externalId: 2001, name: "Khabib Nurmagomedov",   baseCount: 2534 },
      { slugId: "pfp-silva",  externalId: 2002, name: "Anderson Silva",        baseCount: 1876 },
      { slugId: "pfp-gsp",    externalId: 2003, name: "Georges St-Pierre",     baseCount: 2102 },
      { slugId: "pfp-dj",     externalId: 2004, name: "Demetrious Johnson",    baseCount: 1245 },
    ],
  },
  heavyweight: {
    label: "헤비급",
    description: "역대 최강 헤비급 파이터는?",
    fighters: [
      { slugId: "hw-jones", externalId: 1001, name: "Jon Jones",          baseCount: 3201 },
      { slugId: "hw-stipe", externalId: 2005, name: "Stipe Miocic",       baseCount: 1876 },
      { slugId: "hw-fedor", externalId: 2006, name: "Fedor Emelianenko",  baseCount: 2345 },
      { slugId: "hw-cain",  externalId: 2007, name: "Cain Velasquez",     baseCount: 987 },
    ],
  },
  lightweight: {
    label: "라이트급",
    description: "역대 최강 라이트급 파이터는?",
    fighters: [
      { slugId: "lw-khabib",   externalId: 2001, name: "Khabib Nurmagomedov", baseCount: 3456 },
      { slugId: "lw-oliveira", externalId: 2008, name: "Charles Oliveira",    baseCount: 1234 },
      { slugId: "lw-bjpenn",   externalId: 2009, name: "BJ Penn",             baseCount: 876 },
      { slugId: "lw-conor",    externalId: 6592, name: "Conor McGregor",      baseCount: 2109 },
    ],
  },
  "knockout-artist": {
    label: "KO 아티스트",
    description: "최고의 KO 아티스트는?",
    fighters: [
      { slugId: "ko-conor",    externalId: 6592, name: "Conor McGregor",    baseCount: 2345 },
      { slugId: "ko-lewis",    externalId: 2010, name: "Derrick Lewis",     baseCount: 1567 },
      { slugId: "ko-hunt",     externalId: 2011, name: "Mark Hunt",         baseCount: 1890 },
      { slugId: "ko-ngannou",  externalId: 2012, name: "Francis Ngannou",   baseCount: 2678 },
    ],
  },
  "submission-artist": {
    label: "서브미션 아티스트",
    description: "최고의 서브미션 아티스트는?",
    fighters: [
      { slugId: "sub-oliveira", externalId: 2008, name: "Charles Oliveira",      baseCount: 3012 },
      { slugId: "sub-maia",     externalId: 2013, name: "Demian Maia",            baseCount: 1456 },
      { slugId: "sub-khabib",   externalId: 2001, name: "Khabib Nurmagomedov",    baseCount: 2234 },
      { slugId: "sub-gracie",   externalId: 2014, name: "Royce Gracie",           baseCount: 1789 },
    ],
  },
};

// ── externalId → fighters.id 매핑 캐시 (요청 1건당)
async function loadFighterIdMap(externalIds: number[]) {
  if (externalIds.length === 0) return new Map<number, number>();
  const rows = await db
    .select({ id: fightersTbl.id, externalId: fightersTbl.externalId })
    .from(fightersTbl)
    .where(inArray(fightersTbl.externalId, externalIds));
  const map = new Map<number, number>();
  for (const r of rows) {
    if (r.externalId != null) map.set(r.externalId, r.id);
  }
  return map;
}

// ── DB 실제 투표 집계: category + fighter_id → count
async function loadDbCounts(category: string, fighterIds: number[]) {
  if (fighterIds.length === 0) return new Map<number, number>();
  const rows = await db
    .select({
      fighterId: goatVotes.fighterId,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(goatVotes)
    .where(and(eq(goatVotes.category, category), inArray(goatVotes.fighterId, fighterIds)))
    .groupBy(goatVotes.fighterId);
  const map = new Map<number, number>();
  for (const r of rows) map.set(r.fighterId, Number(r.count));
  return map;
}

// ── 해당 fingerprint가 이 카테고리에서 어느 fighter_id에 투표했는지
async function loadMyVote(category: string, fingerprint: string) {
  if (!fingerprint) return null;
  const rows = await db
    .select({ fighterId: goatVotes.fighterId })
    .from(goatVotes)
    .where(and(eq(goatVotes.category, category), eq(goatVotes.fingerprint, fingerprint)))
    .limit(1);
  return rows[0]?.fighterId ?? null;
}

// ── GET: 카테고리별 현황 ──
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const fingerprint = searchParams.get("fingerprint") ?? "";

  if (category) {
    const config = CATEGORIES[category];
    if (!config) {
      return NextResponse.json(
        { success: false, error: "존재하지 않는 카테고리입니다." },
        { status: 404 }
      );
    }

    const externalIds = config.fighters.map((f) => f.externalId);
    const idMap = await loadFighterIdMap(externalIds);
    const fighterIds = [...new Set(config.fighters.map((f) => idMap.get(f.externalId)).filter((v): v is number => !!v))];
    const dbCounts = await loadDbCounts(category, fighterIds);
    const myVotedFighterId = await loadMyVote(category, fingerprint);

    const fighters = config.fighters
      .map((f) => {
        const internalId = idMap.get(f.externalId);
        const dbCount = internalId ? dbCounts.get(internalId) ?? 0 : 0;
        return {
          id: f.slugId,
          fighterId: internalId ?? f.externalId,
          externalId: f.externalId,
          name: f.name,
          voteCount: f.baseCount + dbCount,
          voted: internalId != null && myVotedFighterId === internalId,
        };
      })
      .sort((a, b) => b.voteCount - a.voteCount);

    const totalVotes = fighters.reduce((sum, f) => sum + f.voteCount, 0);

    return NextResponse.json({
      success: true,
      data: {
        category,
        label: config.label,
        description: config.description,
        fighters,
        totalVotes,
      },
    });
  }

  // 전체 카테고리 목록
  const allExternalIds = Object.values(CATEGORIES).flatMap((c) =>
    c.fighters.map((f) => f.externalId)
  );
  const idMap = await loadFighterIdMap([...new Set(allExternalIds)]);
  const allFighterIds = [...new Set([...idMap.values()])];

  // 모든 카테고리 × 선수 집계를 한 번에 조회
  const countsRaw =
    allFighterIds.length === 0
      ? []
      : await db
          .select({
            category: goatVotes.category,
            fighterId: goatVotes.fighterId,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(goatVotes)
          .where(inArray(goatVotes.fighterId, allFighterIds))
          .groupBy(goatVotes.category, goatVotes.fighterId);
  const perCategory = new Map<string, Map<number, number>>();
  for (const r of countsRaw) {
    if (!perCategory.has(r.category)) perCategory.set(r.category, new Map());
    perCategory.get(r.category)!.set(r.fighterId, Number(r.count));
  }

  const categories = Object.entries(CATEGORIES).map(([slug, config]) => {
    const catMap = perCategory.get(slug) ?? new Map();
    const totalVotes = config.fighters.reduce((sum, f) => {
      const internalId = idMap.get(f.externalId);
      const dbCount = internalId ? catMap.get(internalId) ?? 0 : 0;
      return sum + f.baseCount + dbCount;
    }, 0);
    return {
      slug,
      label: config.label,
      description: config.description,
      fighterCount: config.fighters.length,
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

    const config = CATEGORIES[category];
    if (!config) {
      return NextResponse.json(
        { success: false, error: "존재하지 않는 카테고리입니다." },
        { status: 404 }
      );
    }

    const candidate = config.fighters.find((f) => f.slugId === fighterId);
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "해당 카테고리에 존재하지 않는 선수입니다." },
        { status: 404 }
      );
    }

    // external_id → fighters.id 매핑
    const idMap = await loadFighterIdMap([candidate.externalId]);
    const internalId = idMap.get(candidate.externalId);
    if (!internalId) {
      return NextResponse.json(
        { success: false, error: "선수 데이터가 DB에 없습니다. seed 필요." },
        { status: 500 }
      );
    }

    // 현재 fingerprint의 이 카테고리 투표 상태 조회
    const [existing] = await db
      .select({ id: goatVotes.id, fighterId: goatVotes.fighterId })
      .from(goatVotes)
      .where(and(eq(goatVotes.category, category), eq(goatVotes.fingerprint, fingerprint)))
      .limit(1);

    let voted = false;

    if (existing) {
      if (existing.fighterId === internalId) {
        // 같은 후보에 재투표 → 취소
        await db.delete(goatVotes).where(eq(goatVotes.id, existing.id));
        voted = false;
      } else {
        // 다른 후보에서 바꿔 투표
        await db
          .update(goatVotes)
          .set({ fighterId: internalId })
          .where(eq(goatVotes.id, existing.id));
        voted = true;
      }
    } else {
      // 신규 투표
      await db.insert(goatVotes).values({
        category,
        fingerprint,
        fighterId: internalId,
      });
      voted = true;
    }

    // 갱신된 카운트 재조회
    const [{ count = 0 } = { count: 0 }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(goatVotes)
      .where(and(eq(goatVotes.category, category), eq(goatVotes.fighterId, internalId)));

    const voteCount = candidate.baseCount + Number(count);

    return NextResponse.json({
      success: true,
      voted,
      fighter: {
        id: candidate.slugId,
        fighterId: internalId,
        externalId: candidate.externalId,
        name: candidate.name,
        voteCount,
        voted,
      },
    });
  } catch (e) {
    console.error("[POST /api/mma-vote]", e);
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
}
