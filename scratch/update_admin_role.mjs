import 'dotenv/config';
import { connect } from '@tidbcloud/serverless';

const url = process.env.DATABASE_URL || process.env.TIDB_URL;
const connection = connect({ url });

async function main() {
  // Update id=1 (Sócrates Lever) to role='admin'
  const res1 = await connection.execute("UPDATE pmam_users SET role = 'admin' WHERE id = 1");
  console.log("Updated user 1 role to admin:", res1);

  // Check all socrates users
  const res2 = await connection.execute("SELECT id, open_id, name, email, role FROM pmam_users WHERE name LIKE '%Sócrates%' OR email LIKE '%socrates%'");
  console.log("Current Sócrates users:", res2.rows || res2);
}

main();
