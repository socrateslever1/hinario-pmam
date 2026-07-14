function getEnv(name: string): string {
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).cloudflareEnv && (globalThis as any).cloudflareEnv[name]) {
    return (globalThis as any).cloudflareEnv[name];
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
      user: urlObj.username,
      password: urlObj.password,
      database: urlObj.pathname.replace("/", ""),
    };
  } catch {
    return null;
  }
}

export const ENV = {
  get appId() { return getEnv("VITE_APP_ID") || "default"; },
  get cookieSecret() { return getEnv("JWT_SECRET") || "default-secret-key"; },
  get databaseUrl() { return getEnv("DATABASE_URL"); },
  get oAuthServerUrl() { return getEnv("OAUTH_SERVER_URL") || "https://forge.ai.studio"; },
  get ownerOpenId() { return getEnv("OWNER_OPEN_ID"); },
  get isProduction() { return getEnv("NODE_ENV") === "production"; },
  get forgeApiUrl() { return getEnv("BUILT_IN_FORGE_API_URL"); },
  get forgeApiKey() { return getEnv("BUILT_IN_FORGE_API_KEY"); },
  get supabaseUrl() { return getEnv("VITE_SUPABASE_URL"); },
  get supabaseServiceKey() { return getEnv("SUPABASE_SERVICE_ROLE_KEY") || getEnv("VITE_SUPABASE_ANON_KEY"); },
  get tidbHost() {
    const fromEnv = getEnv("TIDB_HOST");
    if (fromEnv) return fromEnv;
    return parseDatabaseUrl(getEnv("DATABASE_URL"))?.host ?? "";
  },
  get tidbPort() {
    const fromEnv = getEnv("TIDB_PORT");
    if (fromEnv) return parseInt(fromEnv);
    const parsed = parseDatabaseUrl(getEnv("DATABASE_URL"));
    return parsed?.port ? parseInt(parsed.port) : 4000;
  },
  get tidbUser() {
    const fromEnv = getEnv("TIDB_USER");
    if (fromEnv) return fromEnv;
    return parseDatabaseUrl(getEnv("DATABASE_URL"))?.user ?? "";
  },
  get tidbPassword() {
    const fromEnv = getEnv("TIDB_PASSWORD");
    if (fromEnv) return fromEnv;
    return parseDatabaseUrl(getEnv("DATABASE_URL"))?.password ?? "";
  },
  get tidbDatabase() {
    const fromEnv = getEnv("TIDB_DATABASE");
    if (fromEnv) return fromEnv;
    return parseDatabaseUrl(getEnv("DATABASE_URL"))?.database ?? "";
  },
  get tidbUrl() { return getEnv("TIDB_URL"); },
  get tidbConfigured() {
    return Boolean(
      (getEnv("TIDB_HOST") || parseDatabaseUrl(getEnv("DATABASE_URL"))?.host) &&
      (getEnv("TIDB_USER") || parseDatabaseUrl(getEnv("DATABASE_URL"))?.user) &&
      (getEnv("TIDB_PASSWORD") || parseDatabaseUrl(getEnv("DATABASE_URL"))?.password) &&
      (getEnv("TIDB_DATABASE") || parseDatabaseUrl(getEnv("DATABASE_URL"))?.database)
    );
  },
  get allowDangerousSystemMutations() { return readBooleanEnv(getEnv("ALLOW_DANGEROUS_SYSTEM_MUTATIONS")); },
};
