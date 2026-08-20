function getEnv(name: string): string {
  if (typeof globalThis !== "undefined" && (globalThis as any).cloudflareEnv && (globalThis as any).cloudflareEnv[name] !== undefined) {
    const val = (globalThis as any).cloudflareEnv[name];
    if (val) return String(val);
  }
  if (typeof process !== "undefined" && process.env && process.env[name] !== undefined) {
    const val = process.env[name];
    if (val) return String(val);
  }
  return "";
}

function readBooleanEnv(value: string | undefined) {
  return value === "1" || value === "true";
}

function parseDatabaseUrl(url: string) {
  try {
    if (!url) return null;
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: urlObj.port || "4000",
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: urlObj.pathname.replace(/^\//, ""),
    };
  } catch {
    return null;
  }
}

export const ENV = {
  get appId() { return getEnv("VITE_APP_ID") || "default"; },
  get cookieSecret() { return getEnv("JWT_SECRET") || "default-secret-key"; },
  get databaseUrl() { return getEnv("DATABASE_URL") || getEnv("TIDB_URL"); },
  get oAuthServerUrl() { return getEnv("OAUTH_SERVER_URL") || "https://forge.ai.studio"; },
  get ownerOpenId() { return getEnv("OWNER_OPEN_ID"); },
  get isProduction() { return getEnv("NODE_ENV") === "production"; },
  get forgeApiUrl() { return getEnv("BUILT_IN_FORGE_API_URL"); },
  get forgeApiKey() { return getEnv("BUILT_IN_FORGE_API_KEY"); },
  get supabaseUrl() { return getEnv("VITE_SUPABASE_URL"); },
  get supabaseServiceKey() { return getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("VITE_SUPABASE_ANON_KEY"); },
  get tidbHost() {
    return getEnv("TIDB_HOST") || getEnv("DB_HOST") || parseDatabaseUrl(getEnv("DATABASE_URL") || getEnv("TIDB_URL"))?.host || "";
  },
  get tidbPort() {
    const raw = getEnv("TIDB_PORT") || getEnv("DB_PORT");
    if (raw) return parseInt(raw);
    const parsed = parseDatabaseUrl(getEnv("DATABASE_URL") || getEnv("TIDB_URL"));
    return parsed?.port ? parseInt(parsed.port) : 4000;
  },
  get tidbUser() {
    return getEnv("TIDB_USER") || getEnv("DB_USER") || parseDatabaseUrl(getEnv("DATABASE_URL") || getEnv("TIDB_URL"))?.user || "";
  },
  get tidbPassword() {
    return getEnv("TIDB_PASSWORD") || getEnv("DB_PASSWORD") || parseDatabaseUrl(getEnv("DATABASE_URL") || getEnv("TIDB_URL"))?.password || "";
  },
  get tidbDatabase() {
    return getEnv("TIDB_DATABASE") || getEnv("DB_NAME") || parseDatabaseUrl(getEnv("DATABASE_URL") || getEnv("TIDB_URL"))?.database || "";
  },
  get tidbUrl() { return getEnv("TIDB_URL") || getEnv("DATABASE_URL"); },
  get tidbConfigured() {
    return Boolean(
      (getEnv("TIDB_HOST") || getEnv("DB_HOST") || parseDatabaseUrl(getEnv("DATABASE_URL") || getEnv("TIDB_URL"))?.host) &&
      (getEnv("TIDB_USER") || getEnv("DB_USER") || parseDatabaseUrl(getEnv("DATABASE_URL") || getEnv("TIDB_URL"))?.user) &&
      (getEnv("TIDB_PASSWORD") || getEnv("DB_PASSWORD") || parseDatabaseUrl(getEnv("DATABASE_URL") || getEnv("TIDB_URL"))?.password) &&
      (getEnv("TIDB_DATABASE") || getEnv("DB_NAME") || parseDatabaseUrl(getEnv("DATABASE_URL") || getEnv("TIDB_URL"))?.database)
    );
  },
  get allowDangerousSystemMutations() { return readBooleanEnv(getEnv("ALLOW_DANGEROUS_SYSTEM_MUTATIONS")); },
};
