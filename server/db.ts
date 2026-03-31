import { query } from "./mysql";
import { ENV } from './_core/env';

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
    createdAt: m.created_at,
    updatedAt: m.updated_at
  };
}

export async function upsertUser(user: any): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  
  const lastSignedIn = user.lastSignedIn ? new Date(user.lastSignedIn) : new Date();
  const normalizedEmail = typeof user.email === "string"
    ? user.email.trim().toLowerCase()
    : null;
  const resolvedRole = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : undefined);

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
  const rows = await query('SELECT * FROM pmam_hymns WHERE is_active = 1 ORDER BY number ASC');
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
    'SELECT * FROM pmam_hymns WHERE category = ? AND is_active = 1 ORDER BY number ASC',
    [category]
  );
  return rows.map(mapHymn);
}

export async function createHymn(hymn: any) {
  const lyricsSync = hymn.lyricsSync ? JSON.stringify(hymn.lyricsSync) : null;
  const sql = `
    INSERT INTO pmam_hymns 
    (number, title, subtitle, author, composer, category, lyrics, description, youtube_url, audio_url, lyrics_sync, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const result = await query(sql, [
    hymn.number,
    hymn.title,
    hymn.subtitle || null,
    hymn.author || null,
    hymn.composer || null,
    hymn.category,
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
export async function getAllMissions() {
  const rows = await query('SELECT * FROM pmam_cfap_missions ORDER BY created_at DESC');
  return rows.map(mapMission);
}

export async function getActiveMissions() {
  const rows = await query('SELECT * FROM pmam_cfap_missions WHERE is_active = 1 ORDER BY created_at DESC');
  return rows.map(mapMission);
}

export async function getMissionById(id: number) {
  const rows = await query('SELECT * FROM pmam_cfap_missions WHERE id = ? LIMIT 1', [id]);
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

export async function deleteUser(id: number) {
  await query('DELETE FROM pmam_users WHERE id = ?', [id]);
}

export async function updateUserPassword(id: number, password: string) {
  await query('UPDATE pmam_users SET password = ? WHERE id = ?', [password, id]);
}

// ===== STATS =====
export async function getStats() {
  const [hymnRes] = await query('SELECT COUNT(*) as count FROM pmam_hymns');
  const [missionRes] = await query('SELECT COUNT(*) as count FROM pmam_cfap_missions');
  const [userRes] = await query('SELECT COUNT(*) as count FROM pmam_users');

  return {
    totalHymns: hymnRes?.count || 0,
    totalMissions: missionRes?.count || 0,
    totalUsers: userRes?.count || 0,
  };
}
