import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const inputPath = "C:\\Users\\LEVER\\Desktop\\Nomes_260619_204939.txt";

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
    });
  }

  return students;
}

async function main() {
  const absolutePath = path.resolve(inputPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo de origem não encontrado em: ${absolutePath}`);
  }

  console.log(`Lendo arquivo: ${absolutePath}`);
  const text = fs.readFileSync(absolutePath, "utf8");
  const students = parseStudents(text);

  console.log(`Registros parseados no arquivo: ${students.length}`);

  const cfg = dbConfig();
  console.log(`Conectando ao banco de dados: ${cfg.database} em ${cfg.host}...`);
  const connection = await mysql.createConnection({
    ...cfg,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await connection.beginTransaction();
    let updatedCount = 0;

    for (const student of students) {
      // 1. Atualizar o nome_completo e nome_guerra na tabela pmam_students
      const [result] = await connection.execute(
        "UPDATE pmam_students SET nome_completo = ?, nome_guerra = ? WHERE numerica = ?",
        [student.nomeCompleto, student.nomeGuerra, student.numerica]
      );

      if (result.affectedRows > 0) {
        // 2. Atualizar o name correspondente na tabela pmam_users
        await connection.execute(
          "UPDATE pmam_users SET name = ? WHERE email = ?",
          [student.nomeGuerra, `${student.numerica}@pmam.com`]
        );
        updatedCount++;
      }
    }

    await connection.commit();
    console.log(`\nSucesso! Nome completo restaurado e nome de guerra corrigido para ${updatedCount} alunos.`);

  } catch (error) {
    await connection.rollback();
    console.error("Erro na transação:", error);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
