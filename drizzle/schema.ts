import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "master"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const hymns = mysqlTable("hymns", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }),
  author: varchar("author", { length: 255 }),
  composer: varchar("composer", { length: 255 }),
  category: mysqlEnum("category", ["nacional", "militar", "pmam", "arma", "oracao"]).notNull(),
  lyrics: text("lyrics").notNull(),
  description: text("description"),
  youtubeUrl: varchar("youtubeUrl", { length: 500 }),
  audioUrl: varchar("audioUrl", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  likesCount: int("likesCount").default(0).notNull(),
  viewsCount: int("viewsCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hymn = typeof hymns.$inferSelect;
export type InsertHymn = typeof hymns.$inferInsert;

export const cfapMissions = mysqlTable("cfap_missions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  priority: mysqlEnum("priority", ["normal", "urgente", "critica"]).default("normal").notNull(),
  status: mysqlEnum("status", ["ativa", "cumprida", "inativa"]).default("ativa").notNull(),
  dueDate: date("dueDate"),
  isActive: boolean("isActive").default(true).notNull(),
  authorId: int("authorId"),
  likesCount: int("likesCount").default(0).notNull(),
  viewsCount: int("viewsCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CfapMission = typeof cfapMissions.$inferSelect;
export type InsertCfapMission = typeof cfapMissions.$inferInsert;

// Comentários (hinos e missões) - sem login, apenas nome
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  targetType: mysqlEnum("targetType", ["hymn", "mission"]).notNull(),
  targetId: int("targetId").notNull(),
  authorName: varchar("authorName", { length: 100 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// Likes (fingerprint via localStorage para evitar duplicatas)
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  targetType: mysqlEnum("targetType", ["hymn", "mission"]).notNull(),
  targetId: int("targetId").notNull(),
  visitorId: varchar("visitorId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
