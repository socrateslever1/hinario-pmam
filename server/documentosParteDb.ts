import { query } from "./mysql";
import { createAditamento } from "./serviceScaleDb";

export interface DocumentoParte {
  id: number;
  studentId: number;
  tipoDocumento: string;
  tipoParte: string;
  remetente: string;
  destinatario: string;
  assunto: string;
  anexo: string | null;
  localData: string;
  conteudoJson: string;
  status: 'enviado' | 'aceito' | 'recusado' | 'negociacao';
  observacaoXerife: string | null;
  imagemCabecalhoEsq: string | null;
  imagemCabecalhoDir: string | null;
  assinaturaDigital: string | null;
  assinadoEm: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Extra fields from join (student info)
  nomeGuerra?: string;
  numerica?: string;
  companhia?: number;
  peloton?: number;
}

let ensurePromise: Promise<void> | null = null;

export function ensureDocumentosParteTable(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = query(`
      CREATE TABLE IF NOT EXISTS pmam_documentos_parte (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        tipo_documento VARCHAR(50) NOT NULL,
        tipo_parte VARCHAR(50) NOT NULL,
        remetente VARCHAR(255) NOT NULL,
        destinatario VARCHAR(255) NOT NULL,
        assunto VARCHAR(255) NOT NULL,
        anexo VARCHAR(255) NULL,
        local_data VARCHAR(255) NOT NULL,
        conteudo_json TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'enviado',
        observacao_xerife TEXT NULL,
        imagem_cabecalho_esq LONGTEXT NULL,
        imagem_cabecalho_dir LONGTEXT NULL,
        assinatura_digital VARCHAR(512) NULL,
        assinado_em TIMESTAMP NULL NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_pmam_doc_student (student_id),
        KEY idx_pmam_doc_status (status)
      )
    `).then(() => undefined).catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  return ensurePromise;
}

function mapDocumento(row: any): DocumentoParte {
  return {
    id: Number(row.id),
    studentId: Number(row.student_id),
    tipoDocumento: row.tipo_documento,
    tipoParte: row.tipo_parte,
    remetente: row.remetente,
    destinatario: row.destinatario,
    assunto: row.assunto,
    anexo: row.anexo ?? null,
    localData: row.local_data,
    conteudoJson: row.conteudo_json,
    status: row.status,
    observacaoXerife: row.observacao_xerife ?? null,
    imagemCabecalhoEsq: row.imagem_cabecalho_esq ?? null,
    imagemCabecalhoDir: row.imagem_cabecalho_dir ?? null,
    assinaturaDigital: row.assinatura_digital ?? null,
    assinadoEm: row.assinado_em,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    nomeGuerra: row.nome_guerra,
    numerica: row.numerica,
    companhia: row.companhia != null ? Number(row.companhia) : undefined,
    peloton: row.peloton != null ? Number(row.peloton) : undefined
  };
}

export async function criarDocumentoParte(input: {
  studentId: number;
  tipoDocumento: string;
  tipoParte: string;
  remetente: string;
  destinatario: string;
  assunto: string;
  anexo: string | null;
  localData: string;
  conteudoJson: string;
  imagemCabecalhoEsq: string | null;
  imagemCabecalhoDir: string | null;
  assinaturaDigital: string | null;
}): Promise<number> {
  await ensureDocumentosParteTable();
  const result = await query<any>(`
    INSERT INTO pmam_documentos_parte (
      student_id, tipo_documento, tipo_parte, remetente, destinatario, assunto,
      anexo, local_data, conteudo_json, imagem_cabecalho_esq, imagem_cabecalho_dir,
      assinatura_digital, status, assinado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'enviado', NOW())
  `, [
    input.studentId,
    input.tipoDocumento,
    input.tipoParte,
    input.remetente,
    input.destinatario,
    input.assunto,
    input.anexo,
    input.localData,
    input.conteudoJson,
    input.imagemCabecalhoEsq,
    input.imagemCabecalhoDir,
    input.assinaturaDigital
  ]) as any;
  return Number(result.insertId);
}

export async function obterDocumentoParte(id: number): Promise<DocumentoParte | null> {
  await ensureDocumentosParteTable();
  const rows = await query<any>(`
    SELECT d.*, s.nome_guerra, s.numerica, s.companhia, s.peloton
    FROM pmam_documentos_parte d
    JOIN pmam_students s ON d.student_id = s.id
    WHERE d.id = ?
  `, [id]);
  if (rows.length === 0) return null;
  return mapDocumento(rows[0]);
}

