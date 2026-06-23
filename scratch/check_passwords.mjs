import mysql from "mysql2/promise";
import dotenv from "dotenv";
import * as bcrypt from "bcryptjs";

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
    console.log(`Total students in DB: ${rows.length}`);

    let activeAccounts = 0;
    let defaultAccounts = 0;
    let otherAccounts = 0;

    for (const student of rows) {
      // Check if senha matches numerica (default password)
      const isDefault = await bcrypt.compare(student.numerica, student.senha).catch(() => false);
      if (isDefault) {
        defaultAccounts++;
      } else {
        // Not default. Let's see if we can check if it's a valid bcrypt hash
        if (student.senha && student.senha.startsWith("$2b$")) {
          activeAccounts++;
        } else {
          otherAccounts++;
        }
      }
    }

    console.log(`Active/Custom password accounts: ${activeAccounts}`);
    console.log(`Default password accounts (senha matches numerica): ${defaultAccounts}`);
    console.log(`Other/Invalid accounts: ${otherAccounts}`);

    // Print a few active accounts if any
    const activeList = [];
    for (const student of rows) {
      const isDefault = await bcrypt.compare(student.numerica, student.senha).catch(() => false);
      if (!isDefault && student.senha && student.senha.startsWith("$2b$")) {
        activeList.push(student);
      }
    }
    console.log("Some active students:", activeList.slice(0, 5));

  } finally {
    await connection.end();
  }
}

run().catch(console.error);
