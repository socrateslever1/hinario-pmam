import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

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
    const testPassword = "pmam2026";
    const hash = await bcrypt.hash(testPassword, 12);
    console.log(`Generated hash for "${testPassword}":`, hash);
    
    // Update soliveira@gmail.com password
    await connection.query(
      "UPDATE pmam_users SET password = ? WHERE email = 'soliveira@gmail.com'",
      [hash]
    );
    console.log("Updated soliveira@gmail.com password in DB.");
    
    // Fetch again
    const [rows] = await connection.query(
      "SELECT password FROM pmam_users WHERE email = 'soliveira@gmail.com'"
    );
    const dbPassword = rows[0].password;
    console.log("DB password is now:", dbPassword);
    
    // Test comparison
    const match = await bcrypt.compare(testPassword, dbPassword);
    console.log("Bcrypt comparison match:", match);
    
    // Test with email lowercasing logic
    const inputEmail = "soliveira@gmail.com ";
    const normalizedEmail = inputEmail.trim().toLowerCase();
    console.log("Normalized Email check:", normalizedEmail === "soliveira@gmail.com");
    
  } finally {
    await connection.end();
  }
}

run().catch(console.error);
