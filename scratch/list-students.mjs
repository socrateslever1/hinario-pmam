import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

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

const urlConfig = parseDatabaseUrl(process.env.DATABASE_URL || "");
const config = {
  host: process.env.TIDB_HOST || urlConfig?.host,
  port: Number(process.env.TIDB_PORT || urlConfig?.port || 4000),
  user: process.env.TIDB_USER || urlConfig?.user,
  password: process.env.TIDB_PASSWORD || urlConfig?.password,
  database: process.env.TIDB_DATABASE || urlConfig?.database,
  ssl: {
    rejectUnauthorized: true,
  }
};

async function run() {
  const connection = await mysql.createConnection(config);
  try {
    const [rows] = await connection.query(
      "SELECT id, numerica, nome_guerra, senha, session_token, cpf, rg FROM pmam_students ORDER BY id DESC LIMIT 15"
    );
    console.log("Últimos 15 alunos:");
    console.table(rows.map(r => ({
      id: r.id,
      numerica: r.numerica,
      nome_guerra: r.nome_guerra,
      tem_senha: !!r.senha,
      senha_preview: r.senha ? r.senha.slice(0, 15) + "..." : "null",
      tem_token: !!r.session_token,
      cpf: r.cpf,
      rg: r.rg
    })));
  } finally {
    await connection.end();
  }
}

run().catch(console.error);
