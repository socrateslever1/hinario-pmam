import { connect } from '@tidbcloud/serverless';
import 'dotenv/config';
import bcrypt from "bcryptjs";

const url = `mysql://${process.env.TIDB_USER}:${process.env.TIDB_PASSWORD}@${process.env.TIDB_HOST}/${process.env.TIDB_DATABASE}?ssl={"rejectUnauthorized":true}`;
const connection = connect({ url });

async function run() {
  const result = await connection.execute("SELECT * FROM pmam_users WHERE email = '4122@pmam.com'");
  const user = result.rows[0];
  console.log("Found user:", user);
  
  const dbPassword = user.password;
  const isBcrypt = dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$") || dbPassword.startsWith("$2y$");
  console.log("isBcrypt:", isBcrypt);
  
  // They usually login with their numeric code as password for students? No, they had a custom password.
  // Wait, I don't know their password. But if they say it stopped working, maybe the Date parsing broke something else?
  
  // Let's test the date parsing logic to see if it mutated something it shouldn't have.
  for (const key in user) {
    const val = user[key];
    if (typeof val === 'string') {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(val) || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(val) || /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        console.log(`Parsed ${key} as Date:`, new Date(val));
      }
    }
  }
}

run().catch(console.error);
