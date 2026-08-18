import { query } from "./mysql";

export type OrdemUnidaAudioType = "corneta" | "dobrado" | "voz";

export interface OrdemUnidaAudioRecord {
  id: number;
  itemId: string;
  itemTitle: string;
  itemType: OrdemUnidaAudioType;
  audioUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  duration: number | null;
  voiceProfileKey: string;
  voiceAuthorName: string | null;
  voiceAuthorPhotoUrl: string | null;
  isActive: boolean;
  uploadedBy: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

let schemaPromise: Promise<void> | null = null;

function mapAudio(row: any): OrdemUnidaAudioRecord {
  return {
    id: Number(row.id),
    itemId: row.item_id,
    itemTitle: row.item_title,
    itemType: row.item_type,
    audioUrl: row.audio_url,
    fileKey: row.file_key,
    fileName: row.file_name,
    fileSize: row.file_size === null || row.file_size === undefined ? null : Number(row.file_size),
    mimeType: row.mime_type ?? null,
    duration: row.duration === null || row.duration === undefined ? null : Number(row.duration),
    voiceProfileKey: row.voice_profile_key || "default",
    voiceAuthorName: row.voice_author_name ?? null,
    voiceAuthorPhotoUrl: row.voice_author_photo_url ?? null,
    isActive: row.is_active === 1 || row.is_active === true,
    uploadedBy: row.uploaded_by === null || row.uploaded_by === undefined ? null : Number(row.uploaded_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function ensureOrdemUnidaAudioSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
      CREATE TABLE IF NOT EXISTS pmam_ordem_unida_audios (
        id INT NOT NULL AUTO_INCREMENT,
        item_id VARCHAR(128) NOT NULL,
        item_title VARCHAR(255) NOT NULL,
        item_type ENUM('corneta', 'dobrado', 'voz') NOT NULL,
        audio_url LONGTEXT NOT NULL,
        file_key VARCHAR(512) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INT NULL,
        mime_type VARCHAR(100) NULL,
        duration INT NULL,
        voice_profile_key VARCHAR(128) NOT NULL DEFAULT 'default',
        voice_author_name VARCHAR(255) NULL,
        voice_author_photo_url LONGTEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        uploaded_by INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_pmam_ordem_unida_audios_item_voice (item_id, voice_profile_key),
        KEY idx_pmam_ordem_unida_audios_active (is_active)
      )
      `);
      await query("ALTER TABLE pmam_ordem_unida_audios ADD COLUMN IF NOT EXISTS voice_profile_key VARCHAR(128) NOT NULL DEFAULT 'default' AFTER duration");
      await query("ALTER TABLE pmam_ordem_unida_audios ADD COLUMN IF NOT EXISTS voice_author_name VARCHAR(255) NULL AFTER voice_profile_key");
      await query("ALTER TABLE pmam_ordem_unida_audios ADD COLUMN IF NOT EXISTS voice_author_photo_url LONGTEXT NULL AFTER voice_author_name");

      const indexes = await query(
        "SELECT DISTINCT INDEX_NAME AS index_name FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pmam_ordem_unida_audios'",
      );
      const indexNames = new Set(indexes.map((row: any) => String(row.index_name)));
      if (indexNames.has("uq_pmam_ordem_unida_audios_item")) {
        await query("ALTER TABLE pmam_ordem_unida_audios DROP INDEX uq_pmam_ordem_unida_audios_item");
      }
      if (!indexNames.has("uq_pmam_ordem_unida_audios_item_voice")) {
        await query("ALTER TABLE pmam_ordem_unida_audios ADD UNIQUE INDEX uq_pmam_ordem_unida_audios_item_voice (item_id, voice_profile_key)");
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function listActiveOrdemUnidaAudios() {
  await ensureOrdemUnidaAudioSchema();
  const rows = await query("SELECT * FROM pmam_ordem_unida_audios WHERE is_active = 1 ORDER BY item_type, item_title");
  return rows.map(mapAudio);
}

export async function listAllOrdemUnidaAudios() {
  await ensureOrdemUnidaAudioSchema();
  const rows = await query("SELECT * FROM pmam_ordem_unida_audios ORDER BY item_type, item_title");
  return rows.map(mapAudio);
}

export async function getOrdemUnidaAudioByItemId(itemId: string, voiceProfileKey = "default") {
  await ensureOrdemUnidaAudioSchema();
  const rows = await query("SELECT * FROM pmam_ordem_unida_audios WHERE item_id = ? AND voice_profile_key = ? LIMIT 1", [itemId, voiceProfileKey]);
  return rows[0] ? mapAudio(rows[0]) : null;
}

export async function upsertOrdemUnidaAudio(input: {
  itemId: string;
  itemTitle: string;
  itemType: OrdemUnidaAudioType;
  audioUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration?: number | null;
  voiceProfileKey?: string;
  voiceAuthorName?: string | null;
  voiceAuthorPhotoUrl?: string | null;
  uploadedBy: number;
}) {
  await ensureOrdemUnidaAudioSchema();
  await query(
    `INSERT INTO pmam_ordem_unida_audios
      (item_id, item_title, item_type, audio_url, file_key, file_name, file_size, mime_type, duration, voice_profile_key, voice_author_name, voice_author_photo_url, is_active, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE
       item_title = VALUES(item_title),
       item_type = VALUES(item_type),
       audio_url = VALUES(audio_url),
       file_key = VALUES(file_key),
       file_name = VALUES(file_name),
       file_size = VALUES(file_size),
       mime_type = VALUES(mime_type),
       duration = VALUES(duration),
       voice_author_name = VALUES(voice_author_name),
       voice_author_photo_url = COALESCE(VALUES(voice_author_photo_url), voice_author_photo_url),
       is_active = 1,
       uploaded_by = VALUES(uploaded_by),
       updated_at = CURRENT_TIMESTAMP`,
    [
      input.itemId,
      input.itemTitle,
      input.itemType,
      input.audioUrl,
      input.fileKey,
      input.fileName,
      input.fileSize,
      input.mimeType,
      input.duration ?? null,
      input.voiceProfileKey || "default",
      input.voiceAuthorName || null,
      input.voiceAuthorPhotoUrl || null,
      input.uploadedBy,
    ],
  );
  return getOrdemUnidaAudioByItemId(input.itemId, input.voiceProfileKey || "default");
}

export async function deactivateOrdemUnidaAudio(id: number) {
  await ensureOrdemUnidaAudioSchema();
  await query(
    "UPDATE pmam_ordem_unida_audios SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id],
  );
}
