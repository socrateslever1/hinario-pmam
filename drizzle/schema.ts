import {
  boolean,
  date,
  datetime,
  decimal,
  index,
  int,
  json,
  longtext,
  mysqlEnum,
  mysqlTable,
  primaryKey,
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
  role: mysqlEnum("role", ["master", "admin", "comandante_corpo", "subcomandante_corpo", "comandante_cfap", "subcomandante_cfap", "comandante_cia", "comandante_pel", "student"]).default("student"),
  pelotaoId: int("pelotao_id"),
  companhiaId: int("companhia_id"),
  forcePasswordChange: boolean("force_password_change").default(false),
  isActive: boolean("is_active").notNull().default(true),
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
  audioUrl: longtext("audio_url"), // Suporta URLs de qualquer tamanho (MP3, WAV, OGG, M4A, Base64 Data URL, etc.)
  instrumentalAudioUrl: longtext("instrumental_audio_url"),
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
  imageUrl: longtext("image_url"),
  videoUrl: longtext("video_url"),
  audioUrl: longtext("audio_url"),
  pdfUrl: longtext("pdf_url"),
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
  videoUrl: longtext("video_url"),
  pdfUrl: longtext("pdf_url"),
  imageUrl: longtext("image_url"),
  youtubeUrl: varchar("youtube_url", { length: 255 }),
  cornettaAudioUrl: longtext("cornetta_audio_url"),
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

export const pmamBugleCalls = mysqlTable("pmam_bugle_calls", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  audioUrl: longtext("audio_url"),
  iconKey: varchar("icon_key", { length: 64 }).default("music"),
  troopState: varchar("troop_state", { length: 120 }),
  category: varchar("category", { length: 100 }).default("geral"),
  sourceUrl: longtext("source_url"),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PmamBugleCall = typeof pmamBugleCalls.$inferSelect;
export type InsertPmamBugleCall = typeof pmamBugleCalls.$inferInsert;

export const pmamMarches = mysqlTable("pmam_marches", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  composer: varchar("composer", { length: 255 }),
  audioUrl: longtext("audio_url"),
  sourceUrl: longtext("source_url"),
  sortOrder: int("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PmamMarch = typeof pmamMarches.$inferSelect;
export type InsertPmamMarch = typeof pmamMarches.$inferInsert;

export const pmamVoiceProfiles = mysqlTable("pmam_voice_profiles", {
  profileKey: varchar("profile_key", { length: 128 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  photoUrl: longtext("photo_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  activeIdx: index("idx_pmam_voice_profiles_active").on(table.isActive),
}));

export type PmamVoiceProfile = typeof pmamVoiceProfiles.$inferSelect;
export type InsertPmamVoiceProfile = typeof pmamVoiceProfiles.$inferInsert;

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

export const pmamCfapHistory = mysqlTable("pmam_cfap_history", {
  slug: varchar("slug", { length: 160 }).primaryKey(),
  rank: varchar("rank_name", { length: 80 }).notNull(),
  name: varchar("full_name", { length: 255 }).notNull(),
  periodsJson: longtext("periods_json").notNull(),
  portraitUrl: longtext("portrait_url"),
  biography: longtext("biography"),
  highlightsJson: longtext("highlights_json").notNull(),
  videosJson: longtext("videos_json").notNull(),
  sourcesJson: longtext("sources_json").notNull(),
  inMemoriam: boolean("in_memoriam").notNull().default(false),
  isVisible: boolean("is_visible").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  updatedBy: int("updated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => ({
  visibleOrderIdx: index("idx_pmam_cfap_history_visible_order").on(table.isVisible, table.sortOrder),
}));

export type PmamCfapHistory = typeof pmamCfapHistory.$inferSelect;
export type InsertPmamCfapHistory = typeof pmamCfapHistory.$inferInsert;

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
  registrationStatus: mysqlEnum("registration_status", ["available", "active", "blocked"]).notNull().default("active"),
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

export const pmamOrdemUnidaAudios = mysqlTable("pmam_ordem_unida_audios", {
  id: int("id").autoincrement().primaryKey(),
  itemId: varchar("item_id", { length: 128 }).notNull(),
  itemTitle: varchar("item_title", { length: 255 }).notNull(),
  itemType: mysqlEnum("item_type", ["corneta", "dobrado", "voz"]).notNull(),
  audioUrl: longtext("audio_url").notNull(),
  fileKey: varchar("file_key", { length: 512 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: int("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  duration: int("duration"),
  voiceProfileKey: varchar("voice_profile_key", { length: 128 }).notNull().default("default"),
  voiceAuthorName: varchar("voice_author_name", { length: 255 }),
  voiceAuthorPhotoUrl: longtext("voice_author_photo_url"),
  isActive: boolean("is_active").default(true),
  uploadedBy: int("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  itemVoiceProfileUnique: uniqueIndex("uq_pmam_ordem_unida_audios_item_voice").on(table.itemId, table.voiceProfileKey),
}));

export type PmamOrdemUnidaAudio = typeof pmamOrdemUnidaAudios.$inferSelect;
export type InsertPmamOrdemUnidaAudio = typeof pmamOrdemUnidaAudios.$inferInsert;

export const pmamAdministrativeDaily = mysqlTable(
  "pmam_administrative_daily",
  {
    id: int("id").autoincrement().primaryKey(),
    date: date("date").notNull(),
    companhia: int("companhia").notNull(),
    peloton: int("peloton").notNull(),
    locationStatus: varchar("location_status", { length: 32 }).notNull().default("sala"),
    formationStatus: varchar("formation_status", { length: 32 }).notNull().default("nao_informado"),
    lunchStatus: varchar("lunch_status", { length: 32 }).notNull().default("nao_informado"),
    snackStatus: varchar("snack_status", { length: 32 }).notNull().default("nao_informado"),
    ranchAdvance: boolean("ranch_advance").notNull().default(false),
    punishmentSummary: text("punishment_summary"),
    factsSummary: text("facts_summary"),
    pendingSummary: text("pending_summary"),
    pendingResolvedAt: timestamp("pending_resolved_at"),
    updatedBy: int("updated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("uq_pmam_administrative_daily_scope").on(t.date, t.companhia, t.peloton),
    index("idx_pmam_administrative_daily_pending").on(t.pendingResolvedAt, t.date),
  ]
);

export type PmamAdministrativeDaily = typeof pmamAdministrativeDaily.$inferSelect;
export type InsertPmamAdministrativeDaily = typeof pmamAdministrativeDaily.$inferInsert;

export const pmamAdministrativeWeeklyConfig = mysqlTable(
  "pmam_administrative_weekly_config",
  {
    companhia: int("companhia").notNull(),
    peloton: int("peloton").notNull(),
    ranchWeekdays: varchar("ranch_weekdays", { length: 32 }).notNull().default(""),
    lunchWeekdays: varchar("lunch_weekdays", { length: 32 }).notNull().default(""),
    snackWeekdays: varchar("snack_weekdays", { length: 32 }).notNull().default(""),
    updatedBy: int("updated_by"),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.companhia, t.peloton] }),
  ]
);

export type PmamAdministrativeWeeklyConfig = typeof pmamAdministrativeWeeklyConfig.$inferSelect;
export type InsertPmamAdministrativeWeeklyConfig = typeof pmamAdministrativeWeeklyConfig.$inferInsert;

export const pmamUploadRegistry = mysqlTable(
  "pmam_upload_registry",
  {
    id: int("id").autoincrement().primaryKey(),
    fileKey: varchar("file_key", { length: 700 }).notNull(),
    fileUrl: longtext("file_url").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    fileSize: int("file_size").notNull(),
    folder: varchar("folder", { length: 160 }).notNull(),
    status: mysqlEnum("status", ["stored", "linked", "deleted", "failed"]).notNull().default("stored"),
    uploadedBy: int("uploaded_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [
    uniqueIndex("uq_pmam_upload_registry_key").on(t.fileKey),
    index("idx_pmam_upload_registry_status").on(t.status, t.createdAt),
    index("idx_pmam_upload_registry_user").on(t.uploadedBy, t.createdAt),
  ],
);

export const pmamAditamentos = mysqlTable(
  "pmam_aditamentos",
  {
    id: int("id").autoincrement().primaryKey(),
    companhia: int("companhia").notNull(),
    peloton: int("peloton").notNull(),
    titulo: varchar("titulo", { length: 255 }).notNull(),
    conteudo: text("conteudo"),
    data: date("data").notNull(),
    pdfUrl: varchar("pdf_url", { length: 512 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [index("idx_pmam_aditamentos_scope").on(t.companhia, t.peloton, t.data)],
);

export const pmamStudentBaixadoDocuments = mysqlTable(
  "pmam_student_baixado_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    studentId: int("student_id").notNull(),
    companhia: int("companhia").notNull(),
    peloton: int("peloton").notNull(),
    fileUrl: longtext("file_url").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    fileSize: int("file_size"),
    note: varchar("note", { length: 1000 }),
    baixadoKind: varchar("baixado_kind", { length: 40 }).notNull().default("informativo"),
    hpmHomologated: boolean("hpm_homologated").notNull().default(false),
    uploadedBy: int("uploaded_by"),
    uploadedByStudentId: int("uploaded_by_student_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_pmam_baixado_docs_student").on(t.studentId, t.createdAt),
    index("idx_pmam_baixado_docs_scope").on(t.companhia, t.peloton, t.createdAt),
  ],
);

export const pmamFileObjects = mysqlTable(
  "pmam_file_objects",
  {
    fileKey: varchar("file_key", { length: 700 }).primaryKey(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    fileSize: int("file_size").notNull(),
    chunkSize: int("chunk_size").notNull(),
    totalChunks: int("total_chunks").notNull(),
    status: mysqlEnum("status", ["uploading", "ready", "failed"]).notNull().default("uploading"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => [index("idx_pmam_file_objects_status").on(t.status, t.updatedAt)],
);

export const pmamFileObjectChunks = mysqlTable(
  "pmam_file_object_chunks",
  {
    fileKey: varchar("file_key", { length: 700 }).notNull(),
    chunkIndex: int("chunk_index").notNull(),
    dataBase64: longtext("data_base64").notNull(),
  },
  (t) => [primaryKey({ columns: [t.fileKey, t.chunkIndex] })],
);

export const runtimeTables = {
  pmamUsers,
  pmamHymns,
  pmamCfapMissions,
  pmamDrill,
  pmamBugleCalls,
  pmamMarches,
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
  pmamOrdemUnidaAudios,
  pmamAdministrativeDaily,
  pmamAdministrativeWeeklyConfig,
  pmamUploadRegistry,
  pmamAditamentos,
  pmamStudentBaixadoDocuments,
  pmamFileObjects,
  pmamFileObjectChunks,
};


