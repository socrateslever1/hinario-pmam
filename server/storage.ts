// Preconfigured storage helpers
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)
//
// Fallback (no Forge API configured):
//   - Node.js / Express: saves the file to the local `uploads/` directory on disk.
//   - Cloudflare Workers: saves as a data: URI in-memory (max 500 KB; larger files
//     require Forge API to be configured in the environment variables).

import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig & { isLocalFallback?: boolean } {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    return { baseUrl: "", apiKey: "", isLocalFallback: true };
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

/**
 * Attempt to save the buffer to the local `uploads/` directory on disk.
 * Uses a dynamic import so the module-level bundle in Cloudflare Workers never
 * references `node:fs` (which is not implemented there).
 *
 * Returns the local URL if successful, or null if the filesystem is unavailable
 * (e.g. in a Cloudflare Workers environment).
 */
async function trySaveToLocalFs(key: string, buffer: Buffer): Promise<string | null> {
  try {
    // Dynamic imports are resolved only at runtime in Node.js; in Workers they
    // throw during evaluation so we catch the error and return null.
    const [{ default: fs }, { default: path }] = await Promise.all([
      import("node:fs") as Promise<{ default: typeof import("fs") }>,
      import("node:path") as Promise<{ default: typeof import("path") }>,
    ]);

    const uploadsDir = path.resolve(process.cwd(), "uploads");
    // Create subdirectories from the key (e.g. "bugle/calls/1-abc.mp3" → uploads/bugle/calls/)
    const subDir = path.join(uploadsDir, path.dirname(key));
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }
    const safeFileName = key.replace(/[^a-zA-Z0-9/_.-]/g, "_");
    const filePath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${safeFileName}`;
  } catch {
    // Workers runtime or any other environment where fs is unavailable
    return null;
  }
}

// 500 KB — safe ceiling for a TiDB row (max 6 MB) when base64-encoded (~33% overhead)
const MAX_INLINE_BYTES = 500 * 1024;

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);

  if (config.isLocalFallback) {
    const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as any);

    // 1. Try to save to the local filesystem (works in Node.js / Express dev server).
    const localUrl = await trySaveToLocalFs(key, buffer);
    if (localUrl) {
      return { key, url: localUrl };
    }

    // 2. Workers environment — store as data: URI only for small files.
    if (buffer.length > MAX_INLINE_BYTES) {
      throw new Error(
        `Arquivo muito grande para armazenamento local (${Math.round(buffer.length / 1024)} KB). ` +
        `Configure BUILT_IN_FORGE_API_URL e BUILT_IN_FORGE_API_KEY no ambiente para envios acima de ${Math.round(MAX_INLINE_BYTES / 1024)} KB.`
      );
    }

    const base64 = buffer.toString("base64");
    const mimeType = contentType || "application/octet-stream";
    return { key, url: `data:${mimeType};base64,${base64}` };
  }

  const { baseUrl, apiKey } = config;
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);

  if (config.isLocalFallback) {
    // Reconstruct the same path used by storagePut
    const safeFileName = key.replace(/[^a-zA-Z0-9/_.-]/g, "_");
    return { key, url: `/uploads/${safeFileName}` };
  }

  const { baseUrl, apiKey } = config;
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}
