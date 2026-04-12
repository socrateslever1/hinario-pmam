import mysql from 'mysql2/promise';
import { ENV } from './_core/env';

let pool: mysql.Pool | null = null;

function getPool() {
  if (!ENV.tidbConfigured) {
    throw new Error(
      "TiDB is not configured. Set TIDB_HOST, TIDB_USER, TIDB_PASSWORD and TIDB_DATABASE in the server environment."
    );
  }

  if (!pool) {
    console.log('[MySQL] Initializing connection pool for TiDB...');
    pool = mysql.createPool({
      host: ENV.tidbHost,
      port: ENV.tidbPort,
      user: ENV.tidbUser,
      password: ENV.tidbPassword,
      database: ENV.tidbDatabase,
      ssl: {
        rejectUnauthorized: true,
      },
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool;
}

// Helper to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [rows] = await getPool().execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('[MySQL Error] Original Query:', sql);
    console.error('[MySQL Error] Message:', error);
    throw error;
  }
}
