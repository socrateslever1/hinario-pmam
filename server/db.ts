import { query } from "./mysql";
import { ENV } from './_core/env';
import { nanoid } from "nanoid";
import type { StudyDashboard, StudyModuleProgressRecord, StudyStudent, StudyStudentSession } from "../shared/types";

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

function normalizeStudyStudentNumber(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
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

  return result; // MySQL result contains insertId
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
    lyricsSync: 'lyrics_sync',
    isActive: 'is_active'
  };

  for (const [key, dbKey] of Object.entries(fields)) {
    if (hymn[key] !== undefined) {
      updates.push(`${dbKey} = ?`);
      let val = hymn[key];
      if (key === 'lyricsSync') val = val ? JSON.stringify(val) : null;
      if (key === 'isActive') val = val ? 1 : 0;
      params.push(val);
    }
  }

  if (updates.length === 0) return;

  const sql = `UPDATE pmam_hymns SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  params.push(id);

  await query(sql, params);
}

export async function deleteHymn(id: number) {
  await query('DELETE FROM pmam_hymns WHERE id = ?', [id]);
}

// ===== CFAP MISSIONS =====
function buildMissionSelectSql(includeOnlyActive: boolean, includeVisitorReaction: boolean) {
  const visitorReactionSelect = includeVisitorReaction
    ? `, EXISTS(
        SELECT 1
        FROM pmam_likes likes
        WHERE likes.target_type = 'mission'
          AND likes.target_id = mission.id
          AND likes.visitor_id = ?
      ) AS visitor_reacted`
    : ", 0 AS visitor_reacted";

  const activeFilter = includeOnlyActive ? "WHERE mission.is_active = 1" : "";

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
    `SELECT * FROM pmam_comments
     WHERE target_type = 'mission' AND target_id = ?
     ORDER BY created_at DESC, id DESC`,
    [missionId]
  );

  return rows.map(mapComment);
}

export async function createMissionComment(missionId: number, authorName: string, content: string) {
  await query(
    `INSERT INTO pmam_comments (target_type, target_id, author_name, content)
     VALUES ('mission', ?, ?, ?)`,
    [missionId, authorName.trim(), content.trim()]
  );
}

export async function toggleMissionReaction(missionId: number, visitorId: string) {
  const existing = await query(
    `SELECT id FROM pmam_likes
     WHERE target_type = 'mission' AND target_id = ? AND visitor_id = ?
     LIMIT 1`,
    [missionId, visitorId]
  );

  let reacted = false;

  if (existing[0]?.id) {
    await query(`DELETE FROM pmam_likes WHERE id = ?`, [existing[0].id]);
  } else {
    await query(
      `INSERT INTO pmam_likes (target_type, target_id, visitor_id)
       VALUES ('mission', ?, ?)`,
      [missionId, visitorId]
    );
    reacted = true;
  }

  const countRows = await query(
    `SELECT COUNT(*) AS total
     FROM pmam_likes
     WHERE target_type = 'mission' AND target_id = ?`,
    [missionId]
  );

  const likesCount = Number(countRows[0]?.total || 0);

  await query(
    `UPDATE pmam_cfap_missions
     SET likes_count = ?, updated_at = updated_at
     WHERE id = ?`,
    [likesCount, missionId]
  );

  return { reacted, likesCount };
}

// ===== SITE SETTINGS =====
export async function getSetting(key: string) {
  const rows = await query('SELECT setting_value FROM pmam_site_settings WHERE setting_key = ? LIMIT 1', [key]);
  return rows[0]?.setting_value;
}

export async function upsertSetting(key: string, value: string) {
  const sql = `
    INSERT INTO pmam_site_settings (setting_key, setting_value)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP
  `;
  await query(sql, [key, value]);
}

// ===== AUTH EMAIL/SENHA =====
export async function getUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await query('SELECT * FROM pmam_users WHERE email = ? LIMIT 1', [normalizedEmail]);
  return mapUser(rows[0]);
}

export async function createUserWithPassword(data: { name: string; email: string; password: string; role: 'user' | 'admin' | 'master' }) {
  const openId = `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const normalizedEmail = data.email.trim().toLowerCase();
  
  const sql = `
    INSERT INTO pmam_users (open_id, name, email, password, login_method, role)
    VALUES (?, ?, ?, ?, 'email', ?)
  `;
  
  await query(sql, [openId, data.name, normalizedEmail, data.password, data.role]);
  return getUserByEmail(normalizedEmail);
}

export async function getAllUsers() {
  const rows = await query(
    'SELECT id, open_id, name, email, role, login_method, created_at, updated_at, last_signed_in FROM pmam_users ORDER BY created_at DESC'
  );
  return rows.map(mapUser);
}

export async function updateUserRole(id: number, role: 'user' | 'admin' | 'master') {
  await query('UPDATE pmam_users SET role = ? WHERE id = ?', [role, id]);
}

