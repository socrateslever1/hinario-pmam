/**
 * Version management for auto-update mechanism
 * Returns current build version and timestamp
 */

export interface VersionInfo {
  version: string;
  timestamp: number;
  buildTime: string;
}

// Versão estável por processo: usa BUILD_VERSION se disponível,
// caso contrário usa o timestamp de início do processo (único por deploy)
const PROCESS_START_TIME = Date.now();
const STABLE_VERSION = process.env.BUILD_VERSION || `build-${PROCESS_START_TIME}`;

/**
 * Get current version info
 * This is injected during build time
 */
export function getVersionInfo(): VersionInfo {
  const version = STABLE_VERSION;
  const timestamp = parseInt(process.env.BUILD_TIMESTAMP || PROCESS_START_TIME.toString(), 10);
  const buildTime = new Date(timestamp).toISOString();

  return {
    version,
    timestamp,
    buildTime,
  };
}

/**
 * Generate version hash from package.json and environment
 */
export function generateVersionHash(): string {
  const now = Date.now();
  const hash = Buffer.from(`${now}`).toString('base64').slice(0, 8);
  return hash;
}
