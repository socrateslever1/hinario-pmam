import { query } from './server/mysql.ts';

async function run() {
  try {
    const rows = await query("SELECT * FROM pmam_users WHERE email = '4122@pmam.com'");
    console.log("Returned rows:", rows);
  } catch(e) {
    console.error("Error:", e);
  }
}

run();
