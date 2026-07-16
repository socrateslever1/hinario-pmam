import { query } from "./mysql";
import {
  calculateFoNetCount,
  FO_LC_THRESHOLD,
  getFoCodeDefinition,
  normalizeFoCode,
} from "../shared/foCatalog";

export type XerifeLevel = "principal" | "companhia" | "pelotao";

export interface XerifeAssignment {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  level: XerifeLevel;
  companhia: number | null;
  peloton: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ServiceStudent {
  id: number;
  numerica: string;
  nomeGuerra: string;
  nomeCompleto?: string | null;
  companhia: number;
  peloton: number;
  condition?: string;
  deskNumber?: number | null;
  fotoUrl?: string;
}

export type LcCaseStatus = "pending" | "homologated" | "rejected" | "cancelled";
export type FoContestStatus = "none" | "pending" | "accepted" | "rejected";
export type FoContestSource = "portal" | "cal";
export type BaixadoKind =
  | "informativo"
  | "ausente_com_atestado"
  | "ausente_sem_atestado"
  | "presente_sem_atestado";
export type InternalReportType = "desistente" | "desertor" | "baixado" | "outro";
export type InternalReportStatus = "active" | "resolved" | "cancelled";

export interface StudentLcCase {
  id: number;
  studentId: number;
  numerica: string | null;
  nomeGuerra: string | null;
  companhia: number;
  peloton: number;
  foCode: string;
  foLabel: string;
  negativeCount: number;
  positiveCount: number;
  netCount: number;
  status: LcCaseStatus;
  recolhimentoDate: string | null;
  durationHours: number | null;
  procedures: string | null;
  judgedBy: number | null;
  judgedByName: string | null;
  judgedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BaixadoDocument {
  id: number;
  studentId: number;
  companhia: number;
  peloton: number;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number | null;
  note: string | null;
  baixadoKind: BaixadoKind;
  hpmHomologated: boolean;
  uploadedBy: number | null;
  uploadedByName: string | null;
  uploadedByStudentId: number | null;
  createdAt: Date | string;
}

export interface StudentInternalReport {
  id: number;
  studentId: number;
  numerica: string | null;
  nomeGuerra: string | null;
  companhia: number;
  peloton: number;
  type: InternalReportType;
  status: InternalReportStatus;
  title: string;
  note: string | null;
  visibleToStudent: boolean;
  createdBy: number | null;
  createdByName: string | null;
  resolvedBy: number | null;
  resolvedByName: string | null;
  resolvedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BaixadoStudent {
  studentId: number;
  numerica: string;
  nomeGuerra: string;
  nomeCompleto: string | null;
  companhia: number;
  peloton: number;
  condition: string;
  deskNumber: number | null;
  fotoUrl: string | null;
  documentCount: number;
  latestDocumentAt: Date | string | null;
  documents: BaixadoDocument[];
}

export interface PlatoonRoles {
  companhia: number;
  peloton: number;
  homemHoraId: number | null;
  alunoLigacaoId: number | null;
  p5FilmmakerId: number | null;
  xerifeId: number | null;
  subXerifeId: number | null;
  homemHoraName: string | null;
  alunoLigacaoName: string | null;
  p5FilmmakerName: string | null;
  xerifeName: string | null;
  subXerifeName: string | null;
  aditamento: string | null;
  updatedAt: Date | string | null;
}

export interface WeeklyScale {
  id: number;
  companhia: number;
  peloton: number;
  weekStart: string;
  dutyDate: string | null;
  xerifeId: number | null;
  subXerifeId: number | null;
  xerifeName: string | null;
  subXerifeName: string | null;
  aditamento: string | null;
  isPublished: boolean;
  cleaning: CleaningDay[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CleaningDay {
  weekday: number;
  serviceDate: string | null;
  studentIds: number[];
  studentNames: string[];
}

export interface ServiceBoardItem {
  companhia: number;
  peloton: number;
  roles: PlatoonRoles | null;
  week: WeeklyScale | null;
}

let schemaPromise: Promise<void> | null = null;

function toDateOnly(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function parseIds(value: unknown): number[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)
      : [];
  } catch {
    return [];
  }
}

export async function ensureServiceScaleTables() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_xerife_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          level VARCHAR(32) NOT NULL,
          companhia INT NULL,
          peloton INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_xerife_assignments_user (user_id),
          KEY idx_pmam_xerife_assignments_scope (companhia, peloton)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_platoon_roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          homem_hora_id INT NULL,
          aluno_ligacao_id INT NULL,
          p5_filmmaker_id INT NULL,
          xerife_id INT NULL,
          sub_xerife_id INT NULL,
          aditamento VARCHAR(255) NULL,
          updated_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_platoon_roles_scope (companhia, peloton)
        )
      `);

      // Add columns dynamically if not exist
      const platoonCols = await query("SHOW COLUMNS FROM pmam_platoon_roles");
      const hasXerife = platoonCols.some((col: any) => col.Field === 'xerife_id');
      const hasSubXerife = platoonCols.some((col: any) => col.Field === 'sub_xerife_id');
      const hasP5 = platoonCols.some((col: any) => col.Field === 'p5_filmmaker_id');

      if (!hasXerife) {
        await query("ALTER TABLE pmam_platoon_roles ADD COLUMN xerife_id INT NULL");
      }
      if (!hasSubXerife) {
        await query("ALTER TABLE pmam_platoon_roles ADD COLUMN sub_xerife_id INT NULL");
      }
      if (!hasP5) {
        await query("ALTER TABLE pmam_platoon_roles ADD COLUMN p5_filmmaker_id INT NULL");
      }

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_xerife_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          student_id INT NOT NULL,
          role VARCHAR(32) NOT NULL,
          promoted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_pmam_xerife_history_scope (companhia, peloton)
        )
      `);

      // Add student_id and foto_url to pmam_users if not exist
      const userCols = await query("SHOW COLUMNS FROM pmam_users");
      const hasStudentId = userCols.some((col: any) => col.Field === 'student_id');
      const hasUserFotoUrl = userCols.some((col: any) => col.Field === 'foto_url');

      if (!hasStudentId) {
        await query("ALTER TABLE pmam_users ADD COLUMN student_id INT NULL");
      }
      if (!hasUserFotoUrl) {
        await query("ALTER TABLE pmam_users ADD COLUMN foto_url LONGTEXT NULL");
      }

      try {
        const blogCols = await query("SHOW COLUMNS FROM pmam_blog_post");
        const hasBlogCia = blogCols.some((col: any) => col.Field === 'companhia');
        const hasBlogPel = blogCols.some((col: any) => col.Field === 'peloton');
        if (!hasBlogCia) {
          await query("ALTER TABLE pmam_blog_post ADD COLUMN companhia INT NULL");
        }
        if (!hasBlogPel) {
          await query("ALTER TABLE pmam_blog_post ADD COLUMN peloton INT NULL");
        }
      } catch (e) {
        console.warn("[Database] Could not verify/alter pmam_blog_post table:", e);
      }

