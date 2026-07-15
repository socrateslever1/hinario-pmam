import { connect } from '@tidbcloud/serverless';
import 'dotenv/config';
const url = `mysql://${process.env.TIDB_USER}:${process.env.TIDB_PASSWORD}@${process.env.TIDB_HOST}/${process.env.TIDB_DATABASE}?ssl={"rejectUnauthorized":true}`;
const connection = connect({ url });
connection.execute('SELECT COUNT(*) as count FROM pmam_users WHERE student_id IS NOT NULL').then(r => console.log(r)).catch(console.error);
