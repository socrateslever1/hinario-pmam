import { connect } from '@tidbcloud/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const url = process.env.TIDB_URL || process.env.DATABASE_URL;

async function seedStudents() {
  if (!url) {
    console.error("TIDB_URL or DATABASE_URL not set!");
    process.exit(1);
  }

  const connection = connect({ url });
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Ensure columns exist
  try { await connection.execute("ALTER TABLE pmam_students ADD COLUMN desk_number INT NULL"); } catch (e) {}
  try { await connection.execute("ALTER TABLE pmam_students ADD COLUMN `condition` VARCHAR(32) NOT NULL DEFAULT 'pronto'"); } catch (e) {}
  try { await connection.execute("ALTER TABLE pmam_students ADD COLUMN session_token VARCHAR(128)"); } catch (e) {}
  try { await connection.execute("ALTER TABLE pmam_students ADD COLUMN nome_completo VARCHAR(255)"); } catch (e) {}

  console.log("Seeding 492 students across 5 Companhias and 2 Pelotões...");

  // Cia 1 to 5, Peloton 1 and 2
  const ciaCounts = [
    { cia: 1, pel: 1, start: 1101, count: 50 },
    { cia: 1, pel: 2, start: 1201, count: 50 },
    { cia: 2, pel: 1, start: 2101, count: 50 },
    { cia: 2, pel: 2, start: 2201, count: 50 },
    { cia: 3, pel: 1, start: 3101, count: 50 },
    { cia: 3, pel: 2, start: 3201, count: 50 },
    { cia: 4, pel: 1, start: 4101, count: 50 },
    { cia: 4, pel: 2, start: 4201, count: 50 },
    { cia: 5, pel: 1, start: 5101, count: 46 },
    { cia: 5, pel: 2, start: 5201, count: 46 },
  ];

  let totalInserted = 0;

  for (const group of ciaCounts) {
    for (let i = 0; i < group.count; i++) {
      const numVal = group.start + i;
      const numerica = String(numVal);
      const deskNumber = i + 1;
      const nomeGuerra = `Aluno ${numerica}`;
      const email = `${numerica}@pmam.com`;

      // 1. Insert into pmam_students
      await connection.execute(
        `INSERT INTO pmam_students (numerica, nome_guerra, nome_completo, senha, companhia, peloton, desk_number, \`condition\`, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pronto', NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           nome_guerra = VALUES(nome_guerra),
           nome_completo = VALUES(nome_completo),
           companhia = VALUES(companhia),
           peloton = VALUES(peloton),
           desk_number = VALUES(desk_number),
           updated_at = NOW()`,
        [numerica, nomeGuerra, nomeGuerra, hashedPassword, group.cia, group.pel, deskNumber]
      );

      // Get inserted student id
      const studentRes = await connection.execute(
        `SELECT id FROM pmam_students WHERE numerica = ? LIMIT 1`,
        [numerica]
      );
      const studentRows = Array.isArray(studentRes) ? studentRes : (studentRes ? studentRes.rows : []) || [];
      const studentId = studentRows[0] ? studentRows[0][0] || studentRows[0].id : null;

      // 2. Insert into pmam_users for login
      const openId = `student-${numerica}-${Date.now()}`;
      await connection.execute(
        `INSERT INTO pmam_users (open_id, name, email, password, login_method, role, student_id, companhia_id, pelotao_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'email', 'student', ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password = VALUES(password),
           student_id = VALUES(student_id),
           companhia_id = VALUES(companhia_id),
           pelotao_id = VALUES(pelotao_id),
           updated_at = NOW()`,
        [openId, nomeGuerra, email, hashedPassword, studentId, group.cia, group.pel]
      );

      totalInserted++;
    }
    console.log(`  ✓ Seeding completed for Cia ${group.cia} Pel ${group.pel} (${group.count} alunos)`);
  }

  console.log(`\nAll ${totalInserted} students seeded successfully!`);
  process.exit(0);
}

seedStudents().catch((err) => {
  console.error("Student seed failed:", err);
  process.exit(1);
});
