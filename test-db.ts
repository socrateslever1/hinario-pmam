import { connect } from '@tidbcloud/serverless';
import 'dotenv/config';

const url = `mysql://${process.env.TIDB_USER}:${process.env.TIDB_PASSWORD}@${process.env.TIDB_HOST}/${process.env.TIDB_DATABASE}?ssl={"rejectUnauthorized":true}`;
const connection = connect({ url });

async function run() {
  const result = await connection.execute("SELECT id, email, password, role FROM pmam_users LIMIT 5");
  console.log(result);
}

run().catch(console.error);
