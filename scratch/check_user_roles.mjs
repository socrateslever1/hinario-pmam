import 'dotenv/config';
import { connect } from '@tidbcloud/serverless';

const url = process.env.DATABASE_URL || process.env.TIDB_URL;
const connection = connect({ url });

async function main() {
  const users = await connection.execute("SELECT id, open_id, name, email, role FROM pmam_users WHERE role != 'student' OR email IS NOT NULL OR name LIKE '%Sócrates%' LIMIT 20");
  console.log(users.rows || users);
}

main();
