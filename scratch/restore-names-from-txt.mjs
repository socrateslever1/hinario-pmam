import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const inputPath = "C:\\Users\\LEVER\\Desktop\\Nomes_260619_204939.txt";
const shouldApply = process.argv.includes("--apply");

function parseDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 4000),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ""),
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

function normalizeSourceName(value) {
  // The source file already has the authoritative spelling and capitalization.
  // NFC only unifies composed accents; it does not alter names or particles.
  return value.trim().replace(/\s+/g, " ").normalize("NFC");
}

function parseStudents(text) {
  const students = [];
  const seen = new Set();
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

    const entry = line.match(/^(\d{4})\s+[\u2013-]\s+(.+)$/u);
    if (!entry || !companhia || !peloton) continue;

    const numerica = entry[1];
    if (seen.has(numerica)) {
      throw new Error(`Numérica duplicada no arquivo: ${numerica}`);
    }
    seen.add(numerica);

    students.push({
      numerica,
      nomeCompleto: normalizeSourceName(entry[2]),
      companhia,
      peloton,
    });
  }

  return students;
}

async function main() {
  const absolutePath = path.resolve(inputPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo de origem não encontrado: ${absolutePath}`);
  }

  const students = parseStudents(fs.readFileSync(absolutePath, "utf8"));
  if (students.length !== 492) {
    throw new Error(`Esperados 492 alunos no arquivo, encontrados ${students.length}.`);
  }

  const cfg = dbConfig();
  if (!cfg.host || !cfg.user || !cfg.password || !cfg.database) {
    throw new Error("Configuração do banco ausente. Verifique o arquivo .env.");
  }

  const connection = await mysql.createConnection({
    ...cfg,
    ssl: { rejectUnauthorized: true },
    connectTimeout: 15000,
  });

  try {
    const [currentRows] = await connection.execute(
      "SELECT id, numerica, nome_guerra, nome_completo FROM pmam_students"
    );
    const currentByNumerica = new Map(currentRows.map(row => [String(row.numerica), row]));
    const missing = students.filter(student => !currentByNumerica.has(student.numerica));
    const changes = students.flatMap(student => {
      const current = currentByNumerica.get(student.numerica);
      if (!current) return [];
      if (
        current.nome_guerra === student.nomeCompleto &&
        current.nome_completo === student.nomeCompleto
      ) {
        return [];
      }
      return [{ student, current }];
    });

    console.log(`Fonte validada: ${students.length} alunos.`);
    console.log(`Encontrados na base: ${students.length - missing.length}.`);
    console.log(`Nomes que precisam de correção: ${changes.length}.`);
    if (missing.length) {
      console.log(`Numéricas ausentes na base: ${missing.map(item => item.numerica).join(", ")}`);
    }

    for (const { student, current } of changes.slice(0, 20)) {
      console.log(
        `${student.numerica}: "${current.nome_guerra}" / "${current.nome_completo ?? ""}" -> "${student.nomeCompleto}"`
      );
    }
    if (changes.length > 20) {
      console.log(`... e mais ${changes.length - 20} correções.`);
    }

    if (!shouldApply) {
      console.log("Simulação concluída. Use --apply para gravar as correções.");
      return;
    }

    const backupPath = path.join(
      process.env.TEMP || "C:\\tmp",
      `pmam-student-names-before-restore-${Date.now()}.json`
    );
    fs.writeFileSync(backupPath, JSON.stringify(currentRows, null, 2), "utf8");
    console.log(`Cópia dos nomes atuais criada em: ${backupPath}`);

    await connection.beginTransaction();
    try {
      const batchSize = 100;
      for (let offset = 0; offset < changes.length; offset += batchSize) {
        const batch = changes.slice(offset, offset + batchSize);
        const cases = batch.map(() => "WHEN ? THEN ?").join(" ");
        const numericas = batch.map(({ student }) => student.numerica);
        const caseParams = batch.flatMap(({ student }) => [student.numerica, student.nomeCompleto]);
        const wherePlaceholders = batch.map(() => "?").join(", ");

        await connection.execute(
          `UPDATE pmam_students
             SET nome_guerra = CASE numerica ${cases} ELSE nome_guerra END,
                 nome_completo = CASE numerica ${cases} ELSE nome_completo END,
                 updated_at = CURRENT_TIMESTAMP
           WHERE numerica IN (${wherePlaceholders})`,
          [...caseParams, ...caseParams, ...numericas]
        );
        console.log(`Lote ${Math.floor(offset / batchSize) + 1}: ${batch.length} alunos atualizados.`);
      }

      await connection.execute(`
        UPDATE pmam_users u
        INNER JOIN pmam_students s ON s.id = u.student_id
        SET u.name = s.nome_guerra, u.updated_at = CURRENT_TIMESTAMP
        WHERE u.name <> s.nome_guerra OR u.name IS NULL
      `);
      await connection.execute(`
        UPDATE pmam_users u
        INNER JOIN pmam_students s ON u.email = CONCAT(s.numerica, '@pmam.com')
        SET u.name = s.nome_guerra, u.student_id = COALESCE(u.student_id, s.id), u.updated_at = CURRENT_TIMESTAMP
        WHERE u.name <> s.nome_guerra OR u.name IS NULL OR u.student_id IS NULL
      `);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    console.log(`Correção concluída: ${changes.length} registros atualizados.`);
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
