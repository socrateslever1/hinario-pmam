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

        const [deskRows] = await connection.execute(
          "SHOW COLUMNS FROM pmam_students LIKE 'desk_number'"
        );

        if ((deskRows as any[]).length === 0) {
          await connection.execute(
            "ALTER TABLE pmam_students ADD COLUMN desk_number INT NULL"
          );
          await connection.execute(
            "UPDATE pmam_students SET desk_number = CAST(numerica AS SIGNED) WHERE desk_number IS NULL AND numerica REGEXP '^[0-9]+$'"
          );
        }

        const [studentColumns] = await connection.execute("SHOW COLUMNS FROM pmam_students");
        const columns = studentColumns as any[];
        const hasColumn = (name: string) => columns.some((col) => col.Field === name);

        const profileColumns: Array<{ name: string; ddl: string }> = [
          { name: "cpf", ddl: "ALTER TABLE pmam_students ADD COLUMN cpf VARCHAR(32) NULL" },
          { name: "phone", ddl: "ALTER TABLE pmam_students ADD COLUMN phone VARCHAR(64) NULL" },
          { name: "address", ddl: "ALTER TABLE pmam_students ADD COLUMN address LONGTEXT NULL" },
          { name: "birth_date", ddl: "ALTER TABLE pmam_students ADD COLUMN birth_date VARCHAR(16) NULL" },
          { name: "blood_type", ddl: "ALTER TABLE pmam_students ADD COLUMN blood_type VARCHAR(16) NULL" },
          { name: "emergency_contact", ddl: "ALTER TABLE pmam_students ADD COLUMN emergency_contact VARCHAR(255) NULL" },
          { name: "emergency_phone", ddl: "ALTER TABLE pmam_students ADD COLUMN emergency_phone VARCHAR(64) NULL" },
        ];

        for (const column of profileColumns) {
          if (!hasColumn(column.name)) {
            await connection.execute(column.ddl);
          }
        }

        const profileTypeFixes = [
          "ALTER TABLE pmam_students MODIFY COLUMN foto_url LONGTEXT NULL",
          "ALTER TABLE pmam_students MODIFY COLUMN nome_completo VARCHAR(512) NULL",
          "ALTER TABLE pmam_students MODIFY COLUMN rg VARCHAR(64) NULL",
          "ALTER TABLE pmam_students MODIFY COLUMN email VARCHAR(255) NULL",
          "ALTER TABLE pmam_students MODIFY COLUMN address LONGTEXT NULL",
        ];

        for (const ddl of profileTypeFixes) {
          try {
            await connection.execute(ddl);
          } catch (error) {
            console.warn("[StudentDB] Could not widen profile column:", ddl, error);
          }
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
  cpf?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  bloodType?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  condition?: string;
  deskNumber?: number | null;
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

    const defaultDesk = parseInt(numerica, 10);
    const deskVal = isNaN(defaultDesk) ? null : defaultDesk;

    const query = `
      INSERT INTO pmam_students (numerica, nome_guerra, senha, session_token, companhia, peloton, desk_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      numerica,
      nomeGuerra,
      hashedPassword,
      sessionToken,
      companhia,
      peloton,
      deskVal,
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
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, cpf, phone, address, birth_date as birthDate, blood_type as bloodType, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, \`condition\`, desk_number as deskNumber, created_at as createdAt, updated_at as updatedAt
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
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, cpf, phone, address, birth_date as birthDate, blood_type as bloodType, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, \`condition\`, desk_number as deskNumber, created_at as createdAt, updated_at as updatedAt
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
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, cpf, phone, address, birth_date as birthDate, blood_type as bloodType, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, \`condition\`, desk_number as deskNumber, created_at as createdAt, updated_at as updatedAt
      FROM pmam_students
      ORDER BY numerica ASC
    `;

    const [rows] = await connection.execute(query);
    return (rows as any[]) || [];
  } finally {
    connection.release();
  }
}

