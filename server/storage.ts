// Preconfigured storage helpers
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)
//
// Storage order: Cloudflare R2, Forge, Supabase, then local disk in Node.js.
// Cloudflare never stores binary files inline in the relational database.

import { ENV } from './_core/env';
import { normalizeStorageKey, publicStorageUrl } from './storagePath';

type StorageConfig = { baseUrl: string; apiKey: string };
type R2BucketLike = {
  put: (
    key: string,
    value: Uint8Array,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ) => Promise<unknown>;
  delete: (key: string) => Promise<unknown>;
};

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
  return normalizeStorageKey(relKey);
}

function getCloudflareBucket(): R2BucketLike | null {
  return (globalThis as any).cloudflareEnv?.UPLOADS_BUCKET ?? null;
}

function isCloudflareRuntime() {
  return typeof (globalThis as any).cloudflareEnv !== "undefined";
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

    const safeKey = key.replace(/[^a-zA-Z0-9/_.-]/g, "_");

    for (const dir of [rootUploadsDir, clientUploadsDir]) {
      const targetFilePath = path.join(dir, safeKey);
      const subDir = path.dirname(targetFilePath);
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }
      fs.writeFileSync(targetFilePath, buffer);
    }

    return `/uploads/${safeKey}`;
  } catch (err) {
    console.error("[Local Storage Put Error]", err);
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

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as any);

  // Cloudflare Pages must use persistent object storage. Filesystem writes are
  // ephemeral there, and binary audio must not be embedded in a TiDB row.
  const bucket = getCloudflareBucket();
  if (bucket) {
    await bucket.put(key, new Uint8Array(buffer), {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    return { key, url: publicStorageUrl(key) };
  }

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

  if (isCloudflareRuntime()) {
    const { putDatabaseObject } = await import("./databaseObjectStorage");
    await putDatabaseObject(key, buffer, contentType);
    return { key, url: publicStorageUrl(key) };
  }

  // 3. Try to save to the local filesystem (works in Node.js / Express dev server).
  const localUrl = await trySaveToLocalFs(key, buffer);
  if (localUrl) {
    return { key, url: localUrl };
  }

  throw new Error("Não foi possível acessar um armazenamento persistente para o arquivo.");
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);

  if (getCloudflareBucket()) {
    return { key, url: publicStorageUrl(key) };
  }

  if (config.isLocalFallback) {
    if (isCloudflareRuntime()) {
      return { key, url: publicStorageUrl(key) };
    }
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

export async function storageDelete(relKey: string): Promise<boolean> {
  const key = normalizeKey(relKey);
  const bucket = getCloudflareBucket();
  if (bucket) {
    await bucket.delete(key);
    return true;
  }

  if (ENV.supabaseUrl && ENV.supabaseServiceKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(ENV.supabaseUrl, ENV.supabaseServiceKey);
      const { error } = await supabase.storage.from("uploads").remove([key]);
      if (!error) return true;
    } catch (error) {
      console.warn("[Storage rollback] Falha no Supabase", error);
    }
  }

  if (isCloudflareRuntime()) {
    const { deleteDatabaseObject } = await import("./databaseObjectStorage");
    await deleteDatabaseObject(key);
    return true;
  }

  if (!isCloudflareRuntime()) {
    try {
      const [{ default: fs }, { default: path }] = await Promise.all([
        import("node:fs") as Promise<{ default: typeof import("fs") }>,
        import("node:path") as Promise<{ default: typeof import("path") }>,
      ]);
      const safeKey = key.replace(/[^a-zA-Z0-9/_.-]/g, "_");
      for (const root of [path.resolve(process.cwd(), "uploads"), path.resolve(process.cwd(), "client", "public", "uploads")]) {
        const target = path.resolve(root, safeKey);
        if (target.startsWith(`${root}${path.sep}`) && fs.existsSync(target)) fs.unlinkSync(target);
      }
      return true;
    } catch (error) {
      console.warn("[Storage rollback] Falha no disco local", error);
    }
  }
  return false;
}

export async function storagePutWithRollback<T>(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
  persist: (stored: { key: string; url: string }) => Promise<T>,
): Promise<T> {
  const stored = await storagePut(relKey, data, contentType);
  try {
    return await persist(stored);
  } catch (error) {
    await storageDelete(stored.key).catch((rollbackError) => {
      console.error("[Storage rollback] Não foi possível remover o arquivo órfão", rollbackError);
    });
    throw error;
  }
}
