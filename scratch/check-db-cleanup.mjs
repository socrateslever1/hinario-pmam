import fs from "node:fs";
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
    // 1. List all tables and counts
    const [tables] = await connection.execute("SHOW TABLES");
    const dbName = cfg.database;
    const tableKey = `Tables_in_${dbName}`;

    console.log("=== TABELAS NO BANCO DE DADOS ===");
    for (const tRow of tables) {
      const tableName = tRow[tableKey] || Object.values(tRow)[0];
      const [countRow] = await connection.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
      console.log(`Tabela: ${tableName} | Registros: ${countRow[0].cnt}`);
    }

    // 2. Check for "Soldado Teste" or mock entries in pmam_students
    const [testStudents] = await connection.execute(
      "SELECT id, numerica, nome_guerra, nome_completo, companhia, peloton FROM pmam_students WHERE nome_guerra LIKE '%Teste%'"
    );
    console.log(`\n=== ALUNOS DE TESTE DETECTADOS (nome contendo 'Teste'): ${testStudents.length} ===`);
    testStudents.forEach(s => {
      console.log(`ID: ${s.id} | Num: ${s.numerica} | Guerra: ${s.nome_guerra} | Completo: ${s.nome_completo} | Cia: ${s.companhia} | Pel: ${s.peloton}`);
    });

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
