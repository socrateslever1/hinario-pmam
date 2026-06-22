import { query } from "./mysql";

export type CfapPersonnelCategory = "comando" | "administracao" | "corpo_alunos" | "apoio";

export interface CfapPersonnel {
  id: number;
  category: CfapPersonnelCategory;
  rank: string;
  fullName: string;
  ci: string | null;
  permanentFunction: string;
  section: string | null;
  companhia: number | null;
  peloton: number | null;
  isActive: boolean;
  sourceDocument: string | null;
  sourceDate: string | null;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CfapPersonnelInput {
  category: CfapPersonnelCategory;
  rank: string;
  fullName: string;
  ci?: string | null;
  permanentFunction: string;
  section?: string | null;
  companhia?: number | null;
  peloton?: number | null;
  isActive?: boolean;
  sourceDocument?: string | null;
  sourceDate?: string | null;
  notes?: string | null;
}

const INITIAL_PERSONNEL_BASE: CfapPersonnelInput[] = [
  { category: "comando", rank: "MAJ QOPM", fullName: "Fernando Yukio Miyadaira", ci: "20796", permanentFunction: "Subcomandante do CFAP", section: "Comando" },
  { category: "administracao", rank: "MAJ QOPM", fullName: "Leonardo Lima Luz", ci: "20858", permanentFunction: "Chefe da SJD", section: "SJD" },
  { category: "administracao", rank: "MAJ QOPM", fullName: "Zorásio Bonfim dos Santos", ci: "19629", permanentFunction: "Chefe da P-3", section: "P-3" },
  { category: "corpo_alunos", rank: "CAP QOPM", fullName: "Johnes Fernandes Costa", ci: "22913", permanentFunction: "Comandante do CAL", section: "CAL" },
  { category: "administracao", rank: "CAP QOPM", fullName: "Lidiane de Souza Pinto", ci: "16843", permanentFunction: "Chefe da P-1", section: "P-1" },
  { category: "administracao", rank: "CAP QOPM", fullName: "Carlos Alberto Martins Queiroz Júnior", ci: "23719", permanentFunction: "Chefe da P-4", section: "P-4" },
  { category: "administracao", rank: "2º TEN QOAPM", fullName: "Ramon Carioca de Oliveira", ci: "13653", permanentFunction: "Adjunto da P-4", section: "P-4" },
  { category: "administracao", rank: "1º SGT QPPM", fullName: "Valder Araújo Cardoso", ci: "15662", permanentFunction: "Sargenteante", section: "Administração" },
  { category: "administracao", rank: "3º SGT QPPM", fullName: "Francyne Annick Castro Cabral", ci: "21489", permanentFunction: "Auxiliar da P-1", section: "P-1" },
  { category: "administracao", rank: "3º SGT QPPM", fullName: "Gleydson de Amorim Marques", ci: "19969", permanentFunction: "Auxiliar da P-1", section: "P-1" },
  { category: "administracao", rank: "3º SGT QPPM", fullName: "Susana Floriano Júlio Moura Santos", ci: "22210", permanentFunction: "Auxiliar da P-1", section: "P-1" },
  { category: "administracao", rank: "CB QPPM", fullName: "Rayson Rodrigo Batista de Sá", ci: "22068", permanentFunction: "Auxiliar da P-4", section: "P-4" },
  { category: "administracao", rank: "CB QPPM", fullName: "Adielson Ferreira Horta", ci: "24841", permanentFunction: "Auxiliar da P-5", section: "P-5" },
  { category: "administracao", rank: "SD QPPM", fullName: "Bernhard Johnson Coelho de Souza", ci: "25728", permanentFunction: "Auxiliar da P-3", section: "P-3" },
  { category: "apoio", rank: "SD QPPM", fullName: "Rebeca Polyana dos Santos Marques", ci: "26226", permanentFunction: "Auxiliar de Oficial de Dia", section: "Serviço" },
  { category: "administracao", rank: "AL SD QPPM", fullName: "William Gomes da Silva", ci: "27326", permanentFunction: "Auxiliar da P-4", section: "P-4" },
  { category: "administracao", rank: "AL SD QPPM", fullName: "Emmanuel Saraiva e Souza", ci: "26966", permanentFunction: "Auxiliar da P-4", section: "P-4" },
  { category: "administracao", rank: "CB QPPM", fullName: "Herbeth Geysi Silva Coelho", ci: "21539", permanentFunction: "Auxiliar da P-4", section: "P-4" },
  { category: "corpo_alunos", rank: "CAP QOPM", fullName: "Rodolfo de Souza Lima", ci: "23796", permanentFunction: "Adjunto do CAL", section: "CAL" },
  { category: "corpo_alunos", rank: "CAP QOPM", fullName: "Carolina Grijó da Silva", ci: "23721", permanentFunction: "Comandante de Companhia", section: "CAL" },
  { category: "corpo_alunos", rank: "CAP QOPM", fullName: "João Carlos Pequeno da Silva", ci: "17839", permanentFunction: "Comandante de Companhia", section: "CAL" },
  { category: "corpo_alunos", rank: "2º TEN QOAPM", fullName: "Caio Fábio de Araújo Queiroz", ci: "15948", permanentFunction: "Comandante de Companhia", section: "CAL" },
  { category: "corpo_alunos", rank: "2º TEN QOAPM", fullName: "Eduardo Carlos da Silva", ci: "14526", permanentFunction: "Comandante de Companhia", section: "CAL" },
  { category: "corpo_alunos", rank: "1º SGT QPPM", fullName: "Gervandro Rodrigues Campos", ci: "16145", permanentFunction: "Comandante de Pelotão", section: "CAL" },
  { category: "corpo_alunos", rank: "2º SGT QPPM", fullName: "Willas Uchoa Fernandes", ci: "17969", permanentFunction: "Comandante de Pelotão", section: "CAL" },
  { category: "corpo_alunos", rank: "2º SGT QPPM", fullName: "Hudson do Carmo Nascimento", ci: "17498", permanentFunction: "Comandante de Pelotão", section: "CAL" },
  { category: "corpo_alunos", rank: "2º SGT QPPM", fullName: "José Elias Barbosa de Oliveira", ci: "17849", permanentFunction: "Comandante de Pelotão", section: "CAL" },
  { category: "corpo_alunos", rank: "3º SGT QPPM", fullName: "Dleon Batista Nascimento", ci: "19895", permanentFunction: "Comandante de Pelotão", section: "CAL" },
  { category: "corpo_alunos", rank: "3º SGT QPPM", fullName: "Ellen Bianca Moreira", ci: "20257", permanentFunction: "Comandante de Pelotão", section: "CAL" },
  { category: "corpo_alunos", rank: "3º SGT QPPM", fullName: "Diego Macedo de Oliveira", ci: "21299", permanentFunction: "Comandante de Pelotão", section: "CAL" },
  { category: "corpo_alunos", rank: "3º SGT QPPM", fullName: "Alex Júnior Almeida Brasil", ci: "23186", permanentFunction: "Comandante de Pelotão", section: "CAL" },
];

const INITIAL_PERSONNEL: CfapPersonnelInput[] = INITIAL_PERSONNEL_BASE.map((item) => ({
  ...item,
  sourceDocument: "Aditamentos CFAP nº 46, 49, 52, 53 e 54/2026",
  sourceDate: "2026-06-19",
  notes: "Carga inicial sujeita à conferência do Xerife Geral.",
}));

let schemaPromise: Promise<void> | null = null;

function toDateOnly(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function mapPersonnel(row: any): CfapPersonnel {
  return {
    id: Number(row.id),
    category: row.category,
    rank: row.rankName,
    fullName: row.fullName,
    ci: row.ci,
    permanentFunction: row.permanentFunction,
    section: row.section,
    companhia: row.companhia === null ? null : Number(row.companhia),
    peloton: row.peloton === null ? null : Number(row.peloton),
    isActive: Boolean(row.isActive),
    sourceDocument: row.sourceDocument,
    sourceDate: toDateOnly(row.sourceDate),
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function ensureCfapPersonnelTables() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_cfap_personnel (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category VARCHAR(32) NOT NULL,
          rank_name VARCHAR(60) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          ci VARCHAR(40) NULL,
          permanent_function VARCHAR(255) NOT NULL,
          section_name VARCHAR(120) NULL,
          companhia INT NULL,
          peloton INT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          source_document VARCHAR(255) NULL,
          source_date DATE NULL,
          notes TEXT NULL,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_cfap_personnel_ci (ci),
          KEY idx_pmam_cfap_personnel_active (is_active, category),
          KEY idx_pmam_cfap_personnel_name (full_name)
        )
      `);
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_cfap_personnel_audit (
          id INT AUTO_INCREMENT PRIMARY KEY,
          personnel_id INT NULL,
          action VARCHAR(32) NOT NULL,
          snapshot_json LONGTEXT NOT NULL,
          changed_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_pmam_cfap_personnel_audit_person (personnel_id, created_at)
        )
      `);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export async function listCfapPersonnel(options?: { includeInactive?: boolean; search?: string }) {
  await ensureCfapPersonnelTables();
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (!options?.includeInactive) conditions.push("is_active = true");
  if (options?.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    conditions.push("(full_name LIKE ? OR ci LIKE ? OR permanent_function LIKE ? OR section_name LIKE ?)");
    params.push(term, term, term, term);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`
    SELECT id, category, rank_name AS rankName, full_name AS fullName, ci,
           permanent_function AS permanentFunction, section_name AS section,
           companhia, peloton, is_active AS isActive,
           source_document AS sourceDocument, source_date AS sourceDate, notes,
           created_at AS createdAt, updated_at AS updatedAt
    FROM pmam_cfap_personnel
    ${where}
    ORDER BY is_active DESC, FIELD(category, 'comando', 'administracao', 'corpo_alunos', 'apoio'),
             section_name, permanent_function, full_name
  `, params);
  return rows.map(mapPersonnel);
}

export async function getCfapPersonnelSummary() {
  await ensureCfapPersonnelTables();
  const [personnelRows, studentRows] = await Promise.all([
    query(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) AS active
      FROM pmam_cfap_personnel
    `),
    query(`SELECT COUNT(*) AS total FROM pmam_students`),
  ]);
  return {
    total: Number((personnelRows[0] as any)?.total || 0),
    active: Number((personnelRows[0] as any)?.active || 0),
    students: Number((studentRows[0] as any)?.total || 0),
  };
}

async function auditPersonnel(personnelId: number | null, action: string, snapshot: unknown, changedBy?: number | null) {
  await query(`
    INSERT INTO pmam_cfap_personnel_audit (personnel_id, action, snapshot_json, changed_by)
    VALUES (?, ?, ?, ?)
  `, [personnelId, action, JSON.stringify(snapshot), changedBy ?? null]);
}

export async function createCfapPersonnel(input: CfapPersonnelInput, changedBy?: number | null) {
  await ensureCfapPersonnelTables();
  const result: any = await query(`
    INSERT INTO pmam_cfap_personnel (
      category, rank_name, full_name, ci, permanent_function, section_name,
      companhia, peloton, is_active, source_document, source_date, notes,
      created_by, updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    input.category, input.rank, input.fullName, input.ci || null,
    input.permanentFunction, input.section || null, input.companhia ?? null,
    input.peloton ?? null, input.isActive ?? true, input.sourceDocument || null,
    input.sourceDate || null, input.notes || null, changedBy ?? null, changedBy ?? null,
  ]);
  const id = Number(result.insertId);
  await auditPersonnel(id, "create", input, changedBy);
  return id;
}

export async function updateCfapPersonnel(id: number, input: CfapPersonnelInput, changedBy?: number | null) {
  await ensureCfapPersonnelTables();
  const before = (await listCfapPersonnel({ includeInactive: true })).find((item) => item.id === id);
  await query(`
    UPDATE pmam_cfap_personnel SET
      category = ?, rank_name = ?, full_name = ?, ci = ?, permanent_function = ?,
      section_name = ?, companhia = ?, peloton = ?, is_active = ?,
      source_document = ?, source_date = ?, notes = ?, updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    input.category, input.rank, input.fullName, input.ci || null,
    input.permanentFunction, input.section || null, input.companhia ?? null,
    input.peloton ?? null, input.isActive ?? true, input.sourceDocument || null,
    input.sourceDate || null, input.notes || null, changedBy ?? null, id,
  ]);
  await auditPersonnel(id, "update", { before, after: input }, changedBy);
}

export async function seedInitialCfapPersonnel(changedBy?: number | null) {
  await ensureCfapPersonnelTables();
  const cis = INITIAL_PERSONNEL.map((item) => item.ci as string);
  const existing = await query(
    `SELECT ci FROM pmam_cfap_personnel WHERE ci IN (${cis.map(() => "?").join(", ")})`,
    cis,
  );
  const existingCis = new Set(existing.map((item: any) => item.ci));
  const placeholders = INITIAL_PERSONNEL.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
  const params = INITIAL_PERSONNEL.flatMap((item) => [
    item.category, item.rank, item.fullName, item.ci || null,
    item.permanentFunction, item.section || null, item.companhia ?? null,
    item.peloton ?? null, item.isActive ?? true, item.sourceDocument || null,
    item.sourceDate || null, item.notes || null, changedBy ?? null, changedBy ?? null,
  ]);
  await query(`
    INSERT INTO pmam_cfap_personnel (
      category, rank_name, full_name, ci, permanent_function, section_name,
      companhia, peloton, is_active, source_document, source_date, notes,
      created_by, updated_by
    ) VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      category = VALUES(category), rank_name = VALUES(rank_name), full_name = VALUES(full_name),
      permanent_function = VALUES(permanent_function), section_name = VALUES(section_name),
      source_document = VALUES(source_document), source_date = VALUES(source_date),
      notes = VALUES(notes), updated_by = VALUES(updated_by), is_active = true,
      updated_at = CURRENT_TIMESTAMP
  `, params);
  const inserted = INITIAL_PERSONNEL.length - existingCis.size;
  const updated = existingCis.size;
  await auditPersonnel(null, "seed", { inserted, updated, source: "Aditamentos 46, 49, 52, 53 e 54/2026" }, changedBy);
  return { inserted, updated, total: INITIAL_PERSONNEL.length };
}
