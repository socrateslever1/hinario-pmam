import { query } from "./mysql";

export type CfapHistoryVideo = { title: string; url: string };
export type CfapHistorySource = { title: string; url: string };
export type CfapHistoryMemoryItem = { title: string; description: string; imageUrl: string };

export interface CfapHistoryRecord {
  slug: string;
  rank: string;
  name: string;
  periods: string[];
  portraitUrl: string | null;
  biography: string | null;
  highlights: string[];
  commandPhrase: string | null;
  memoryGallery: CfapHistoryMemoryItem[];
  videos: CfapHistoryVideo[];
  sources: CfapHistorySource[];
  inMemoriam: boolean;
  isVisible: boolean;
  sortOrder: number;
  updatedAt: Date | string;
}

export interface CfapHistoryInput extends Omit<CfapHistoryRecord, "updatedAt"> {}

let schemaPromise: Promise<void> | null = null;

function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function mapRecord(row: any): CfapHistoryRecord {
  return {
    slug: row.slug,
    rank: row.rankName,
    name: row.fullName,
    periods: parseArray<string>(row.periodsJson),
    portraitUrl: row.portraitUrl,
    biography: row.biography,
    highlights: parseArray<string>(row.highlightsJson),
    commandPhrase: row.commandPhrase || null,
    memoryGallery: parseArray<CfapHistoryMemoryItem>(row.memoryGalleryJson),
    videos: parseArray<CfapHistoryVideo>(row.videosJson),
    sources: parseArray<CfapHistorySource>(row.sourcesJson),
    inMemoriam: Boolean(row.inMemoriam),
    isVisible: Boolean(row.isVisible),
    sortOrder: Number(row.sortOrder || 0),
    updatedAt: row.updatedAt,
  };
}

export async function ensureCfapHistoryTables() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_cfap_history (
          slug VARCHAR(160) PRIMARY KEY,
          rank_name VARCHAR(80) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          periods_json LONGTEXT NOT NULL,
          portrait_url LONGTEXT NULL,
          biography LONGTEXT NULL,
          highlights_json LONGTEXT NOT NULL,
          command_phrase LONGTEXT NULL,
          memory_gallery_json LONGTEXT NOT NULL,
          videos_json LONGTEXT NOT NULL,
          sources_json LONGTEXT NOT NULL,
          in_memoriam BOOLEAN NOT NULL DEFAULT false,
          is_visible BOOLEAN NOT NULL DEFAULT true,
          sort_order INT NOT NULL DEFAULT 0,
          updated_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_pmam_cfap_history_visible_order (is_visible, sort_order)
        )
      `);
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_cfap_history_audit (
          id INT AUTO_INCREMENT PRIMARY KEY,
          commander_slug VARCHAR(160) NOT NULL,
          snapshot_json LONGTEXT NOT NULL,
          changed_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_pmam_cfap_history_audit_slug (commander_slug, created_at)
        )
      `);
      const columns = await query<{ Field: string }>("SHOW COLUMNS FROM pmam_cfap_history");
      const columnNames = new Set(columns.map((column) => String(column.Field)));
      if (!columnNames.has("command_phrase")) {
        await query("ALTER TABLE pmam_cfap_history ADD COLUMN command_phrase LONGTEXT NULL AFTER highlights_json");
      }
      if (!columnNames.has("memory_gallery_json")) {
        await query("ALTER TABLE pmam_cfap_history ADD COLUMN memory_gallery_json LONGTEXT NULL AFTER command_phrase");
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function listCfapHistoryRecords(options?: { includeHidden?: boolean }) {
  await ensureCfapHistoryTables();
  const rows = await query(`
    SELECT slug, rank_name AS rankName, full_name AS fullName,
           periods_json AS periodsJson, portrait_url AS portraitUrl, biography,
           highlights_json AS highlightsJson, command_phrase AS commandPhrase,
           memory_gallery_json AS memoryGalleryJson, videos_json AS videosJson,
           sources_json AS sourcesJson, in_memoriam AS inMemoriam,
           is_visible AS isVisible, sort_order AS sortOrder, updated_at AS updatedAt
    FROM pmam_cfap_history
    ${options?.includeHidden ? "" : "WHERE is_visible = true"}
    ORDER BY sort_order, full_name
  `);
  return rows.map(mapRecord);
}

export async function upsertCfapHistoryRecord(input: CfapHistoryInput, changedBy?: number | null) {
  await ensureCfapHistoryTables();
  const snapshot = JSON.stringify(input);
  await query(`
    INSERT INTO pmam_cfap_history (
      slug, rank_name, full_name, periods_json, portrait_url, biography,
      highlights_json, command_phrase, memory_gallery_json, videos_json, sources_json, in_memoriam, is_visible,
      sort_order, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      rank_name = VALUES(rank_name), full_name = VALUES(full_name),
      periods_json = VALUES(periods_json), portrait_url = VALUES(portrait_url),
      biography = VALUES(biography), highlights_json = VALUES(highlights_json),
      command_phrase = VALUES(command_phrase), memory_gallery_json = VALUES(memory_gallery_json),
      videos_json = VALUES(videos_json), sources_json = VALUES(sources_json),
      in_memoriam = VALUES(in_memoriam), is_visible = VALUES(is_visible),
      sort_order = VALUES(sort_order), updated_by = VALUES(updated_by),
      updated_at = CURRENT_TIMESTAMP
  `, [
    input.slug, input.rank, input.name, JSON.stringify(input.periods),
    input.portraitUrl || null, input.biography || null, JSON.stringify(input.highlights),
    input.commandPhrase || null, JSON.stringify(input.memoryGallery), JSON.stringify(input.videos),
    JSON.stringify(input.sources), input.inMemoriam,
    input.isVisible, input.sortOrder, changedBy ?? null,
  ]);
  await query(`
    INSERT INTO pmam_cfap_history_audit (commander_slug, snapshot_json, changed_by)
    VALUES (?, ?, ?)
  `, [input.slug, snapshot, changedBy ?? null]);
}
