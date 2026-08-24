import "dotenv/config";
import { connect } from "@tidbcloud/serverless";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function rowsOf(result: unknown): Record<string, unknown>[] {
  if (Array.isArray(result)) return result as Record<string, unknown>[];
  if (result && typeof result === "object" && "rows" in result) {
    const rows = (result as { rows?: unknown }).rows;
    return Array.isArray(rows) ? rows as Record<string, unknown>[] : [];
  }
  return [];
}

function safeName(value: unknown) {
  const name = String(value);
  if (!/^[A-Za-z0-9_]+$/.test(name)) throw new Error(`Nome de tabela invalido: ${name}`);
  return name;
}

async function main() {
  const url = process.env.TIDB_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("TIDB_URL ou DATABASE_URL nao configurada");

  const db = connect({ url, fullResult: true });
  const tableResult = await db.execute("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tables = rowsOf(tableResult).map((row) => safeName(Object.values(row)[0])).sort();
  const backup: Record<string, unknown> = {
    format: "hinario-pmam-tidb-logical-backup-v1",
    createdAt: new Date().toISOString(),
    tables: {},
  };

  for (const table of tables) {
    const createRows = rowsOf(await db.execute(`SHOW CREATE TABLE \`${table}\``));
    const dataRows = rowsOf(await db.execute(`SELECT * FROM \`${table}\``));
    (backup.tables as Record<string, unknown>)[table] = {
      createSql: createRows[0] ? Object.values(createRows[0])[1] : null,
      rowCount: dataRows.length,
      rows: dataRows,
    };
    console.log(`${table}: ${dataRows.length}`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = path.resolve("tmp", "tidb-backups");
  const outputPath = path.join(outputDir, `before-recovery-${stamp}.json`);
  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, JSON.stringify(backup, (_key, value) => {
    if (typeof value === "bigint") return value.toString();
    if (value instanceof Uint8Array) return { type: "base64", data: Buffer.from(value).toString("base64") };
    return value;
  }, 2));
  console.log(`BACKUP_PATH=${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
