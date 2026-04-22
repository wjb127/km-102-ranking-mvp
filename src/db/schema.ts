import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  uuid,
  numeric,
  date,
  jsonb,
  bigint,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** 카테고리 테이블 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  totalVotes: integer("total_votes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** 인물 테이블 */
export const persons = pgTable("persons", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 100 }).notNull(),
  photoUrl: text("photo_url"),
  nationality: varchar("nationality", { length: 50 }),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  voteCount: integer("vote_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** 투표 테이블 */
export const votes = pgTable(
  "votes",
  {
    id: serial("id").primaryKey(),
    personId: integer("person_id")
      .notNull()
      .references(() => persons.id),
    voterFingerprint: varchar("voter_fingerprint", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique("votes_person_voter_unique").on(table.personId, table.voterFingerprint)]
);

/** 댓글 테이블 */
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  content: text("content").notNull(),
  reportCount: integer("report_count").notNull().default(0),
  isHidden: boolean("is_hidden").notNull().default(false),
  writerFingerprint: varchar("writer_fingerprint", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** 신고 테이블 */
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id")
    .notNull()
    .references(() => comments.id),
  reason: text("reason"),
  reporterFingerprint: varchar("reporter_fingerprint", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** 관리자 테이블 */
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// =====================================================
// MMA 커뮤니티 스키마 (db/schema.sql 과 1:1 매핑)
// =====================================================

/** 사용자 (Auth.js 호환 + 자체 이메일/비번 로그인) */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    nickname: varchar("nickname", { length: 50 }).notNull().unique(),
    passwordHash: text("password_hash"),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    image: text("image"),
    role: varchar("role", { length: 20 }).notNull().default("user"),
    isBanned: boolean("is_banned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_users_nickname").on(t.nickname)]
);

/** Auth.js OAuth 계정 연결 */
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: bigint("expires_at", { mode: "number" }),
    tokenType: varchar("token_type", { length: 50 }),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (t) => [uniqueIndex("accounts_provider_account_unique").on(t.provider, t.providerAccountId)]
);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

/** MMA 단체 */
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  nameKo: varchar("name_ko", { length: 100 }),
});

