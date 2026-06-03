import mysql from "mysql2/promise";
import * as bcrypt from "bcryptjs";
import { ENV } from "./_core/env";

let connectionPool: mysql.Pool | null = null;

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
      ssl: {} as any,
    });
  }
  return connectionPool;
}

export interface StudentData {
  id: number;
  numerica: string;
  nomeGuerra: string;
  companhia: number;
  peloton: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function createStudent(
  numerica: string,
  nomeGuerra: string,
  senha: string,
  companhia: number,
  peloton: number
): Promise<StudentData | null> {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO pmam_students (numerica, nome_guerra, senha, companhia, peloton)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      numerica,
      nomeGuerra,
      hashedPassword,
      companhia,
      peloton,
    ]);

    const insertResult = result as any;
    if (insertResult.insertId) {
      return getStudentById(insertResult.insertId);
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
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, created_at as createdAt, updated_at as updatedAt
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
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, created_at as createdAt, updated_at as updatedAt
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
      SELECT id, numerica, nome_guerra as nomeGuerra, companhia, peloton, created_at as createdAt, updated_at as updatedAt
      FROM pmam_students
      ORDER BY numerica ASC
    `;

    const [rows] = await connection.execute(query);
    return (rows as any[]) || [];
  } finally {
    connection.release();
  }
}
