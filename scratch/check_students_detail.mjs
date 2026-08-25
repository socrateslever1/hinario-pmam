import 'dotenv/config';
import { connect } from '@tidbcloud/serverless';

const url = process.env.DATABASE_URL || process.env.TIDB_URL;
const connection = connect({ url });

async function main() {
  console.log("--- PMAM USERS (LIMIT 10) ---");
  const users = await connection.execute("SELECT id, name, email, role FROM pmam_users WHERE role = 'student' LIMIT 10");
  console.log(users.rows || users);

  console.log("--- PMAM GRADE STUDENTS (LIMIT 10) ---");
  const gradeStudents = await connection.execute("SELECT id, student_number, full_name FROM pmam_grade_students LIMIT 10");
  console.log(gradeStudents.rows || gradeStudents);

  console.log("--- PMAM STUDENTS NON-GENERIC (LIMIT 10) ---");
  const customStudents = await connection.execute("SELECT numerica, nome_guerra, nome_completo FROM pmam_students WHERE nome_guerra NOT LIKE 'Aluno %' LIMIT 10");
  console.log(customStudents.rows || customStudents);
}

main();
