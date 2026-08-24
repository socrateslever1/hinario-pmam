import { connect } from '@tidbcloud/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const url = process.env.TIDB_URL || process.env.DATABASE_URL;

async function seedMaster() {
  if (!url) {
    console.error("TIDB_URL or DATABASE_URL not set!");
    process.exit(1);
  }

  const connection = connect({ url });
  const hashedPassword = await bcrypt.hash("123456", 12);
  const emails = ['socrates.lever@gmail.com', 'socrates@icomp.ufam.edu.br'];

  console.log("Seeding master users...");

  for (const email of emails) {
    const existing = await connection.execute(
      'SELECT id FROM pmam_users WHERE email = ? LIMIT 1',
      [email]
    );

    const rows = Array.isArray(existing) ? existing : existing.rows || [];

    if (rows.length > 0) {
      await connection.execute(
        'UPDATE pmam_users SET password = ?, role = "admin", name = "Sócrates", login_method = "email" WHERE email = ?',
        [hashedPassword, email]
      );
      console.log(`✓ Master user ${email} updated successfully!`);
    } else {
      const openId = `master-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await connection.execute(
        'INSERT INTO pmam_users (open_id, name, email, password, login_method, role, created_at, updated_at) VALUES (?, "Sócrates", ?, ?, "email", "admin", NOW(), NOW())',
        [openId, email, hashedPassword]
      );
      console.log(`✓ Master user ${email} created successfully!`);
    }
  }

  console.log("Master seed completed!");
  process.exit(0);
}

seedMaster().catch(e => {
  console.error("Seed failed:", e);
  process.exit(1);
});

