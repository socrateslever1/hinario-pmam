// Preconfigured storage helpers
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)
// When Forge API is not configured, falls back to data: URIs (base64 inline)
// which are compatible with Cloudflare Workers (no Node.js fs available).

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

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);

  if (config.isLocalFallback) {
    // No Forge API configured. Store as a data: URI (base64-encoded inline).
    // This works in both Cloudflare Workers and Node.js without needing fs.
    const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as any);
    const base64 = buffer.toString("base64");
    const mimeType = contentType || "application/octet-stream";
    const url = `data:${mimeType};base64,${base64}`;
    return { key, url };
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

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const config = getStorageConfig();
  const key = normalizeKey(relKey);

  if (config.isLocalFallback) {
    const fileName = key.split("/").pop() ?? key;
    return {
      key,
      url: `/uploads/${fileName}`,
    };
  }

  const { baseUrl, apiKey } = config;
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey),
  };
}
