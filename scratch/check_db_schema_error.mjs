import 'dotenv/config';
import { connect } from '@tidbcloud/serverless';

const url = process.env.DATABASE_URL || process.env.TIDB_URL;
const connection = connect({ url });

async function check() {
  console.log("=== CHECKING PMAM_STUDENTS COLUMNS ===");
  try {
    const cols = await connection.execute("DESCRIBE pmam_students");
    console.log("pmam_students columns:", cols.rows || cols);
  } catch (e) {
    console.error("Error describing pmam_students:", e.message);
  }

  console.log("=== CHECKING HYMN 1 ===");
  try {
    const hymn = await connection.execute("SELECT id, number, title, lyrics FROM pmam_hymns WHERE id = 1 OR number = 1");
    console.log("Hymn 1:", hymn.rows || hymn);
  } catch (e) {
    console.error("Error querying hymn 1:", e.message);
  }
}

check();
