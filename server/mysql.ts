import { connect } from '@tidbcloud/serverless';
import { ENV } from './_core/env';

let connection: ReturnType<typeof connect> | null = null;

function getConnection() {
  if (!ENV.tidbConfigured) {
    const envKeys = (globalThis as any).cloudflareEnv ? Object.keys((globalThis as any).cloudflareEnv).join(", ") : "none";
    throw new Error(
      `TiDB is not configured. HOST: ${!!ENV.tidbHost}, USER: ${!!ENV.tidbUser}, PASS: ${!!ENV.tidbPassword}, DB: ${!!ENV.tidbDatabase}. Keys in env: ${envKeys}`
    );
  }

  if (!connection) {
    const url = `mysql://${ENV.tidbUser}:${ENV.tidbPassword}@${ENV.tidbHost}/${ENV.tidbDatabase}?ssl={"rejectUnauthorized":true}`;
    connection = connect({ url, fullResult: true });
  }

  return connection;
}

// Helper to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const result = await getConnection().execute(sql, params);
    // The execute function from @tidbcloud/serverless might return an object { rows } or an array depending on internal options.
    const rawRows = result && !Array.isArray(result) && 'rows' in (result as any) ? (result as any).rows : result;
    
    // TiDB Serverless HTTP API returns dates as strings. We must convert them back to Date objects 
    // so tRPC/superjson can serialize them correctly for the frontend.
    const rows = Array.isArray(rawRows) ? rawRows.map(row => {
      if (!row || typeof row !== 'object') return row;
      const parsedRow = { ...row };
      for (const key in parsedRow) {
        const val = parsedRow[key];
        if (typeof val === 'string') {
          if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(val)) {
            parsedRow[key] = new Date(val.replace(' ', 'T') + 'Z');
          } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(val)) {
            parsedRow[key] = new Date(val);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            parsedRow[key] = new Date(val);
          }
        }
      }
      return parsedRow;
    }) : rawRows;

    // Attach insertId and affectedRows metadata to the returned array
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      const resultAny = result as any;
      if (resultAny.lastInsertId !== undefined && resultAny.lastInsertId !== null) {
        (rows as any).insertId = Number(resultAny.lastInsertId);
      }
      if (resultAny.rowsAffected !== undefined && resultAny.rowsAffected !== null) {
        (rows as any).affectedRows = Number(resultAny.rowsAffected);
      }
    }

    return rows as T[];
  } catch (error) {
    console.error('[MySQL Error] Original Query:', sql);
    console.error('[MySQL Error] Message:', error);
    throw error;
  }
}
