import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.TIDB_HOST || 'localhost',
    port: parseInt(process.env.TIDB_PORT || '4000'),
    user: process.env.TIDB_USER || 'root',
    password: process.env.TIDB_PASSWORD || '',
    database: process.env.TIDB_DATABASE || 'hinario_pmam',
    ssl: {
      rejectUnauthorized: true,
    },
  });

  try {
    console.log("Updating role 'master' to 'admin'...");
    const [res1] = await connection.execute("UPDATE pmam_users SET role = 'admin' WHERE role = 'master'");
    console.log("Result master->admin:", res1);

    console.log("Updating role 'user' to 'student'...");
    const [res2] = await connection.execute("UPDATE pmam_users SET role = 'student' WHERE role = 'user'");
    console.log("Result user->student:", res2);

    console.log('Executing ALTER TABLE statement...');
    const sql = `ALTER TABLE pmam_users MODIFY COLUMN role enum('admin','comandante_corpo','subcomandante_corpo','comandante_cfap','subcomandante_cfap','comandante_cia','comandante_pel','student') DEFAULT 'student';`;
    const [result] = await connection.execute(sql);
    console.log('ALTER TABLE executed successfully:', result);
  } catch (error) {
    console.error('Failed execution:', error);
  } finally {
    await connection.end();
  }
}

main();
