/**
 * MANUS_LOCK: PECULIO_CRITICAL_MODULE
 * Nao alterar deliberadamente este arquivo sem autorizacao explicita do dono do projeto.
 * Este modulo cria e mantem as tabelas, auditoria, chegada tardia, justificativas e fechamento do Peculio.
 * Qualquer mudanca pode afetar dados reais de frequencia; preserve migracoes incrementais e compatibilidade.
 */
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
          entry_time VARCHAR(5) NOT NULL DEFAULT '05:00',
          closed_at TIMESTAMP NULL,
          closed_by INT NULL,
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
          arrival_time TIMESTAMP NULL,
          arrival_registered_by INT NULL,
          justification_note VARCHAR(500) NULL,
          justification_status VARCHAR(16) NULL,
          justification_by INT NULL,
          justification_at TIMESTAMP NULL,
          justification_reviewed_by INT NULL,
          justification_reviewed_at TIMESTAMP NULL,
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

      const reportCols = await query("SHOW COLUMNS FROM pmam_peculio_reports");
      const hasEntryTime = reportCols.some((col: any) => col.Field === "entry_time");
      const hasClosedAt = reportCols.some((col: any) => col.Field === "closed_at");
      const hasClosedBy = reportCols.some((col: any) => col.Field === "closed_by");
      if (!hasEntryTime) {
        await query("ALTER TABLE pmam_peculio_reports ADD COLUMN entry_time VARCHAR(5) NOT NULL DEFAULT '05:00' AFTER cmt_pel");
      }
      if (!hasClosedAt) {
        await query("ALTER TABLE pmam_peculio_reports ADD COLUMN closed_at TIMESTAMP NULL AFTER entry_time");
      }
      if (!hasClosedBy) {
        await query("ALTER TABLE pmam_peculio_reports ADD COLUMN closed_by INT NULL AFTER closed_at");
      }

      const statusCols = await query("SHOW COLUMNS FROM pmam_peculio_student_statuses");
      const hasStatusCol = (name: string) => statusCols.some((col: any) => col.Field === name);
      if (!hasStatusCol("arrival_time")) {
        await query("ALTER TABLE pmam_peculio_student_statuses ADD COLUMN arrival_time TIMESTAMP NULL AFTER observacao");
      }
      if (!hasStatusCol("arrival_registered_by")) {
        await query("ALTER TABLE pmam_peculio_student_statuses ADD COLUMN arrival_registered_by INT NULL AFTER arrival_time");
      }
      if (!hasStatusCol("justification_note")) {
        await query("ALTER TABLE pmam_peculio_student_statuses ADD COLUMN justification_note VARCHAR(500) NULL AFTER arrival_registered_by");
      }
      if (!hasStatusCol("justification_status")) {
        await query("ALTER TABLE pmam_peculio_student_statuses ADD COLUMN justification_status VARCHAR(16) NULL AFTER justification_note");
      }
      if (!hasStatusCol("justification_by")) {
        await query("ALTER TABLE pmam_peculio_student_statuses ADD COLUMN justification_by INT NULL AFTER justification_status");
      }
      if (!hasStatusCol("justification_at")) {
        await query("ALTER TABLE pmam_peculio_student_statuses ADD COLUMN justification_at TIMESTAMP NULL AFTER justification_by");
      }
      if (!hasStatusCol("justification_reviewed_by")) {
        await query("ALTER TABLE pmam_peculio_student_statuses ADD COLUMN justification_reviewed_by INT NULL AFTER justification_at");
      }
      if (!hasStatusCol("justification_reviewed_at")) {
        await query("ALTER TABLE pmam_peculio_student_statuses ADD COLUMN justification_reviewed_at TIMESTAMP NULL AFTER justification_reviewed_by");
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

export function normalizeEntryTime(value?: string | null) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "05:00";
  return value;
}

