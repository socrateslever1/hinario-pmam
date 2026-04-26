import { query } from "./mysql";
import { ENV } from './_core/env';
import { nanoid } from "nanoid";
import type { StudyDashboard, StudyModuleProgressRecord, StudyStudent, StudyStudentSession } from "../shared/types";
import { isValidStudyStudentNumber, normalizeStudyStudentNumber } from "../shared/study";

// Helper to map snake_case to camelCase
function mapUser(u: any) {
  if (!u) return u;
  return {
    id: u.id,
    openId: u.open_id,
    name: u.name,
    email: u.email,
    password: u.password,
    loginMethod: u.login_method,
    role: u.role,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    lastSignedIn: u.last_signed_in
  };
}

function normalizeCategory(category: unknown) {
  if (typeof category !== "string") return category;
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function mapHymn(h: any) {
  if (!h) return h;
  // Handle lyricsSync potential string/object parsing
  let lyricsSync = h.lyrics_sync;
  if (typeof lyricsSync === 'string') {
    try {
      lyricsSync = JSON.parse(lyricsSync);
    } catch {
      lyricsSync = null;
    }
  }
  
  return {
    id: h.id,
    number: h.number,
    title: h.title,
    subtitle: h.subtitle,
    author: h.author,
    composer: h.composer,
    category: normalizeCategory(h.category),
    collection: h.collection,
    lyrics: h.lyrics,
    description: h.description,
    youtubeUrl: h.youtube_url,
    audioUrl: h.audio_url,
    lyricsSync,
    isActive: h.is_active === 1 || h.is_active === true,
    likesCount: h.likes_count,
    viewsCount: h.views_count,
    createdAt: h.created_at,
    updatedAt: h.updated_at
  };
}

function mapMission(m: any) {
  if (!m) return m;
  return {
    id: m.id,
    title: m.title,
    content: m.content,
    priority: m.priority,
    status: m.status,
    dueDate: m.due_date,
    isActive: m.is_active === 1 || m.is_active === true,
    authorId: m.author_id,
    likesCount: m.likes_count,
    viewsCount: m.views_count,
    commentsCount: Number(m.comments_count || 0),
    visitorReacted: Boolean(m.visitor_reacted),
    createdAt: m.created_at,
    updatedAt: m.updated_at
  };
}

function mapComment(c: any) {
  if (!c) return c;
  return {
    id: c.id,
    targetType: c.target_type,
    targetId: c.target_id,
    authorName: c.author_name,
    content: c.content,
    createdAt: c.created_at,
  };
}

function mapDrill(d: any) {
  if (!d) return d;
  let attachmentsJson = d.attachments_json;
  if (typeof attachmentsJson === 'string') {
    try {
      attachmentsJson = JSON.parse(attachmentsJson);
    } catch {
      attachmentsJson = null;
    }
  }
  
  return {
    id: d.id,
    title: d.title,
    subtitle: d.subtitle,
    description: d.description,
    category: d.category,
    difficulty: d.difficulty,
    duration: d.duration,
    videoUrl: d.video_url,
    pdfUrl: d.pdf_url,
    imageUrl: d.image_url,
    content: d.content,
    instructor: d.instructor,
    prerequisites: d.prerequisites,
    learningOutcomes: d.learning_outcomes,
    attachmentsJson,
    isActive: d.is_active === 1 || d.is_active === true,
    likesCount: d.likes_count,
    viewsCount: d.views_count,
    authorId: d.author_id,
    createdAt: d.created_at,
    updatedAt: d.updated_at
  };
}

export const STUDY_ACCESS_TOKEN_MISMATCH = "STUDY_ACCESS_TOKEN_MISMATCH";

function safeParseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapStudyStudent(row: any): StudyStudent | null {
  if (!row) return null;
  return {
    id: row.id,
    studentNumber: row.student_number,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActiveAt: row.last_active_at,
  };
}

function mapStudyModuleProgress(row: any): StudyModuleProgressRecord | null {
  if (!row) return null;
  return {
    moduleSlug: row.module_slug,
    completedSectionIds: safeParseJson<string[]>(row.completed_section_ids, []),
    answers: safeParseJson<Record<string, string | string[] | null>>(row.answers_json, {}),
    lastScore: row.last_score === null || row.last_score === undefined ? null : Number(row.last_score),
    bestScore: row.best_score === null || row.best_score === undefined ? null : Number(row.best_score),
    lastSubmittedAt: row.last_submitted_at ? new Date(row.last_submitted_at).toISOString() : null,
    updatedAt: row.updated_at ?? null,
  };
}

let studySchemaPromise: Promise<void> | null = null;

async function ensureStudyColumn(
  tableName: string,
  columnName: string,
  columnDefinitionSql: string
) {
  const rows = await query<{ Field: string }>(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
  if (rows.length === 0) {
    await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinitionSql}`);
  }
}

function createStudyAccessToken() {
  return nanoid(48);
}

export async function ensureStudyTables() {
  if (!studySchemaPromise) {
    studySchemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_study_students (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_number VARCHAR(64) NOT NULL,
          display_name VARCHAR(120) NULL,
          access_token VARCHAR(128) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_study_students_number (student_number)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_study_module_progress (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_number VARCHAR(64) NOT NULL,
          module_slug VARCHAR(96) NOT NULL,
          completed_section_ids LONGTEXT NOT NULL,
          answers_json LONGTEXT NOT NULL,
          last_score INT NULL,
          best_score INT NULL,
          last_submitted_at DATETIME NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_study_module_progress_student_module (student_number, module_slug),
          KEY idx_pmam_study_module_progress_student (student_number),
          KEY idx_pmam_study_module_progress_module (module_slug)
        )
      `);

      await ensureStudyColumn("pmam_study_students", "access_token", "access_token VARCHAR(128) NULL AFTER display_name");

      const missingTokens = await query<{ id: number }>(
        `SELECT id FROM pmam_study_students WHERE access_token IS NULL OR access_token = ''`
      );

      for (const row of missingTokens) {
        await query(
          `UPDATE pmam_study_students SET access_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [createStudyAccessToken(), row.id]
        );
      }
    })().catch((error) => {
      studySchemaPromise = null;
      throw error;
    });
  }

  await studySchemaPromise;
}

export async function upsertUser(user: any): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  
  const lastSignedIn = user.lastSignedIn ? new Date(user.lastSignedIn) : new Date();
  const normalizedEmail = typeof user.email === "string"
    ? user.email.trim().toLowerCase()
    : null;
  const resolvedRole = user.role ?? (user.openId === ENV.ownerOpenId ? "master" : undefined);

  const columns = ["open_id", "last_signed_in"];
  const placeholders = ["?", "?"];
  const params: any[] = [user.openId, lastSignedIn];
  const updates = ["last_signed_in = VALUES(last_signed_in)", "updated_at = CURRENT_TIMESTAMP"];

  if (user.name !== undefined) {
    columns.push("name");
    placeholders.push("?");
    params.push(user.name ?? null);
    updates.push("name = VALUES(name)");
  }

  if (user.email !== undefined) {
    columns.push("email");
    placeholders.push("?");
    params.push(normalizedEmail);
    updates.push("email = VALUES(email)");
  }

  if (user.loginMethod !== undefined) {
    columns.push("login_method");
    placeholders.push("?");
    params.push(user.loginMethod ?? null);
    updates.push("login_method = VALUES(login_method)");
  }

  if (user.password !== undefined) {
    columns.push("password");
    placeholders.push("?");
    params.push(user.password ?? null);
    updates.push("password = VALUES(password)");
  }

  if (resolvedRole !== undefined) {
    columns.push("role");
    placeholders.push("?");
    params.push(resolvedRole);
    updates.push("role = VALUES(role)");
  }

  const sql = `
    INSERT INTO pmam_users (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    ON DUPLICATE KEY UPDATE ${updates.join(", ")}
  `;

  await query(sql, params);
}

export async function getUserByOpenId(openId: string) {
  const rows = await query('SELECT * FROM pmam_users WHERE open_id = ? LIMIT 1', [openId]);
  return mapUser(rows[0]);
}

// ===== HYMNS =====
export async function getAllHymns() {
  const rows = await query('SELECT * FROM pmam_hymns ORDER BY number ASC');
  return rows.map(mapHymn);
}

export async function getActiveHymns() {
  const rows = await query(
    "SELECT * FROM pmam_hymns WHERE is_active = 1 AND (collection IS NULL OR collection <> 'tfm') ORDER BY number ASC"
  );
  return rows.map(mapHymn);
}

export async function getHymnById(id: number) {
  const rows = await query('SELECT * FROM pmam_hymns WHERE id = ? LIMIT 1', [id]);
  return mapHymn(rows[0]);
}

export async function getHymnByNumber(number: number) {
  const rows = await query('SELECT * FROM pmam_hymns WHERE number = ? LIMIT 1', [number]);
  return mapHymn(rows[0]);
}

export async function getHymnsByCategory(category: string) {
  const rows = await query(
    "SELECT * FROM pmam_hymns WHERE category = ? AND is_active = 1 AND (collection IS NULL OR collection <> 'tfm') ORDER BY number ASC",
    [category]
  );
  return rows.map(mapHymn);
}

export async function getHymnsByCollection(collection: string) {
  const rows = await query(
    'SELECT * FROM pmam_hymns WHERE collection = ? AND is_active = 1 ORDER BY number ASC',
    [collection]
  );
  return rows.map(mapHymn);
}

export async function createHymn(hymn: any) {
  const lyricsSync = hymn.lyricsSync ? JSON.stringify(hymn.lyricsSync) : null;
  const sql = `
    INSERT INTO pmam_hymns 
    (number, title, subtitle, author, composer, category, collection, lyrics, description, youtube_url, audio_url, lyrics_sync, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [
    hymn.number,
    hymn.title,
    hymn.subtitle || null,
    hymn.author || null,
    hymn.composer || null,
    hymn.category,
    hymn.collection || null,
    hymn.lyrics,
    hymn.description || null,
    hymn.youtubeUrl || null,
    hymn.audioUrl || null,
    lyricsSync,
    hymn.isActive ?? 1
  ]);

  return result;
}

export async function updateHymn(id: number, hymn: any) {
  const updates: string[] = [];
  const params: any[] = [];

  const fields: Record<string, string> = {
    number: 'number',
    title: 'title',
    subtitle: 'subtitle',
    author: 'author',
    composer: 'composer',
    category: 'category',
    collection: 'collection',
    lyrics: 'lyrics',
    description: 'description',
    youtubeUrl: 'youtube_url',
    audioUrl: 'audio_url',
    isActive: 'is_active'
  };

  for (const [key, dbKey] of Object.entries(fields)) {
    if (hymn[key] !== undefined) {
      updates.push(`${dbKey} = ?`);
      let val = hymn[key];
      if (key === 'isActive') val = val ? 1 : 0;
      params.push(val);
    }
  }

  if (hymn.lyricsSync !== undefined) {
    updates.push(`lyrics_sync = ?`);
    params.push(hymn.lyricsSync ? JSON.stringify(hymn.lyricsSync) : null);
  }

  if (updates.length === 0) return;

  const sql = `UPDATE pmam_hymns SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await query(sql, params);
}

export async function deleteHymn(id: number) {
  await query('DELETE FROM pmam_hymns WHERE id = ?', [id]);
}

// ===== MISSIONS =====
function buildMissionSelectSql(activeOnly: boolean, includeVisitorReaction: boolean) {
  const activeFilter = activeOnly ? "WHERE mission.is_active = 1" : "";
  const visitorReactionSelect = includeVisitorReaction ? `, EXISTS(
    SELECT 1
    FROM pmam_likes likes
    WHERE likes.target_type = 'mission'
      AND likes.target_id = mission.id
      AND likes.visitor_id = ?
  ) AS visitor_reacted` : ", 0 AS visitor_reacted";

  return `
    SELECT
      mission.*,
      (
        SELECT COUNT(*)
        FROM pmam_comments comments
        WHERE comments.target_type = 'mission'
          AND comments.target_id = mission.id
      ) AS comments_count
      ${visitorReactionSelect}
    FROM pmam_cfap_missions mission
    ${activeFilter}
    ORDER BY mission.created_at DESC
  `;
}

export async function getAllMissions(visitorId?: string | null) {
  const rows = await query(
    buildMissionSelectSql(false, Boolean(visitorId)),
    visitorId ? [visitorId] : []
  );
  return rows.map(mapMission);
}

export async function getActiveMissions(visitorId?: string | null) {
  const rows = await query(
    buildMissionSelectSql(true, Boolean(visitorId)),
    visitorId ? [visitorId] : []
  );
  return rows.map(mapMission);
}

export async function getMissionById(id: number, visitorId?: string | null) {
  const sql = `
    SELECT
      mission.*,
      (
        SELECT COUNT(*)
        FROM pmam_comments comments
        WHERE comments.target_type = 'mission'
          AND comments.target_id = mission.id
      ) AS comments_count
      ${visitorId ? `, EXISTS(
        SELECT 1
        FROM pmam_likes likes
        WHERE likes.target_type = 'mission'
          AND likes.target_id = mission.id
          AND likes.visitor_id = ?
      ) AS visitor_reacted` : ", 0 AS visitor_reacted"}
    FROM pmam_cfap_missions mission
    WHERE mission.id = ?
    LIMIT 1
  `;
  const rows = await query(sql, visitorId ? [visitorId, id] : [id]);
  return mapMission(rows[0]);
}

export async function createMission(mission: any) {
  const sql = `
    INSERT INTO pmam_cfap_missions 
    (title, content, priority, status, due_date, is_active, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [
    mission.title,
    mission.content,
    mission.priority || 'normal',
    mission.status || 'ativa',
    mission.dueDate || null,
    mission.isActive ?? 1,
    mission.authorId || null
  ]);

  return result;
}

export async function updateMission(id: number, mission: any) {
  const updates: string[] = [];
  const params: any[] = [];

  const fields: Record<string, string> = {
    title: 'title',
    content: 'content',
    priority: 'priority',
    status: 'status',
    dueDate: 'due_date',
    isActive: 'is_active'
  };

  for (const [key, dbKey] of Object.entries(fields)) {
    if (mission[key] !== undefined) {
      updates.push(`${dbKey} = ?`);
      let val = mission[key];
      if (key === 'isActive') val = val ? 1 : 0;
      params.push(val);
    }
  }

  if (updates.length === 0) return;

  const sql = `UPDATE pmam_cfap_missions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await query(sql, params);
}

export async function deleteMission(id: number) {
  await query('DELETE FROM pmam_cfap_missions WHERE id = ?', [id]);
}

export async function getMissionComments(missionId: number) {
  const rows = await query(
    'SELECT * FROM pmam_comments WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC',
    ['mission', missionId]
  );
  return rows.map(mapComment);
}

export async function createMissionComment(missionId: number, authorName: string, content: string) {
  await query(
    'INSERT INTO pmam_comments (target_type, target_id, author_name, content) VALUES (?, ?, ?, ?)',
    ['mission', missionId, authorName, content]
  );
}

export async function deleteMissionComment(commentId: number) {
  await query('DELETE FROM pmam_comments WHERE id = ?', [commentId]);
}

export async function toggleMissionReaction(missionId: number, visitorId: string) {
  const existing = await query(
    'SELECT id FROM pmam_likes WHERE target_type = ? AND target_id = ? AND visitor_id = ? LIMIT 1',
    ['mission', missionId, visitorId]
  );

  if (existing.length > 0) {
    await query(
      'DELETE FROM pmam_likes WHERE target_type = ? AND target_id = ? AND visitor_id = ?',
      ['mission', missionId, visitorId]
    );
    return { liked: false };
  } else {
    await query(
      'INSERT INTO pmam_likes (target_type, target_id, visitor_id) VALUES (?, ?, ?)',
      ['mission', missionId, visitorId]
    );
    return { liked: true };
  }
}

// ===== COMMENTS =====
export async function getHymnComments(hymnId: number) {
  const rows = await query(
    'SELECT * FROM pmam_comments WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC',
    ['hymn', hymnId]
  );
  return rows.map(mapComment);
}

export async function createHymnComment(hymnId: number, authorName: string, content: string) {
  await query(
    'INSERT INTO pmam_comments (target_type, target_id, author_name, content) VALUES (?, ?, ?, ?)',
    ['hymn', hymnId, authorName, content]
  );
}

export async function deleteHymnComment(commentId: number) {
  await query('DELETE FROM pmam_comments WHERE id = ?', [commentId]);
}

// ===== LIKES =====
export async function toggleHymnReaction(hymnId: number, visitorId: string) {
  const existing = await query(
    'SELECT id FROM pmam_likes WHERE target_type = ? AND target_id = ? AND visitor_id = ? LIMIT 1',
    ['hymn', hymnId, visitorId]
  );

  if (existing.length > 0) {
    await query(
      'DELETE FROM pmam_likes WHERE target_type = ? AND target_id = ? AND visitor_id = ?',
      ['hymn', hymnId, visitorId]
    );
    return { liked: false };
  } else {
    await query(
      'INSERT INTO pmam_likes (target_type, target_id, visitor_id) VALUES (?, ?, ?)',
      ['hymn', hymnId, visitorId]
    );
    return { liked: true };
  }
}

// ===== USERS =====
export async function getAllUsers() {
  const rows = await query('SELECT * FROM pmam_users ORDER BY created_at DESC');
  return rows.map(mapUser);
}

export async function getUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await query('SELECT * FROM pmam_users WHERE email = ? LIMIT 1', [normalizedEmail]);
  return mapUser(rows[0]);
}

export async function createUserWithPassword(user: any) {
  const normalizedEmail = user.email.trim().toLowerCase();
  const openId = `user-${nanoid(16)}`;
  
  const sql = `
    INSERT INTO pmam_users (open_id, name, email, password, login_method, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  await query(sql, [
    openId,
    user.name,
    normalizedEmail,
    user.password,
    'email',
    user.role || 'user'
  ]);
}

// ===== SETTINGS =====
export async function getSetting(key: string) {
  const rows = await query('SELECT setting_value FROM pmam_site_settings WHERE setting_key = ? LIMIT 1', [key]);
  return rows[0]?.setting_value ?? null;
}

export async function setSetting(key: string, value: string) {
  await query(
    'INSERT INTO pmam_site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
    [key, value]
  );
}

// ===== STUDY =====
export async function getOrCreateStudyStudent(studentNumber: string, displayName?: string) {
  if (!isValidStudyStudentNumber(studentNumber)) {
    throw new Error("INVALID_STUDY_STUDENT_NUMBER");
  }

  const normalized = normalizeStudyStudentNumber(studentNumber);
  const accessToken = createStudyAccessToken();

  const existing = await query(
    `SELECT * FROM pmam_study_students WHERE student_number = ? LIMIT 1`,
    [normalized]
  );

  if (existing.length > 0) {
    return mapStudyStudent(existing[0]);
  }

  await query(
    `INSERT INTO pmam_study_students (student_number, display_name, access_token) VALUES (?, ?, ?)`,
    [normalized, displayName || null, accessToken]
  );

  const rows = await query(
    `SELECT * FROM pmam_study_students WHERE student_number = ? LIMIT 1`,
    [normalized]
  );

  return mapStudyStudent(rows[0]);
}

export async function getStudyStudentByNumber(studentNumber: string) {
  if (!isValidStudyStudentNumber(studentNumber)) {
    throw new Error("INVALID_STUDY_STUDENT_NUMBER");
  }

  const normalized = normalizeStudyStudentNumber(studentNumber);
  const rows = await query(
    `SELECT * FROM pmam_study_students WHERE student_number = ? LIMIT 1`,
    [normalized]
  );

  return mapStudyStudent(rows[0]);
}

export async function getStudyStudentByAccessToken(accessToken: string) {
  const rows = await query(
    `SELECT * FROM pmam_study_students WHERE access_token = ? LIMIT 1`,
    [accessToken]
  );

  return mapStudyStudent(rows[0]);
}

export async function ensureStudyStudentSession(
  studentNumber: string,
  displayName?: string | null,
  accessToken?: string | null,
): Promise<StudyStudentSession> {
  await ensureStudyTables();

  if (!isValidStudyStudentNumber(studentNumber)) {
    throw new Error("INVALID_STUDY_STUDENT_NUMBER");
  }

  const normalized = normalizeStudyStudentNumber(studentNumber);
  const requestedToken = accessToken?.trim() || null;
  const nextToken = requestedToken || createStudyAccessToken();

  const existingRows = await query(
    `SELECT * FROM pmam_study_students WHERE student_number = ? LIMIT 1`,
    [normalized],
  );

  if (existingRows.length === 0) {
    await query(
      `INSERT INTO pmam_study_students (student_number, display_name, access_token, last_active_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [normalized, displayName || null, nextToken],
    );
  } else {
    const updates: string[] = ["last_active_at = CURRENT_TIMESTAMP", "updated_at = CURRENT_TIMESTAMP"];
    const params: any[] = [];

    if (displayName !== undefined) {
      updates.push("display_name = ?");
      params.push(displayName || null);
    }

    if (!existingRows[0]?.access_token) {
      updates.push("access_token = ?");
      params.push(nextToken);
    }

    params.push(normalized);
    await query(`UPDATE pmam_study_students SET ${updates.join(", ")} WHERE student_number = ?`, params);
  }

  const rows = await query(
    `SELECT * FROM pmam_study_students WHERE student_number = ? LIMIT 1`,
    [normalized],
  );

  const student = mapStudyStudent(rows[0]);
  if (!student) {
    throw new Error("STUDY_STUDENT_NOT_FOUND");
  }

  return {
    student,
    accessToken: rows[0]?.access_token || nextToken,
  };
}

export async function getStudyDashboard(
  studentNumber: string,
  _accessToken?: string | null,
): Promise<StudyDashboard> {
  await ensureStudyTables();

  if (!isValidStudyStudentNumber(studentNumber)) {
    throw new Error("INVALID_STUDY_STUDENT_NUMBER");
  }

  const session = await ensureStudyStudentSession(studentNumber, null, _accessToken ?? null);

  const progressRows = await query(
    `SELECT * FROM pmam_study_module_progress WHERE student_number = ? ORDER BY module_slug ASC`,
    [session.student.studentNumber],
  );

  return {
    student: session.student,
    modules: progressRows.map((row) => mapStudyModuleProgress(row)).filter(Boolean) as StudyModuleProgressRecord[],
  };
}

export async function getStudyModuleProgress(
  studentNumber: string,
  _accessToken: string | null | undefined,
  moduleSlug: string,
): Promise<StudyModuleProgressRecord> {
  await ensureStudyTables();

  if (!isValidStudyStudentNumber(studentNumber)) {
    throw new Error("INVALID_STUDY_STUDENT_NUMBER");
  }

  const normalized = normalizeStudyStudentNumber(studentNumber);
  await ensureStudyStudentSession(normalized, null, _accessToken ?? null);

  const rows = await query(
    `SELECT * FROM pmam_study_module_progress WHERE student_number = ? AND module_slug = ? LIMIT 1`,
    [normalized, moduleSlug],
  );

  return (
    mapStudyModuleProgress(rows[0]) ?? {
      moduleSlug,
      completedSectionIds: [],
      answers: {},
      lastScore: null,
      bestScore: null,
      lastSubmittedAt: null,
      updatedAt: null,
    }
  );
}

export async function saveStudyModuleProgress(
  studentNumber: string,
  accessToken: string | null | undefined,
  moduleSlug: string,
  progress: any
) {
  await ensureStudyTables();

  if (!isValidStudyStudentNumber(studentNumber)) {
    throw new Error("INVALID_STUDY_STUDENT_NUMBER");
  }

  const normalized = normalizeStudyStudentNumber(studentNumber);
  const session = await ensureStudyStudentSession(normalized, null, accessToken ?? null);

  const completedSectionIds = JSON.stringify(progress.completedSectionIds || []);
  const answers = JSON.stringify(progress.answers || {});

  await query(
    `INSERT INTO pmam_study_module_progress 
    (student_number, module_slug, completed_section_ids, answers_json, last_score, best_score, last_submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    completed_section_ids = VALUES(completed_section_ids),
    answers_json = VALUES(answers_json),
    last_score = VALUES(last_score),
    best_score = VALUES(best_score),
    last_submitted_at = VALUES(last_submitted_at),
    updated_at = CURRENT_TIMESTAMP`,
    [
      normalized,
      moduleSlug,
      completedSectionIds,
      answers,
      progress.lastScore ?? null,
      progress.bestScore ?? null,
      progress.lastSubmittedAt ? new Date(progress.lastSubmittedAt) : null,
    ]
  );

  const rows = await query(
    `SELECT * FROM pmam_study_module_progress WHERE student_number = ? AND module_slug = ? LIMIT 1`,
    [session.student.studentNumber, moduleSlug]
  );

  return (
    mapStudyModuleProgress(rows[0]) ?? {
      moduleSlug,
      completedSectionIds,
      answers,
      lastScore: progress.lastScore,
      bestScore: progress.bestScore,
      lastSubmittedAt: progress.lastSubmittedAt,
      updatedAt: null,
    }
  );
}

// ===== STATS =====
export async function getStats() {
  const [hymnRes] = await query("SELECT COUNT(*) as count FROM pmam_hymns WHERE collection IS NULL OR collection <> 'tfm'");
  const [cmRes] = await query("SELECT COUNT(*) as count FROM pmam_hymns WHERE collection = 'tfm'");
  const [missionRes] = await query('SELECT COUNT(*) as count FROM pmam_cfap_missions');
  const [userRes] = await query('SELECT COUNT(*) as count FROM pmam_users');
  const [drillRes] = await query('SELECT COUNT(*) as count FROM pmam_drill');

  return {
    totalHymns: hymnRes?.count || 0,
    totalCharlieMike: cmRes?.count || 0,
    totalMissions: missionRes?.count || 0,
    totalUsers: userRes?.count || 0,
    totalDrill: drillRes?.count || 0,
  };
}

// ===== DRILL (Ordem Unida) =====
export async function getAllDrill() {
  const rows = await query('SELECT * FROM pmam_drill ORDER BY created_at DESC');
  return rows.map(mapDrill);
}

export async function getActiveDrill() {
  const rows = await query('SELECT * FROM pmam_drill WHERE is_active = 1 ORDER BY created_at DESC');
  return rows.map(mapDrill);
}

export async function getDrillById(id: number) {
  const rows = await query('SELECT * FROM pmam_drill WHERE id = ? LIMIT 1', [id]);
  return mapDrill(rows[0]);
}

export async function getDrillByCategory(category: string) {
  const rows = await query('SELECT * FROM pmam_drill WHERE category = ? AND is_active = 1 ORDER BY created_at DESC', [category]);
  return rows.map(mapDrill);
}

export async function createDrill(drill: any) {
  const attachmentsJson = drill.attachmentsJson ? JSON.stringify(drill.attachmentsJson) : null;
  const sql = `
    INSERT INTO pmam_drill 
    (title, subtitle, description, category, difficulty, duration, video_url, pdf_url, image_url, content, instructor, prerequisites, learning_outcomes, attachments_json, is_active, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [
    drill.title,
    drill.subtitle || null,
    drill.description || null,
    drill.category || null,
    drill.difficulty || 'intermediario',
    drill.duration || null,
    drill.videoUrl || null,
    drill.pdfUrl || null,
    drill.imageUrl || null,
    drill.content || null,
    drill.instructor || null,
    drill.prerequisites || null,
    drill.learningOutcomes || null,
    attachmentsJson,
    drill.isActive ?? 1,
    drill.authorId || null
  ]);

  return result;
}

export async function updateDrill(id: number, drill: any) {
  const updates: string[] = [];
  const params: any[] = [];

  const fields: Record<string, string> = {
    title: 'title',
    subtitle: 'subtitle',
    description: 'description',
    category: 'category',
    difficulty: 'difficulty',
    duration: 'duration',
    videoUrl: 'video_url',
    pdfUrl: 'pdf_url',
    imageUrl: 'image_url',
    content: 'content',
    instructor: 'instructor',
    prerequisites: 'prerequisites',
    learningOutcomes: 'learning_outcomes',
    isActive: 'is_active'
  };

  for (const [key, dbKey] of Object.entries(fields)) {
    if (drill[key] !== undefined) {
      updates.push(`${dbKey} = ?`);
      let val = drill[key];
      if (key === 'isActive') val = val ? 1 : 0;
      params.push(val);
    }
  }

  if (drill.attachmentsJson !== undefined) {
    updates.push(`attachments_json = ?`);
    params.push(drill.attachmentsJson ? JSON.stringify(drill.attachmentsJson) : null);
  }

  if (updates.length === 0) return;

  const sql = `UPDATE pmam_drill SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await query(sql, params);
}

export async function deleteDrill(id: number) {
  await query('DELETE FROM pmam_drill WHERE id = ?', [id]);
}
