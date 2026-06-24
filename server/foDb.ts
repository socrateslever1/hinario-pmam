import { query } from './mysql';

export interface FatoObservadoProva {
  id: number;
  fatoObservadoId: number;
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

/**
 * Criar uma prova (foto/vídeo) para um Fato Observado
 */
export async function createFatoObservadoProva(input: {
  fatoObservadoId: number;
  arquivoUrl: string;
  tipo: "foto" | "video" | "audio" | "documento";
  nomeArquivo?: string;
  tamanho?: number;
  mimeType?: string;
  criadoPor?: number;
}): Promise<number> {
  const result = await query(
    `INSERT INTO pmam_fato_observado_provas 
      (fato_observado_id, arquivo_url, tipo, nome_arquivo, tamanho, mime_type, criado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.fatoObservadoId,
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
export async function listFatoObservadoProvas(fatoObservadoId: number): Promise<FatoObservadoProva[]> {
  const rows = await query(
    `SELECT 
      id, fato_observado_id as fatoObservadoId, arquivo_url as arquivoUrl, 
      tipo, nome_arquivo as nomeArquivo, tamanho, mime_type as mimeType,
      data_upload as dataUpload, criado_por as criadoPor,
      created_at as createdAt, updated_at as updatedAt
     FROM pmam_fato_observado_provas
     WHERE fato_observado_id = ?
     ORDER BY data_upload ASC`,
    [fatoObservadoId]
  );
  return (rows || []).map(mapFatoObservadoProva);
}

/**
 * Obter uma prova específica
 */
export async function getFatoObservadoProva(provaId: number): Promise<FatoObservadoProva | null> {
  const rows = await query(
    `SELECT 
      id, fato_observado_id as fatoObservadoId, arquivo_url as arquivoUrl, 
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
export async function deleteFatoObservadoProvas(fatoObservadoId: number): Promise<void> {
  await query(
    `DELETE FROM pmam_fato_observado_provas WHERE fato_observado_id = ?`,
    [fatoObservadoId]
  );
}

/**
 * Mapear resultado do banco para objeto com camelCase
 */
function mapFatoObservadoProva(p: any): FatoObservadoProva {
  return {
    id: p.id,
    fatoObservadoId: p.fatoObservadoId || p.fato_observado_id,
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
