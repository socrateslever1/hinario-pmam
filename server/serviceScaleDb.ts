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
  if (user.role === "master") return true;
  if (!assignment) return false;
  if (assignment.level === "principal") return true;
  if (assignment.level === "companhia") return assignment.companhia === companhia;
  return assignment.companhia === companhia && assignment.peloton === peloton;
}

export function getDefaultScope(
  user: { role?: string | null },
  assignment: XerifeAssignment | null,
): { companhia?: number; peloton?: number; unrestricted: boolean } {
  if (user.role === "master" || assignment?.level === "principal") {
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
    SELECT id, numerica, nome_guerra AS nomeGuerra, companhia, peloton, \`condition\`, desk_number AS deskNumber, foto_url AS fotoUrl
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
