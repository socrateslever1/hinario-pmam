function readBooleanEnv(value: string | undefined) {
  return value === "1" || value === "true";
}

function readRequiredEnv(name: string) {
  return process.env[name]?.trim() ?? "";
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
  tidbHost: readRequiredEnv("TIDB_HOST"),
  tidbPort: parseInt(process.env.TIDB_PORT || "4000"),
  tidbUser: readRequiredEnv("TIDB_USER"),
  tidbPassword: readRequiredEnv("TIDB_PASSWORD"),
  tidbDatabase: readRequiredEnv("TIDB_DATABASE"),
  tidbUrl: process.env.TIDB_URL?.trim() ?? "",
  tidbConfigured: Boolean(
    readRequiredEnv("TIDB_HOST") &&
    readRequiredEnv("TIDB_USER") &&
    readRequiredEnv("TIDB_PASSWORD") &&
    readRequiredEnv("TIDB_DATABASE")
  ),
  allowDangerousSystemMutations: readBooleanEnv(process.env.ALLOW_DANGEROUS_SYSTEM_MUTATIONS),
};
