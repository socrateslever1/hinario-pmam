import {
  boolean,
  date,
  datetime,
  decimal,
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
  openId: varchar("open_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("login_method", { length: 50 }),
  role: mysqlEnum("role", ["admin", "comandante_corpo", "comandante_cfap", "comandante_cia", "comandante_pel", "student"]).default("student"),
  pelotaoId: int("pelotao_id"),
  companhiaId: int("companhia_id"),
  forcePasswordChange: boolean("force_password_change").default(false),
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
  instrumentalYoutubeUrl: varchar("instrumental_youtube_url", { length: 512 }),
  audioUrl: text("audio_url"), // Suporta URLs de qualquer tamanho (MP3, WAV, OGG, M4A, etc.)
  instrumentalAudioUrl: text("instrumental_audio_url"),
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
  imageUrl: varchar("image_url", { length: 512 }),
  videoUrl: varchar("video_url", { length: 512 }),
  audioUrl: varchar("audio_url", { length: 512 }),
  pdfUrl: varchar("pdf_url", { length: 512 }),
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

export const pmamBlogPost = mysqlTable("pmam_blog_post", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: longtext("content").notNull(),
  imageUrl: varchar("image_url", { length: 512 }),
  youtubeUrl: varchar("youtube_url", { length: 512 }),
  authorId: int("author_id").notNull(),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PmamBlogPost = typeof pmamBlogPost.$inferSelect;
export type InsertPmamBlogPost = typeof pmamBlogPost.$inferInsert;

export const pmamGradeStudents = mysqlTable("pmam_grade_students", {
  id: int("id").autoincrement().primaryKey(),
  studentNumber: varchar("student_number", { length: 10 }).notNull().unique(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PmamGradeStudent = typeof pmamGradeStudents.$inferSelect;
export type InsertPmamGradeStudent = typeof pmamGradeStudents.$inferInsert;

export const pmamGradeDisciplines = mysqlTable("pmam_grade_disciplines", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("student_id").notNull(),
  disciplineName: varchar("discipline_name", { length: 255 }).notNull(),
  professorName: varchar("professor_name", { length: 255 }),
  grade: int("grade"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PmamGradeDiscipline = typeof pmamGradeDisciplines.$inferSelect;
export type InsertPmamGradeDiscipline = typeof pmamGradeDisciplines.$inferInsert;

export const pmamPostImages = mysqlTable("pmam_post_images", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("post_id"),
  url: varchar("url", { length: 512 }).notNull(),
  fileKey: varchar("file_key", { length: 512 }).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  width: int("width"),
  height: int("height"),
  alignment: varchar("alignment", { length: 20 }).default("center"),
  sizePercent: int("size_percent").default(100),
  mimeType: varchar("mime_type", { length: 100 }),
  fileSize: int("file_size"),
  uploadedBy: int("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PmamPostImage = typeof pmamPostImages.$inferSelect;
export type InsertPmamPostImage = typeof pmamPostImages.$inferInsert;

export const pmamStudents = mysqlTable("pmam_students", {
  id: int("id").autoincrement().primaryKey(),
  numerica: varchar("numerica", { length: 4 }).notNull().unique(),
  nomeGuerra: varchar("nome_guerra", { length: 255 }).notNull(),
  senha: varchar("senha", { length: 255 }).notNull(),
  sessionToken: varchar("session_token", { length: 128 }),
  companhia: int("companhia").notNull(), // 1-5
  peloton: int("peloton").notNull(), // 1-2
  nomeCompleto: varchar("nome_completo", { length: 255 }),
  rg: varchar("rg", { length: 20 }),
  email: varchar("email", { length: 255 }),
  fotoUrl: longtext("foto_url"), // Base64 ou URL da foto
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PmamStudent = typeof pmamStudents.$inferSelect;
export type InsertPmamStudent = typeof pmamStudents.$inferInsert;

export const pmamDisciplines = mysqlTable("pmam_disciplines", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("created_by").notNull(), // Admin ID
  isActive: boolean("is_active").default(true),
  startDate: date("start_date"),
  examDate: date("exam_date"),
  status: varchar("status", { length: 50 }).default("em_breve"),
  studyMaterialUrl: varchar("study_material_url", { length: 512 }),
  studyMaterialName: varchar("study_material_name", { length: 255 }),
  gaivotasLinks: text("gaivotas_links"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PmamDiscipline = typeof pmamDisciplines.$inferSelect;
export type InsertPmamDiscipline = typeof pmamDisciplines.$inferInsert;

export const pmamStudentGrades = mysqlTable("pmam_student_grades", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("student_id").notNull(),
  disciplineId: int("discipline_id").notNull(),
  professorName: varchar("professor_name", { length: 255 }),
  grade: decimal("grade", { precision: 3, scale: 1 }), // 0-10 com 1 casa decimal
  evaluationDate: date("evaluation_date"),
  observation: text("observation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PmamStudentGrade = typeof pmamStudentGrades.$inferSelect;
export type InsertPmamStudentGrade = typeof pmamStudentGrades.$inferInsert;

export const pmamFatoObservado = mysqlTable("pmam_fato_observado", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("student_id").notNull(),
  tipo: mysqlEnum("tipo", ["positive", "negative"]).notNull(), // FO+ ou FO-
  descricao: text("descricao").notNull(),
  data: date("data").notNull(),
  registradoPor: int("registrado_por").notNull(), // Xerife que registrou
  validadoPor: int("validado_por"), // Xerife que validou (opcional)
  status: mysqlEnum("status", ["pendente", "validado", "rejeitado"]).default("pendente"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PmamFatoObservado = typeof pmamFatoObservado.$inferSelect;
export type InsertPmamFatoObservado = typeof pmamFatoObservado.$inferInsert;

export const pmamFatoObservadoProvas = mysqlTable("pmam_fato_observado_provas", {
  id: int("id").autoincrement().primaryKey(),
  studentObservationId: int("student_observation_id"),
  arquivoUrl: longtext("arquivo_url").notNull(),
  tipo: mysqlEnum("tipo", ["foto", "video", "audio", "documento"]).default("foto"),
  nomeArquivo: varchar("nome_arquivo", { length: 255 }),
  tamanho: int("tamanho"), // em bytes
  mimeType: varchar("mime_type", { length: 100 }),
  dataUpload: timestamp("data_upload").defaultNow(),
  criadoPor: int("criado_por"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PmamFatoObservadoProva = typeof pmamFatoObservadoProvas.$inferSelect;
export type InsertPmamFatoObservadoProva = typeof pmamFatoObservadoProvas.$inferInsert;

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
  pmamBlogPost,
  pmamPostImages,
  pmamGradeStudents,
  pmamGradeDisciplines,
  pmamStudents,
  pmamDisciplines,
  pmamStudentGrades,
  pmamFatoObservado,
  pmamFatoObservadoProvas,
};


