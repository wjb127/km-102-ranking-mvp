import { NextRequest, NextResponse } from "next/server";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { fighterOrgRecords, fighters as fightersTbl, goatVotes } from "@/db/schema";
import { formatNameKoEn } from "@/lib/format-name";

type CategorySlug =
  | "pound-for-pound"
  | "heavyweight"
  | "lightweight"
  | "knockout-artist"
  | "submission-artist";

interface CategoryConfig {
  label: string;
  description: string;
}

interface VoteCandidate {
  id: string;
  fighterId: number;
  name: string;
  imageUrl: string | null;
  voteCount: number;
  voted: boolean;
}

const CATEGORY_CONFIG: Record<CategorySlug, CategoryConfig> = {
  "pound-for-pound": {
    label: "파운드 포 파운드",
    description: "실제 선수 DB 기준으로 역대 파운드 포 파운드 최강자를 골라주세요.",
  },
  heavyweight: {
    label: "헤비급",
    description: "실제 선수 DB 기준으로 역대 최강 헤비급 파이터를 골라주세요.",
  },
  lightweight: {
    label: "라이트급",
    description: "실제 선수 DB 기준으로 역대 최강 라이트급 파이터를 골라주세요.",
  },
  "knockout-artist": {
    label: "KO 아티스트",
    description: "실제 전적 기준으로 최고의 KO 아티스트를 골라주세요.",
  },
  "submission-artist": {
    label: "서브미션 아티스트",
    description: "실제 전적 기준으로 최고의 서브미션 아티스트를 골라주세요.",
  },
};

const CATEGORY_ORDER: CategorySlug[] = [
  "pound-for-pound",
  "heavyweight",
  "lightweight",
  "knockout-artist",
  "submission-artist",
];

const CANDIDATE_LIMIT = 5;

function isCategorySlug(value: string | null): value is CategorySlug {
  return value != null && value in CATEGORY_CONFIG;
}

function fightCountExpr() {
  return sql<number>`
    (${fightersTbl.careerWins}
      + ${fightersTbl.careerLosses}
      + ${fightersTbl.careerDraws}
      + ${fightersTbl.careerNoContests})
  `;
}

function winRateExpr(totalFights: ReturnType<typeof fightCountExpr>) {
  return sql<number>`
    CASE
      WHEN ${totalFights} = 0 THEN 0
      ELSE ${fightersTbl.careerWins}::float / ${totalFights}
    END
  `;
}

async function loadCategoryCandidates(category: CategorySlug) {
  const totalFights = fightCountExpr();
  const winRate = winRateExpr(totalFights);
  const totals = db
    .select({
      fighterId: fighterOrgRecords.fighterId,
      winsByKo: sql<number>`COALESCE(SUM(${fighterOrgRecords.winsByKo}), 0)::int`.as("wins_by_ko"),
      winsBySub: sql<number>`COALESCE(SUM(${fighterOrgRecords.winsBySub}), 0)::int`.as("wins_by_sub"),
    })
    .from(fighterOrgRecords)
    .groupBy(fighterOrgRecords.fighterId)
    .as("totals");

  if (category === "pound-for-pound") {
    return await db
      .select({
        fighterId: fightersTbl.id,
        fullName: fightersTbl.fullName,
        fullNameKo: fightersTbl.fullNameKo,
        imageUrl: fightersTbl.imageUrl,
        wins: fightersTbl.careerWins,
      })
      .from(fightersTbl)
      .where(and(eq(fightersTbl.isActive, true), gte(totalFights, 5)))
      .orderBy(desc(fightersTbl.careerWins), desc(winRate), asc(fightersTbl.fullName))
      .limit(CANDIDATE_LIMIT);
  }

  if (category === "heavyweight") {
    return await db
      .select({
        fighterId: fightersTbl.id,
        fullName: fightersTbl.fullName,
        fullNameKo: fightersTbl.fullNameKo,
        imageUrl: fightersTbl.imageUrl,
        wins: fightersTbl.careerWins,
      })
      .from(fightersTbl)
      .where(
        and(
          eq(fightersTbl.isActive, true),
          eq(fightersTbl.weightClass, "Heavyweight"),
          gte(totalFights, 3)
        )
      )
      .orderBy(desc(fightersTbl.careerWins), desc(winRate), asc(fightersTbl.fullName))
      .limit(CANDIDATE_LIMIT);
  }

  if (category === "lightweight") {
    return await db
      .select({
        fighterId: fightersTbl.id,
        fullName: fightersTbl.fullName,
        fullNameKo: fightersTbl.fullNameKo,
        imageUrl: fightersTbl.imageUrl,
        wins: fightersTbl.careerWins,
      })
      .from(fightersTbl)
      .where(
        and(
          eq(fightersTbl.isActive, true),
          eq(fightersTbl.weightClass, "Lightweight"),
          gte(totalFights, 3)
        )
      )
      .orderBy(desc(fightersTbl.careerWins), desc(winRate), asc(fightersTbl.fullName))
      .limit(CANDIDATE_LIMIT);
  }

  if (category === "knockout-artist") {
    return await db
      .select({
        fighterId: fightersTbl.id,
        fullName: fightersTbl.fullName,
        fullNameKo: fightersTbl.fullNameKo,
        imageUrl: fightersTbl.imageUrl,
        wins: fightersTbl.careerWins,
        winsByKo: totals.winsByKo,
      })
      .from(fightersTbl)
      .leftJoin(totals, eq(totals.fighterId, fightersTbl.id))
      .where(and(eq(fightersTbl.isActive, true), gte(totalFights, 3)))
      .orderBy(
        desc(sql<number>`COALESCE(${totals.winsByKo}, 0)`),
        desc(fightersTbl.careerWins),
        asc(fightersTbl.fullName)
      )
      .limit(CANDIDATE_LIMIT);
  }

  return await db
    .select({
      fighterId: fightersTbl.id,
      fullName: fightersTbl.fullName,
      fullNameKo: fightersTbl.fullNameKo,
      imageUrl: fightersTbl.imageUrl,
      wins: fightersTbl.careerWins,
      winsBySub: totals.winsBySub,
    })
    .from(fightersTbl)
    .leftJoin(totals, eq(totals.fighterId, fightersTbl.id))
    .where(and(eq(fightersTbl.isActive, true), gte(totalFights, 3)))
    .orderBy(
      desc(sql<number>`COALESCE(${totals.winsBySub}, 0)`),
      desc(fightersTbl.careerWins),
      asc(fightersTbl.fullName)
    )
    .limit(CANDIDATE_LIMIT);
}

