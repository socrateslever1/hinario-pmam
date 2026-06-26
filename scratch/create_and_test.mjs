import dotenv from "dotenv";
dotenv.config();
import * as db from "../server/db.ts";
import bcrypt from "bcryptjs";

async function test() {
  try {
    const email = "teste_novo";
    const result = await db.createAccessUser({
      name: "Teste Novo",
      email: email,
      role: "admin"
    });
    console.log("Created user result:", result);
    
    const user = await db.getUserByEmail(email);
    console.log("Created user in DB:", user);
    
    const isPmamMatch = await bcrypt.compare("pmam2026", user.password);
    console.log("Is password 'pmam2026'?", isPmamMatch);
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    process.exit(0);
  }
}

test();
