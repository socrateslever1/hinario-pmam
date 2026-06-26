import { query } from "./mysql";

export interface GradeStudent {
  id: number;
  studentNumber: string;
  cpf: string;
  fullName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeDiscipline {
  id: number;
  studentId: number;
  disciplineName: string;
  professorName?: string;
  grade?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DisciplineCatalogItem {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  isActive: boolean;
  startDate?: Date | string | null;
  examDate?: Date | string | null;
  status: string;
  studyMaterialUrl?: string | null;
  studyMaterialName?: string | null;
  gaivotasLinks?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentGradeEntry {
  id: number;
  studentId: number;
  disciplineId: number;
  disciplineName: string;
  professorName?: string;
  grade?: number;
  evaluationDate?: string;
  observation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeRankingRow {
  position: number;
  studentId: number;
  nomeGuerra: string;
  numerica: string;
  companhia: number;
  peloton: number;
  average: number;
  totalScore: number;
  disciplineCount: number;
}

export interface AdminStudentGradeEntry extends StudentGradeEntry {
  studentName: string;
  numerica: string;
  companhia: number;
  peloton: number;
}

function mapGradeStudent(row: any): GradeStudent | null {
  if (!row) return null;
  return {
    id: row.id,
    studentNumber: row.student_number,
    cpf: row.cpf,
    fullName: row.full_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGradeDiscipline(row: any): GradeDiscipline | null {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    disciplineName: row.discipline_name,
    professorName: row.professor_name,
    grade: row.grade,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDisciplineCatalogItem(row: any): DisciplineCatalogItem | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    isActive: Boolean(row.is_active),
    startDate: row.start_date,
    examDate: row.exam_date,
    status: row.status || "em_breve",
    studyMaterialUrl: row.study_material_url,
    studyMaterialName: row.study_material_name,
    gaivotasLinks: row.gaivotas_links,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStudentGradeEntry(row: any): StudentGradeEntry | null {
  if (!row) return null;
  return {
    id: row.id,
    studentId: row.student_id,
    disciplineId: row.discipline_id,
    disciplineName: row.discipline_name,
    professorName: row.professor_name,
    grade: row.grade,
    evaluationDate: row.evaluation_date,
    observation: row.observation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ===== NEW STUDENT GRADE SYSTEM =====

let platoonSchemaPromise: Promise<void> | null = null;

export async function ensurePlatoonDisciplineTable() {
  if (!platoonSchemaPromise) {
    platoonSchemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS pmam_platoon_disciplines (
          id INT AUTO_INCREMENT PRIMARY KEY,
          discipline_id INT NOT NULL,
          companhia INT NOT NULL,
          peloton INT NOT NULL,
          start_date DATE NULL,
          exam_date DATE NULL,
          status VARCHAR(50) DEFAULT 'em_breve',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_pmam_platoon_disciplines_scope (discipline_id, companhia, peloton),
          FOREIGN KEY (discipline_id) REFERENCES pmam_disciplines(id) ON DELETE CASCADE
        )
      `);
    })().catch((error) => {
      platoonSchemaPromise = null;
      throw error;
    });
  }
  await platoonSchemaPromise;
}

export async function getActiveDisciplineCatalog(companhia?: number, peloton?: number): Promise<DisciplineCatalogItem[]> {
  await ensurePlatoonDisciplineTable();
  if (companhia !== undefined && peloton !== undefined) {
    const rows = await query(
      `SELECT 
        d.id,
        d.name,
        d.description,
        d.created_by,
        d.is_active,
        pd.start_date,
        pd.exam_date,
        pd.status,
        d.study_material_url,
        d.study_material_name,
        d.gaivotas_links,
        d.created_at,
        d.updated_at,
        d.start_date as global_start_date,
        d.exam_date as global_exam_date,
        d.status as global_status
      FROM pmam_disciplines d
      INNER JOIN pmam_platoon_disciplines pd ON pd.discipline_id = d.id
        AND pd.companhia = ? 
        AND pd.peloton = ?
      WHERE d.is_active = true 
      ORDER BY d.name ASC`,
      [companhia, peloton]
    );
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      createdBy: row.created_by,
      isActive: Boolean(row.is_active),
      startDate: row.start_date !== null ? row.start_date : row.global_start_date,
      examDate: row.exam_date !== null ? row.exam_date : row.global_exam_date,
      status: (row.status !== null && row.status !== undefined) ? row.status : (row.global_status || "em_breve"),
      studyMaterialUrl: row.study_material_url || undefined,
      studyMaterialName: row.study_material_name || undefined,
      gaivotasLinks: row.gaivotas_links || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } else {
    const rows = await query(
      "SELECT * FROM pmam_disciplines WHERE is_active = true ORDER BY name ASC"
    );
    return rows.map(mapDisciplineCatalogItem).filter((d): d is DisciplineCatalogItem => d !== null);
  }
}

export async function isDisciplineAvailableForScope(
  disciplineId: number,
  companhia: number,
  peloton: number,
): Promise<boolean> {
  await ensurePlatoonDisciplineTable();
  const rows = await query(
    `SELECT d.id
     FROM pmam_disciplines d
     INNER JOIN pmam_platoon_disciplines pd ON pd.discipline_id = d.id
     WHERE d.id = ?
       AND d.is_active = true
       AND pd.companhia = ?
       AND pd.peloton = ?
     LIMIT 1`,
    [disciplineId, companhia, peloton],
  );
  return rows.length > 0;
}

export async function upsertPlatoonDiscipline(
  disciplineId: number,
  companhia: number,
  peloton: number,
  startDate?: string | null,
  examDate?: string | null,
  status?: string
): Promise<void> {
  await ensurePlatoonDisciplineTable();
  await query(
    `INSERT INTO pmam_platoon_disciplines 
      (discipline_id, companhia, peloton, start_date, exam_date, status) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
      start_date = VALUES(start_date),
      exam_date = VALUES(exam_date),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP`,
    [
      disciplineId,
      companhia,
      peloton,
      startDate || null,
      examDate || null,
      status || 'em_breve'
    ]
  );
}


export async function createCatalogDiscipline(
  name: string,
  description: string | undefined,
  createdBy: number,
  startDate?: string | null,
  examDate?: string | null,
  status?: string,
  studyMaterialUrl?: string | null,
  studyMaterialName?: string | null,
  gaivotasLinks?: string | null
): Promise<DisciplineCatalogItem> {
  const result = await query(
    `INSERT INTO pmam_disciplines 
      (name, description, created_by, start_date, exam_date, status, study_material_url, study_material_name, gaivotas_links) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      description || null,
      createdBy,
      startDate || null,
      examDate || null,
      status || 'em_breve',
      studyMaterialUrl || null,
      studyMaterialName || null,
      gaivotasLinks || null
    ]
  );

  const rows = await query(
    "SELECT * FROM pmam_disciplines WHERE id = ? LIMIT 1",
    [(result as any).insertId]
  );
  const discipline = mapDisciplineCatalogItem(rows[0]);
  if (!discipline) throw new Error("Failed to create discipline");
  return discipline;
}

export async function updateCatalogDiscipline(
  id: number,
  name: string,
  description?: string,
  startDate?: string | null,
  examDate?: string | null,
  status?: string,
  studyMaterialUrl?: string | null,
  studyMaterialName?: string | null,
  gaivotasLinks?: string | null
): Promise<void> {
  await query(
    `UPDATE pmam_disciplines SET 
      name = ?, 
      description = ?, 
      start_date = ?, 
      exam_date = ?, 
      status = ?, 
      study_material_url = ?, 
      study_material_name = ?, 
      gaivotas_links = ?, 
      updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [
      name,
      description || null,
      startDate || null,
      examDate || null,
      status || 'em_breve',
      studyMaterialUrl || null,
      studyMaterialName || null,
      gaivotasLinks || null,
      id
    ]
  );
}

export async function deleteCatalogDiscipline(id: number): Promise<void> {
  await query(
    "UPDATE pmam_disciplines SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [id]
  );
}


export async function getStudentGradeEntries(studentId: number): Promise<StudentGradeEntry[]> {
  const rows = await query(
    `SELECT
      g.id,
      g.student_id,
      g.discipline_id,
      d.name as discipline_name,
      g.professor_name,
      g.grade,
      g.evaluation_date,
      g.observation,
      g.created_at,
      g.updated_at
    FROM pmam_student_grades g
    INNER JOIN pmam_disciplines d ON d.id = g.discipline_id
    WHERE g.student_id = ?
    ORDER BY d.name ASC`,
    [studentId]
  );
  return rows.map(mapStudentGradeEntry).filter((g): g is StudentGradeEntry => g !== null);
}

export async function createStudentGradeEntry(
  studentId: number,
  disciplineId: number,
  professorName?: string,
  grade?: number,
  evaluationDate?: string,
  observation?: string
): Promise<StudentGradeEntry> {
  // Converter notas acima de 10 (ex: 70 -> 7.0, 100 -> 10.0)
  if (grade !== undefined && grade > 10) {
    grade = grade / 10;
  }
  
  // Validar nota (0-10)
  if (grade !== undefined && (grade < 0 || grade > 10)) {
    throw new Error("Nota deve estar entre 0 e 10");
  }
  
  // Verificar se já existe nota para este aluno nesta disciplina
  const existingRows = await query(
    `SELECT id FROM pmam_student_grades
    WHERE student_id = ? AND discipline_id = ?
    LIMIT 1`,
    [studentId, disciplineId]
  );

  if (existingRows.length > 0) {
    throw new Error("Você já possui uma nota lançada para esta disciplina. Edite a nota existente ou delete-a antes de lançar uma nova.");
  }

  const result = await query(
    `INSERT INTO pmam_student_grades
      (student_id, discipline_id, professor_name, grade, evaluation_date, observation)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      disciplineId,
      professorName || null,
      grade ?? null,
      evaluationDate || null,
      observation || null,
    ]
  );

  const gradeId = (result as any).insertId;
  const rows = await query(
    `SELECT
      g.id,
      g.student_id,
      g.discipline_id,
      d.name as discipline_name,
      g.professor_name,
      g.grade,
      g.evaluation_date,
      g.observation,
      g.created_at,
      g.updated_at
    FROM pmam_student_grades g
    INNER JOIN pmam_disciplines d ON d.id = g.discipline_id
    WHERE g.id = ?
    LIMIT 1`,
    [gradeId]
  );
  const entry = mapStudentGradeEntry(rows[0]);
  if (!entry) throw new Error("Failed to create student grade");
  return entry;
}

export async function updateStudentGradeEntry(
  id: number,
  studentId: number,
  disciplineId?: number,
  professorName?: string,
  grade?: number | null,
  evaluationDate?: string | null,
  observation?: string | null
): Promise<void> {
  // Converter notas acima de 10 (ex: 70 -> 7.0, 100 -> 10.0)
  if (grade !== undefined && grade !== null && grade > 10) {
    grade = grade / 10;
  }
  
  // Validar nota (0-10)
  if (grade !== undefined && grade !== null && (grade < 0 || grade > 10)) {
    throw new Error("Nota deve estar entre 0 e 10");
  }
  
  const updates: string[] = [];
  const params: any[] = [];

  if (disciplineId !== undefined) {
    updates.push("discipline_id = ?");
    params.push(disciplineId);
  }
  if (professorName !== undefined) {
    updates.push("professor_name = ?");
    params.push(professorName || null);
  }
  if (grade !== undefined) {
    updates.push("grade = ?");
    params.push(grade);
  }
  if (evaluationDate !== undefined) {
    updates.push("evaluation_date = ?");
    params.push(evaluationDate || null);
  }
  if (observation !== undefined) {
    updates.push("observation = ?");
    params.push(observation || null);
  }

  if (updates.length === 0) return;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id, studentId);
  await query(
    `UPDATE pmam_student_grades SET ${updates.join(", ")} WHERE id = ? AND student_id = ?`,
    params
  );
}

export async function deleteStudentGradeEntry(id: number, studentId: number): Promise<void> {
  await query("DELETE FROM pmam_student_grades WHERE id = ? AND student_id = ?", [id, studentId]);
}

export async function calculateStudentAverage(studentId: number): Promise<number> {
  const rows = await query(
    "SELECT AVG(grade) as avg_grade FROM pmam_student_grades WHERE student_id = ? AND grade IS NOT NULL",
    [studentId]
  );
  const avgGrade = rows[0]?.avg_grade;
  return avgGrade ? Math.round(avgGrade * 100) / 100 : 0;
}

export async function getGradeRanking(filters?: {
  companhia?: number;
  peloton?: number;
}): Promise<GradeRankingRow[]> {
  const where: string[] = [];
  const params: any[] = [];

  if (filters?.companhia !== undefined) {
    where.push("s.companhia = ?");
    params.push(filters.companhia);
  }
  if (filters?.peloton !== undefined) {
    where.push("s.peloton = ?");
    params.push(filters.peloton);
  }

  const rows = await query(
    `SELECT
      s.id as student_id,
      s.nome_guerra,
      s.numerica,
      s.companhia,
      s.peloton,
      COALESCE(SUM(g.grade), 0) as total_score,
      COALESCE(AVG(g.grade), 0) as avg_grade,
      COUNT(g.id) as discipline_count
    FROM pmam_students s
    LEFT JOIN pmam_student_grades g ON g.student_id = s.id AND g.grade IS NOT NULL
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    GROUP BY s.id, s.nome_guerra, s.numerica, s.companhia, s.peloton
     ORDER BY avg_grade DESC, discipline_count DESC, s.numerica ASC`,
    params
  );

  return rows.map((row: any, index: number) => ({
    position: index + 1,
    studentId: row.student_id,
    nomeGuerra: row.nome_guerra,
    numerica: row.numerica,
    companhia: row.companhia,
    peloton: row.peloton,
    average: Math.round(Number(row.avg_grade || 0) * 100) / 100,
    totalScore: Math.round(Number(row.total_score || 0) * 100) / 100,
    disciplineCount: Number(row.discipline_count || 0),
  }));
}

export async function getAllStudentGradeEntries(): Promise<AdminStudentGradeEntry[]> {
  const rows = await query(
    `SELECT
      g.id,
      g.student_id,
      s.nome_guerra as student_name,
      s.numerica,
      s.companhia,
      s.peloton,
      g.discipline_id,
      d.name as discipline_name,
      g.professor_name,
      g.grade,
      g.evaluation_date,
      g.observation,
      g.created_at,
      g.updated_at
    FROM pmam_student_grades g
    INNER JOIN pmam_students s ON s.id = g.student_id
    INNER JOIN pmam_disciplines d ON d.id = g.discipline_id
    ORDER BY s.numerica ASC, d.name ASC`
  );

  return rows.map((row: any) => ({
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    numerica: row.numerica,
    companhia: row.companhia,
    peloton: row.peloton,
    disciplineId: row.discipline_id,
    disciplineName: row.discipline_name,
    professorName: row.professor_name,
    grade: row.grade,
    evaluationDate: row.evaluation_date,
    observation: row.observation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// ===== GRADE STUDENTS =====

export async function getGradeStudentByNumberAndCpf(
  studentNumber: string,
  cpf: string
): Promise<GradeStudent | null> {
  const rows = await query(
    "SELECT * FROM pmam_grade_students WHERE student_number = ? AND cpf = ? LIMIT 1",
    [studentNumber, cpf]
  );
  return mapGradeStudent(rows[0]);
}

export async function getGradeStudentById(id: number): Promise<GradeStudent | null> {
  const rows = await query(
    "SELECT * FROM pmam_grade_students WHERE id = ? LIMIT 1",
    [id]
  );
  return mapGradeStudent(rows[0]);
}

export async function createGradeStudent(
  studentNumber: string,
  cpf: string,
  fullName?: string
): Promise<GradeStudent> {
  const result = await query(
    "INSERT INTO pmam_grade_students (student_number, cpf, full_name) VALUES (?, ?, ?)",
    [studentNumber, cpf, fullName || null]
  );

  const student = await getGradeStudentById((result as any).insertId);
  if (!student) throw new Error("Failed to create grade student");
  return student;
}

// ===== GRADE DISCIPLINES =====

export async function getDisciplinesByStudentId(studentId: number): Promise<GradeDiscipline[]> {
  const rows = await query(
    "SELECT * FROM pmam_grade_disciplines WHERE student_id = ? ORDER BY created_at DESC",
    [studentId]
  );
  return rows.map(mapGradeDiscipline).filter((d): d is GradeDiscipline => d !== null);
}

export async function createDiscipline(
  studentId: number,
  disciplineName: string,
  professorName?: string,
  grade?: number
): Promise<GradeDiscipline> {
  const result = await query(
    "INSERT INTO pmam_grade_disciplines (student_id, discipline_name, professor_name, grade) VALUES (?, ?, ?, ?)",
    [studentId, disciplineName, professorName || null, grade || null]
  );

  const disciplineId = (result as any).insertId;
  const rows = await query(
    "SELECT * FROM pmam_grade_disciplines WHERE id = ? LIMIT 1",
    [disciplineId]
  );
  const discipline = mapGradeDiscipline(rows[0]);
  if (!discipline) throw new Error("Failed to create discipline");
  return discipline;
}

export async function updateDiscipline(
  id: number,
  disciplineName?: string,
  professorName?: string,
  grade?: number
): Promise<void> {
  const updates: string[] = [];
  const params: any[] = [];

  if (disciplineName !== undefined) {
    updates.push("discipline_name = ?");
    params.push(disciplineName);
  }

  if (professorName !== undefined) {
    updates.push("professor_name = ?");
    params.push(professorName);
  }

  if (grade !== undefined) {
    updates.push("grade = ?");
    params.push(grade);
  }

  if (updates.length === 0) return;

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const sql = `UPDATE pmam_grade_disciplines SET ${updates.join(", ")} WHERE id = ?`;
  await query(sql, params);
}

export async function deleteDiscipline(id: number): Promise<void> {
  await query("DELETE FROM pmam_grade_disciplines WHERE id = ?", [id]);
}

export async function calculateTotalGrade(studentId: number): Promise<number> {
  const rows = await query(
    "SELECT AVG(grade) as avg_grade FROM pmam_grade_disciplines WHERE student_id = ? AND grade IS NOT NULL",
    [studentId]
  );
  const avgGrade = rows[0]?.avg_grade;
  return avgGrade ? Math.round(avgGrade * 100) / 100 : 0;
}
