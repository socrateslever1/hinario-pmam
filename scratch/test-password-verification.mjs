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
      "SELECT id, numerica, nome_guerra, senha FROM pmam_students WHERE numerica = '4122'"
    );
    if (rows.length === 0) {
      console.log("No student 4122 found.");
      return;
    }
    const student = rows[0];
    console.log("Found student:", student);

    // Test bcryptjs compare
    console.log("Testing password 'novasenhateste123'...");
    const isMatch = await bcrypt.compare("novasenhateste123", student.senha);
    console.log("bcrypt.compare result:", isMatch);

    // Test with a freshly hashed password
    const testPlain = "testing123";
    console.log("Hashing fresh password:", testPlain);
    const hash = await bcrypt.hash(testPlain, 10);
    console.log("Fresh hash:", hash);
    const freshMatch = await bcrypt.compare(testPlain, hash);
    console.log("Fresh match:", freshMatch);
    
  } finally {
    await connection.end();
  }
}

run().catch(console.error);