/** 선수 */
export const fighters = pgTable(
  "fighters",
  {
    id: serial("id").primaryKey(),
    externalId: integer("external_id").unique(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    fullNameKo: varchar("full_name_ko", { length: 200 }),
    nickname: varchar("nickname", { length: 100 }),
    nicknameKo: varchar("nickname_ko", { length: 100 }),
    weightClass: varchar("weight_class", { length: 50 }),
    nationality: varchar("nationality", { length: 100 }),
    nationalityKo: varchar("nationality_ko", { length: 100 }),
    birthDate: date("birth_date"),
    heightCm: numeric("height_cm", { precision: 5, scale: 2 }),
    reachCm: numeric("reach_cm", { precision: 5, scale: 2 }),
    imageUrl: text("image_url"),
    bio: text("bio"),
    bioKo: text("bio_ko"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_fighters_full_name").on(t.fullName),
    index("idx_fighters_weight_class").on(t.weightClass),
  ]
);

/** 단체별 전적 (이적 시 분리 누적) */
export const fighterOrgRecords = pgTable(
  "fighter_org_records",
  {
    id: serial("id").primaryKey(),
    fighterId: integer("fighter_id")
      .notNull()
      .references(() => fighters.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    draws: integer("draws").notNull().default(0),
    noContests: integer("no_contests").notNull().default(0),
    winsByKo: integer("wins_by_ko").notNull().default(0),
    winsBySub: integer("wins_by_sub").notNull().default(0),
    winsByDec: integer("wins_by_dec").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("for_fighter_org_unique").on(t.fighterId, t.organizationId)]
);

/** 이벤트 */
export const mmaEvents = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    externalId: integer("external_id").unique(),
    organizationId: integer("organization_id").references(() => organizations.id),
    name: varchar("name", { length: 255 }).notNull(),
    nameKo: varchar("name_ko", { length: 255 }),
    eventDate: timestamp("event_date", { withTimezone: true }),
    venue: varchar("venue", { length: 255 }),
    venueKo: varchar("venue_ko", { length: 255 }),
    country: varchar("country", { length: 100 }),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_events_date").on(t.eventDate)]
);

/** 경기 */
export const fights = pgTable(
  "fights",
  {
    id: serial("id").primaryKey(),
    externalId: integer("external_id").unique(),
    eventId: integer("event_id")
      .notNull()
      .references(() => mmaEvents.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id").references(() => organizations.id),
    fighterAId: integer("fighter_a_id")
      .notNull()
      .references(() => fighters.id),
    fighterBId: integer("fighter_b_id")
      .notNull()
      .references(() => fighters.id),
    weightClass: varchar("weight_class", { length: 50 }),
    isTitleFight: boolean("is_title_fight").notNull().default(false),
    isMainEvent: boolean("is_main_event").notNull().default(false),
    winnerId: integer("winner_id").references(() => fighters.id),
    result: varchar("result", { length: 20 }),
    method: text("method"),
    round: integer("round"),
    time: varchar("time", { length: 10 }),
    isVoid: boolean("is_void").notNull().default(false),
    isAppliedToRecord: boolean("is_applied_to_record").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_fights_event").on(t.eventId),
    index("idx_fights_fighters").on(t.fighterAId, t.fighterBId),
  ]
);

/** 관리자 수동 보정 로그 */
export const adminOverrides = pgTable(
  "admin_overrides",
  {
    id: serial("id").primaryKey(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => users.id),
    targetType: varchar("target_type", { length: 50 }).notNull(),
    targetId: integer("target_id").notNull(),
    reason: text("reason").notNull(),
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_overrides_target").on(t.targetType, t.targetId)]
);

/** GOAT 투표 */
export const goatVotes = pgTable(
  "goat_votes",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    fingerprint: varchar("fingerprint", { length: 100 }),
    category: varchar("category", { length: 30 }).notNull(),
    fighterId: integer("fighter_id")
      .notNull()
      .references(() => fighters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("votes_user_category_unique").on(t.userId, t.category),
    uniqueIndex("votes_fp_category_unique").on(t.fingerprint, t.category),
    index("idx_votes_fighter_cat").on(t.fighterId, t.category),
  ]
);

/** 게시판 */
export const boardPosts = pgTable(
  "board_posts",
  {
    id: serial("id").primaryKey(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    authorNickname: varchar("author_nickname", { length: 50 }).notNull(),
    category: varchar("category", { length: 20 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    imageUrls: text("image_urls").array().default(sql`'{}'::text[]`),
    viewCount: integer("view_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_posts_category").on(t.category, t.createdAt),
    index("idx_posts_created").on(t.createdAt),
    index("idx_posts_hot").on(t.likeCount, t.createdAt),
  ]
);

/** 게시글 추천 */
export const postLikes = pgTable(
  "post_likes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => boardPosts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    fingerprint: varchar("fingerprint", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("post_likes_user_unique").on(t.postId, t.userId),
    uniqueIndex("post_likes_fp_unique").on(t.postId, t.fingerprint),
  ]
);

/** MMA 댓글 (폴리모픽: post | fighter | event | fight) */
export const mmaComments = pgTable(
  "mma_comments",
  {
    id: serial("id").primaryKey(),
    targetType: varchar("target_type", { length: 20 }).notNull(),
    targetId: integer("target_id").notNull(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    authorNickname: varchar("author_nickname", { length: 50 }).notNull(),
    parentId: integer("parent_id"),
    content: text("content").notNull(),
    likeCount: integer("like_count").notNull().default(0),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_mma_comments_target").on(t.targetType, t.targetId, t.createdAt)]
);

/** MMA 댓글 신고 */
export const mmaCommentReports = pgTable("mma_comment_reports", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id")
    .notNull()
    .references(() => mmaComments.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  reporterFingerprint: varchar("reporter_fingerprint", { length: 100 }),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** 쪽지 */
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    isDeletedSender: boolean("is_deleted_sender").notNull().default(false),
    isDeletedReceiver: boolean("is_deleted_receiver").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_msg_receiver").on(t.receiverId, t.isRead, t.createdAt),
    index("idx_msg_sender").on(t.senderId, t.createdAt),
  ]
);

/** 번역 캐시 */
export const translations = pgTable(
  "translations",
  {
    id: serial("id").primaryKey(),
    sourceHash: varchar("source_hash", { length: 64 }).notNull(),
    sourceLang: varchar("source_lang", { length: 5 }).notNull().default("en"),
    targetLang: varchar("target_lang", { length: 5 }).notNull().default("ko"),
    sourceText: text("source_text").notNull(),
    translatedText: text("translated_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("translations_hash_lang_unique").on(t.sourceHash, t.sourceLang, t.targetLang),
  ]
);