export async function updateUserPassword(id: number, password: string) {
  await query('UPDATE pmam_users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [password, id]);
}

export async function deleteUser(id: number) {
  await query('DELETE FROM pmam_users WHERE id = ?', [id]);
}

// ===== STUDY =====
async function getStudyStudentRow(studentNumber: string) {
  const rows = await query<any>(
    `SELECT * FROM pmam_study_students WHERE student_number = ? LIMIT 1`,
    [studentNumber]
  );
  return rows[0] ?? null;
}

async function updateStudyStudentActivity(studentId: number, displayName?: string | null) {
  await query(
    `
      UPDATE pmam_study_students
      SET display_name = COALESCE(?, display_name),
          last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [displayName?.trim() || null, studentId]
  );
}

async function requireStudyStudentAccess(studentNumber: string, accessToken: string) {
  await ensureStudyTables();
  const normalizedStudentNumber = normalizeStudyStudentNumber(studentNumber);
  if (!normalizedStudentNumber) {
    throw new Error("Student number is required");
  }

  if (!accessToken?.trim()) {
    throw new Error(STUDY_ACCESS_TOKEN_MISMATCH);
  }

  const row = await getStudyStudentRow(normalizedStudentNumber);
  if (!row || row.access_token !== accessToken.trim()) {
    throw new Error(STUDY_ACCESS_TOKEN_MISMATCH);
  }

  await updateStudyStudentActivity(row.id);
  return mapStudyStudent(row);
}

export async function ensureStudyStudentSession(
  studentNumber: string,
  displayName?: string | null,
  accessToken?: string | null
): Promise<StudyStudentSession> {
  await ensureStudyTables();
  const normalizedStudentNumber = normalizeStudyStudentNumber(studentNumber);
  if (!normalizedStudentNumber) {
    throw new Error("Student number is required");
  }

  const providedToken = accessToken?.trim() || "";
  const existingRow = await getStudyStudentRow(normalizedStudentNumber);

  if (!existingRow) {
    const nextAccessToken = createStudyAccessToken();
    await query(
      `
        INSERT INTO pmam_study_students (student_number, display_name, access_token, last_active_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [normalizedStudentNumber, displayName?.trim() || null, nextAccessToken]
    );

    const createdRow = await getStudyStudentRow(normalizedStudentNumber);
    if (!createdRow) {
      throw new Error("Study student could not be created");
    }

    return {
      student: mapStudyStudent(createdRow)!,
      accessToken: createdRow.access_token,
    };
  }

  const storedToken = typeof existingRow.access_token === "string" ? existingRow.access_token.trim() : "";
  if (storedToken && providedToken !== storedToken) {
    throw new Error(STUDY_ACCESS_TOKEN_MISMATCH);
  }

  const nextAccessToken = storedToken || createStudyAccessToken();
  await query(
    `
      UPDATE pmam_study_students
      SET display_name = COALESCE(?, display_name),
          access_token = ?,
          last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [displayName?.trim() || null, nextAccessToken, existingRow.id]
  );

  const refreshedRow = await getStudyStudentRow(normalizedStudentNumber);
  if (!refreshedRow) {
    throw new Error("Study student could not be loaded");
  }

  return {
    student: mapStudyStudent(refreshedRow)!,
    accessToken: refreshedRow.access_token,
  };
}

export async function getStudyDashboard(studentNumber: string, accessToken: string): Promise<StudyDashboard> {
  const student = await requireStudyStudentAccess(studentNumber, accessToken);
  if (!student) {
    throw new Error("Study student not found");
  }

  const rows = await query(
    `SELECT * FROM pmam_study_module_progress WHERE student_number = ? ORDER BY module_slug ASC`,
    [student.studentNumber]
  );

  return {
    student,
    modules: rows.map(mapStudyModuleProgress).filter(Boolean) as StudyModuleProgressRecord[],
  };
}

export async function getStudyModuleProgress(
  studentNumber: string,
  accessToken: string,
  moduleSlug: string
): Promise<StudyModuleProgressRecord> {
  const student = await requireStudyStudentAccess(studentNumber, accessToken);
  if (!student) {
    throw new Error("Study student not found");
  }

  const rows = await query(
    `SELECT * FROM pmam_study_module_progress WHERE student_number = ? AND module_slug = ? LIMIT 1`,
    [student.studentNumber, moduleSlug]
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
  accessToken: string,
  moduleSlug: string,
  progress: Omit<StudyModuleProgressRecord, "moduleSlug" | "updatedAt">
): Promise<StudyModuleProgressRecord> {
  const student = await requireStudyStudentAccess(studentNumber, accessToken);
  if (!student) {
    throw new Error("Study student not found");
  }

  const completedSectionIds = Array.from(new Set(progress.completedSectionIds)).filter(Boolean);
  const answers = progress.answers ?? {};

  await query(
    `
      INSERT INTO pmam_study_module_progress (
        student_number,
        module_slug,
        completed_section_ids,
        answers_json,
        last_score,
        best_score,
        last_submitted_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        completed_section_ids = VALUES(completed_section_ids),
        answers_json = VALUES(answers_json),
        last_score = VALUES(last_score),
        best_score = VALUES(best_score),
        last_submitted_at = VALUES(last_submitted_at),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      student.studentNumber,
      moduleSlug,
      JSON.stringify(completedSectionIds),
      JSON.stringify(answers),
      progress.lastScore,
      progress.bestScore,
      progress.lastSubmittedAt ? new Date(progress.lastSubmittedAt) : null,
    ]
  );

  const rows = await query(
    `SELECT * FROM pmam_study_module_progress WHERE student_number = ? AND module_slug = ? LIMIT 1`,
    [student.studentNumber, moduleSlug]
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

  return {
    totalHymns: hymnRes?.count || 0,
    totalCharlieMike: cmRes?.count || 0,
    totalMissions: missionRes?.count || 0,
    totalUsers: userRes?.count || 0,
  };
}
