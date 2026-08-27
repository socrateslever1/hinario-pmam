import { connect } from '@tidbcloud/serverless';
import { ENV } from './_core/env';

let connection: ReturnType<typeof connect> | null = null;
const DEFAULT_QUERY_TIMEOUT_MS = ENV.isProduction ? 5_000 : 1_200;
const DB_UNAVAILABLE_RETRY_MS = ENV.isProduction ? 30_000 : 60_000;
let databaseUnavailableUntil = 0;

function getQueryTimeoutMs() {
  const raw = process.env.DB_QUERY_TIMEOUT_MS || process.env.TIDB_QUERY_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_QUERY_TIMEOUT_MS;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, sql: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      const error = new Error(`Database query timed out after ${timeoutMs}ms`);
      (error as any).code = "DB_QUERY_TIMEOUT";
      (error as any).sqlPreview = sql.replace(/\s+/g, " ").trim().slice(0, 160);
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function createDatabaseUnavailableError(reason: string) {
  const error = new Error(reason);
  (error as any).code = "DB_TEMPORARILY_UNAVAILABLE";
  return error;
}

function isTransientDatabaseError(error: unknown) {
  const err = error as any;
  const message = String(err?.message ?? error ?? "");
  const causeCode = String(err?.cause?.code ?? err?.code ?? "");

  return (
    causeCode === "DB_QUERY_TIMEOUT" ||
    causeCode === "DB_TEMPORARILY_UNAVAILABLE" ||
    causeCode === "UND_ERR_CONNECT_TIMEOUT" ||
    message.includes("fetch failed") ||
    message.includes("Connect Timeout") ||
    message.includes("Database query timed out")
  );
}

function isCooldownError(error: unknown) {
  const err = error as any;
  return String(err?.cause?.code ?? err?.code ?? "") === "DB_TEMPORARILY_UNAVAILABLE";
}

function getConnection() {
  if (!ENV.tidbConfigured) {
    const cfKeys = (globalThis as any).cloudflareEnv ? Object.keys((globalThis as any).cloudflareEnv).join(", ") : "none";
    const procKeys = typeof process !== "undefined" && process.env ? Object.keys(process.env).join(", ") : "none";
    throw new Error(
      `TiDB is not configured. HOST: ${!!ENV.tidbHost}, USER: ${!!ENV.tidbUser}, PASS: ${!!ENV.tidbPassword}, DB: ${!!ENV.tidbDatabase}. CF env keys: [${cfKeys}], Proc env keys: [${procKeys}]`
    );
  }

  const userEnc = encodeURIComponent(ENV.tidbUser);
  const passEnc = encodeURIComponent(ENV.tidbPassword);
  const portStr = ENV.tidbPort ? `:${ENV.tidbPort}` : "";
  const url = `mysql://${userEnc}:${passEnc}@${ENV.tidbHost}${portStr}/${ENV.tidbDatabase}?ssl={"rejectUnauthorized":true}`;

  if (!connection || (connection as any)._lastUrl !== url) {
    connection = connect({ url, fullResult: true });
    (connection as any)._lastUrl = url;
  }

  return connection;
}

// Helper to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  try {
    if (Date.now() < databaseUnavailableUntil) {
      throw createDatabaseUnavailableError("Database temporarily unavailable; waiting before retrying remote connection");
    }

    const result = await withTimeout(
      getConnection().execute(sql, params),
      getQueryTimeoutMs(),
      sql,
    );
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
      const insertIdVal = resultAny.lastInsertId ?? resultAny.insertId;
      if (insertIdVal !== undefined && insertIdVal !== null) {
        (rows as any).insertId = Number(insertIdVal);
      }
      const affectedRowsVal = resultAny.rowsAffected ?? resultAny.affectedRows;
      if (affectedRowsVal !== undefined && affectedRowsVal !== null) {
        (rows as any).affectedRows = Number(affectedRowsVal);
      }
    }

    return rows as T[];
  } catch (error) {
    if (isCooldownError(error)) {
      throw error;
    }

    if (isTransientDatabaseError(error)) {
      databaseUnavailableUntil = Date.now() + DB_UNAVAILABLE_RETRY_MS;
      console.warn(
        "[MySQL] Banco remoto indisponível; usando fallback quando existir. Nova tentativa após cooldown.",
        (error as any)?.code || (error as any)?.cause?.code || String((error as any)?.message || error)
      );
    } else {
      console.error('[MySQL Error] Original Query:', sql);
      console.error('[MySQL Error] Message:', error);
    }
    throw error;
  }
}
