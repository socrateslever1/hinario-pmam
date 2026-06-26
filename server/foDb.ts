import { query } from './mysql';

export interface FatoObservadoProva {
  id: number;
  studentObservationId: number;
  arquivoUrl: string;
  tipo: "foto" | "video" | "audio" | "documento";
  nomeArquivo?: string | null;
  tamanho?: number | null;
  mimeType?: string | null;
  dataUpload: Date | string;
  criadoPor?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

let proofSchemaPromise: Promise<void> | null = null;

export async function ensureFoProofSchema() {
  if (!proofSchemaPromise) {
    proofSchemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_fato_observado_provas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_observation_id INT NULL,
          arquivo_url LONGTEXT NOT NULL,
          tipo ENUM('foto', 'video', 'audio', 'documento') DEFAULT 'foto',
          nome_arquivo VARCHAR(255) NULL,
          tamanho INT NULL,
          mime_type VARCHAR(100) NULL,
          data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          criado_por INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      await query(
        "ALTER TABLE pmam_fato_observado_provas ADD COLUMN IF NOT EXISTS student_observation_id INT NULL"
      );
    })().catch((error) => {
      proofSchemaPromise = null;
      throw error;
    });
  }
  await proofSchemaPromise;
}

/**
 * Criar uma prova (foto/vídeo) para um Fato Observado
 */
export async function createFatoObservadoProva(input: {
  studentObservationId: number;
  arquivoUrl: string;
  tipo: "foto" | "video" | "audio" | "documento";
  nomeArquivo?: string;
  tamanho?: number;
  mimeType?: string;
  criadoPor?: number;
}): Promise<number> {
  const result = await query(
    `INSERT INTO pmam_fato_observado_provas 
      (student_observation_id, arquivo_url, tipo, nome_arquivo, tamanho, mime_type, criado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.studentObservationId,
      input.arquivoUrl,
      input.tipo,
      input.nomeArquivo || null,
      input.tamanho || null,
      input.mimeType || null,
      input.criadoPor || null,
    ]
  );
  return (result as any).insertId;
}

/**
 * Listar provas de um Fato Observado
 */
export async function listFatoObservadoProvas(studentObservationId: number): Promise<FatoObservadoProva[]> {
  const rows = await query(
    `SELECT 
      id, student_observation_id as studentObservationId, arquivo_url as arquivoUrl,
      tipo, nome_arquivo as nomeArquivo, tamanho, mime_type as mimeType,
      data_upload as dataUpload, criado_por as criadoPor,
      created_at as createdAt, updated_at as updatedAt
     FROM pmam_fato_observado_provas
     WHERE student_observation_id = ?
     ORDER BY data_upload ASC`,
    [studentObservationId]
  );
  return (rows || []).map(mapFatoObservadoProva);
}

/**
 * Obter uma prova específica
 */
export async function getFatoObservadoProva(provaId: number): Promise<FatoObservadoProva | null> {
  const rows = await query(
    `SELECT 
      id, student_observation_id as studentObservationId, arquivo_url as arquivoUrl,
      tipo, nome_arquivo as nomeArquivo, tamanho, mime_type as mimeType,
      data_upload as dataUpload, criado_por as criadoPor,
      created_at as createdAt, updated_at as updatedAt
     FROM pmam_fato_observado_provas
     WHERE id = ?`,
    [provaId]
  );
  return rows?.[0] ? mapFatoObservadoProva(rows[0]) : null;
}

/**
 * Deletar uma prova
 */
export async function deleteFatoObservadoProva(provaId: number): Promise<void> {
  await query(
    `DELETE FROM pmam_fato_observado_provas WHERE id = ?`,
    [provaId]
  );
}

/**
 * Deletar todas as provas de um Fato Observado
 */
export async function deleteFatoObservadoProvas(studentObservationId: number): Promise<void> {
  await query(
    `DELETE FROM pmam_fato_observado_provas WHERE student_observation_id = ?`,
    [studentObservationId]
  );
}

/**
 * Mapear resultado do banco para objeto com camelCase
 */
function mapFatoObservadoProva(p: any): FatoObservadoProva {
  return {
    id: p.id,
    studentObservationId: p.studentObservationId || p.student_observation_id,
    arquivoUrl: p.arquivoUrl || p.arquivo_url,
    tipo: p.tipo,
    nomeArquivo: p.nomeArquivo || p.nome_arquivo,
    tamanho: p.tamanho,
    mimeType: p.mimeType || p.mime_type,
    dataUpload: p.dataUpload || p.data_upload,
    criadoPor: p.criadoPor || p.criado_por,
    createdAt: p.createdAt || p.created_at,
    updatedAt: p.updatedAt || p.updated_at,
  };
}
