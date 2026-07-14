import { query as dbQuery } from "./mysql";
import * as bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { ENV } from "./_core/env";


let studentSessionSchemaPromise: Promise<void> | null = null;
async function ensureStudentSessionSchema() {
  if (!studentSessionSchemaPromise) {
    studentSessionSchemaPromise = (async () => {
      

      try {
        const rows = await dbQuery(
          "SHOW COLUMNS FROM pmam_students LIKE 'session_token'"
        );

        if ((rows as any[]).length === 0) {
          await dbQuery(
            "ALTER TABLE pmam_students ADD COLUMN session_token varchar(128)"
          );
        }

        const conditionRows = await dbQuery(
          "SHOW COLUMNS FROM pmam_students LIKE 'condition'"
        );

        if ((conditionRows as any[]).length === 0) {
          await dbQuery(
            "ALTER TABLE pmam_students ADD COLUMN `condition` varchar(32) NOT NULL DEFAULT 'pronto'"
          );
        }

        const deskRows = await dbQuery(
          "SHOW COLUMNS FROM pmam_students LIKE 'desk_number'"
        );

        if ((deskRows as any[]).length === 0) {
          await dbQuery(
            "ALTER TABLE pmam_students ADD COLUMN desk_number INT NULL"
          );
          await dbQuery(
            "UPDATE pmam_students SET desk_number = CAST(numerica AS SIGNED) WHERE desk_number IS NULL AND numerica REGEXP '^[0-9]+$'"
          );
        }

        const studentColumns = await dbQuery("SHOW COLUMNS FROM pmam_students");
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
            await dbQuery(column.ddl);
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
            await dbQuery(ddl);
          } catch (error) {
            console.warn("[StudentDB] Could not widen profile column:", ddl, error);
          }
        }
      } finally {
        
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
  
  await ensureStudentSessionSchema();
  

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    const sessionToken = nanoid(64);

    const defaultDesk = parseInt(numerica, 10);
    const deskVal = isNaN(defaultDesk) ? null : defaultDesk;

    const query = `
      INSERT INTO pmam_students (numerica, nome_guerra, senha, session_token, companhia, peloton, desk_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await dbQuery(query, [
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
    
  }
}

export async function getStudentByNumerica(
  numerica: string
): Promise<StudentData | null> {
  
  await ensureStudentSessionSchema();
  

  try {
    const query = `
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, session_token as sessionToken, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, cpf, phone, address, birth_date as birthDate, blood_type as bloodType, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, \`condition\`, desk_number as deskNumber, created_at as createdAt, updated_at as updatedAt
      FROM pmam_students
      WHERE numerica = ?
      LIMIT 1
    `;

    const rows = await dbQuery(query, [numerica]);
    const students = rows as any[];

    return students[0] || null;
  } finally {
    
  }
}

export async function verifyStudentPassword(
  numerica: string,
  senha: string
): Promise<boolean> {
  

  try {
    const query = `
      SELECT senha
      FROM pmam_students
      WHERE numerica = ?
      LIMIT 1
    `;

    const rows = await dbQuery(query, [numerica]);
    const students = rows as any[];

    if (!students[0]) {
      return false;
    }

    const dbSenha = students[0].senha;
    const isBcrypt = dbSenha.startsWith("$2a$") || dbSenha.startsWith("$2b$") || dbSenha.startsWith("$2y$");

    if (!isBcrypt) {
      return senha === dbSenha;
    }

    return bcrypt.compare(senha, dbSenha);
  } finally {
    
  }
}

export async function studentExists(numerica: string): Promise<boolean> {
  const student = await getStudentByNumerica(numerica);
  return !!student;
}

export async function getStudentById(id: number): Promise<StudentData | null> {
  
  await ensureStudentSessionSchema();
  

  try {
    const query = `
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, session_token as sessionToken, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, cpf, phone, address, birth_date as birthDate, blood_type as bloodType, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, \`condition\`, desk_number as deskNumber, created_at as createdAt, updated_at as updatedAt
      FROM pmam_students
      WHERE id = ?
      LIMIT 1
    `;

    const rows = await dbQuery(query, [id]);
    const students = rows as any[];

    return students[0] || null;
  } finally {
    
  }
}

export async function getAllStudents(): Promise<StudentData[]> {
  
  await ensureStudentSessionSchema();
  

  try {
    const query = `
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, session_token as sessionToken, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, cpf, phone, address, birth_date as birthDate, blood_type as bloodType, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, \`condition\`, desk_number as deskNumber, created_at as createdAt, updated_at as updatedAt
      FROM pmam_students
      ORDER BY numerica ASC
    `;

    const rows = await dbQuery(query);
    return (rows as any[]) || [];
  } finally {
    
  }
}

export async function updateStudentDeskNumber(studentId: number, deskNumber: number | null): Promise<void> {
  

  try {
    await dbQuery(
      "UPDATE pmam_students SET desk_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [deskNumber, studentId]
    );
  } finally {
    
  }
}

export async function updateStudentRosterData(
  id: number,
  data: {
    numerica?: string;
    nomeGuerra?: string;
    nomeCompleto?: string | null;
    companhia?: number;
    peloton?: number;
    deskNumber?: number | null;
  }
): Promise<void> {
  

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
    if (data.nomeCompleto !== undefined) {
      updates.push("nome_completo = ?");
      params.push(data.nomeCompleto);
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
    await dbQuery(
      `UPDATE pmam_students SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    // Sync name to pmam_users if they have a mirrored account and nomeGuerra changed
    if (data.nomeGuerra !== undefined) {
      const userSyncQuery = `
        UPDATE pmam_users
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ?
      `;
      await dbQuery(userSyncQuery, [data.nomeGuerra, id]);
    }
  } finally {
    
  }
}

export async function clearStudentDesk(companhia: number, peloton: number, deskNumber: number): Promise<void> {
  

  try {
    await dbQuery(
      "UPDATE pmam_students SET desk_number = NULL, updated_at = CURRENT_TIMESTAMP WHERE companhia = ? AND peloton = ? AND desk_number = ?",
      [companhia, peloton, deskNumber]
    );
  } finally {
    
  }
}

export async function rotateStudentSessionToken(id: number): Promise<string> {
  
  await ensureStudentSessionSchema();
  

  try {
    const sessionToken = nanoid(64);
    await dbQuery(
      "UPDATE pmam_students SET session_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [sessionToken, id]
    );
    return sessionToken;
  } finally {
    
  }
}

export async function verifyStudentSession(id: number, sessionToken: string): Promise<boolean> {
  if (!id || !sessionToken) return false;

  
  await ensureStudentSessionSchema();
  

  try {
    const rows = await dbQuery(
      "SELECT id FROM pmam_students WHERE id = ? AND session_token = ? LIMIT 1",
      [id, sessionToken]
    );
    return (rows as any[]).length > 0;
  } finally {
    
  }
}

export async function updateStudentPassword(id: number, senha: string): Promise<void> {
  
  await ensureStudentSessionSchema();
  

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    await dbQuery(
      "UPDATE pmam_students SET senha = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedPassword, id]
    );
  } finally {
    
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

    await dbQuery(query, params);

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
      await dbQuery(userSyncQuery, userParams);
    }
  } finally {
    
  }
}

export async function deleteStudent(id: number): Promise<void> {
  

  try {
    await dbQuery("BEGIN");
    await dbQuery("DELETE FROM pmam_student_grades WHERE student_id = ?", [id]);
    for (const table of [
      "pmam_student_observations",
      "pmam_seat_change_requests",
      "pmam_notice_reads",
      "pmam_peculio_student_statuses",
    ]) {
      try {
        await dbQuery(`DELETE FROM ${table} WHERE student_id = ?`, [id]);
      } catch (error: any) {
        if (error?.code !== "ER_NO_SUCH_TABLE") throw error;
      }
    }
    await dbQuery("DELETE FROM pmam_students WHERE id = ?", [id]);
    await dbQuery("COMMIT");
  } catch (error) {
    await dbQuery("ROLLBACK");
    throw error;
  } finally {
    
  }
}

export async function updateStudentCondition(id: number, condition: string): Promise<void> {
  

  try {
    await dbQuery(
      "UPDATE pmam_students SET `condition` = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [condition, id]
    );
  } finally {
    
  }
}

export async function getStudentByRg(
  rg: string
): Promise<StudentData | null> {
  
  await ensureStudentSessionSchema();
  

  try {
    const query = `
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, session_token as sessionToken, foto_url as fotoUrl, nome_completo as nomeCompleto, rg, email, cpf, phone, address, birth_date as birthDate, blood_type as bloodType, emergency_contact as emergencyContact, emergency_phone as emergencyPhone, \`condition\`, desk_number as deskNumber, created_at as createdAt, updated_at as updatedAt
      FROM pmam_students
      WHERE REPLACE(REPLACE(rg, '.', ''), '-', '') = REPLACE(REPLACE(?, '.', ''), '-', '')
      LIMIT 1
    `;

    const rows = await dbQuery(query, [rg]);
    const students = rows as any[];

    return students[0] || null;
  } finally {
    
  }
}
