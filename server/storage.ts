// Preconfigured storage helpers
// Uses the Biz-provided storage proxy (Authorization: Bearer <token>)

import { ENV } from './_core/env';
import fs from 'fs/promises';
import path from 'path';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig | null {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    return null;
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
  if (config) {
    try {
      const { baseUrl, apiKey } = config;
      const key = normalizeKey(relKey);
      const uploadUrl = buildUploadUrl(baseUrl, key);
      const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: buildAuthHeaders(apiKey),
        body: formData,
      });

      if (response.ok) {
        const url = (await response.json()).url;
        return { key, url };
      }
    } catch (err) {
      console.error("Remote storage failed, falling back to local:", err);
    }
  }

  // Fallback local
  console.log("Usando armazenamento local para:", relKey);
  const key = normalizeKey(relKey);
  const filePath = path.join(process.cwd(), "uploads", key);
  const dir = path.dirname(filePath);
  
  await fs.mkdir(dir, { recursive: true });
  
  let buffer: Buffer;
  if (typeof data === 'string') {
    buffer = Buffer.from(data, 'base64');
  } else {
    buffer = Buffer.from(data as any);
  }
  
  await fs.writeFile(filePath, buffer);
  return { key, url: `/uploads/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const config = getStorageConfig();
  if (config) {
    try {
      const { baseUrl, apiKey } = config;
      const key = normalizeKey(relKey);
      return {
        key,
        url: await buildDownloadUrl(baseUrl, key, apiKey),
      };
    } catch (err) {
      console.error("Remote get failed, falling back to local:", err);
    }
  }
  
  const key = normalizeKey(relKey);
  return { key, url: `/uploads/${key}` };
}
