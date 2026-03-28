import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function seedMaster() {
  const hashedPassword = await bcrypt.hash("123456", 12);
  
  // Check if user already exists
  const existing = await db.execute(`SELECT id FROM users WHERE email = 'socrates.lever@gmail.com' LIMIT 1`);
  
  if (existing[0] && existing[0].length > 0) {
    // Update existing user
    await db.execute(`UPDATE users SET password = '${hashedPassword}', role = 'master', name = 'Sócrates', loginMethod = 'email' WHERE email = 'socrates.lever@gmail.com'`);
    console.log("Master user updated successfully!");
  } else {
    // Insert new user
    await db.execute(`INSERT INTO users (openId, name, email, password, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES ('master-socrates', 'Sócrates', 'socrates.lever@gmail.com', '${hashedPassword}', 'email', 'master', NOW(), NOW(), NOW())`);
    console.log("Master user created successfully!");
  }
  
  process.exit(0);
}

seedMaster().catch(e => { console.error(e); process.exit(1); });
