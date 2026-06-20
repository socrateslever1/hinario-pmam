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
    // 1. Group students by Cia and Peloton
    const [groups] = await connection.execute(
      "SELECT companhia, peloton, COUNT(*) as cnt FROM pmam_students GROUP BY companhia, peloton"
    );
    console.log("=== DISTRIBUIÇÃO DOS ALUNOS POR COMPANHIA E PELOTÃO ===");
    for (const g of groups) {
      console.log(`Cia: ${g.companhia} | Pel: ${g.peloton} | Quantidade: ${g.cnt}`);
    }

    // 2. Select students that do not match the valid Cia (1-5) and Peloton (1-2) or have "Teste" in their name
    const [weirdStudents] = await connection.execute(
      "SELECT id, numerica, nome_guerra, nome_completo, companhia, peloton FROM pmam_students WHERE companhia NOT IN (1,2,3,4,5) OR peloton NOT IN (1,2) OR nome_guerra LIKE '%Teste%' OR nome_guerra LIKE '%Soldado%'"
    );
    console.log(`\n=== ALUNOS ESTRANHOS/TESTE DETECTADOS: ${weirdStudents.length} ===`);
    for (const s of weirdStudents) {
      console.log(`ID: ${s.id} | Num: ${s.numerica} | Guerra: ${s.nome_guerra} | Completo: ${s.nome_completo} | Cia: ${s.companhia} | Pel: ${s.peloton}`);
    }

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
