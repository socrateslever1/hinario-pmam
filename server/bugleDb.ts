import { query } from "./mysql";

export type BugleContentKind = "call" | "march";

let schemaPromise: Promise<void> | null = null;

export async function ensureBugleSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_bugle_calls (
          id INT NOT NULL AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          audio_url LONGTEXT NULL,
          icon_key VARCHAR(64) DEFAULT 'music',
          troop_state VARCHAR(120) NULL,
          category VARCHAR(100) DEFAULT 'geral',
          source_url LONGTEXT NULL,
          sort_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_pmam_bugle_calls_name (name)
        )
      `);
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_marches (
          id INT NOT NULL AUTO_INCREMENT,
          title VARCHAR(255) NOT NULL,
          composer VARCHAR(255) NULL,
          audio_url LONGTEXT NULL,
          source_url LONGTEXT NULL,
          sort_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `);
      try {
        await query("ALTER TABLE pmam_bugle_calls MODIFY COLUMN audio_url LONGTEXT NULL");
      } catch (_) {}
      try {
        await query("ALTER TABLE pmam_bugle_calls MODIFY COLUMN source_url LONGTEXT NULL");
      } catch (_) {}
      try {
        await query("ALTER TABLE pmam_marches MODIFY COLUMN audio_url LONGTEXT NULL");
      } catch (_) {}
      try {
        await query("ALTER TABLE pmam_marches MODIFY COLUMN source_url LONGTEXT NULL");
      } catch (_) {}
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

function mapBugleCall(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    audioUrl: row.audio_url,
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
  return {
    id: row.id,
    title: row.title,
    composer: row.composer,
    audioUrl: row.audio_url,
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
