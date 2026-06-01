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
