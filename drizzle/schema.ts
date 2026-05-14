import {
  boolean,
  date,
  datetime,
  int,
  json,
  longtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Banco real em uso pelo sistema.
 * Estas tabelas `pmam_*` são as fontes ativas lidas/escritas pelo backend.
 */

export const pmamUsers = mysqlTable("pmam_users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("open_id", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("login_method", { length: 50 }),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  lastSignedIn: timestamp("last_signed_in"),
});

export type PmamUser = typeof pmamUsers.$inferSelect;
export type InsertPmamUser = typeof pmamUsers.$inferInsert;

export const pmamHymns = mysqlTable("pmam_hymns", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").unique(),
  title: varchar("title", { length: 255 }),
  subtitle: varchar("subtitle", { length: 255 }),
  author: varchar("author", { length: 255 }),
  composer: varchar("composer", { length: 255 }),
  category: varchar("category", { length: 100 }),
  collection: varchar("collection", { length: 64 }),
  lyrics: text("lyrics"),
  description: text("description"),
  youtubeUrl: varchar("youtube_url", { length: 255 }),
  audioUrl: varchar("audio_url", { length: 255 }),
  lyricsSync: json("lyrics_sync"),
  isActive: boolean("is_active").default(true),
  likesCount: int("likes_count").default(0),
  viewsCount: int("views_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PmamHymn = typeof pmamHymns.$inferSelect;
export type InsertPmamHymn = typeof pmamHymns.$inferInsert;

export const pmamCfapMissions = mysqlTable("pmam_cfap_missions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }),
  content: text("content"),
  attachmentsJson: longtext("attachments_json"),
  priority: varchar("priority", { length: 50 }),
  status: varchar("status", { length: 50 }),
  dueDate: timestamp("due_date"),
  isActive: boolean("is_active").default(true),
  authorId: int("author_id"),
  likesCount: int("likes_count").default(0),
  viewsCount: int("views_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PmamCfapMission = typeof pmamCfapMissions.$inferSelect;
export type InsertPmamCfapMission = typeof pmamCfapMissions.$inferInsert;

export const pmamDrill = mysqlTable("pmam_drill", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 255 }),
  description: longtext("description"),
  category: varchar("category", { length: 100 }),
  difficulty: varchar("difficulty", { length: 50 }).default("intermediario"),
  duration: int("duration"),
  videoUrl: varchar("video_url", { length: 255 }),
  pdfUrl: varchar("pdf_url", { length: 255 }),
  imageUrl: varchar("image_url", { length: 255 }),
  youtubeUrl: varchar("youtube_url", { length: 255 }),
  cornettaAudioUrl: varchar("cornetta_audio_url", { length: 255 }),
  content: longtext("content"),
  instructor: varchar("instructor", { length: 255 }),
  prerequisites: text("prerequisites"),
  learningOutcomes: longtext("learning_outcomes"),
  attachmentsJson: longtext("attachments_json"),
  isActive: boolean("is_active").default(true),
  likesCount: int("likes_count").default(0),
  viewsCount: int("views_count").default(0),
  authorId: int("author_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PmamDrill = typeof pmamDrill.$inferSelect;
export type InsertPmamDrill = typeof pmamDrill.$inferInsert;

export const pmamComments = mysqlTable("pmam_comments", {
  id: int("id").autoincrement().primaryKey(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: int("target_id"),
  authorName: varchar("author_name", { length: 255 }),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PmamComment = typeof pmamComments.$inferSelect;
export type InsertPmamComment = typeof pmamComments.$inferInsert;

export const pmamLikes = mysqlTable("pmam_likes", {
  id: int("id").autoincrement().primaryKey(),
  targetType: varchar("target_type", { length: 50 }),
  targetId: int("target_id"),
  visitorId: varchar("visitor_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PmamLike = typeof pmamLikes.$inferSelect;
export type InsertPmamLike = typeof pmamLikes.$inferInsert;

export const pmamSiteSettings = mysqlTable("pmam_site_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("setting_key", { length: 255 }).unique(),
  settingValue: text("setting_value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PmamSiteSetting = typeof pmamSiteSettings.$inferSelect;
export type InsertPmamSiteSetting = typeof pmamSiteSettings.$inferInsert;

export const pmamStudyStudents = mysqlTable("pmam_study_students", {
  id: int("id").autoincrement().primaryKey(),
  studentNumber: varchar("student_number", { length: 64 }).notNull().unique(),
  displayName: varchar("display_name", { length: 120 }),
  accessToken: varchar("access_token", { length: 128 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
});

export type PmamStudyStudent = typeof pmamStudyStudents.$inferSelect;
export type InsertPmamStudyStudent = typeof pmamStudyStudents.$inferInsert;

export const pmamStudyModuleProgress = mysqlTable(
  "pmam_study_module_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    studentNumber: varchar("student_number", { length: 64 }).notNull(),
    moduleSlug: varchar("module_slug", { length: 96 }).notNull(),
    completedSectionIds: longtext("completed_section_ids").notNull(),
    answersJson: longtext("answers_json").notNull(),
    lastScore: int("last_score"),
    bestScore: int("best_score"),
    lastSubmittedAt: datetime("last_submitted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => ({
    studentModuleUnique: uniqueIndex("uq_pmam_study_module_progress_student_module").on(
      table.studentNumber,
      table.moduleSlug,
    ),
  }),
);

export type PmamStudyModuleProgress = typeof pmamStudyModuleProgress.$inferSelect;
export type InsertPmamStudyModuleProgress = typeof pmamStudyModuleProgress.$inferInsert;

export const pmamMissionMedia = mysqlTable("pmam_mission_media", {
  id: int("id").autoincrement().primaryKey(),
  missionId: int("mission_id").notNull(),
  type: mysqlEnum("type", ["image", "video", "audio", "pdf", "document"]).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  url: varchar("url", { length: 512 }).notNull(),
  fileSize: int("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  duration: int("duration"),
  thumbnail: varchar("thumbnail", { length: 512 }),
  order: int("order").default(0),
  isActive: boolean("is_active").default(true),
  uploadedBy: int("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PmamMissionMedia = typeof pmamMissionMedia.$inferSelect;
export type InsertPmamMissionMedia = typeof pmamMissionMedia.$inferInsert;

export const pmamContent = mysqlTable("pmam_content", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["post", "news", "announcement", "highlight"]).notNull(),
  content: longtext("content"),
  imageUrl: varchar("image_url", { length: 512 }),
  videoUrl: varchar("video_url", { length: 512 }),
  audioUrl: varchar("audio_url", { length: 512 }),
  pdfUrl: varchar("pdf_url", { length: 512 }),
  position: int("position").default(0),
  isActive: boolean("is_active").default(true),
  isArchived: boolean("is_archived").default(false),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PmamContent = typeof pmamContent.$inferSelect;
export type InsertPmamContent = typeof pmamContent.$inferInsert;

export const pmamContentLayout = mysqlTable("pmam_content_layout", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("content_id").notNull(),
  section: varchar("section", { length: 100 }).notNull(),
  column: int("column").default(1),
  row: int("row").default(1),
  width: varchar("width", { length: 50 }).default("full"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  contentUnique: uniqueIndex("uq_pmam_content_layout_content").on(table.contentId),
}));

export type PmamContentLayout = typeof pmamContentLayout.$inferSelect;
export type InsertPmamContentLayout = typeof pmamContentLayout.$inferInsert;

export const runtimeTables = {
  pmamUsers,
  pmamHymns,
  pmamCfapMissions,
  pmamDrill,
  pmamComments,
  pmamLikes,
  pmamSiteSettings,
  pmamStudyStudents,
  pmamStudyModuleProgress,
  pmamMissionMedia,
  pmamContent,
  pmamContentLayout,
};

/**
 * Tabelas legadas preservadas no banco.
 * O sistema atual não deve depender delas para runtime normal.
 */

export const legacyUsers = mysqlTable("users", {
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

export type LegacyUser = typeof legacyUsers.$inferSelect;
export type InsertLegacyUser = typeof legacyUsers.$inferInsert;

export const legacyHymns = mysqlTable("hymns", {
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

export type LegacyHymn = typeof legacyHymns.$inferSelect;
export type InsertLegacyHymn = typeof legacyHymns.$inferInsert;

export const legacyCfapMissions = mysqlTable("cfap_missions", {
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

export type LegacyCfapMission = typeof legacyCfapMissions.$inferSelect;
export type InsertLegacyCfapMission = typeof legacyCfapMissions.$inferInsert;

export const legacyComments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  targetType: mysqlEnum("targetType", ["hymn", "mission"]).notNull(),
  targetId: int("targetId").notNull(),
  authorName: varchar("authorName", { length: 100 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LegacyComment = typeof legacyComments.$inferSelect;
export type InsertLegacyComment = typeof legacyComments.$inferInsert;

export const legacyLikes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  targetType: mysqlEnum("targetType", ["hymn", "mission"]).notNull(),
  targetId: int("targetId").notNull(),
  visitorId: varchar("visitorId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LegacyLike = typeof legacyLikes.$inferSelect;
export type InsertLegacyLike = typeof legacyLikes.$inferInsert;

export const legacySiteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LegacySiteSetting = typeof legacySiteSettings.$inferSelect;
export type InsertLegacySiteSetting = typeof legacySiteSettings.$inferInsert;

export const legacyTables = {
  legacyUsers,
  legacyHymns,
  legacyCfapMissions,
  legacyComments,
  legacyLikes,
  legacySiteSettings,
};
