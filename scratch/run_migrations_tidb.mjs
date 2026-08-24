import { connect } from '@tidbcloud/serverless';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const drizzleDir = path.join(rootDir, 'drizzle');

const url = process.env.TIDB_URL;
if (!url) {
  console.error("TIDB_URL not set in environment!");
  process.exit(1);
}

const connection = connect({ url });

async function run() {
  console.log("Connecting to TiDB via serverless HTTP...");
  
  // Find all .sql files in drizzle directory sorted
  const files = fs.readdirSync(drizzleDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} SQL migration files:`, files);

  for (const file of files) {
    const filePath = path.join(drizzleDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Split by --> statement-breakpoint or semicolon
    const rawStatements = content.split(/--> statement-breakpoint|\;\s*\n/);
    
    console.log(`\nExecuting migration ${file}...`);
    for (let stmt of rawStatements) {
      stmt = stmt.trim();
      if (!stmt) continue;
      // Remove trailing semicolon if present
      if (stmt.endsWith(';')) {
        stmt = stmt.slice(0, -1).trim();
      }
      if (!stmt) continue;
      
      try {
        await connection.execute(stmt);
        console.log(`  ✓ Statement executed successfully (${stmt.slice(0, 50).replace(/\n/g, ' ')}...)`);
      } catch (err) {
        console.warn(`  ⚠️ Statement notice/warning (${stmt.slice(0, 40).replace(/\n/g, ' ')}...):`, err.message || err);
      }
    }
  }

  console.log("\nMigration completed! Verifying tables...");
  const tables = await connection.execute("SHOW TABLES");
  console.log("Tables in database:", tables);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
