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
  // Manus (TiDB) Configuration
  tidbHost: process.env.TIDB_HOST || "gateway03.us-east-1.prod.aws.tidbcloud.com",
  tidbPort: parseInt(process.env.TIDB_PORT || "4000"),
  tidbUser: process.env.TIDB_USER || "CZ6fqEVQpCUKFJb.9db839fe7bfc",
  tidbPassword: process.env.TIDB_PASSWORD || "etH2wXWdiR822X4tgm9p",
  tidbDatabase: process.env.TIDB_DATABASE || "oYQqDtLooPR5vbQ65ChDb9",
  tidbUrl: process.env.TIDB_URL || 'mysql://CZ6fqEVQpCUKFJb.9db839fe7bfc:etH2wXWdiR822X4tgm9p@gateway03.us-east-1.prod.aws.tidbcloud.com:4000/oYQqDtLooPR5vbQ65ChDb9?ssl={"rejectUnauthorized":true}',
};