export async function updateStudentDeskNumber(studentId: number, deskNumber: number | null): Promise<void> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.execute(
      "UPDATE pmam_students SET desk_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [deskNumber, studentId]
    );
  } finally {
    connection.release();
  }
}

export async function updateStudentRosterData(
  id: number,
  data: {
    numerica?: string;
    nomeGuerra?: string;
    companhia?: number;
    peloton?: number;
    deskNumber?: number | null;
  }
): Promise<void> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    const updates: string[] = [];
    const params: any[] = [];
    if (data.numerica !== undefined) {
      updates.push("numerica = ?");
      params.push(data.numerica);
    }
    if (data.nomeGuerra !== undefined) {
      updates.push("nome_guerra = ?");
      params.push(data.nomeGuerra);
    }
    if (data.companhia !== undefined) {
      updates.push("companhia = ?");
      params.push(data.companhia);
    }
    if (data.peloton !== undefined) {
      updates.push("peloton = ?");
      params.push(data.peloton);
    }
    if (data.deskNumber !== undefined) {
      updates.push("desk_number = ?");
      params.push(data.deskNumber);
    }
    if (!updates.length) return;

    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);
    await connection.execute(
      `UPDATE pmam_students SET ${updates.join(", ")} WHERE id = ?`,
      params
    );
  } finally {
    connection.release();
  }
}

export async function clearStudentDesk(companhia: number, peloton: number, deskNumber: number): Promise<void> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.execute(
      "UPDATE pmam_students SET desk_number = NULL, updated_at = CURRENT_TIMESTAMP WHERE companhia = ? AND peloton = ? AND desk_number = ?",
      [companhia, peloton, deskNumber]
    );
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
    cpf?: string | null;
    phone?: string | null;
    address?: string | null;
    birthDate?: string | null;
    bloodType?: string | null;
    emergencyContact?: string | null;
    emergencyPhone?: string | null;
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
    if (data.cpf !== undefined) {
      updates.push("cpf = ?");
      params.push(data.cpf);
    }
    if (data.phone !== undefined) {
      updates.push("phone = ?");
      params.push(data.phone);
    }
    if (data.address !== undefined) {
      updates.push("address = ?");
      params.push(data.address);
    }
    if (data.birthDate !== undefined) {
      updates.push("birth_date = ?");
      params.push(data.birthDate);
    }
    if (data.bloodType !== undefined) {
      updates.push("blood_type = ?");
      params.push(data.bloodType);
    }
    if (data.emergencyContact !== undefined) {
      updates.push("emergency_contact = ?");
      params.push(data.emergencyContact);
    }
    if (data.emergencyPhone !== undefined) {
      updates.push("emergency_phone = ?");
      params.push(data.emergencyPhone);
    }
    let syncedPasswordHash: string | undefined;
    if (data.fotoUrl !== undefined) {
      updates.push("foto_url = ?");
      params.push(data.fotoUrl);
    }
    if (data.senha !== undefined && data.senha !== "") {
      const hashedPassword = await bcrypt.hash(data.senha, 10);
      updates.push("senha = ?");
      params.push(hashedPassword);
      syncedPasswordHash = hashedPassword;
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

    // Sync to pmam_users if they have a mirrored account
    const userUpdates: string[] = [];
    const userParams: any[] = [];
    if (data.nomeGuerra !== undefined) {
      userUpdates.push("name = ?");
      userParams.push(data.nomeGuerra);
    }
    if (data.fotoUrl !== undefined) {
      userUpdates.push("foto_url = ?");
      userParams.push(data.fotoUrl);
    }
    if (syncedPasswordHash !== undefined) {
      userUpdates.push("password = ?");
      userParams.push(syncedPasswordHash);
    }

    if (userUpdates.length > 0) {
      userUpdates.push("updated_at = CURRENT_TIMESTAMP");
      userParams.push(id);
      const userSyncQuery = `
        UPDATE pmam_users
        SET ${userUpdates.join(", ")}
        WHERE student_id = ?
      `;
      await connection.execute(userSyncQuery, userParams);
    }
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
