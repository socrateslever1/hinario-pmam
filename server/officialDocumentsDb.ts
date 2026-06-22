import { query } from "./mysql";

export interface OfficialDocument {
  id: number;
  title: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: number | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

let ensurePromise: Promise<void> | null = null;

export function ensureOfficialDocumentsTable(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = query(`
      CREATE TABLE IF NOT EXISTS pmam_official_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(180) NOT NULL,
        description VARCHAR(500) NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url VARCHAR(1024) NOT NULL,
        file_key VARCHAR(512) NOT NULL,
        mime_type VARCHAR(120) NOT NULL,
        file_size INT UNSIGNED NOT NULL,
        uploaded_by INT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_pmam_official_documents_active_created (is_active, created_at)
      )
    `).then(() => undefined).catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}

function mapDocument(row: any): OfficialDocument {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description ?? null,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileKey: row.file_key,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size || 0),
    uploadedBy: row.uploaded_by == null ? null : Number(row.uploaded_by),
    isActive: row.is_active === true || Number(row.is_active) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listOfficialDocuments(activeOnly = true): Promise<OfficialDocument[]> {
  await ensureOfficialDocumentsTable();
  const rows = await query<any>(`
    SELECT id, title, description, file_name, file_url, file_key, mime_type,
           file_size, uploaded_by, is_active, created_at, updated_at
    FROM pmam_official_documents
    ${activeOnly ? "WHERE is_active = TRUE" : ""}
    ORDER BY created_at DESC, id DESC
  `);
  return rows.map(mapDocument);
}

export async function createOfficialDocument(input: {
  title: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: number;
}): Promise<number> {
  await ensureOfficialDocumentsTable();
  const result = await query<any>(`
    INSERT INTO pmam_official_documents
      (title, description, file_name, file_url, file_key, mime_type, file_size, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    input.title,
    input.description,
    input.fileName,
    input.fileUrl,
    input.fileKey,
    input.mimeType,
    input.fileSize,
    input.uploadedBy,
  ]) as any;
  return Number(result.insertId);
}

export async function deleteOfficialDocument(id: number): Promise<boolean> {
  await ensureOfficialDocumentsTable();
  const result = await query<any>(
    "DELETE FROM pmam_official_documents WHERE id = ?",
    [id],
  ) as any;
  return Number(result.affectedRows || 0) > 0;
}
