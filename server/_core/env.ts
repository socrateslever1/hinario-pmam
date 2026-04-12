function readBooleanEnv(value: string | undefined) {
  return value === "1" || value === "true";
}

function readRequiredEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function parseDatabaseUrl(url: string) {
  try {
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
  appId: process.env.VITE_APP_ID || "default",
  cookieSecret: process.env.JWT_SECRET || "default-secret-key",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL || "https://forge.ai.studio",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
  tidbHost: (() => {
    const fromEnv = readRequiredEnv("TIDB_HOST");
    if (fromEnv) return fromEnv;
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL || "");
    return parsed?.host ?? "";
  })(),
  tidbPort: (() => {
    const fromEnv = process.env.TIDB_PORT;
    if (fromEnv) return parseInt(fromEnv);
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL || "");
    return parsed?.port ? parseInt(parsed.port) : 4000;
  })(),
  tidbUser: (() => {
    const fromEnv = readRequiredEnv("TIDB_USER");
    if (fromEnv) return fromEnv;
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL || "");
    return parsed?.user ?? "";
  })(),
  tidbPassword: (() => {
    const fromEnv = readRequiredEnv("TIDB_PASSWORD");
    if (fromEnv) return fromEnv;
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL || "");
    return parsed?.password ?? "";
  })(),
  tidbDatabase: (() => {
    const fromEnv = readRequiredEnv("TIDB_DATABASE");
    if (fromEnv) return fromEnv;
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL || "");
    return parsed?.database ?? "";
  })(),
  tidbUrl: process.env.TIDB_URL?.trim() ?? "",
  tidbConfigured: Boolean(
    (readRequiredEnv("TIDB_HOST") || parseDatabaseUrl(process.env.DATABASE_URL || "")?.host) &&
    (readRequiredEnv("TIDB_USER") || parseDatabaseUrl(process.env.DATABASE_URL || "")?.user) &&
    (readRequiredEnv("TIDB_PASSWORD") || parseDatabaseUrl(process.env.DATABASE_URL || "")?.password) &&
    (readRequiredEnv("TIDB_DATABASE") || parseDatabaseUrl(process.env.DATABASE_URL || "")?.database)
  ),
  allowDangerousSystemMutations: readBooleanEnv(process.env.ALLOW_DANGEROUS_SYSTEM_MUTATIONS),
};
