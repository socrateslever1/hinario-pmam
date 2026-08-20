import { query } from "./mysql";

export type BugleContentKind = "call" | "march";

let schemaPromise: Promise<void> | null = null;

export async function ensureBugleSchema() {
  // Tabelas e alterações são aplicadas pelas migrações, não durante leituras.
  schemaPromise ??= Promise.resolve();
  await schemaPromise;
}

/**
 * Resolve the audio URL for a bugle call or march row.
 * - HTTP/HTTPS and data: URIs that are already accessible externally are returned as-is.
 * - data: URIs stored inline and /uploads/ local paths are redirected to the
 *   /api/bugle-audio proxy endpoint, which reads the raw bytes from the DB and
 *   serves them correctly in both Node.js and Cloudflare Workers.
 */
function resolveAudioUrl(audioUrl: string | null | undefined, kind: "call" | "march", id: number): string | null {
  if (!audioUrl) return null;
  // data: URI or local file path — serve via the proxy endpoint that reads from DB
  if (audioUrl.startsWith("data:") || audioUrl.startsWith("/uploads/")) {
    return `/api/bugle-audio/${kind}/${id}`;
  }
  return audioUrl;
}

function mapBugleCall(row: any) {
  if (!row) return row;
  const id = Number(row.id);
  return {
    id,
    name: row.name,
    audioUrl: resolveAudioUrl(row.audio_url, "call", id),
    iconKey: row.icon_key || "music",
    troopState: row.troop_state,
    category: row.category || "geral",
    sourceUrl: row.source_url,
    sortOrder: Number(row.sort_order || 0),
    isActive: row.is_active === 1 || row.is_active === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMarch(row: any) {
  if (!row) return row;
  const id = Number(row.id);
  return {
    id,
    title: row.title,
    composer: row.composer,
    audioUrl: resolveAudioUrl(row.audio_url, "march", id),
    sourceUrl: row.source_url,
    sortOrder: Number(row.sort_order || 0),
    isActive: row.is_active === 1 || row.is_active === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listBugleCalls(activeOnly = true) {
  await ensureBugleSchema();
  const where = activeOnly ? "WHERE is_active = 1" : "";
  const rows = await query(`SELECT * FROM pmam_bugle_calls ${where} ORDER BY sort_order, name`);
  return rows.map(mapBugleCall);
}

export async function listMarches(activeOnly = true) {
  await ensureBugleSchema();
  const where = activeOnly ? "WHERE is_active = 1" : "";
  const rows = await query(`SELECT * FROM pmam_marches ${where} ORDER BY sort_order, title`);
  return rows.map(mapMarch);
}

export async function createBugleCall(input: any) {
  await ensureBugleSchema();
  const result = await query(
    `INSERT INTO pmam_bugle_calls
      (name, audio_url, icon_key, troop_state, category, source_url, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.audioUrl || null,
      input.iconKey || "music",
      input.troopState || null,
      input.category || "geral",
      input.sourceUrl || null,
      input.sortOrder ?? 0,
      input.isActive === false ? 0 : 1,
    ],
  );
  return (result as any).insertId as number | undefined;
}

export async function createMarch(input: any) {
  await ensureBugleSchema();
  const result = await query(
    `INSERT INTO pmam_marches
      (title, composer, audio_url, source_url, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.composer || null,
      input.audioUrl || null,
      input.sourceUrl || null,
      input.sortOrder ?? 0,
      input.isActive === false ? 0 : 1,
    ],
  );
  return (result as any).insertId as number | undefined;
}

const CALL_FIELDS: Record<string, string> = {
  name: "name",
  audioUrl: "audio_url",
  iconKey: "icon_key",
  troopState: "troop_state",
  category: "category",
  sourceUrl: "source_url",
  sortOrder: "sort_order",
  isActive: "is_active",
};

const MARCH_FIELDS: Record<string, string> = {
  title: "title",
  composer: "composer",
  audioUrl: "audio_url",
  sourceUrl: "source_url",
  sortOrder: "sort_order",
  isActive: "is_active",
};

async function updateRecord(table: string, id: number, input: any, fields: Record<string, string>) {
  await ensureBugleSchema();
  const updates: string[] = [];
  const values: any[] = [];
  for (const [key, column] of Object.entries(fields)) {
    if (input[key] === undefined) continue;
    updates.push(`${column} = ?`);
    const value = input[key];
    values.push(
      key === "isActive"
        ? (value ? 1 : 0)
        : (typeof value === "string" && value.trim() === "" ? null : value),
    );
  }
  if (!updates.length) return;
  values.push(id);
  await query(`UPDATE ${table} SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
}

export function updateBugleCall(id: number, input: any) {
  return updateRecord("pmam_bugle_calls", id, input, CALL_FIELDS);
}

export function updateMarch(id: number, input: any) {
  return updateRecord("pmam_marches", id, input, MARCH_FIELDS);
}

export async function deleteBugleCall(id: number) {
  await ensureBugleSchema();
  await query("DELETE FROM pmam_bugle_calls WHERE id = ?", [id]);
}

export async function deleteMarch(id: number) {
  await ensureBugleSchema();
  await query("DELETE FROM pmam_marches WHERE id = ?", [id]);
}