      try {
        const missionCols = await query("SHOW COLUMNS FROM pmam_cfap_missions");
        const hasMissionCia = missionCols.some((col: any) => col.Field === 'companhia');
        const hasMissionPel = missionCols.some((col: any) => col.Field === 'peloton');
        if (!hasMissionCia) {
          await query("ALTER TABLE pmam_cfap_missions ADD COLUMN companhia INT NULL");
        }
        if (!hasMissionPel) {
          await query("ALTER TABLE pmam_cfap_missions ADD COLUMN peloton INT NULL");
        }
      } catch (e) {
        console.warn("[Database] Could not verify/alter pmam_cfap_missions table:", e);
      }

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_weekly_service_scales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          week_start DATE NOT NULL,
          xerife_id INT NULL,
          sub_xerife_id INT NULL,
          aditamento VARCHAR(255) NULL,
          is_published BOOLEAN NOT NULL DEFAULT false,
          updated_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_weekly_service_scales_scope (companhia, peloton, week_start),
          KEY idx_pmam_weekly_service_scales_published (is_published, week_start)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_cleaning_scale_days (
          id INT AUTO_INCREMENT PRIMARY KEY,
          weekly_scale_id INT NOT NULL,
          weekday INT NOT NULL,
          service_date DATE NULL,
          student_ids_json LONGTEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_cleaning_scale_days_day (weekly_scale_id, weekday)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_aditamentos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          titulo VARCHAR(255) NOT NULL,
          conteudo TEXT NULL,
          data DATE NOT NULL,
          pdf_url VARCHAR(512) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_pmam_aditamentos_scope (companhia, peloton, data)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_seat_change_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          requested_desk_number INT NOT NULL,
          current_desk_number INT NULL,
          status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
          reason VARCHAR(255) NULL,
          decided_by INT NULL,
          decided_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_pmam_seat_requests_scope_status (companhia, peloton, status),
          KEY idx_pmam_seat_requests_student_status (student_id, status)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_platoon_notices (
          id INT AUTO_INCREMENT PRIMARY KEY,
          companhia INT NULL,
          peloton INT NULL,
          student_id INT NULL,
          title VARCHAR(160) NOT NULL,
          message TEXT NOT NULL,
          priority ENUM('normal','important','urgent') NOT NULL DEFAULT 'normal',
          created_by INT NULL,
          archived_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_pmam_notices_scope (companhia, peloton, student_id, archived_at),
          KEY idx_pmam_notices_created (created_at)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_notice_reads (
          notice_id INT NOT NULL,
          student_id INT NOT NULL,
          read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (notice_id, student_id)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_student_observations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          type ENUM('positive','negative','neutral') NOT NULL DEFAULT 'neutral',
          note LONGTEXT NOT NULL,
          fo_code VARCHAR(32) NULL,
          created_by INT NULL,
          validation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
          validated_by INT NULL,
          validated_at TIMESTAMP NULL,
          validation_note VARCHAR(500) NULL,
          contest_status VARCHAR(16) NOT NULL DEFAULT 'none',
          contest_source VARCHAR(16) NULL,
          contest_text LONGTEXT NULL,
          contested_at TIMESTAMP NULL,
          contest_decided_by INT NULL,
          contest_decided_at TIMESTAMP NULL,
          contest_decision_note VARCHAR(1000) NULL,
          annulled_by INT NULL,
          annulled_at TIMESTAMP NULL,
          annulment_note VARCHAR(1000) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_pmam_student_observations_student (student_id, created_at),
          KEY idx_pmam_student_observations_student_code (student_id, fo_code, validation_status),
          KEY idx_pmam_student_observations_scope (companhia, peloton),
          KEY idx_pmam_student_observations_validation (validation_status, created_at),
          KEY idx_pmam_student_observations_contest (contest_status, contested_at)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_fo_reasons (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type ENUM('positive','negative') NOT NULL,
          code VARCHAR(32) NULL,
          label VARCHAR(500) NOT NULL,
          normalized_label VARCHAR(500) NOT NULL,
          validation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
          created_by INT NULL,
          validated_by INT NULL,
          validated_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_fo_reasons_type_label (type, normalized_label),
          KEY idx_pmam_fo_reasons_code (type, code),
          KEY idx_pmam_fo_reasons_status (validation_status, type, label)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_lc_cases (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          fo_code VARCHAR(32) NOT NULL,
          negative_count INT NOT NULL DEFAULT 0,
          positive_count INT NOT NULL DEFAULT 0,
          net_count INT NOT NULL DEFAULT 0,
          status ENUM('pending','homologated','rejected','cancelled') NOT NULL DEFAULT 'pending',
          recolhimento_date DATE NULL,
          duration_hours INT NULL,
          procedures LONGTEXT NULL,
          judged_by INT NULL,
          judged_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_pmam_lc_cases_scope_status (companhia, peloton, status),
          KEY idx_pmam_lc_cases_student_status (student_id, status),
          KEY idx_pmam_lc_cases_code (fo_code, status)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_student_baixado_documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          file_url LONGTEXT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          mime_type VARCHAR(120) NOT NULL,
          file_size INT NULL,
          note VARCHAR(1000) NULL,
          baixado_kind VARCHAR(40) NOT NULL DEFAULT 'informativo',
          hpm_homologated BOOLEAN NOT NULL DEFAULT false,
          uploaded_by INT NULL,
          uploaded_by_student_id INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_pmam_baixado_docs_student (student_id, created_at),
          KEY idx_pmam_baixado_docs_scope (companhia, peloton, created_at)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_student_internal_reports (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          type VARCHAR(32) NOT NULL,
          status VARCHAR(16) NOT NULL DEFAULT 'active',
          title VARCHAR(180) NOT NULL,
          note LONGTEXT NULL,
          visible_to_student BOOLEAN NOT NULL DEFAULT true,
          created_by INT NULL,
          resolved_by INT NULL,
          resolved_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_pmam_internal_reports_scope (companhia, peloton, status, created_at),
          KEY idx_pmam_internal_reports_student (student_id, status, created_at),
          KEY idx_pmam_internal_reports_type (type, status)
        )
      `);

      const observationCols = await query("SHOW COLUMNS FROM pmam_student_observations");
      const hasObservationCol = (name: string) => observationCols.some((col: any) => col.Field === name);
      if (!hasObservationCol("validation_status")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN validation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' AFTER created_by");
      }
      if (!hasObservationCol("validated_by")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN validated_by INT NULL AFTER validation_status");
      }
      if (!hasObservationCol("validated_at")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN validated_at TIMESTAMP NULL AFTER validated_by");
      }
      if (!hasObservationCol("validation_note")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN validation_note VARCHAR(500) NULL AFTER validated_at");
      }
      if (!hasObservationCol("fo_code")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN fo_code VARCHAR(32) NULL AFTER note");
      }
      if (!hasObservationCol("contest_status")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN contest_status VARCHAR(16) NOT NULL DEFAULT 'none' AFTER validation_note");
      }
      if (!hasObservationCol("contest_source")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN contest_source VARCHAR(16) NULL AFTER contest_status");
      }
      if (!hasObservationCol("contest_text")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN contest_text LONGTEXT NULL AFTER contest_source");
      }
      if (!hasObservationCol("contested_at")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN contested_at TIMESTAMP NULL AFTER contest_text");
      }
      if (!hasObservationCol("contest_decided_by")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN contest_decided_by INT NULL AFTER contested_at");
      }
      if (!hasObservationCol("contest_decided_at")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN contest_decided_at TIMESTAMP NULL AFTER contest_decided_by");
      }
      if (!hasObservationCol("contest_decision_note")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN contest_decision_note VARCHAR(1000) NULL AFTER contest_decided_at");
      }
      if (!hasObservationCol("annulled_by")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN annulled_by INT NULL AFTER contest_decision_note");
      }
      if (!hasObservationCol("annulled_at")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN annulled_at TIMESTAMP NULL AFTER annulled_by");
      }
      if (!hasObservationCol("annulment_note")) {
        await query("ALTER TABLE pmam_student_observations ADD COLUMN annulment_note VARCHAR(1000) NULL AFTER annulled_at");
      }
      try {
        await query("ALTER TABLE pmam_student_observations MODIFY COLUMN note LONGTEXT NOT NULL");
      } catch (error) {
        console.warn("[ServiceScaleDB] Could not widen pmam_student_observations.note:", error);
      }

      const baixadoCols = await query("SHOW COLUMNS FROM pmam_student_baixado_documents");
      if (!baixadoCols.some((col: any) => col.Field === "baixado_kind")) {
        await query("ALTER TABLE pmam_student_baixado_documents ADD COLUMN baixado_kind VARCHAR(40) NOT NULL DEFAULT 'informativo' AFTER note");
      }

      const reasonCols = await query("SHOW COLUMNS FROM pmam_fo_reasons");
      if (!reasonCols.some((col: any) => col.Field === "code")) {
        await query("ALTER TABLE pmam_fo_reasons ADD COLUMN code VARCHAR(32) NULL AFTER type");
      }

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_student_highlights (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          title VARCHAR(160) NOT NULL,
          description TEXT NULL,
          promoted_by INT NULL,
          active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_pmam_student_highlights_active (active, created_at),
          KEY idx_pmam_student_highlights_scope (companhia, peloton)
        )
      `);

      // Check if duty_date column exists in pmam_weekly_service_scales
      const columns = await query("SHOW COLUMNS FROM pmam_weekly_service_scales LIKE 'duty_date'");
      if ((columns as any[]).length === 0) {
        await query("ALTER TABLE pmam_weekly_service_scales ADD COLUMN duty_date DATE NULL AFTER sub_xerife_id");
      }

      // Check if p5_filmmaker_id column exists in pmam_platoon_roles
      const p5ColsCheck = await query("SHOW COLUMNS FROM pmam_platoon_roles LIKE 'p5_filmmaker_id'");
      if ((p5ColsCheck as any[]).length === 0) {
        await query("ALTER TABLE pmam_platoon_roles ADD COLUMN p5_filmmaker_id INT NULL AFTER aluno_ligacao_id");
      }

      // Demote local scope xerifes who were incorrectly promoted to 'admin'
      await query(`
        UPDATE pmam_users u
        INNER JOIN pmam_xerife_assignments xa ON xa.user_id = u.id
        SET u.role = 'user', u.updated_at = CURRENT_TIMESTAMP
        WHERE u.role = 'admin'
      `);
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  await schemaPromise;
}

export function canAccessScope(
  user: { role?: string | null; companhiaId?: number | null; pelotaoId?: number | null },
  assignment: XerifeAssignment | null,
  companhia: number,
  peloton?: number | null,
) {
  if (user.role === "master" || user.role === "admin") return true;
  if (
    user.role === "comandante_corpo" ||
    user.role === "subcomandante_corpo" ||
    user.role === "sub_comandante_corpo" ||
    user.role === "comandante_cfap" ||
    user.role === "subcomandante_cfap" ||
    user.role === "sub_comandante_cfap"
  ) return true;
  if (user.role === "comandante_cia") {
    return user.companhiaId === companhia;
  }
  if (user.role === "comandante_pel") {
    return user.companhiaId === companhia && (peloton === undefined || peloton === null || user.pelotaoId === peloton);
  }
  
  if (!assignment) return false;
  if (assignment.level === "principal") return true;
  if (assignment.level === "companhia") return assignment.companhia === companhia;
  return assignment.companhia === companhia && assignment.peloton === peloton;
}

export function getDefaultScope(
  user: { role?: string | null; companhiaId?: number | null; pelotaoId?: number | null },
  assignment: XerifeAssignment | null,
): { companhia?: number; peloton?: number; unrestricted: boolean } {
  if (user.role === "master" || user.role === "admin" || assignment?.level === "principal") {
    return { unrestricted: true };
  }
  if (
    user.role === "comandante_corpo" ||
    user.role === "subcomandante_corpo" ||
    user.role === "sub_comandante_corpo" ||
    user.role === "comandante_cfap" ||
    user.role === "subcomandante_cfap" ||
    user.role === "sub_comandante_cfap"
  ) {
    return { unrestricted: true };
  }
  if (user.role === "comandante_cia" && user.companhiaId) {
    return { companhia: user.companhiaId, unrestricted: false };
  }
  if (user.role === "comandante_pel" && user.companhiaId && user.pelotaoId) {
    return { companhia: user.companhiaId, peloton: user.pelotaoId, unrestricted: false };
  }

  if (assignment?.level === "companhia" && assignment.companhia) {
    return { companhia: assignment.companhia, unrestricted: false };
  }
  if (assignment?.level === "pelotao" && assignment.companhia && assignment.peloton) {
    return { companhia: assignment.companhia, peloton: assignment.peloton, unrestricted: false };
  }
  return { unrestricted: false };
}

export async function getXerifeAssignment(userId: number): Promise<XerifeAssignment | null> {
  await ensureServiceScaleTables();
  const rows = await query(`
    SELECT
      xa.*,
      u.name AS user_name,
      u.email AS user_email
    FROM pmam_xerife_assignments xa
    INNER JOIN pmam_users u ON u.id = xa.user_id
    WHERE xa.user_id = ?
    LIMIT 1
  `, [userId]);
  return mapAssignment(rows[0]);
}

export async function listXerifeAssignments(): Promise<XerifeAssignment[]> {
  await ensureServiceScaleTables();
  const rows = await query(`
    SELECT
      xa.*,
      u.name AS user_name,
      u.email AS user_email
    FROM pmam_xerife_assignments xa
    INNER JOIN pmam_users u ON u.id = xa.user_id
    ORDER BY xa.level ASC, xa.companhia ASC, xa.peloton ASC, u.name ASC
  `);
  return rows.map(mapAssignment).filter((item): item is XerifeAssignment => item !== null);
}

export async function upsertXerifeAssignment(input: {
  userId: number;
  level: XerifeLevel;
  companhia?: number | null;
  peloton?: number | null;
}) {
  await ensureServiceScaleTables();
  await query(`
    INSERT INTO pmam_xerife_assignments (user_id, level, companhia, peloton)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      level = VALUES(level),
      companhia = VALUES(companhia),
      peloton = VALUES(peloton),
      updated_at = CURRENT_TIMESTAMP
  `, [
    input.userId,
    input.level,
    input.level === "principal" ? null : input.companhia ?? null,
    input.level === "pelotao" ? input.peloton ?? null : null,
  ]);
}

export async function deleteXerifeAssignment(id: number) {
  await ensureServiceScaleTables();
  await query("DELETE FROM pmam_xerife_assignments WHERE id = ?", [id]);
}

export async function listStudents(scope?: { companhia?: number; peloton?: number }): Promise<ServiceStudent[]> {
  await ensureServiceScaleTables();
  const where: string[] = [];
  const params: any[] = [];

  if (scope?.companhia) {
    where.push("companhia = ?");
    params.push(scope.companhia);
  }
  if (scope?.peloton) {
    where.push("peloton = ?");
    params.push(scope.peloton);
  }

  const rows = await query(`
    SELECT id, numerica, nome_guerra AS nomeGuerra, nome_completo AS nomeCompleto, companhia, peloton, \`condition\`, desk_number AS deskNumber, foto_url AS fotoUrl
    FROM pmam_students
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY companhia ASC, peloton ASC, numerica ASC
  `, params);

  return rows as ServiceStudent[];
}

export async function getPlatoonRoles(companhia: number, peloton: number): Promise<PlatoonRoles | null> {
  await ensureServiceScaleTables();
  const rows = await query(`
    SELECT
      pr.*,
      hh.nome_guerra AS homem_hora_name,
      al.nome_guerra AS aluno_ligacao_name,
      p5.nome_guerra AS p5_filmmaker_name,
      x.nome_guerra AS xerife_name,
      sx.nome_guerra AS sub_xerife_name
    FROM pmam_platoon_roles pr
    LEFT JOIN pmam_students hh ON hh.id = pr.homem_hora_id
    LEFT JOIN pmam_students al ON al.id = pr.aluno_ligacao_id
    LEFT JOIN pmam_students p5 ON p5.id = pr.p5_filmmaker_id
    LEFT JOIN pmam_students x ON x.id = pr.xerife_id
    LEFT JOIN pmam_students sx ON sx.id = pr.sub_xerife_id
    WHERE pr.companhia = ? AND pr.peloton = ?
    LIMIT 1
  `, [companhia, peloton]);
  return mapRoles(rows[0], companhia, peloton);
}

export async function upsertPlatoonRoles(input: {
  companhia: number;
  peloton: number;
  homemHoraId?: number | null;
  alunoLigacaoId?: number | null;
  p5FilmmakerId?: number | null;
  xerifeId?: number | null;
  subXerifeId?: number | null;
  aditamento?: string | null;
  updatedBy: number;
}) {
  await ensureServiceScaleTables();
  await query(`
    INSERT INTO pmam_platoon_roles
      (companhia, peloton, homem_hora_id, aluno_ligacao_id, p5_filmmaker_id, xerife_id, sub_xerife_id, aditamento, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      homem_hora_id = VALUES(homem_hora_id),
      aluno_ligacao_id = VALUES(aluno_ligacao_id),
      p5_filmmaker_id = VALUES(p5_filmmaker_id),
      xerife_id = VALUES(xerife_id),
      sub_xerife_id = VALUES(sub_xerife_id),
      aditamento = VALUES(aditamento),
      updated_by = VALUES(updated_by),
      updated_at = CURRENT_TIMESTAMP
  `, [
    input.companhia,
    input.peloton,
    input.homemHoraId ?? null,
    input.alunoLigacaoId ?? null,
    input.p5FilmmakerId ?? null,
    input.xerifeId ?? null,
    input.subXerifeId ?? null,
    input.aditamento || null,
    input.updatedBy,
  ]);
}

export async function promoteStudentToXerife(
  studentId: number,
  role: 'xerife' | 'sub_xerife',
  companhia: number,
  peloton: number,
  updatedBy: number
): Promise<void> {
  await ensureServiceScaleTables();

  const students = await query("SELECT * FROM pmam_students WHERE id = ? LIMIT 1", [studentId]);
  const student = students[0];
  if (!student) {
    throw new Error("Aluno não encontrado");
  }

  const currentRoles = await query(
    "SELECT * FROM pmam_platoon_roles WHERE companhia = ? AND peloton = ? LIMIT 1",
    [companhia, peloton]
  );
  
  const roleColumn = role === 'xerife' ? 'xerife_id' : 'sub_xerife_id';
  const oldActiveId = currentRoles[0]?.[roleColumn];
  const oldCreatedAt = currentRoles[0]?.updated_at || new Date();

  if (oldActiveId && oldActiveId !== studentId) {
    await query(
      `INSERT INTO pmam_xerife_history (companhia, peloton, student_id, role, promoted_at, archived_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [companhia, peloton, oldActiveId, role, oldCreatedAt]
    );

    const oldStudents = await query("SELECT * FROM pmam_students WHERE id = ? LIMIT 1", [oldActiveId]);
    const oldStudent = oldStudents[0];
    if (oldStudent) {
      const oldEmail = `${oldStudent.numerica}@pmam.com`;
      const oldUsers = await query("SELECT id FROM pmam_users WHERE email = ? LIMIT 1", [oldEmail]);
      const oldUser = oldUsers[0];
      if (oldUser) {
        await query("DELETE FROM pmam_xerife_assignments WHERE user_id = ?", [oldUser.id]);
        await query("DELETE FROM pmam_users WHERE id = ?", [oldUser.id]);
      }
    }
  }

  await query(`
    INSERT INTO pmam_platoon_roles (companhia, peloton, xerife_id, sub_xerife_id, updated_by)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      xerife_id = IF(VALUES(xerife_id) IS NOT NULL, VALUES(xerife_id), xerife_id),
      sub_xerife_id = IF(VALUES(sub_xerife_id) IS NOT NULL, VALUES(sub_xerife_id), sub_xerife_id),
      updated_by = VALUES(updated_by),
      updated_at = CURRENT_TIMESTAMP
  `, [
    companhia,
    peloton,
    role === 'xerife' ? studentId : null,
    role === 'sub_xerife' ? studentId : null,
    updatedBy
  ]);
  
  if (role === 'xerife') {
    await query(
      "UPDATE pmam_platoon_roles SET xerife_id = ?, sub_xerife_id = IF(sub_xerife_id = ?, NULL, sub_xerife_id) WHERE companhia = ? AND peloton = ?",
      [studentId, studentId, companhia, peloton]
    );
  } else {
    await query(
      "UPDATE pmam_platoon_roles SET sub_xerife_id = ?, xerife_id = IF(xerife_id = ?, NULL, xerife_id) WHERE companhia = ? AND peloton = ?",
      [studentId, studentId, companhia, peloton]
    );
  }

  const email = `${student.numerica}@pmam.com`;
  const existingUsers = await query("SELECT * FROM pmam_users WHERE email = ? LIMIT 1", [email]);
  let userId;

  if (existingUsers.length > 0) {
    userId = existingUsers[0].id;
    await query(
      "UPDATE pmam_users SET name = ?, student_id = ?, foto_url = ?, role = 'user' WHERE id = ?",
      [student.nome_guerra, studentId, student.foto_url || null, userId]
    );
  } else {
    const openId = `student-${student.numerica}-${Date.now()}`;
    const result = await query(
      `INSERT INTO pmam_users (open_id, name, email, password, login_method, role, student_id, foto_url)
       VALUES (?, ?, ?, ?, 'email', 'user', ?, ?)`,
      [openId, student.nome_guerra, email, student.senha, studentId, student.foto_url || null]
    );
    userId = (result as any).insertId;
  }

  await query("DELETE FROM pmam_xerife_assignments WHERE user_id = ?", [userId]);
  await query(
    "INSERT INTO pmam_xerife_assignments (user_id, level, companhia, peloton) VALUES (?, 'pelotao', ?, ?)",
    [userId, companhia, peloton]
  );
}

export interface XerifeHistoryRow {
  id: number;
  companhia: number;
  peloton: number;
  studentId: number;
  nomeGuerra: string;
  numerica: string;
  role: string;
  promotedAt: Date | string;
  archivedAt: Date | string;
}

export async function listXerifeHistory(companhia: number, peloton: number): Promise<XerifeHistoryRow[]> {
  await ensureServiceScaleTables();
  const rows = await query(`
    SELECT
      h.id,
      h.companhia,
      h.peloton,
      h.student_id,
      s.nome_guerra,
      s.numerica,
      h.role,
      h.promoted_at,
      h.archived_at
    FROM pmam_xerife_history h
    INNER JOIN pmam_students s ON s.id = h.student_id
    WHERE h.companhia = ? AND h.peloton = ?
    ORDER BY h.archived_at DESC
  `, [companhia, peloton]);

  return rows.map((row: any) => ({
    id: row.id,
    companhia: row.companhia,
    peloton: row.peloton,
    studentId: row.student_id,
    nomeGuerra: row.nome_guerra,
    numerica: row.numerica,
    role: row.role,
    promotedAt: row.promoted_at,
    archivedAt: row.archived_at
  }));
}

export interface ActiveXerifeRow {
  companhia: number;
  peloton: number;
  xerifeName: string | null;
  subXerifeName: string | null;
}

export async function listAllActiveXerifes(): Promise<ActiveXerifeRow[]> {
  await ensureServiceScaleTables();
  const rows = await query(`
    SELECT
      c.companhia,
      p.peloton,
      x.nome_guerra AS xerife_name,
      sx.nome_guerra AS sub_xerife_name
    FROM (SELECT 1 AS companhia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) c
    CROSS JOIN (SELECT 1 AS peloton UNION SELECT 2) p
    LEFT JOIN pmam_platoon_roles pr ON pr.companhia = c.companhia AND pr.peloton = p.peloton
    LEFT JOIN pmam_students x ON x.id = pr.xerife_id
    LEFT JOIN pmam_students sx ON sx.id = pr.sub_xerife_id
    ORDER BY c.companhia ASC, p.peloton ASC
  `);

  return rows.map((row: any) => ({
    companhia: Number(row.companhia),
    peloton: Number(row.peloton),
    xerifeName: row.xerife_name,
    subXerifeName: row.sub_xerife_name
  }));
}

export async function getWeeklyScale(companhia: number, peloton: number, weekStart: string): Promise<WeeklyScale | null> {
  await ensureServiceScaleTables();
  const rows = await query(`
    SELECT
      ws.*,
      x.nome_guerra AS xerife_name,
      sx.nome_guerra AS sub_xerife_name
    FROM pmam_weekly_service_scales ws
    LEFT JOIN pmam_students x ON x.id = ws.xerife_id
    LEFT JOIN pmam_students sx ON sx.id = ws.sub_xerife_id
    WHERE ws.companhia = ? AND ws.peloton = ? AND ws.week_start = ?
    LIMIT 1
  `, [companhia, peloton, weekStart]);

  const week = mapWeek(rows[0]);
  if (!week) return null;
  week.cleaning = await getCleaningDays(week.id);
  return week;
}

export async function upsertWeeklyScale(input: {
  companhia: number;
  peloton: number;
  weekStart: string;
  dutyDate?: string | null;
  xerifeId?: number | null;
  subXerifeId?: number | null;
  aditamento?: string | null;
  isPublished?: boolean;
  cleaning?: Array<{ weekday: number; serviceDate?: string | null; studentIds: number[] }>;
  updatedBy: number;
}): Promise<WeeklyScale | null> {
  await ensureServiceScaleTables();
  await query(`
    INSERT INTO pmam_weekly_service_scales
      (companhia, peloton, week_start, duty_date, xerife_id, sub_xerife_id, aditamento, is_published, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      duty_date = VALUES(duty_date),
      xerife_id = VALUES(xerife_id),
      sub_xerife_id = VALUES(sub_xerife_id),
      aditamento = VALUES(aditamento),
      is_published = VALUES(is_published),
      updated_by = VALUES(updated_by),
      updated_at = CURRENT_TIMESTAMP
  `, [
    input.companhia,
    input.peloton,
    input.weekStart,
    input.dutyDate || null,
    input.xerifeId ?? null,
    input.subXerifeId ?? null,
    input.aditamento || null,
    input.isPublished ? 1 : 0,
    input.updatedBy,
  ]);

  const week = await getWeeklyScale(input.companhia, input.peloton, input.weekStart);
  if (week && input.cleaning) {
    for (const item of input.cleaning) {
      await query(`
        INSERT INTO pmam_cleaning_scale_days
          (weekly_scale_id, weekday, service_date, student_ids_json)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          service_date = VALUES(service_date),
          student_ids_json = VALUES(student_ids_json),
          updated_at = CURRENT_TIMESTAMP
      `, [
        week.id,
        item.weekday,
        item.serviceDate || null,
        JSON.stringify(item.studentIds || []),
      ]);
    }
  }

  return getWeeklyScale(input.companhia, input.peloton, input.weekStart);
}

export async function getPublishedServiceBoard(weekStart?: string | null): Promise<ServiceBoardItem[]> {
  await ensureServiceScaleTables();
  const params: any[] = [];
  const weekFilter = weekStart ? "AND ws.week_start = ?" : "";
  if (weekStart) params.push(weekStart);

  const rows = await query(`
    SELECT
      ws.*,
      x.nome_guerra AS xerife_name,
      sx.nome_guerra AS sub_xerife_name
    FROM pmam_weekly_service_scales ws
    LEFT JOIN pmam_students x ON x.id = ws.xerife_id
    LEFT JOIN pmam_students sx ON sx.id = ws.sub_xerife_id
    WHERE ws.is_published = 1 ${weekFilter}
    ORDER BY ws.week_start DESC, ws.companhia ASC, ws.peloton ASC
  `, params);

  const weeks = rows.map(mapWeek).filter((item): item is WeeklyScale => item !== null);
  const items: ServiceBoardItem[] = [];
  for (const week of weeks) {
    week.cleaning = await getCleaningDays(week.id);
    items.push({
      companhia: week.companhia,
      peloton: week.peloton,
      roles: await getPlatoonRoles(week.companhia, week.peloton),
      week,
    });
  }
  return items;
}

async function getCleaningDays(weeklyScaleId: number): Promise<CleaningDay[]> {
  const rows = await query(`
    SELECT *
    FROM pmam_cleaning_scale_days
    WHERE weekly_scale_id = ?
    ORDER BY weekday ASC
  `, [weeklyScaleId]);

  const studentIds = Array.from(new Set(rows.flatMap((row: any) => parseIds(row.student_ids_json))));
  const names = new Map<number, string>();
  if (studentIds.length) {
    const placeholders = studentIds.map(() => "?").join(", ");
    const students = await query(`
      SELECT id, nome_guerra AS nomeGuerra
      FROM pmam_students
      WHERE id IN (${placeholders})
    `, studentIds);
    for (const student of students as any[]) {
      names.set(student.id, student.nomeGuerra);
    }
  }

  return rows.map((row: any) => {
    const ids = parseIds(row.student_ids_json);
    return {
      weekday: Number(row.weekday),
      serviceDate: toDateOnly(row.service_date),
      studentIds: ids,
      studentNames: ids.map((id) => names.get(id)).filter((name): name is string => Boolean(name)),
    };
  });
}

function mapAssignment(row: any): XerifeAssignment | null {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    level: row.level,
    companhia: row.companhia,
    peloton: row.peloton,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRoles(row: any, companhia: number, peloton: number): PlatoonRoles | null {
  if (!row) {
    return {
      companhia,
      peloton,
      homemHoraId: null,
      alunoLigacaoId: null,
      p5FilmmakerId: null,
      xerifeId: null,
      subXerifeId: null,
      homemHoraName: null,
      alunoLigacaoName: null,
      p5FilmmakerName: null,
      xerifeName: null,
      subXerifeName: null,
      aditamento: null,
      updatedAt: null,
    };
  }
  return {
    companhia: row.companhia,
    peloton: row.peloton,
    homemHoraId: row.homem_hora_id,
    alunoLigacaoId: row.aluno_ligacao_id,
    p5FilmmakerId: row.p5_filmmaker_id,
    xerifeId: row.xerife_id,
    subXerifeId: row.sub_xerife_id,
    homemHoraName: row.homem_hora_name,
    alunoLigacaoName: row.aluno_ligacao_name,
    p5FilmmakerName: row.p5_filmmaker_name,
    xerifeName: row.xerife_name,
    subXerifeName: row.sub_xerife_name,
    aditamento: row.aditamento,
    updatedAt: row.updated_at,
  };
}

function mapWeek(row: any): WeeklyScale | null {
  if (!row) return null;
  return {
    id: row.id,
    companhia: row.companhia,
    peloton: row.peloton,
    weekStart: toDateOnly(row.week_start) || "",
    dutyDate: toDateOnly(row.duty_date),
    xerifeId: row.xerife_id,
    subXerifeId: row.sub_xerife_id,
    xerifeName: row.xerife_name,
    subXerifeName: row.sub_xerife_name,
    aditamento: row.aditamento,
    isPublished: row.is_published === 1 || row.is_published === true,
    cleaning: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface Aditamento {
  id: number;
  companhia: number;
  peloton: number;
  titulo: string;
  conteudo: string | null;
  data: string;
  pdfUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export async function getAditamento(id: number): Promise<Aditamento | null> {
  await ensureServiceScaleTables();
  const rows = await query(`
    SELECT id, companhia, peloton, titulo, conteudo, data, pdf_url AS pdfUrl, created_at AS createdAt, updated_at AS updatedAt
    FROM pmam_aditamentos
    WHERE id = ?
    LIMIT 1
  `, [id]);
  if (!rows[0]) return null;
  return {
    ...rows[0],
    data: toDateOnly(rows[0].data) || ""
  };
}

export async function listAditamentos(companhia: number, peloton: number): Promise<Aditamento[]> {
  await ensureServiceScaleTables();
  const rows = await query(`
    SELECT id, companhia, peloton, titulo, conteudo, data, pdf_url AS pdfUrl, created_at AS createdAt, updated_at AS updatedAt
    FROM pmam_aditamentos
    WHERE companhia = ? AND peloton = ?
    ORDER BY data DESC, id DESC
  `, [companhia, peloton]);

  return (rows as any[]).map(row => ({
    ...row,
    data: toDateOnly(row.data) || ""
  }));
}

export async function createAditamento(input: {
  companhia: number;
  peloton: number;
  titulo: string;
  conteudo: string | null;
  data: string;
  pdfUrl: string | null;
}): Promise<void> {
  await ensureServiceScaleTables();
  await query(`
    INSERT INTO pmam_aditamentos (companhia, peloton, titulo, conteudo, data, pdf_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [input.companhia, input.peloton, input.titulo, input.conteudo, input.data, input.pdfUrl]);
}

export async function deleteAditamento(id: number): Promise<void> {
  await ensureServiceScaleTables();
  await query("DELETE FROM pmam_aditamentos WHERE id = ?", [id]);
}

export interface SeatChangeRequest {
  id: number;
  studentId: number;
  numerica?: string;
  nomeGuerra?: string;
  companhia: number;
  peloton: number;
  requestedDeskNumber: number;
  currentDeskNumber: number | null;
  status: "pending" | "approved" | "rejected";
  reason: string | null;
  decidedBy: number | null;
  decidedAt: Date | string | null;
  createdAt: Date | string;
}

function mapSeatRequest(row: any): SeatChangeRequest {
  return {
    id: row.id,
    studentId: row.student_id,
    numerica: row.numerica,
    nomeGuerra: row.nome_guerra,
    companhia: row.companhia,
    peloton: row.peloton,
    requestedDeskNumber: row.requested_desk_number,
    currentDeskNumber: row.current_desk_number,
    status: row.status,
    reason: row.reason,
    decidedBy: row.decided_by,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

export async function createSeatChangeRequest(input: {
  studentId: number;
  companhia: number;
  peloton: number;
  requestedDeskNumber: number;
  currentDeskNumber: number | null;
}): Promise<number> {
  await ensureServiceScaleTables();
  await query(
    `UPDATE pmam_seat_change_requests
     SET status = 'rejected', reason = 'Substituida por nova solicitacao', updated_at = CURRENT_TIMESTAMP
     WHERE student_id = ? AND status = 'pending'`,
    [input.studentId]
  );
  const result = await query(
    `INSERT INTO pmam_seat_change_requests
      (student_id, companhia, peloton, requested_desk_number, current_desk_number)
     VALUES (?, ?, ?, ?, ?)`,
    [input.studentId, input.companhia, input.peloton, input.requestedDeskNumber, input.currentDeskNumber]
  );
  return (result as any).insertId;
}

export async function listSeatChangeRequests(companhia: number, peloton: number, status: "pending" | "approved" | "rejected" = "pending"): Promise<SeatChangeRequest[]> {
  await ensureServiceScaleTables();
  const rows = await query(
    `SELECT r.*, s.numerica, s.nome_guerra
     FROM pmam_seat_change_requests r
     LEFT JOIN pmam_students s ON s.id = r.student_id
     WHERE r.companhia = ? AND r.peloton = ? AND r.status = ?
     ORDER BY r.created_at ASC`,
    [companhia, peloton, status]
  );
  return (rows as any[]).map(mapSeatRequest);
}

export async function getSeatChangeRequest(id: number): Promise<SeatChangeRequest | null> {
  await ensureServiceScaleTables();
  const rows = await query(
    `SELECT r.*, s.numerica, s.nome_guerra
     FROM pmam_seat_change_requests r
     LEFT JOIN pmam_students s ON s.id = r.student_id
     WHERE r.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ? mapSeatRequest(rows[0]) : null;
}

export async function decideSeatChangeRequest(input: {
  id: number;
  status: "approved" | "rejected";
  reason: string | null;
  decidedBy: number;
}): Promise<void> {
  await ensureServiceScaleTables();
  await query(
    `UPDATE pmam_seat_change_requests
     SET status = ?, reason = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.status, input.reason, input.decidedBy, input.id]
  );
}

export interface PlatoonNotice {
  id: number;
  companhia: number | null;
  peloton: number | null;
  studentId: number | null;
  title: string;
  message: string;
  priority: "normal" | "important" | "urgent";
  createdBy: number | null;
  createdAt: Date | string;
  readAt?: Date | string | null;
}

function mapNotice(row: any): PlatoonNotice {
  return {
    id: row.id,
    companhia: row.companhia,
    peloton: row.peloton,
    studentId: row.student_id,
    title: row.title,
    message: row.message,
    priority: row.priority,
    createdBy: row.created_by,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
  };
}

export async function createNotice(input: {
  companhia: number | null;
  peloton: number | null;
  studentId: number | null;
  title: string;
  message: string;
  priority: "normal" | "important" | "urgent";
  createdBy: number;
}): Promise<number> {
  await ensureServiceScaleTables();
  const result = await query(
    `INSERT INTO pmam_platoon_notices
      (companhia, peloton, student_id, title, message, priority, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.companhia, input.peloton, input.studentId, input.title, input.message, input.priority, input.createdBy]
  );
  return (result as any).insertId;
}

export async function listStudentNotices(studentId: number, companhia: number, peloton: number): Promise<PlatoonNotice[]> {
  await ensureServiceScaleTables();
  const rows = await query(
    `SELECT n.*, r.read_at
     FROM pmam_platoon_notices n
     LEFT JOIN pmam_notice_reads r ON r.notice_id = n.id AND r.student_id = ?
     WHERE n.archived_at IS NULL
       AND r.notice_id IS NULL
       AND (
         n.student_id = ?
         OR (n.student_id IS NULL AND n.companhia = ? AND n.peloton = ?)
         OR (n.student_id IS NULL AND n.companhia IS NULL AND n.peloton IS NULL)
       )
     ORDER BY FIELD(n.priority, 'urgent', 'important', 'normal'), n.created_at DESC
     LIMIT 12`,
    [studentId, studentId, companhia, peloton]
  );
  return (rows as any[]).map(mapNotice);
}

export async function listScopeNotices(companhia: number, peloton: number): Promise<PlatoonNotice[]> {
  await ensureServiceScaleTables();
  const rows = await query(
    `SELECT *
     FROM pmam_platoon_notices
     WHERE archived_at IS NULL
       AND ((companhia = ? AND peloton = ?) OR (companhia IS NULL AND peloton IS NULL))
     ORDER BY created_at DESC
     LIMIT 50`,
    [companhia, peloton]
  );
  return (rows as any[]).map(mapNotice);
}

export async function markNoticeRead(noticeId: number, studentId: number): Promise<void> {
  await ensureServiceScaleTables();
  await query(
    `INSERT INTO pmam_notice_reads (notice_id, student_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP`,
    [noticeId, studentId]
  );
}

export async function createStudentObservation(input: {
  studentId: number;
  companhia: number;
  peloton: number;
  type: "positive" | "negative" | "neutral";
  note: string;
  foCode?: string | null;
  createdBy: number;
  validationStatus?: "pending" | "approved" | "rejected";
  validatedBy?: number | null;
  validatedAt?: Date | null;
}): Promise<number> {
  await ensureServiceScaleTables();
  const foCode = input.foCode ? normalizeFoCode(input.foCode) : null;
  const result = await query(
    `INSERT INTO pmam_student_observations
      (student_id, companhia, peloton, type, note, fo_code, created_by, validation_status, validated_by, validated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.studentId,
      input.companhia,
      input.peloton,
      input.type,
      input.note,
      foCode,
      input.createdBy,
      input.validationStatus ?? "pending",
      input.validatedBy ?? null,
      input.validatedAt ?? null,
    ]
  );
  return (result as any).insertId;
}

export async function listStudentObservations(studentId: number, options?: { onlyVisibleToStudent?: boolean }): Promise<any[]> {
  await ensureServiceScaleTables();
  const where = ["o.student_id = ?"];
  const params: any[] = [studentId];
  if (options?.onlyVisibleToStudent) {
    where.push("o.type IN ('positive','negative')");
    where.push("o.validation_status = 'approved'");
  }
  return query(
    `SELECT o.*, u.name AS created_by_name, vu.name AS validated_by_name
     FROM pmam_student_observations o
     LEFT JOIN pmam_users u ON u.id = o.created_by
     LEFT JOIN pmam_users vu ON vu.id = o.validated_by
     WHERE ${where.join(" AND ")}
     ORDER BY o.created_at DESC`,
    params
  );
}

export async function listPendingStudentObservations(scope?: { companhia?: number | null; peloton?: number | null }): Promise<any[]> {
  await ensureServiceScaleTables();
  const where = ["o.validation_status = 'pending'", "o.type IN ('positive','negative')"];
  const params: any[] = [];
  if (scope?.companhia) {
    where.push("o.companhia = ?");
    params.push(scope.companhia);
  }
  if (scope?.peloton) {
    where.push("o.peloton = ?");
    params.push(scope.peloton);
  }
  return query(
    `SELECT o.*, s.numerica, s.nome_guerra, u.name AS created_by_name
     FROM pmam_student_observations o
     INNER JOIN pmam_students s ON s.id = o.student_id
     LEFT JOIN pmam_users u ON u.id = o.created_by
     WHERE ${where.join(" AND ")}
     ORDER BY o.created_at ASC
     LIMIT 200`,
    params
  );
}

export async function getStudentObservation(id: number): Promise<any | null> {
  await ensureServiceScaleTables();
  const rows = await query(
    `SELECT o.*, s.numerica, s.nome_guerra
     FROM pmam_student_observations o
     INNER JOIN pmam_students s ON s.id = o.student_id
     WHERE o.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function validateStudentObservation(input: {
  id: number;
  status: "approved" | "rejected";
  validatedBy: number;
  validationNote?: string | null;
}): Promise<void> {
  await ensureServiceScaleTables();
  await query(
    `UPDATE pmam_student_observations
     SET validation_status = ?, validated_by = ?, validated_at = CURRENT_TIMESTAMP, validation_note = ?
     WHERE id = ?`,
    [input.status, input.validatedBy, input.validationNote ?? null, input.id]
  );
}

export async function contestStudentObservation(input: {
  id: number;
  source: FoContestSource;
  text: string;
}): Promise<void> {
  await ensureServiceScaleTables();
  await query(
    `UPDATE pmam_student_observations
     SET contest_status = 'pending',
       contest_source = ?,
       contest_text = ?,
       contested_at = CURRENT_TIMESTAMP,
       contest_decided_by = NULL,
       contest_decided_at = NULL,
       contest_decision_note = NULL
     WHERE id = ?
       AND validation_status = 'approved'
       AND annulled_at IS NULL
       AND contest_status = 'none'`,
    [input.source, input.text, input.id]
  );
}

export async function listContestedStudentObservations(scope?: {
  companhia?: number | null;
  peloton?: number | null;
  status?: FoContestStatus | "all";
}): Promise<any[]> {
  await ensureServiceScaleTables();
  const where = ["o.contest_status <> 'none'", "o.type IN ('positive','negative')"];
  const params: any[] = [];
  if (scope?.status && scope.status !== "all") {
    where.push("o.contest_status = ?");
    params.push(scope.status);
  }
  if (scope?.companhia) {
    where.push("o.companhia = ?");
    params.push(scope.companhia);
  }
  if (scope?.peloton) {
    where.push("o.peloton = ?");
    params.push(scope.peloton);
  }
  return query(
    `SELECT
       o.*,
       s.numerica,
       s.nome_guerra,
       u.name AS created_by_name,
       vu.name AS validated_by_name,
       du.name AS contest_decided_by_name,
       au.name AS annulled_by_name
     FROM pmam_student_observations o
     INNER JOIN pmam_students s ON s.id = o.student_id
     LEFT JOIN pmam_users u ON u.id = o.created_by
     LEFT JOIN pmam_users vu ON vu.id = o.validated_by
     LEFT JOIN pmam_users du ON du.id = o.contest_decided_by
     LEFT JOIN pmam_users au ON au.id = o.annulled_by
     WHERE ${where.join(" AND ")}
     ORDER BY FIELD(o.contest_status, 'pending', 'accepted', 'rejected'), o.contested_at ASC
     LIMIT 300`,
    params
  );
}

export async function decideObservationContest(input: {
  id: number;
  status: "accepted" | "rejected";
  decidedBy: number;
  decisionNote?: string | null;
}): Promise<void> {
  await ensureServiceScaleTables();
  const accepted = input.status === "accepted";
  await query(
    `UPDATE pmam_student_observations
     SET contest_status = ?,
       contest_decided_by = ?,
       contest_decided_at = CURRENT_TIMESTAMP,
       contest_decision_note = ?,
       annulled_by = CASE WHEN ? THEN ? ELSE annulled_by END,
       annulled_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE annulled_at END,
       annulment_note = CASE WHEN ? THEN ? ELSE annulment_note END
     WHERE id = ?
       AND contest_status = 'pending'`,
    [
      input.status,
      input.decidedBy,
      input.decisionNote ?? null,
      accepted ? 1 : 0,
      input.decidedBy,
      accepted ? 1 : 0,
      accepted ? 1 : 0,
      input.decisionNote ?? null,
      input.id,
    ]
  );
}

function mapLcCase(row: any): StudentLcCase {
  const status = (row.status || "pending") as LcCaseStatus;
  const foCode = normalizeFoCode(row.fo_code || row.foCode || "");
  const definition = getFoCodeDefinition("negative", foCode) || getFoCodeDefinition("positive", foCode);
  return {
    id: Number(row.id),
    studentId: Number(row.student_id ?? row.studentId),
    numerica: row.numerica ?? null,
    nomeGuerra: row.nome_guerra ?? row.nomeGuerra ?? null,
    companhia: Number(row.companhia),
    peloton: Number(row.peloton),
    foCode,
    foLabel: definition?.label ?? foCode,
    negativeCount: Number(row.negative_count ?? row.negativeCount ?? 0),
    positiveCount: Number(row.positive_count ?? row.positiveCount ?? 0),
    netCount: Number(row.net_count ?? row.netCount ?? 0),
    status,
    recolhimentoDate: toDateOnly(row.recolhimento_date ?? row.recolhimentoDate),
    durationHours: row.duration_hours === null || row.duration_hours === undefined
      ? null
      : Number(row.duration_hours),
    procedures: row.procedures ?? null,
    judgedBy: row.judged_by === null || row.judged_by === undefined ? null : Number(row.judged_by),
    judgedByName: row.judged_by_name ?? row.judgedByName ?? null,
    judgedAt: row.judged_at ?? row.judgedAt ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

export async function getFoCodeBalance(studentId: number, foCode: string) {
  await ensureServiceScaleTables();
  const normalizedCode = normalizeFoCode(foCode);
  const rows = await query(
    `SELECT
       SUM(CASE WHEN type = 'negative' THEN 1 ELSE 0 END) AS negative_count,
       SUM(CASE WHEN type = 'positive' THEN 1 ELSE 0 END) AS positive_count
     FROM pmam_student_observations
     WHERE student_id = ?
       AND fo_code = ?
       AND validation_status = 'approved'
       AND annulled_at IS NULL
       AND type IN ('positive', 'negative')`,
    [studentId, normalizedCode]
  );
  const row = rows[0] || {};
  const negativeCount = Number(row.negative_count ?? 0);
  const positiveCount = Number(row.positive_count ?? 0);
  return {
    foCode: normalizedCode,
    negativeCount,
    positiveCount,
    netCount: calculateFoNetCount(negativeCount, positiveCount),
  };
}

export async function recomputeLcCaseForStudentCode(
  studentId: number,
  companhia: number,
  peloton: number,
  foCode: string,
) {
  await ensureServiceScaleTables();
  const normalizedCode = normalizeFoCode(foCode);
  if (!normalizedCode) return null;

  const balance = await getFoCodeBalance(studentId, normalizedCode);
  const rows = await query(
    `SELECT *
     FROM pmam_lc_cases
     WHERE student_id = ?
       AND fo_code = ?
       AND status IN ('pending', 'homologated')
     ORDER BY FIELD(status, 'pending', 'homologated'), created_at DESC
     LIMIT 1`,
    [studentId, normalizedCode]
  );
  const activeCase = rows[0] ?? null;

  if (balance.netCount >= FO_LC_THRESHOLD) {
    if (activeCase?.status === "homologated") {
      await query(
        `UPDATE pmam_lc_cases
         SET negative_count = ?, positive_count = ?, net_count = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [balance.negativeCount, balance.positiveCount, balance.netCount, activeCase.id]
      );
      return mapLcCase({ ...activeCase, ...balance });
    }

    if (activeCase?.status === "pending") {
      await query(
        `UPDATE pmam_lc_cases
         SET negative_count = ?, positive_count = ?, net_count = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [balance.negativeCount, balance.positiveCount, balance.netCount, activeCase.id]
      );
      return mapLcCase({ ...activeCase, ...balance });
    }

    const result = await query(
      `INSERT INTO pmam_lc_cases
        (student_id, companhia, peloton, fo_code, negative_count, positive_count, net_count, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        studentId,
        companhia,
        peloton,
        normalizedCode,
        balance.negativeCount,
        balance.positiveCount,
        balance.netCount,
      ]
    );
    return {
      id: (result as any).insertId,
      ...balance,
      status: "pending" as const,
    };
  }

  if (activeCase?.status === "pending") {
    await query(
      `UPDATE pmam_lc_cases
       SET negative_count = ?, positive_count = ?, net_count = ?, status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [balance.negativeCount, balance.positiveCount, balance.netCount, activeCase.id]
    );
  }

  return null;
}

export async function listLcCases(options?: {
  companhia?: number | null;
  peloton?: number | null;
  status?: LcCaseStatus | "active";
}): Promise<StudentLcCase[]> {
  await ensureServiceScaleTables();
  const where: string[] = [];
  const params: any[] = [];

  if (options?.companhia) {
    where.push("lc.companhia = ?");
    params.push(options.companhia);
  }
  if (options?.peloton) {
    where.push("lc.peloton = ?");
    params.push(options.peloton);
  }
  if (options?.status === "active" || !options?.status) {
    where.push("lc.status IN ('pending', 'homologated')");
  } else {
    where.push("lc.status = ?");
    params.push(options.status);
  }

  const rows = await query(
    `SELECT lc.*, s.numerica, s.nome_guerra, u.name AS judged_by_name
     FROM pmam_lc_cases lc
     INNER JOIN pmam_students s ON s.id = lc.student_id
     LEFT JOIN pmam_users u ON u.id = lc.judged_by
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY FIELD(lc.status, 'pending', 'homologated', 'rejected', 'cancelled'),
       lc.updated_at ASC
     LIMIT 300`,
    params
  );

  return (rows as any[]).map(mapLcCase);
}

export async function listStudentLcCases(studentId: number): Promise<StudentLcCase[]> {
  await ensureServiceScaleTables();
  const rows = await query(
    `SELECT lc.*, s.numerica, s.nome_guerra, u.name AS judged_by_name
     FROM pmam_lc_cases lc
     INNER JOIN pmam_students s ON s.id = lc.student_id
     LEFT JOIN pmam_users u ON u.id = lc.judged_by
     WHERE lc.student_id = ?
       AND lc.status IN ('pending', 'homologated')
     ORDER BY FIELD(lc.status, 'homologated', 'pending'), lc.updated_at DESC`,
    [studentId]
  );
  return (rows as any[]).map(mapLcCase);
}

export async function getLcCase(id: number): Promise<StudentLcCase | null> {
  await ensureServiceScaleTables();
  const rows = await query(
    `SELECT lc.*, s.numerica, s.nome_guerra, u.name AS judged_by_name
     FROM pmam_lc_cases lc
     INNER JOIN pmam_students s ON s.id = lc.student_id
     LEFT JOIN pmam_users u ON u.id = lc.judged_by
     WHERE lc.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ? mapLcCase(rows[0]) : null;
}

export async function decideLcCase(input: {
  id: number;
  status: "homologated" | "rejected";
  recolhimentoDate?: string | null;
  durationHours?: number | null;
  procedures?: string | null;
  judgedBy: number;
}): Promise<void> {
  await ensureServiceScaleTables();
  await query(
    `UPDATE pmam_lc_cases
     SET status = ?,
       recolhimento_date = ?,
       duration_hours = ?,
       procedures = ?,
       judged_by = ?,
       judged_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      input.status,
      input.status === "homologated" ? input.recolhimentoDate ?? null : null,
      input.status === "homologated" ? input.durationHours ?? null : null,
      input.procedures ?? null,
      input.judgedBy,
      input.id,
    ]
  );
}

function normalizeBaixadoKind(value?: string | null): BaixadoKind {
  const allowed = new Set<BaixadoKind>([
    "informativo",
    "ausente_com_atestado",
    "ausente_sem_atestado",
    "presente_sem_atestado",
  ]);
  return allowed.has(value as BaixadoKind) ? value as BaixadoKind : "informativo";
}

function mapBaixadoDocument(row: any): BaixadoDocument {
  return {
    id: Number(row.id),
    studentId: Number(row.student_id ?? row.studentId),
    companhia: Number(row.companhia),
    peloton: Number(row.peloton),
    fileUrl: row.file_url ?? row.fileUrl,
    fileName: row.file_name ?? row.fileName,
    mimeType: row.mime_type ?? row.mimeType,
    fileSize: row.file_size === null || row.file_size === undefined ? null : Number(row.file_size),
    note: row.note ?? null,
    baixadoKind: normalizeBaixadoKind(row.baixado_kind ?? row.baixadoKind),
    hpmHomologated: row.hpm_homologated === 1 || row.hpm_homologated === true,
    uploadedBy: row.uploaded_by === null || row.uploaded_by === undefined ? null : Number(row.uploaded_by),
    uploadedByName: row.uploaded_by_name ?? row.uploadedByName ?? null,
    uploadedByStudentId: row.uploaded_by_student_id === null || row.uploaded_by_student_id === undefined
      ? null
      : Number(row.uploaded_by_student_id),
    createdAt: row.created_at ?? row.createdAt,
  };
}

export async function createBaixadoDocument(input: {
  studentId: number;
  companhia: number;
  peloton: number;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize?: number | null;
  note?: string | null;
  baixadoKind?: BaixadoKind | null;
  hpmHomologated?: boolean;
  uploadedBy?: number | null;
  uploadedByStudentId?: number | null;
}): Promise<number> {
  await ensureServiceScaleTables();
  const result = await query(
    `INSERT INTO pmam_student_baixado_documents
      (student_id, companhia, peloton, file_url, file_name, mime_type, file_size, note, baixado_kind, hpm_homologated, uploaded_by, uploaded_by_student_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.studentId,
      input.companhia,
      input.peloton,
      input.fileUrl,
      input.fileName,
      input.mimeType,
      input.fileSize ?? null,
      input.note ?? null,
      normalizeBaixadoKind(input.baixadoKind),
      input.hpmHomologated ? 1 : 0,
      input.uploadedBy ?? null,
      input.uploadedByStudentId ?? null,
    ]
  );
  return (result as any).insertId;
}

export async function listBaixadoDocuments(studentId: number): Promise<BaixadoDocument[]> {
  await ensureServiceScaleTables();
  const rows = await query(
    `SELECT d.*, u.name AS uploaded_by_name
     FROM pmam_student_baixado_documents d
     LEFT JOIN pmam_users u ON u.id = d.uploaded_by
     WHERE d.student_id = ?
     ORDER BY d.created_at DESC
     LIMIT 100`,
    [studentId]
  );
  return (rows as any[]).map(mapBaixadoDocument);
}

export async function listBaixadoStudents(options?: {
  companhia?: number | null;
  peloton?: number | null;
}): Promise<BaixadoStudent[]> {
  await ensureServiceScaleTables();
  const where: string[] = ["(s.`condition` = 'baixado' OR d.id IS NOT NULL)"];
  const params: any[] = [];

  if (options?.companhia) {
    where.push("s.companhia = ?");
    params.push(options.companhia);
  }
  if (options?.peloton) {
    where.push("s.peloton = ?");
    params.push(options.peloton);
  }

  const rows = await query(
    `SELECT
       s.id AS student_id,
       s.numerica,
       s.nome_guerra,
       s.nome_completo,
       s.companhia,
       s.peloton,
       s.\`condition\`,
       s.desk_number,
       s.foto_url,
       COUNT(d.id) AS document_count,
       MAX(d.created_at) AS latest_document_at
     FROM pmam_students s
     LEFT JOIN pmam_student_baixado_documents d ON d.student_id = s.id
     WHERE ${where.join(" AND ")}
     GROUP BY s.id, s.numerica, s.nome_guerra, s.nome_completo, s.companhia, s.peloton, s.\`condition\`, s.desk_number, s.foto_url
     ORDER BY FIELD(s.\`condition\`, 'baixado') DESC, latest_document_at DESC, s.companhia ASC, s.peloton ASC, s.numerica ASC
     LIMIT 300`,
    params
  );

  const result: BaixadoStudent[] = [];
  for (const row of rows as any[]) {
    const studentId = Number(row.student_id);
    result.push({
      studentId,
      numerica: row.numerica,
      nomeGuerra: row.nome_guerra,
      nomeCompleto: row.nome_completo ?? null,
      companhia: Number(row.companhia),
      peloton: Number(row.peloton),
      condition: row.condition || "pronto",
      deskNumber: row.desk_number === null || row.desk_number === undefined ? null : Number(row.desk_number),
      fotoUrl: row.foto_url ?? null,
      documentCount: Number(row.document_count ?? 0),
      latestDocumentAt: row.latest_document_at ?? null,
      documents: await listBaixadoDocuments(studentId),
    });
  }
  return result;
}

function normalizeInternalReportType(value?: string | null): InternalReportType {
  const allowed = new Set<InternalReportType>(["desistente", "desertor", "baixado", "outro"]);
  return allowed.has(value as InternalReportType) ? value as InternalReportType : "outro";
}

function normalizeInternalReportStatus(value?: string | null): InternalReportStatus {
  const allowed = new Set<InternalReportStatus>(["active", "resolved", "cancelled"]);
  return allowed.has(value as InternalReportStatus) ? value as InternalReportStatus : "active";
}

function mapInternalReport(row: any): StudentInternalReport {
  return {
    id: Number(row.id),
    studentId: Number(row.student_id ?? row.studentId),
    numerica: row.numerica ?? null,
    nomeGuerra: row.nome_guerra ?? row.nomeGuerra ?? null,
    companhia: Number(row.companhia),
    peloton: Number(row.peloton),
    type: normalizeInternalReportType(row.type),
    status: normalizeInternalReportStatus(row.status),
    title: row.title,
    note: row.note ?? null,
    visibleToStudent: row.visible_to_student === 1 || row.visible_to_student === true,
    createdBy: row.created_by === null || row.created_by === undefined ? null : Number(row.created_by),
    createdByName: row.created_by_name ?? row.createdByName ?? null,
    resolvedBy: row.resolved_by === null || row.resolved_by === undefined ? null : Number(row.resolved_by),
    resolvedByName: row.resolved_by_name ?? row.resolvedByName ?? null,
    resolvedAt: row.resolved_at ?? row.resolvedAt ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  };
}

export async function createInternalReport(input: {
  studentId: number;
  companhia: number;
  peloton: number;
  type: InternalReportType;
  title: string;
  note?: string | null;
  visibleToStudent?: boolean;
  createdBy?: number | null;
}): Promise<number> {
  await ensureServiceScaleTables();
  const result = await query(
    `INSERT INTO pmam_student_internal_reports
      (student_id, companhia, peloton, type, title, note, visible_to_student, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.studentId,
      input.companhia,
      input.peloton,
      normalizeInternalReportType(input.type),
      input.title,
      input.note ?? null,
      input.visibleToStudent === false ? 0 : 1,
      input.createdBy ?? null,
    ]
  );
  return (result as any).insertId;
}

export async function listInternalReports(options?: {
  companhia?: number | null;
  peloton?: number | null;
  studentId?: number | null;
  status?: InternalReportStatus | "all";
  visibleToStudent?: boolean;
}): Promise<StudentInternalReport[]> {
  await ensureServiceScaleTables();
  const where: string[] = [];
  const params: any[] = [];
  if (options?.companhia) {
    where.push("r.companhia = ?");
    params.push(options.companhia);
  }
  if (options?.peloton) {
    where.push("r.peloton = ?");
    params.push(options.peloton);
  }
  if (options?.studentId) {
    where.push("r.student_id = ?");
    params.push(options.studentId);
  }
  if (options?.status && options.status !== "all") {
    where.push("r.status = ?");
    params.push(options.status);
  } else if (!options?.status) {
    where.push("r.status = 'active'");
  }
  if (options?.visibleToStudent !== undefined) {
    where.push("r.visible_to_student = ?");
    params.push(options.visibleToStudent ? 1 : 0);
  }
  const rows = await query(
    `SELECT r.*, s.numerica, s.nome_guerra, cu.name AS created_by_name, ru.name AS resolved_by_name
     FROM pmam_student_internal_reports r
     INNER JOIN pmam_students s ON s.id = r.student_id
     LEFT JOIN pmam_users cu ON cu.id = r.created_by
     LEFT JOIN pmam_users ru ON ru.id = r.resolved_by
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY FIELD(r.status, 'active', 'resolved', 'cancelled'), r.created_at ASC
     LIMIT 300`,
    params
  );
  return (rows as any[]).map(mapInternalReport);
}

export async function getInternalReport(id: number): Promise<StudentInternalReport | null> {
  await ensureServiceScaleTables();
  const rows = await query(
    `SELECT r.*, s.numerica, s.nome_guerra, cu.name AS created_by_name, ru.name AS resolved_by_name
     FROM pmam_student_internal_reports r
     INNER JOIN pmam_students s ON s.id = r.student_id
     LEFT JOIN pmam_users cu ON cu.id = r.created_by
     LEFT JOIN pmam_users ru ON ru.id = r.resolved_by
     WHERE r.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] ? mapInternalReport(rows[0]) : null;
}

export async function updateInternalReportStatus(input: {
  id: number;
  status: InternalReportStatus;
  resolvedBy?: number | null;
}): Promise<void> {
  await ensureServiceScaleTables();
  await query(
    `UPDATE pmam_student_internal_reports
     SET status = ?,
       resolved_by = CASE WHEN ? IN ('resolved', 'cancelled') THEN ? ELSE resolved_by END,
       resolved_at = CASE WHEN ? IN ('resolved', 'cancelled') THEN CURRENT_TIMESTAMP ELSE resolved_at END,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.status, input.status, input.resolvedBy ?? null, input.status, input.id]
  );
}

export type FoReasonType = "positive" | "negative";
export type FoReasonStatus = "pending" | "approved" | "rejected";

function normalizeFoReasonLabel(label: string): { label: string; normalizedLabel: string } {
  const cleanLabel = label.trim().replace(/\s+/g, " ").normalize("NFC");
  return {
    label: cleanLabel,
    normalizedLabel: cleanLabel.toLocaleLowerCase("pt-BR"),
  };
}

export async function listFoReasons(status: FoReasonStatus = "approved"): Promise<any[]> {
  await ensureServiceScaleTables();
  return query(
    `SELECT r.*, creator.name AS created_by_name, validator.name AS validated_by_name
     FROM pmam_fo_reasons r
     LEFT JOIN pmam_users creator ON creator.id = r.created_by
     LEFT JOIN pmam_users validator ON validator.id = r.validated_by
     WHERE r.validation_status = ?
     ORDER BY r.type ASC, r.label ASC`,
    [status]
  );
}

export async function suggestFoReason(input: {
  type: FoReasonType;
  label: string;
  createdBy: number;
  approveImmediately?: boolean;
}): Promise<{ id: number; status: FoReasonStatus }> {
  await ensureServiceScaleTables();
  const normalized = normalizeFoReasonLabel(input.label);
  const requestedStatus: FoReasonStatus = input.approveImmediately ? "approved" : "pending";

  await query(
    `INSERT INTO pmam_fo_reasons
      (type, label, normalized_label, validation_status, created_by, validated_by, validated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       label = VALUES(label),
       created_by = VALUES(created_by),
       validated_by = IF(validation_status = 'approved', validated_by, VALUES(validated_by)),
       validated_at = IF(validation_status = 'approved', validated_at, VALUES(validated_at)),
       validation_status = IF(validation_status = 'approved', 'approved', VALUES(validation_status)),
       updated_at = CURRENT_TIMESTAMP`,
    [
      input.type,
      normalized.label,
      normalized.normalizedLabel,
      requestedStatus,
      input.createdBy,
      input.approveImmediately ? input.createdBy : null,
      input.approveImmediately ? new Date() : null,
    ]
  );

  const rows = await query(
    `SELECT id, validation_status
     FROM pmam_fo_reasons
     WHERE type = ? AND normalized_label = ?
     LIMIT 1`,
    [input.type, normalized.normalizedLabel]
  );
  return {
    id: Number(rows[0].id),
    status: rows[0].validation_status as FoReasonStatus,
  };
}

export async function validateFoReason(input: {
  id: number;
  status: "approved" | "rejected";
  validatedBy: number;
}): Promise<void> {
  await ensureServiceScaleTables();
  await query(
    `UPDATE pmam_fo_reasons
     SET validation_status = ?, validated_by = ?, validated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [input.status, input.validatedBy, input.id]
  );
}

export async function createStudentHighlight(input: {
  studentId: number;
  companhia: number;
  peloton: number;
  title: string;
  description: string | null;
  promotedBy: number;
}): Promise<number> {
  await ensureServiceScaleTables();
  const result = await query(
    `INSERT INTO pmam_student_highlights
      (student_id, companhia, peloton, title, description, promoted_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.studentId, input.companhia, input.peloton, input.title, input.description, input.promotedBy]
  );
  return (result as any).insertId;
}

export async function listStudentHighlights(limit = 6): Promise<any[]> {
  await ensureServiceScaleTables();
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 6));
  return query(
    `SELECT h.*, s.numerica, s.nome_guerra, s.foto_url
     FROM pmam_student_highlights h
     INNER JOIN pmam_students s ON s.id = h.student_id
     WHERE h.active = true
     ORDER BY h.created_at DESC
     LIMIT ${safeLimit}`
  );
}

// ===== CARGOS / FUNÇÕES CUSTOMIZADAS =====

let cargosSchemaPromise: Promise<void> | null = null;

async function ensureCargosTable() {
  if (!cargosSchemaPromise) {
    cargosSchemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_classroom_cargos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          nome VARCHAR(100) NOT NULL,
          descricao VARCHAR(255) NULL,
          icone VARCHAR(50) NULL DEFAULT 'shield',
          tem_tesouraria BOOLEAN NOT NULL DEFAULT false,
          created_by INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          KEY idx_pmam_classroom_cargos_scope (companhia, peloton)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_classroom_cargo_members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          cargo_id INT NOT NULL,
          student_id INT NOT NULL,
          titulo_cargo VARCHAR(100) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_cargo_member (cargo_id, student_id),
          FOREIGN KEY (cargo_id) REFERENCES pmam_classroom_cargos(id) ON DELETE CASCADE
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_treasury_entries (
          id INT AUTO_INCREMENT PRIMARY KEY,
          cargo_id INT NOT NULL,
          tipo ENUM('entrada','saida') NOT NULL,
          valor DECIMAL(10,2) NOT NULL,
          descricao VARCHAR(255) NOT NULL,
          data DATE NOT NULL,
          registrado_por INT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cargo_id) REFERENCES pmam_classroom_cargos(id) ON DELETE CASCADE,
          KEY idx_pmam_treasury_cargo (cargo_id, data)
        )
      `);
    })().catch((err) => { cargosSchemaPromise = null; throw err; });
  }
  await cargosSchemaPromise;
}

export interface ClassroomCargo {
  id: number;
  companhia: number;
  peloton: number;
  nome: string;
  descricao?: string;
  icone: string;
  temTesouraria: boolean;
  createdBy?: number;
  createdAt: Date;
  members: CargoMember[];
}

export interface CargoMember {
  id: number;
  cargoId: number;
  studentId: number;
  tituloCargo?: string;
  nomeGuerra?: string;
  numerica?: string;
}

export interface TreasuryEntry {
  id: number;
  cargoId: number;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  data: string;
  registradoPor?: number;
  createdAt: Date;
}

export async function listCargos(companhia: number, peloton: number): Promise<ClassroomCargo[]> {
  await ensureCargosTable();
  const cargos = await query(
    `SELECT * FROM pmam_classroom_cargos WHERE companhia = ? AND peloton = ? ORDER BY created_at ASC`,
    [companhia, peloton]
  );
  if (!cargos.length) return [];

  const cargoIds = (cargos as any[]).map((c: any) => c.id);
  const members = await query(
    `SELECT m.*, s.nome_guerra, s.numerica
     FROM pmam_classroom_cargo_members m
     LEFT JOIN pmam_students s ON s.id = m.student_id
     WHERE m.cargo_id IN (${cargoIds.map(() => '?').join(',')})`,
    cargoIds
  );

  return (cargos as any[]).map((c: any) => ({
    id: c.id,
    companhia: c.companhia,
    peloton: c.peloton,
    nome: c.nome,
    descricao: c.descricao || undefined,
    icone: c.icone || 'shield',
    temTesouraria: Boolean(c.tem_tesouraria),
    createdBy: c.created_by || undefined,
    createdAt: c.created_at,
    members: (members as any[])
      .filter((m: any) => m.cargo_id === c.id)
      .map((m: any) => ({
        id: m.id,
        cargoId: m.cargo_id,
        studentId: m.student_id,
        tituloCargo: m.titulo_cargo || undefined,
        nomeGuerra: m.nome_guerra || undefined,
        numerica: m.numerica || undefined,
      })),
  }));
}

export async function getCargoScope(id: number): Promise<{ companhia: number; peloton: number } | null> {
  await ensureCargosTable();
  const rows = await query(
    `SELECT companhia, peloton FROM pmam_classroom_cargos WHERE id = ? LIMIT 1`,
    [id]
  );
  const row = rows[0];
  return row ? { companhia: Number(row.companhia), peloton: Number(row.peloton) } : null;
}

export async function createCargo(input: {
  companhia: number;
  peloton: number;
  nome: string;
  descricao?: string;
  icone?: string;
  temTesouraria?: boolean;
  createdBy?: number;
}): Promise<number> {
  await ensureCargosTable();
  const result = await query(
    `INSERT INTO pmam_classroom_cargos (companhia, peloton, nome, descricao, icone, tem_tesouraria, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.companhia, input.peloton, input.nome, input.descricao || null, input.icone || 'shield', input.temTesouraria ? 1 : 0, input.createdBy || null]
  );
  return (result as any).insertId;
}

export async function updateCargo(id: number, input: {
  nome?: string;
  descricao?: string;
  icone?: string;
  temTesouraria?: boolean;
}): Promise<void> {
  await ensureCargosTable();
  const sets: string[] = [];
  const params: any[] = [];
  if (input.nome !== undefined) { sets.push('nome = ?'); params.push(input.nome); }
  if (input.descricao !== undefined) { sets.push('descricao = ?'); params.push(input.descricao); }
  if (input.icone !== undefined) { sets.push('icone = ?'); params.push(input.icone); }
  if (input.temTesouraria !== undefined) { sets.push('tem_tesouraria = ?'); params.push(input.temTesouraria ? 1 : 0); }
  if (!sets.length) return;
  params.push(id);
  await query(`UPDATE pmam_classroom_cargos SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
}

export async function deleteCargo(id: number): Promise<void> {
  await ensureCargosTable();
  await query('DELETE FROM pmam_classroom_cargos WHERE id = ?', [id]);
}

export async function addCargoMember(cargoId: number, studentId: number, tituloCargo?: string): Promise<void> {
  await ensureCargosTable();
  await query(
    `INSERT INTO pmam_classroom_cargo_members (cargo_id, student_id, titulo_cargo)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE titulo_cargo = VALUES(titulo_cargo)`,
    [cargoId, studentId, tituloCargo || null]
  );
}

export async function removeCargoMember(cargoId: number, studentId: number): Promise<void> {
  await ensureCargosTable();
  await query('DELETE FROM pmam_classroom_cargo_members WHERE cargo_id = ? AND student_id = ?', [cargoId, studentId]);
}

export async function listTreasuryEntries(cargoId: number): Promise<TreasuryEntry[]> {
  await ensureCargosTable();
  const rows = await query(
    `SELECT * FROM pmam_treasury_entries WHERE cargo_id = ? ORDER BY data DESC, created_at DESC`,
    [cargoId]
  );
  return (rows as any[]).map((r: any) => ({
    id: r.id,
    cargoId: r.cargo_id,
    tipo: r.tipo as 'entrada' | 'saida',
    valor: Number(r.valor),
    descricao: r.descricao,
    data: toDateOnly(r.data) || '',
    registradoPor: r.registrado_por || undefined,
    createdAt: r.created_at,
  }));
}

export async function addTreasuryEntry(input: {
  cargoId: number;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  data: string;
  registradoPor?: number;
}): Promise<number> {
  await ensureCargosTable();
  const result = await query(
    `INSERT INTO pmam_treasury_entries (cargo_id, tipo, valor, descricao, data, registrado_por)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.cargoId, input.tipo, input.valor, input.descricao, input.data, input.registradoPor || null]
  );
  return (result as any).insertId;
}

export async function deleteTreasuryEntry(id: number): Promise<void> {
  await ensureCargosTable();
  await query('DELETE FROM pmam_treasury_entries WHERE id = ?', [id]);
}

export async function getTreasuryEntryScope(id: number): Promise<{ companhia: number; peloton: number } | null> {
  await ensureCargosTable();
  const rows = await query(
    `SELECT c.companhia, c.peloton
     FROM pmam_treasury_entries e
     INNER JOIN pmam_classroom_cargos c ON c.id = e.cargo_id
     WHERE e.id = ?
     LIMIT 1`,
    [id]
  );
  const row = rows[0];
  return row ? { companhia: Number(row.companhia), peloton: Number(row.peloton) } : null;
}
