import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

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

async function main() {
  const cfg = dbConfig();
  const connection = await mysql.createConnection({
    ...cfg,
    ssl: { rejectUnauthorized: true },
  });

  try {
    const [rows] = await connection.execute(
      "SELECT id, numerica, nome_guerra, nome_completo, companhia, peloton FROM pmam_students ORDER BY id DESC LIMIT 100"
    );
    console.log("=== ÚLTIMOS 100 ALUNOS INSERIDOS ===");
    for (const r of rows) {
      console.log(`ID: ${r.id} | Num: ${r.numerica} | Guerra: ${r.nome_guerra} | Completo: ${r.nome_completo} | Cia: ${r.companhia} | Pel: ${r.peloton}`);
    }
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
