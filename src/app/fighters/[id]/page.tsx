import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fighters } from "@/db/schema";
import { SITE_URL } from "@/lib/site";
import FighterDetailClient from "./fighter-detail-client";

interface FighterPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FighterPageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return {};

  const [row] = await db
    .select({
      fullName: fighters.fullName,
      fullNameKo: fighters.fullNameKo,
      nickname: fighters.nickname,
      nicknameKo: fighters.nicknameKo,
      weightClass: fighters.weightClass,
      nationality: fighters.nationality,
      careerWins: fighters.careerWins,
      careerLosses: fighters.careerLosses,
      careerDraws: fighters.careerDraws,
      imageUrl: fighters.imageUrl,
    })
    .from(fighters)
    .where(eq(fighters.id, numericId))
    .limit(1);

  if (!row) return {};

  const displayName = row.fullNameKo
    ? `${row.fullNameKo} (${row.fullName})`
    : row.fullName;
  const nicknamePart = row.nicknameKo ?? row.nickname;
  const record = `${row.careerWins}승 ${row.careerLosses}패 ${row.careerDraws}무`;
  const description = [
    record,
    row.weightClass,
    row.nationality,
    nicknamePart ? `별명: ${nicknamePart}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: displayName,
    description,
    alternates: { canonical: `/fighters/${numericId}` },
    openGraph: {
      title: displayName,
      description,
      url: `${SITE_URL}/fighters/${numericId}`,
      type: "profile",
      images: row.imageUrl ? [{ url: row.imageUrl }] : undefined,
    },
    twitter: {
      card: row.imageUrl ? "summary_large_image" : "summary",
      title: displayName,
      description,
      images: row.imageUrl ? [row.imageUrl] : undefined,
    },
  };
}

export default async function FighterPage({ params }: FighterPageProps) {
  const { id } = await params;
  return <FighterDetailClient id={id} />;
}
