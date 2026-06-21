import { query } from "./mysql";

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
          created_by INT NULL,
          validation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
          validated_by INT NULL,
          validated_at TIMESTAMP NULL,
          validation_note VARCHAR(500) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_pmam_student_observations_student (student_id, created_at),
          KEY idx_pmam_student_observations_scope (companhia, peloton),
          KEY idx_pmam_student_observations_validation (validation_status, created_at)
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS pmam_fo_reasons (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type ENUM('positive','negative') NOT NULL,
          label VARCHAR(500) NOT NULL,
          normalized_label VARCHAR(500) NOT NULL,
          validation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
          created_by INT NULL,
          validated_by INT NULL,
          validated_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_fo_reasons_type_label (type, normalized_label),
          KEY idx_pmam_fo_reasons_status (validation_status, type, label)
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
      try {
        await query("ALTER TABLE pmam_student_observations MODIFY COLUMN note LONGTEXT NOT NULL");
      } catch (error) {
        console.warn("[ServiceScaleDB] Could not widen pmam_student_observations.note:", error);
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
  user: { role?: string | null },
  assignment: XerifeAssignment | null,
  companhia: number,
  peloton?: number | null,
) {
  if (user.role === "master" || user.role === "admin") return true;
  if (!assignment) return false;
  if (assignment.level === "principal") return true;
  if (assignment.level === "companhia") return assignment.companhia === companhia;
  return assignment.companhia === companhia && assignment.peloton === peloton;
}

export function getDefaultScope(
  user: { role?: string | null },
  assignment: XerifeAssignment | null,
): { companhia?: number; peloton?: number; unrestricted: boolean } {
  if (user.role === "master" || user.role === "admin" || assignment?.level === "principal") {
    return { unrestricted: true };
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
  createdBy: number;
  validationStatus?: "pending" | "approved" | "rejected";
  validatedBy?: number | null;
  validatedAt?: Date | null;
}): Promise<number> {
  await ensureServiceScaleTables();
  const result = await query(
    `INSERT INTO pmam_student_observations
      (student_id, companhia, peloton, type, note, created_by, validation_status, validated_by, validated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.studentId,
      input.companhia,
      input.peloton,
      input.type,
      input.note,
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
