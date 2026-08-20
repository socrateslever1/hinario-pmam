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

    const rootUploadsDir = path.resolve(process.cwd(), "uploads");
    const clientUploadsDir = path.resolve(process.cwd(), "client", "public", "uploads");

    const safeFileName = key.replace(/[^a-zA-Z0-9/_.-]/g, "_");

    for (const dir of [rootUploadsDir, clientUploadsDir]) {
      const subDir = path.join(dir, path.dirname(key));
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
      fs.writeFileSync(path.join(dir, safeFileName), buffer);
    }

    return `/uploads/${safeFileName}`;
  } catch {
    // Workers runtime or any other environment where fs is unavailable
    return null;
  }
}

/**
 * Attempt to upload to Supabase Storage if credentials are configured in environment variables.
 */
async function tryUploadToSupabase(key: string, buffer: Buffer, contentType: string): Promise<string | null> {
  const supabaseUrl = ENV.supabaseUrl;
  const supabaseKey = ENV.supabaseServiceKey;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const bucket = "uploads";

    const { error } = await supabase.storage
      .from(bucket)
      .upload(key, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn("[Supabase Storage] Upload error:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(key);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn("[Supabase Storage] Exception:", err);
    return null;
  }
}

// 4.2 MB (4,400,000 bytes) — absolute safe ceiling for TiDB single entry limit (max 6,291,456 bytes) after base64 (+33%)
const MAX_INLINE_BYTES = 4_400_000;

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as any);

  // 1. If Forge API is configured, upload to Forge
  if (!config.isLocalFallback) {
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

  // 2. Try Supabase Storage if configured
  const supabaseUrl = await tryUploadToSupabase(key, buffer, contentType);
  if (supabaseUrl) {
    return { key, url: supabaseUrl };
  }

  // 3. Try to save to the local filesystem (works in Node.js / Express dev server).
  const localUrl = await trySaveToLocalFs(key, buffer);
  if (localUrl) {
    return { key, url: localUrl };
  }

  // 4. Workers environment without external storage — store as data: URI inline for files within TiDB limits.
  if (buffer.length > MAX_INLINE_BYTES) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    throw new Error(
      `O áudio (${sizeMb} MB) excede o limite máximo permitido pelo banco de dados (máx. 4.2 MB). ` +
      `Converta o áudio para MP3 (taxa de 128 kbps) para reduzir o tamanho do arquivo.`
    );
  }

  const base64 = buffer.toString("base64");
  const mimeType = contentType || "application/octet-stream";
  return { key, url: `data:${mimeType};base64,${base64}` };
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
