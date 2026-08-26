import { query } from "./mysql";

export const DATABASE_OBJECT_CHUNK_SIZE = 1024 * 1024;

export async function putDatabaseObject(fileKey: string, data: Buffer, mimeType: string) {
  const totalChunks = Math.ceil(data.length / DATABASE_OBJECT_CHUNK_SIZE);
  await deleteDatabaseObject(fileKey);
  try {
    await query(`INSERT INTO pmam_file_objects
      (file_key, mime_type, file_size, chunk_size, total_chunks, status)
      VALUES (?, ?, ?, ?, ?, 'uploading')`,
      [fileKey, mimeType, data.length, DATABASE_OBJECT_CHUNK_SIZE, totalChunks]);
    for (let index = 0; index < totalChunks; index += 1) {
      const start = index * DATABASE_OBJECT_CHUNK_SIZE;
      const chunk = data.subarray(start, Math.min(start + DATABASE_OBJECT_CHUNK_SIZE, data.length));
      await query("INSERT INTO pmam_file_object_chunks (file_key, chunk_index, data_base64) VALUES (?, ?, ?)",
        [fileKey, index, chunk.toString("base64")]);
    }
    await query("UPDATE pmam_file_objects SET status = 'ready' WHERE file_key = ?", [fileKey]);
  } catch (error) {
    await deleteDatabaseObject(fileKey).catch(() => undefined);
    throw error;
  }
}

export async function deleteDatabaseObject(fileKey: string) {
  await query("DELETE FROM pmam_file_object_chunks WHERE file_key = ?", [fileKey]);
  await query("DELETE FROM pmam_file_objects WHERE file_key = ?", [fileKey]);
}

export async function getDatabaseObjectMetadata(fileKey: string) {
  const rows = await query<any>(`SELECT file_key, mime_type, file_size, chunk_size, total_chunks
    FROM pmam_file_objects WHERE file_key = ? AND status = 'ready' LIMIT 1`, [fileKey]);
  const row = rows[0];
  return row ? { fileKey: row.file_key, mimeType: row.mime_type, fileSize: Number(row.file_size),
    chunkSize: Number(row.chunk_size), totalChunks: Number(row.total_chunks) } : null;
}

export async function getDatabaseObjectChunk(fileKey: string, chunkIndex: number) {
  const rows = await query<any>("SELECT data_base64 FROM pmam_file_object_chunks WHERE file_key = ? AND chunk_index = ? LIMIT 1", [fileKey, chunkIndex]);
  return rows[0] ? new Uint8Array(Buffer.from(String(rows[0].data_base64), "base64")) : null;
}
