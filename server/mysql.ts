import { connect } from '@tidbcloud/serverless';
import { ENV } from './_core/env';

let connection: ReturnType<typeof connect> | null = null;

function getConnection() {
  if (!ENV.tidbConfigured) {
    throw new Error(
      "TiDB is not configured. Set TIDB_HOST, TIDB_USER, TIDB_PASSWORD and TIDB_DATABASE in the server environment."
    );
  }

  if (!connection) {
    const url = `mysql://${ENV.tidbUser}:${ENV.tidbPassword}@${ENV.tidbHost}/${ENV.tidbDatabase}?ssl={"rejectUnauthorized":true}`;
    connection = connect({ url });
  }

  return connection;
}

// Helper to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    const result = await getConnection().execute(sql, params);
    // The execute function from @tidbcloud/serverless might return an object { rows } or an array depending on internal options.
    const rows = result && !Array.isArray(result) && 'rows' in (result as any) ? (result as any).rows : result;
    return rows as T[];
  } catch (error) {
    console.error('[MySQL Error] Original Query:', sql);
    console.error('[MySQL Error] Message:', error);
    throw error;
  }
}