export function getPeculioLockedAt(date: string, entryTime?: string | null): Date {
  const close = new Date(`${date}T${normalizeEntryTime(entryTime)}:00-03:00`);
  close.setMinutes(close.getMinutes() - 5);
  return close;
}

export function getPeculioEntryAt(date: string, entryTime?: string | null): Date {
  return new Date(`${date}T${normalizeEntryTime(entryTime)}:00-03:00`);
}

export function getPeculioLateArrivalUntil(date: string, entryTime?: string | null): Date {
  const limit = getPeculioEntryAt(date, entryTime);
  limit.setMinutes(limit.getMinutes() - 1);
  return limit;
}

function normalizeTimestamp(value: any) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
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
    SELECT r.*, u.name AS closed_by_name, u.email AS closed_by_email
    FROM pmam_peculio_reports r
    LEFT JOIN pmam_users u ON u.id = r.closed_by
    WHERE r.companhia = ? AND r.peloton = ? AND r.date = ?
    LIMIT 1
  `, [companhia, peloton, date]);

  const report = reports[0] || null;

  let statuses: Array<{
    studentId: number;
    status: string;
    observacao: string | null;
    arrivalTime: string | null;
    arrivalRegisteredBy: number | null;
    justificationNote: string | null;
    justificationStatus: string | null;
    justificationBy: number | null;
    justificationAt: string | null;
    justificationReviewedBy: number | null;
    justificationReviewedAt: string | null;
  }> = [];
  if (report) {
    statuses = await query(`
      SELECT
        student_id AS studentId,
        status,
        observacao,
        arrival_time AS arrivalTime,
        arrival_registered_by AS arrivalRegisteredBy,
        justification_note AS justificationNote,
        justification_status AS justificationStatus,
        justification_by AS justificationBy,
        justification_at AS justificationAt,
        justification_reviewed_by AS justificationReviewedBy,
        justification_reviewed_at AS justificationReviewedAt
      FROM pmam_peculio_student_statuses
      WHERE report_id = ?
    `, [report.id]);
    statuses = statuses.map((item) => ({
      ...item,
      arrivalTime: normalizeTimestamp(item.arrivalTime),
      justificationAt: normalizeTimestamp(item.justificationAt),
      justificationReviewedAt: normalizeTimestamp(item.justificationReviewedAt),
    }));
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
      entryTime: normalizeEntryTime(report.entry_time),
      closedAt: report.closed_at,
      closedBy: report.closed_by,
      closedByName: report.closed_by_name || report.closed_by_email || null,
    } : null,
    statuses,
  };
}

export async function listPeculioSummaries(date: string) {
  await ensurePeculioTables();

  const reports = await query(`
    SELECT r.*, u.name AS closed_by_name, u.email AS closed_by_email
    FROM pmam_peculio_reports r
    LEFT JOIN pmam_users u ON u.id = r.closed_by
    WHERE r.date = ?
  `, [date]);

  const statusRows = await query(`
    SELECT
      r.companhia,
      r.peloton,
      s.status,
      COUNT(*) AS total
    FROM pmam_peculio_reports r
    JOIN pmam_peculio_student_statuses s ON s.report_id = r.id
    WHERE r.date = ?
    GROUP BY r.companhia, r.peloton, s.status
  `, [date]);

  const studentRows = await query(`
    SELECT companhia, peloton, COUNT(*) AS total
    FROM pmam_students
    GROUP BY companhia, peloton
  `);

  const reportsByScope = new Map<string, any>();
  for (const report of reports) {
    reportsByScope.set(`${report.companhia}-${report.peloton}`, report);
  }

  const studentsByScope = new Map<string, number>();
  for (const row of studentRows) {
    studentsByScope.set(`${row.companhia}-${row.peloton}`, Number(row.total) || 0);
  }

  const statusByScope = new Map<string, Record<string, number>>();
  for (const row of statusRows) {
    const key = `${row.companhia}-${row.peloton}`;
    const current = statusByScope.get(key) ?? {};
    current[row.status] = Number(row.total) || 0;
    statusByScope.set(key, current);
  }

  const summaries = [];
  for (let companhia = 1; companhia <= 5; companhia += 1) {
    for (let peloton = 1; peloton <= 2; peloton += 1) {
      const key = `${companhia}-${peloton}`;
      const report = reportsByScope.get(key) || null;
      const statuses = statusByScope.get(key) ?? {};
      const totalStudents = studentsByScope.get(key) ?? 0;
      const totalChanges = Object.entries(statuses)
        .filter(([status]) => status !== "pronto")
        .reduce((sum, [, count]) => sum + count, 0);

      summaries.push({
        companhia,
        peloton,
        date,
        totalStudents,
        hasReport: Boolean(report),
        totalChanges,
        totalAbsences: statuses.falta ?? 0,
        totalLate: statuses.atraso ?? 0,
        entryTime: normalizeEntryTime(report?.entry_time),
        closedAt: report?.closed_at ?? null,
        closedBy: report?.closed_by ?? null,
        closedByName: report?.closed_by_name || report?.closed_by_email || null,
        statuses,
      });
    }
  }

  return summaries;
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
  entryTime?: string | null;
  statuses: Array<{
    studentId: number;
    status: string;
    observacao?: string | null;
    arrivalTime?: string | null;
  }>;
}) {
  await ensurePeculioTables();

  // 1. Upsert header
  await query(`
    INSERT INTO pmam_peculio_reports (
      companhia, peloton, date, instrucao_local, instrucao_disciplina,
      instrucao_externa, chefe_turma, subchefe_turma, cmt_pel, entry_time
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      instrucao_local = VALUES(instrucao_local),
      instrucao_disciplina = VALUES(instrucao_disciplina),
      instrucao_externa = VALUES(instrucao_externa),
      chefe_turma = VALUES(chefe_turma),
      subchefe_turma = VALUES(subchefe_turma),
      cmt_pel = VALUES(cmt_pel),
      entry_time = VALUES(entry_time),
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
    normalizeEntryTime(input.entryTime),
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
        INSERT INTO pmam_peculio_student_statuses (report_id, student_id, status, observacao, arrival_time)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          observacao = VALUES(observacao),
          arrival_time = VALUES(arrival_time),
          updated_at = CURRENT_TIMESTAMP
      `, [
        reportId,
        item.studentId,
        item.status,
        item.observacao ?? null,
        item.arrivalTime ? new Date(item.arrivalTime) : null,
      ]);
    }
  }

  return getPeculioReport(input.companhia, input.peloton, input.date);
}

async function getOrCreatePeculioReportId(companhia: number, peloton: number, date: string, entryTime?: string | null) {
  await query(`
    INSERT INTO pmam_peculio_reports (companhia, peloton, date, entry_time)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
  `, [companhia, peloton, date, normalizeEntryTime(entryTime)]);

  const reports = await query(`
    SELECT id FROM pmam_peculio_reports
    WHERE companhia = ? AND peloton = ? AND date = ?
    LIMIT 1
  `, [companhia, peloton, date]);

  return reports[0]?.id;
}

export async function studentBelongsToPeculioScope(studentId: number, companhia: number, peloton: number) {
  await ensurePeculioTables();
  const rows = await query(`
    SELECT id
    FROM pmam_students
    WHERE id = ? AND companhia = ? AND peloton = ?
    LIMIT 1
  `, [studentId, companhia, peloton]);
  return Boolean(rows[0]);
}

export async function registerPeculioArrival(input: {
  companhia: number;
  peloton: number;
  date: string;
  studentId: number;
  entryTime?: string | null;
  registeredBy: number;
}) {
  await ensurePeculioTables();
  const reportId = await getOrCreatePeculioReportId(input.companhia, input.peloton, input.date, input.entryTime);
  const now = new Date();
  const lateLimit = getPeculioLateArrivalUntil(input.date, input.entryTime);
  const status = now.getTime() < lateLimit.getTime() ? "atraso" : "falta";
  const note = status === "atraso"
    ? "Chegada registrada após o fechamento do pecúlio."
    : "Chegada registrada fora do prazo; mantido como falta até deliberação do Xerife Geral.";

  await query(`
        INSERT INTO pmam_peculio_student_statuses
      (report_id, student_id, status, observacao, arrival_time, arrival_registered_by)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      observacao = CASE
        WHEN observacao IS NULL OR observacao = '' THEN VALUES(observacao)
        ELSE CONCAT(observacao, ' | ', VALUES(observacao))
      END,
      arrival_time = VALUES(arrival_time),
      arrival_registered_by = VALUES(arrival_registered_by),
      updated_at = CURRENT_TIMESTAMP
  `, [reportId, input.studentId, status, note, now, input.registeredBy]);

  return getPeculioReport(input.companhia, input.peloton, input.date);
}

export async function requestPeculioJustification(input: {
  companhia: number;
  peloton: number;
  date: string;
  studentId: number;
  note: string;
  entryTime?: string | null;
  requestedBy: number;
}) {
  await ensurePeculioTables();
  const reportId = await getOrCreatePeculioReportId(input.companhia, input.peloton, input.date, input.entryTime);
  await query(`
    INSERT INTO pmam_peculio_student_statuses
      (report_id, student_id, status, observacao, justification_note, justification_status, justification_by, justification_at)
    VALUES (?, ?, 'falta', ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
      status = CASE WHEN status = 'pronto' THEN 'falta' ELSE status END,
      observacao = CASE
        WHEN observacao IS NULL OR observacao = '' THEN VALUES(observacao)
        ELSE CONCAT(observacao, ' | ', VALUES(observacao))
      END,
      justification_note = VALUES(justification_note),
      justification_status = 'pending',
      justification_by = VALUES(justification_by),
      justification_at = CURRENT_TIMESTAMP,
      justification_reviewed_by = NULL,
      justification_reviewed_at = NULL,
      updated_at = CURRENT_TIMESTAMP
  `, [reportId, input.studentId, input.note, input.note, input.requestedBy]);

  return getPeculioReport(input.companhia, input.peloton, input.date);
}

export async function reviewPeculioJustification(input: {
  companhia: number;
  peloton: number;
  date: string;
  studentId: number;
  approved: boolean;
  reviewedBy: number;
  approvedStatus?: string;
}) {
  await ensurePeculioTables();
  const data = await getPeculioReport(input.companhia, input.peloton, input.date);
  if (!data.report) return data;

  await query(`
    UPDATE pmam_peculio_student_statuses
    SET
      status = CASE WHEN ? = 1 THEN ? ELSE status END,
      justification_status = ?,
      justification_reviewed_by = ?,
      justification_reviewed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE report_id = ? AND student_id = ?
  `, [
    input.approved ? 1 : 0,
    input.approvedStatus || "pronto",
    input.approved ? "approved" : "rejected",
    input.reviewedBy,
    data.report.id,
    input.studentId,
  ]);

  return getPeculioReport(input.companhia, input.peloton, input.date);
}

export async function closePeculioReport(input: {
  companhia: number;
  peloton: number;
  date: string;
  entryTime?: string | null;
  closedBy: number;
}) {
  await ensurePeculioTables();
  await query(`
    INSERT INTO pmam_peculio_reports (companhia, peloton, date, entry_time, closed_at, closed_by)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    ON DUPLICATE KEY UPDATE
      entry_time = VALUES(entry_time),
      closed_at = CURRENT_TIMESTAMP,
      closed_by = VALUES(closed_by),
      updated_at = CURRENT_TIMESTAMP
  `, [
    input.companhia,
    input.peloton,
    input.date,
    normalizeEntryTime(input.entryTime),
    input.closedBy,
  ]);
  return getPeculioReport(input.companhia, input.peloton, input.date);
}
