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
  console.log(`Conectando ao banco de dados: ${cfg.database} em ${cfg.host}...`);
  const connection = await mysql.createConnection({
    ...cfg,
    ssl: { rejectUnauthorized: true },
  });

  try {
    // 1. Excluir tabelas legadas
    const legacyTables = ['cfap_missions', 'comments', 'hymns', 'likes', 'site_settings', 'users'];
    console.log("\n=== EXCLUINDO TABELAS LEGADAS ===");
    for (const table of legacyTables) {
      console.log(`Excluindo tabela se existir: ${table}...`);
      await connection.execute(`DROP TABLE IF EXISTS \`${table}\``);
    }
    console.log("Operação de exclusão de tabelas concluída.");

    // 2. Excluir aluno de teste "Teste" ID 600001
    console.log("\n=== REMOVENDO ALUNO DE TESTE ===");
    const [result] = await connection.execute(
      "DELETE FROM pmam_students WHERE id = 600001 AND nome_guerra = 'Teste'"
    );
    console.log(`Aluno de teste removido. Linhas afetadas: ${result.affectedRows}`);

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
