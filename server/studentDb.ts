import mysql from "mysql2/promise";
import * as bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { ENV } from "./_core/env";

let connectionPool: mysql.Pool | null = null;
let studentSessionSchemaPromise: Promise<void> | null = null;

async function getPool() {
  if (!connectionPool) {
    connectionPool = mysql.createPool({
      host: ENV.tidbHost,
      port: ENV.tidbPort,
      user: ENV.tidbUser,
      password: ENV.tidbPassword,
      database: ENV.tidbDatabase,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        rejectUnauthorized: true,
      },
    });
  }
  return connectionPool;
}

async function ensureStudentSessionSchema() {
  if (!studentSessionSchemaPromise) {
    studentSessionSchemaPromise = (async () => {
      const pool = await getPool();
      const connection = await pool.getConnection();

      try {
        const [rows] = await connection.execute(
          "SHOW COLUMNS FROM pmam_students LIKE 'session_token'"
        );

        if ((rows as any[]).length === 0) {
          await connection.execute(
            "ALTER TABLE pmam_students ADD COLUMN session_token varchar(128)"
          );
        }

        const [conditionRows] = await connection.execute(
          "SHOW COLUMNS FROM pmam_students LIKE 'condition'"
        );

        if ((conditionRows as any[]).length === 0) {
          await connection.execute(
            "ALTER TABLE pmam_students ADD COLUMN `condition` varchar(32) NOT NULL DEFAULT 'pronto'"
          );
        }
      } finally {
        connection.release();
      }
    })().catch((error) => {
      studentSessionSchemaPromise = null;
      throw error;
    });
  }

  await studentSessionSchemaPromise;
}

export interface StudentData {
  id: number;
  numerica: string;
  nomeGuerra: string;
  companhia: number;
  peloton: number;
  sessionToken?: string;
  createdAt: Date;
  updatedAt: Date;
  fotoUrl?: string;
  nomeCompleto?: string;
  rg?: string;
  email?: string;
  condition?: string;
}

export async function createStudent(
  numerica: string,
  nomeGuerra: string,
  senha: string,
  companhia: number,
  peloton: number
): Promise<StudentData | null> {
  const pool = await getPool();
  await ensureStudentSessionSchema();
  const connection = await pool.getConnection();

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    const sessionToken = nanoid(64);

    const query = `
      INSERT INTO pmam_students (numerica, nome_guerra, senha, session_token, companhia, peloton)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      numerica,
      nomeGuerra,
      hashedPassword,
      sessionToken,
      companhia,
      peloton,
    ]);

    const insertResult = result as any;
    if (insertResult.insertId) {
      const student = await getStudentById(insertResult.insertId);
      return student ? { ...student, sessionToken } : null;
    }

    return null;
  } finally {
    connection.release();
  }
}

export async function getStudentByNumerica(
  numerica: string
): Promise<StudentData | null> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    const query = `
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, \`condition\`, created_at as createdAt, updated_at as updatedAt
      FROM pmam_students
      WHERE numerica = ?
      LIMIT 1
    `;

    const [rows] = await connection.execute(query, [numerica]);
    const students = rows as any[];

    return students[0] || null;
  } finally {
    connection.release();
  }
}

export async function verifyStudentPassword(
  numerica: string,
  senha: string
): Promise<boolean> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    const query = `
      SELECT senha
      FROM pmam_students
      WHERE numerica = ?
      LIMIT 1
    `;

    const [rows] = await connection.execute(query, [numerica]);
    const students = rows as any[];

    if (!students[0]) {
      return false;
    }

    return bcrypt.compare(senha, students[0].senha);
  } finally {
    connection.release();
  }
}

export async function studentExists(numerica: string): Promise<boolean> {
  const student = await getStudentByNumerica(numerica);
  return !!student;
}

export async function getStudentById(id: number): Promise<StudentData | null> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    const query = `
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, \`condition\`, created_at as createdAt, updated_at as updatedAt
      FROM pmam_students
      WHERE id = ?
      LIMIT 1
    `;

    const [rows] = await connection.execute(query, [id]);
    const students = rows as any[];

    return students[0] || null;
  } finally {
    connection.release();
  }
}

export async function getAllStudents(): Promise<StudentData[]> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    const query = `
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, \`condition\`, created_at as createdAt, updated_at as updatedAt
      FROM pmam_students
      ORDER BY numerica ASC
    `;

    const [rows] = await connection.execute(query);
    return (rows as any[]) || [];
  } finally {
    connection.release();
  }
}

export async function rotateStudentSessionToken(id: number): Promise<string> {
  const pool = await getPool();
  await ensureStudentSessionSchema();
  const connection = await pool.getConnection();

  try {
    const sessionToken = nanoid(64);
    await connection.execute(
      "UPDATE pmam_students SET session_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [sessionToken, id]
    );
    return sessionToken;
  } finally {
    connection.release();
  }
}

export async function verifyStudentSession(id: number, sessionToken: string): Promise<boolean> {
  if (!id || !sessionToken) return false;

  const pool = await getPool();
  await ensureStudentSessionSchema();
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.execute(
      "SELECT id FROM pmam_students WHERE id = ? AND session_token = ? LIMIT 1",
      [id, sessionToken]
    );
    return (rows as any[]).length > 0;
  } finally {
    connection.release();
  }
}

export async function updateStudentPassword(id: number, senha: string): Promise<void> {
  const pool = await getPool();
  await ensureStudentSessionSchema();
  const connection = await pool.getConnection();

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    await connection.execute(
      "UPDATE pmam_students SET senha = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedPassword, id]
    );
  } finally {
    connection.release();
  }
}

export async function updateStudentProfile(
  id: number,
  data: {
    nomeGuerra?: string;
    nomeCompleto?: string | null;
    rg?: string | null;
    email?: string | null;
    fotoUrl?: string | null;
    senha?: string;
  }
): Promise<void> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.nomeGuerra !== undefined) {
      updates.push("nome_guerra = ?");
      params.push(data.nomeGuerra);
    }
    if (data.nomeCompleto !== undefined) {
      updates.push("nome_completo = ?");
      params.push(data.nomeCompleto);
    }
    if (data.rg !== undefined) {
      updates.push("rg = ?");
      params.push(data.rg);
    }
    if (data.email !== undefined) {
      updates.push("email = ?");
      params.push(data.email);
    }
    if (data.fotoUrl !== undefined) {
      updates.push("foto_url = ?");
      params.push(data.fotoUrl);
    }
    if (data.senha !== undefined && data.senha !== "") {
      const hashedPassword = await bcrypt.hash(data.senha, 10);
      updates.push("senha = ?");
      params.push(hashedPassword);
    }

    if (updates.length === 0) return;

    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    const query = `
      UPDATE pmam_students 
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    await connection.execute(query, params);
  } finally {
    connection.release();
  }
}

export async function deleteStudent(id: number): Promise<void> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM pmam_student_grades WHERE student_id = ?", [id]);
    await connection.execute("DELETE FROM pmam_students WHERE id = ?", [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateStudentCondition(id: number, condition: string): Promise<void> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.execute(
      "UPDATE pmam_students SET `condition` = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [condition, id]
    );
  } finally {
    connection.release();
  }
}