export async function listarDocumentosEstudante(studentId: number): Promise<DocumentoParte[]> {
  await ensureDocumentosParteTable();
  const rows = await query<any>(`
    SELECT d.*, s.nome_guerra, s.numerica, s.companhia, s.peloton
    FROM pmam_documentos_parte d
    JOIN pmam_students s ON d.student_id = s.id
    WHERE d.student_id = ?
    ORDER BY d.created_at DESC
  `, [studentId]);
  return rows.map(mapDocumento);
}

export async function listarDocumentosXerife(scope: {
  level: string;
  companhia: number | null;
  peloton: number | null;
}): Promise<DocumentoParte[]> {
  await ensureDocumentosParteTable();
  
  let rows: any[] = [];
  if (scope.level === "principal") {
    rows = await query<any>(`
      SELECT d.*, s.nome_guerra, s.numerica, s.companhia, s.peloton
      FROM pmam_documentos_parte d
      JOIN pmam_students s ON d.student_id = s.id
      ORDER BY d.created_at DESC
    `);
  } else if (scope.level === "companhia" && scope.companhia != null) {
    rows = await query<any>(`
      SELECT d.*, s.nome_guerra, s.numerica, s.companhia, s.peloton
      FROM pmam_documentos_parte d
      JOIN pmam_students s ON d.student_id = s.id
      WHERE s.companhia = ?
      ORDER BY d.created_at DESC
    `, [scope.companhia]);
  } else if (scope.level === "pelotao" && scope.companhia != null && scope.peloton != null) {
    rows = await query<any>(`
      SELECT d.*, s.nome_guerra, s.numerica, s.companhia, s.peloton
      FROM pmam_documentos_parte d
      JOIN pmam_students s ON d.student_id = s.id
      WHERE s.companhia = ? AND s.peloton = ?
      ORDER BY d.created_at DESC
    `, [scope.companhia, scope.peloton]);
  } else {
    // Fallback: Xerife sem escopo válido ou não configurado
    return [];
  }
  
  return rows.map(mapDocumento);
}

export async function responderDocumentoParte(
  id: number,
  status: 'aceito' | 'recusado' | 'negociacao',
  observacaoXerife: string | null,
  xerifeName: string
): Promise<boolean> {
  await ensureDocumentosParteTable();
  
  // 1. Atualizar o status da Parte
  const result = await query<any>(`
    UPDATE pmam_documentos_parte
    SET status = ?, observacao_xerife = ?
    WHERE id = ?
  `, [status, observacaoXerife, id]) as any;
  
  const updated = Number(result.affectedRows || 0) > 0;
  
  if (updated && status === 'aceito') {
    // 2. Buscar informações completas da parte para gerar o aditamento automático
    const doc = await obterDocumentoParte(id);
    if (doc) {
      let docDataParsed: any = {};
      try {
        docDataParsed = JSON.parse(doc.conteudoJson);
      } catch (e) {
        docDataParsed = {};
      }
      
      const relato = docDataParsed.parteRelato || docDataParsed.reqJustificativa || docDataParsed.defesaTexto || docDataParsed.guiaMotivo || "";
      
      const companhia = doc.companhia || 1;
      const peloton = doc.peloton || 1;
      
      const tipoLabel = doc.tipoDocumento === 'parte' ? `Parte (${doc.tipoParte})` : 
                        doc.tipoDocumento === 'requerimento' ? 'Requerimento' :
                        doc.tipoDocumento === 'defesa' ? 'Defesa Escrita' : 'Guia de Trânsito';
                        
      const tituloAditamento = `Publicação de ${tipoLabel} - AL SD PM ${doc.nomeGuerra || doc.remetente}`;
      
      const formatCia = `${companhia}ª Cia`;
      const formatPel = `${peloton}º Pel`;
      
      const conteudoAditamento = `O militar AL SD PM (${doc.numerica}) ${doc.nomeGuerra?.toUpperCase() || doc.remetente}, pertencente à ${formatCia} / ${formatPel}, solicitou via trâmite eletrônico o seguinte teor:\n\n` +
        `ASSUNTO: ${doc.assunto}\n` +
        `RELATO INTEGRAL:\n"${relato}"\n\n` +
        `DESPACHO ADMINISTRATIVO:\n` +
        `O pedido foi DEFERIDO e ACATADO eletronicamente pelo Xerife Geral/Administração (${xerifeName}) em ${new Date().toLocaleDateString("pt-BR")}.\n` +
        (observacaoXerife ? `Observação do Deferimento: ${observacaoXerife}\n` : "") +
        `Assinatura do Fechamento: CFAP-DOCS-${doc.id}-${Date.now().toString(36).toUpperCase()}`;

      // Inserir registro em pmam_aditamentos
      await createAditamento({
        companhia,
        peloton,
        titulo: tituloAditamento,
        conteudo: conteudoAditamento,
        data: new Date().toISOString().slice(0, 10),
        pdfUrl: null
      });
    }
  }
  
  return updated;
}
