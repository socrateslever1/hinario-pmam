import { connect } from '@tidbcloud/serverless';
import 'dotenv/config';
const url = `mysql://${process.env.TIDB_USER}:${process.env.TIDB_PASSWORD}@${process.env.TIDB_HOST}/${process.env.TIDB_DATABASE}?ssl={"rejectUnauthorized":true}`;
const connection = connect({ url });
async function run() {
  const result = await connection.execute("SELECT * FROM pmam_users WHERE email = '4122@pmam.com'");
  console.log("Full user row:", JSON.stringify(result[0], null, 2));
}
run().catch(console.error);
