import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

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
