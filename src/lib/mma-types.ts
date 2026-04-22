// ── DB 기반 MMA API 응답 타입 ──

export interface DbFighter {
  id: number;
  externalId: number | null;
  fullName: string;
  fullNameKo: string | null;
  nickname: string | null;
  nicknameKo: string | null;
  weightClass: string | null;
  nationality: string | null;
  nationalityKo: string | null;
  imageUrl: string | null;
  wins: number;
  losses: number;
  draws: number;
  noContests: number;
  winsByKo: number;
  winsBySub: number;
  winsByDec: number;
}

export interface DbOrgRecord {
  id: number;
  wins: number;
  losses: number;
  draws: number;
  noContests: number;
  winsByKo: number;
  winsBySub: number;
  winsByDec: number;
  orgSlug: string | null;
  orgName: string | null;
  orgNameKo: string | null;
}

export interface DbRecentFight {
  id: number;
  eventId: number;
  eventName: string | null;
  eventNameKo: string | null;
  eventDate: string | null;
  fighterAId: number;
  fighterBId: number;
  weightClass: string | null;
  isTitleFight: boolean;
  isMainEvent: boolean;
  winnerId: number | null;
  result: string | null;
  method: string | null;
  round: number | null;
  time: string | null;
}

export interface DbEventSummary {
  id: number;
  externalId: number | null;
  name: string;
  nameKo: string | null;
  eventDate: string | null;
  venue: string | null;
  venueKo: string | null;
  country: string | null;
  imageUrl: string | null;
  orgSlug: string | null;
  orgName: string | null;
  orgNameKo: string | null;
}

export interface DbFightCard {
  id: number;
  weightClass: string | null;
  isTitleFight: boolean;
  isMainEvent: boolean;
  result: string | null;
  method: string | null;
  round: number | null;
  time: string | null;
  winnerId: number | null;
  fighterAId: number;
  fighterAName: string | null;
  fighterANameKo: string | null;
  fighterAImage: string | null;
  fighterBId: number;
  fighterBName: string | null;
  fighterBNameKo: string | null;
  fighterBImage: string | null;
}
