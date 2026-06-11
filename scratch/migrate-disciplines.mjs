import 'dotenv/config';
import mysql from 'mysql2/promise';

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

  console.log('Connected to Tidb. Running table alterations...');

  const queries = [
    "ALTER TABLE pmam_disciplines ADD COLUMN start_date DATE NULL",
    "ALTER TABLE pmam_disciplines ADD COLUMN exam_date DATE NULL",
    "ALTER TABLE pmam_disciplines ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'em_breve'",
    "ALTER TABLE pmam_disciplines ADD COLUMN study_material_url VARCHAR(512) NULL",
    "ALTER TABLE pmam_disciplines ADD COLUMN study_material_name VARCHAR(255) NULL",
    "ALTER TABLE pmam_disciplines ADD COLUMN gaivotas_links TEXT NULL"
  ];

  for (const sql of queries) {
    try {
      console.log(`Running: ${sql}`);
      await connection.execute(sql);
      console.log('Success');
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('Column already exists, skipping.');
      } else {
        console.error('Error executing query:', err);
      }
    }
  }

  await connection.end();
  console.log('Done.');
}

main().catch(console.error);
