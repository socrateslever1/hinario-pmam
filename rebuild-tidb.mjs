import { connect } from '@tidbcloud/serverless';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const drizzleDir = path.join(__dirname, 'drizzle');

const url = process.env.TIDB_URL || process.env.DATABASE_URL;

async function main() {
  if (!url) {
    throw new Error("TIDB_URL or DATABASE_URL environment variable is required.");
  }

  const connection = connect({ url });
  console.log('Connecting to TiDB Cloud via Serverless HTTP...');

  const files = fs.readdirSync(drizzleDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Executing ${files.length} migration script(s)...`);

  for (const file of files) {
    const filePath = path.join(drizzleDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const rawStatements = content.split(/--> statement-breakpoint|\;\s*\n/);

    for (let stmt of rawStatements) {
      stmt = stmt.trim();
      if (!stmt) continue;
      if (stmt.endsWith(';')) stmt = stmt.slice(0, -1).trim();
      if (!stmt) continue;

      try {
        await connection.execute(stmt);
      } catch (err) {
        // Ignore duplicate column/table errors gracefully
        if (!err.message?.includes('already exists') && !err.message?.includes('Duplicate column')) {
          console.warn(`[${file}] Warning executing statement:`, err.message || err);
        }
      }
    }
  }

  console.log('Migrations completed successfully.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

