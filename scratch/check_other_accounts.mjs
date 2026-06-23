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
      "SELECT id, numerica, nome_guerra, senha FROM pmam_students"
    );
    
    console.log("Analyzing first 10 accounts starting from index 0...");
    for (let i = 0; i < 15 && i < rows.length; i++) {
      const student = rows[i];
      console.log(`ID: ${student.id}, Numerica: ${student.numerica}, Name: ${student.nome_guerra}, Senha: "${student.senha}"`);
    }
  } finally {
    await connection.end();
  }
}

run().catch(console.error);
