/**
 * Version management for auto-update mechanism
 * Returns current build version and timestamp
 */

export interface VersionInfo {
  version: string;
  timestamp: number;
  buildTime: string;
}

/**
 * Get current version info
 * This is injected during build time
 */
export function getVersionInfo(): VersionInfo {
  const version = process.env.BUILD_VERSION || 'unknown';
  const timestamp = parseInt(process.env.BUILD_TIMESTAMP || Date.now().toString(), 10);
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
