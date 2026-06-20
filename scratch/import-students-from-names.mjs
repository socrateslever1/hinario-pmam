import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

dotenv.config();

const shouldWrite = process.argv.includes("--write");
const inputPath = process.argv
  .slice(2)
  .find((arg) => !arg.startsWith("--")) || "C:\\Users\\LEVER\\Desktop\\Nomes_260619_204939.txt";

function parseDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 4000),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace("/", ""),
    };
  } catch {
    return null;
  }
}

function dbConfig() {
  const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL || "");
  return {
    host: process.env.TIDB_HOST || fromUrl?.host,
    port: Number(process.env.TIDB_PORT || fromUrl?.port || 4000),
    user: process.env.TIDB_USER || fromUrl?.user,
    password: process.env.TIDB_PASSWORD || fromUrl?.password,
    database: process.env.TIDB_DATABASE || fromUrl?.database,
  };
}

function titleFromFullName(fullName) {
  return fullName
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b([a-zà-ú])/gi, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

function parseStudents(text) {
  const students = [];
  let companhia = null;
  let peloton = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const header = line.match(/^(\d+)a\s+cia\s+(\d+)o\s+pel$/i);
    if (header) {
      companhia = Number(header[1]);
      peloton = Number(header[2]);
      continue;
    }

    const entry = line.match(/^(\d{4})\s+[–-]\s+(.+)$/);
    if (!entry || !companhia || !peloton) continue;

    const numerica = entry[1];
    const nomeCompleto = titleFromFullName(entry[2]);
    const parts = nomeCompleto.trim().split(/\s+/);
    const nomeGuerra = parts.length > 1 ? parts[parts.length - 1] : nomeCompleto;
    students.push({
      numerica,
      nomeGuerra,
      nomeCompleto,
      companhia,
      peloton,
      deskNumber: Number(numerica),
    });
  }

  return students;
}

function findDuplicateNumericas(students) {
  const seen = new Set();
  const duplicates = new Set();
  for (const student of students) {
    if (seen.has(student.numerica)) duplicates.add(student.numerica);
    seen.add(student.numerica);
  }
  return [...duplicates].sort();
}

async function columnExists(connection, table, column) {
  const [rows] = await connection.execute(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
  return rows.length > 0;
}

async function main() {
  const absolutePath = path.resolve(inputPath);
  const text = fs.readFileSync(absolutePath, "utf8");
  const students = parseStudents(text);
  const duplicates = findDuplicateNumericas(students);
  const uniqueStudents = [...new Map(students.map((student) => [student.numerica, student])).values()];

  console.log(`Arquivo: ${absolutePath}`);
  console.log(`Registros lidos: ${students.length}`);
  console.log(`Numéricas únicas: ${uniqueStudents.length}`);
  if (duplicates.length) {
    console.log(`Numéricas duplicadas ignoradas no import: ${duplicates.join(", ")}`);
  }

  const byScope = new Map();
  for (const student of uniqueStudents) {
    const key = `${student.companhia}ª Cia / ${student.peloton}º Pel`;
    byScope.set(key, (byScope.get(key) || 0) + 1);
  }
  for (const [scope, count] of [...byScope.entries()].sort()) {
    console.log(`${scope}: ${count}`);
  }

  if (!shouldWrite) {
    console.log("Dry-run concluído. Use --write para gravar no banco.");
    return;
  }

  const cfg = dbConfig();
  if (!cfg.host || !cfg.user || !cfg.password || !cfg.database) {
    throw new Error("Configuração TiDB ausente. Verifique .env/DATABASE_URL.");
  }

  const connection = await mysql.createConnection({
    ...cfg,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await connection.beginTransaction();

    const hasNomeCompleto = await columnExists(connection, "pmam_students", "nome_completo");
    const hasDeskNumber = await columnExists(connection, "pmam_students", "desk_number");
    const hasCondition = await columnExists(connection, "pmam_students", "condition");

    let inserted = 0;
    let updated = 0;

    const [existingRows] = await connection.execute(
      `SELECT numerica, senha FROM pmam_students WHERE numerica IN (${uniqueStudents.map(() => "?").join(", ")})`,
      uniqueStudents.map((student) => student.numerica),
    );
    const existingPasswords = new Map(existingRows.map((row) => [row.numerica, row.senha]));

    for (const student of uniqueStudents) {
      const existingPassword = existingPasswords.get(student.numerica);
      const senha = existingPassword || await bcrypt.hash(student.numerica, 10);
      const columns = ["numerica", "nome_guerra", "senha", "companhia", "peloton"];
      const values = [student.numerica, student.nomeGuerra, senha, student.companhia, student.peloton];
      const updates = [
        "nome_guerra = VALUES(nome_guerra)",
        "companhia = VALUES(companhia)",
        "peloton = VALUES(peloton)",
        "updated_at = CURRENT_TIMESTAMP",
      ];

      if (hasNomeCompleto) {
        columns.push("nome_completo");
        values.push(student.nomeCompleto);
        updates.push("nome_completo = VALUES(nome_completo)");
      }

      if (hasDeskNumber) {
        columns.push("desk_number");
        values.push(student.deskNumber);
        updates.push("desk_number = VALUES(desk_number)");
      }

      if (hasCondition) {
        columns.push("`condition`");
        values.push("pronto");
      }

      const placeholders = columns.map(() => "?").join(", ");
      const [result] = await connection.execute(
        `INSERT INTO pmam_students (${columns.join(", ")})
         VALUES (${placeholders})
         ON DUPLICATE KEY UPDATE ${updates.join(", ")}`,
        values,
      );

      if (result.affectedRows === 1) inserted += 1;
      else updated += 1;
    }

    await connection.commit();
    console.log(`Importação concluída. Inseridos: ${inserted}. Atualizados: ${updated}.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