async function loadVoteCounts(category: CategorySlug, fighterIds: number[]) {
  if (fighterIds.length === 0) return new Map<number, number>();

  const rows = await db
    .select({
      fighterId: goatVotes.fighterId,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(goatVotes)
    .where(and(eq(goatVotes.category, category), inArray(goatVotes.fighterId, fighterIds)))
    .groupBy(goatVotes.fighterId);

  const counts = new Map<number, number>();
  for (const row of rows) {
    counts.set(row.fighterId, Number(row.count));
  }
  return counts;
}

async function loadMyVote(category: CategorySlug, fingerprint: string) {
  if (!fingerprint) return null;
  const [row] = await db
    .select({ fighterId: goatVotes.fighterId })
    .from(goatVotes)
    .where(and(eq(goatVotes.category, category), eq(goatVotes.fingerprint, fingerprint)))
    .limit(1);
  return row?.fighterId ?? null;
}

async function buildCategoryPayload(category: CategorySlug, fingerprint: string) {
  const config = CATEGORY_CONFIG[category];
  const rawCandidates = await loadCategoryCandidates(category);
  const fighterIds = rawCandidates.map((row) => row.fighterId);
  const voteCounts = await loadVoteCounts(category, fighterIds);
  const myVote = await loadMyVote(category, fingerprint);

  const fighters: VoteCandidate[] = rawCandidates
    .map((row) => ({
      id: String(row.fighterId),
      fighterId: row.fighterId,
      name: formatNameKoEn(row.fullNameKo, row.fullName),
      imageUrl: row.imageUrl,
      voteCount: voteCounts.get(row.fighterId) ?? 0,
      voted: myVote === row.fighterId,
    }))
    .sort((a, b) => b.voteCount - a.voteCount || a.name.localeCompare(b.name, "ko"));

  return {
    category,
    label: config.label,
    description: config.description,
    fighters,
    totalVotes: fighters.reduce((sum, fighter) => sum + fighter.voteCount, 0),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const fingerprint = searchParams.get("fingerprint") ?? "";

  if (category) {
    if (!isCategorySlug(category)) {
      return NextResponse.json(
        { success: false, error: "존재하지 않는 카테고리입니다." },
        { status: 404 }
      );
    }

    const payload = await buildCategoryPayload(category, fingerprint);
    return NextResponse.json({ success: true, data: payload });
  }

  const categories = await Promise.all(
    CATEGORY_ORDER.map(async (slug) => {
      const payload = await buildCategoryPayload(slug, "");
      return {
        slug,
        label: payload.label,
        description: payload.description,
        fighterCount: payload.fighters.length,
        totalVotes: payload.totalVotes,
      };
    })
  );

  return NextResponse.json({ success: true, data: categories });
}

export async function POST(req: NextRequest) {
  try {
    const { category, fighterId, fingerprint } = await req.json();
    const normalizedFighterId = Number(fighterId);

    if (!isCategorySlug(typeof category === "string" ? category : null) || !fingerprint) {
      return NextResponse.json(
        { success: false, error: "category, fighterId, fingerprint가 필요합니다." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(normalizedFighterId) || normalizedFighterId <= 0) {
      return NextResponse.json(
        { success: false, error: "fighterId가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const candidates = await loadCategoryCandidates(category);
    const candidate = candidates.find((row) => row.fighterId === normalizedFighterId);
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: "해당 카테고리에 존재하지 않는 선수입니다." },
        { status: 404 }
      );
    }

    const [existing] = await db
      .select({ id: goatVotes.id, fighterId: goatVotes.fighterId })
      .from(goatVotes)
      .where(and(eq(goatVotes.category, category), eq(goatVotes.fingerprint, fingerprint)))
      .limit(1);

    let voted = false;

    if (existing) {
      if (existing.fighterId === normalizedFighterId) {
        await db.delete(goatVotes).where(eq(goatVotes.id, existing.id));
      } else {
        await db
          .update(goatVotes)
          .set({ fighterId: normalizedFighterId })
          .where(eq(goatVotes.id, existing.id));
        voted = true;
      }
    } else {
      await db.insert(goatVotes).values({
        category,
        fingerprint,
        fighterId: normalizedFighterId,
      });
      voted = true;
    }

    const [{ count = 0 } = { count: 0 }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(goatVotes)
      .where(and(eq(goatVotes.category, category), eq(goatVotes.fighterId, normalizedFighterId)));

    return NextResponse.json({
      success: true,
      voted,
      fighter: {
        id: String(candidate.fighterId),
        fighterId: candidate.fighterId,
        name: formatNameKoEn(candidate.fullNameKo, candidate.fullName),
        imageUrl: candidate.imageUrl,
        voteCount: Number(count),
        voted,
      },
    });
  } catch (e) {
    console.error("[POST /api/mma-vote]", e);
    return NextResponse.json({ success: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
}
