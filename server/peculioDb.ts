import { query } from "./mysql";

let schemaPromise: Promise<void> | null = null;

function toDateOnly(value: any) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export async function ensurePeculioTables() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_peculio_reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          date DATE NOT NULL,
          instrucao_local VARCHAR(255) NULL,
          instrucao_disciplina VARCHAR(255) NULL,
          instrucao_externa BOOLEAN NOT NULL DEFAULT false,
          chefe_turma VARCHAR(255) NULL,
          subchefe_turma VARCHAR(255) NULL,
          cmt_pel VARCHAR(255) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_peculio_reports_scope_date (companhia, peloton, date),
          KEY idx_pmam_peculio_reports_date (date)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_peculio_student_statuses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          report_id INT NOT NULL,
          student_id INT NOT NULL,
          status VARCHAR(16) NOT NULL,
          observacao VARCHAR(255) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_peculio_student_statuses_report_student (report_id, student_id),
          FOREIGN KEY (report_id) REFERENCES pmam_peculio_reports(id) ON DELETE CASCADE
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_peculio_unlocks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          date DATE NOT NULL,
          reason VARCHAR(255) NULL,
          unlocked_until TIMESTAMP NOT NULL,
          unlocked_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_peculio_unlocks_scope_date (companhia, peloton, date),
          KEY idx_pmam_peculio_unlocks_until (unlocked_until)
        )
      `);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export function getPeculioLockedAt(date: string): Date {
  const close = new Date(`${date}T05:00:00-03:00`);
  close.setUTCDate(close.getUTCDate() + 1);
  return close;
}

export async function getPeculioUnlock(companhia: number, peloton: number, date: string) {
  await ensurePeculioTables();
  const rows = await query(`
    SELECT *
    FROM pmam_peculio_unlocks
    WHERE companhia = ? AND peloton = ? AND date = ?
    LIMIT 1
  `, [companhia, peloton, date]);

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    companhia: row.companhia,
    peloton: row.peloton,
    date: toDateOnly(row.date),
    reason: row.reason || null,
    unlockedUntil: row.unlocked_until,
    unlockedBy: row.unlocked_by || null,
    createdAt: row.created_at,
  };
}

export async function releasePeculio(input: {
  companhia: number;
  peloton: number;
  date: string;
  reason?: string | null;
  unlockedUntil: Date;
  unlockedBy?: number | null;
}) {
  await ensurePeculioTables();
  await query(`
    INSERT INTO pmam_peculio_unlocks
      (companhia, peloton, date, reason, unlocked_until, unlocked_by)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      reason = VALUES(reason),
      unlocked_until = VALUES(unlocked_until),
      unlocked_by = VALUES(unlocked_by),
      created_at = CURRENT_TIMESTAMP
  `, [
    input.companhia,
    input.peloton,
    input.date,
    input.reason ?? null,
    input.unlockedUntil,
    input.unlockedBy ?? null,
  ]);
}

export async function getPeculioReport(companhia: number, peloton: number, date: string) {
  await ensurePeculioTables();
  const reports = await query(`
    SELECT * FROM pmam_peculio_reports
    WHERE companhia = ? AND peloton = ? AND date = ?
    LIMIT 1
  `, [companhia, peloton, date]);

  const report = reports[0] || null;

  let statuses: Array<{ studentId: number; status: string; observacao: string | null }> = [];
  if (report) {
    statuses = await query(`
      SELECT student_id AS studentId, status, observacao
      FROM pmam_peculio_student_statuses
      WHERE report_id = ?
    `, [report.id]);
  }

  return {
    report: report ? {
      id: report.id,
      companhia: report.companhia,
      peloton: report.peloton,
      date: toDateOnly(report.date),
      instrucaoLocal: report.instrucao_local,
      instrucaoDisciplina: report.instrucao_disciplina,
      instrucaoExterna: report.instrucao_externa === 1 || report.instrucao_externa === true,
      chefeTurma: report.chefe_turma,
      subchefeTurma: report.subchefe_turma,
      cmtPel: report.cmt_pel,
    } : null,
    statuses,
  };
}

export async function savePeculioReport(input: {
  companhia: number;
  peloton: number;
  date: string;
  instrucaoLocal?: string | null;
  instrucaoDisciplina?: string | null;
  instrucaoExterna?: boolean;
  chefeTurma?: string | null;
  subchefeTurma?: string | null;
  cmtPel?: string | null;
  statuses: Array<{ studentId: number; status: string; observacao?: string | null }>;
}) {
  await ensurePeculioTables();

  // 1. Upsert header
  await query(`
    INSERT INTO pmam_peculio_reports (
      companhia, peloton, date, instrucao_local, instrucao_disciplina,
      instrucao_externa, chefe_turma, subchefe_turma, cmt_pel
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      instrucao_local = VALUES(instrucao_local),
      instrucao_disciplina = VALUES(instrucao_disciplina),
      instrucao_externa = VALUES(instrucao_externa),
      chefe_turma = VALUES(chefe_turma),
      subchefe_turma = VALUES(subchefe_turma),
      cmt_pel = VALUES(cmt_pel),
      updated_at = CURRENT_TIMESTAMP
  `, [
    input.companhia,
    input.peloton,
    input.date,
    input.instrucaoLocal ?? null,
    input.instrucaoDisciplina ?? null,
    input.instrucaoExterna ? 1 : 0,
    input.chefeTurma ?? null,
    input.subchefeTurma ?? null,
    input.cmtPel ?? null,
  ]);

  // Fetch the report ID
  const reports = await query(`
    SELECT id FROM pmam_peculio_reports
    WHERE companhia = ? AND peloton = ? AND date = ?
    LIMIT 1
  `, [input.companhia, input.peloton, input.date]);

  const reportId = reports[0].id;

  // 2. Save statuses
  if (input.statuses && input.statuses.length > 0) {
    for (const item of input.statuses) {
      await query(`
        INSERT INTO pmam_peculio_student_statuses (report_id, student_id, status, observacao)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          observacao = VALUES(observacao),
          updated_at = CURRENT_TIMESTAMP
      `, [
        reportId,
        item.studentId,
        item.status,
        item.observacao ?? null,
      ]);
    }
  }

  return getPeculioReport(input.companhia, input.peloton, input.date);
}
