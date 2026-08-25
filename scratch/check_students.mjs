import 'dotenv/config';
import { connect } from '@tidbcloud/serverless';

const url = process.env.DATABASE_URL || process.env.TIDB_URL;
const connection = connect({ url });

async function main() {
  const res = await connection.execute('SELECT numerica, nome_guerra, nome_completo, companhia, peloton FROM pmam_students ORDER BY id ASC LIMIT 10');
  const rows = res.rows || res;
  console.log(JSON.stringify(rows, null, 2));
}

main();
