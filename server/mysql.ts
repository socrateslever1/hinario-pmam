import mysql from 'mysql2/promise';
import { ENV } from './_core/env';

// For TiDB Cloud, we need to handle SSL
const connectionConfig = {
  host: ENV.tidbHost,
  port: ENV.tidbPort,
  user: ENV.tidbUser,
  password: ENV.tidbPassword,
  database: ENV.tidbDatabase,
  ssl: {
    // TiDB Cloud usually requires rejectUnauthorized: true
    rejectUnauthorized: true,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log('[MySQL] Initializing connection pool for TiDB...');

export const pool = mysql.createPool(connectionConfig);

// Helper to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('[MySQL Error] Original Query:', sql);
    console.error('[MySQL Error] Message:', error);
    throw error;
  }
}
