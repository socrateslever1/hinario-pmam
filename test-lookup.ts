import { getUserByEmail } from './server/db.ts';
import bcrypt from 'bcryptjs';
import { ENV } from './server/_core/env.ts';
console.log("ENV db:", ENV.tidbDatabase);

async function run() {
  const emailOrNumeric = "4122";
  let normalizedEmail = emailOrNumeric.toLowerCase();
  if (/^\d{4}$/.test(emailOrNumeric)) {
    normalizedEmail = `${emailOrNumeric}@pmam.com`;
  }
  
  const user = await getUserByEmail(normalizedEmail);
  console.log("User:", user);
  if (!user) {
    console.log("USER NOT FOUND");
    return;
  }
  
  const inputPassword = "temp"; // Let's pretend the user types temp, though they might type something else.
  // Wait, I don't know the password. Let's just see if we found the user.
}
run();
