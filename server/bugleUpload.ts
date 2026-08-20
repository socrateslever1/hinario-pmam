import type { User } from "../shared/types";
import * as bugleDb from "./bugleDb";
import { query } from "./mysql";
import { getXerifeAssignment } from "./serviceScaleDb";

export type BugleUploadKind = "call" | "march";

export const MAX_BUGLE_AUDIO_SIZE = 50 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  webm: "audio/webm",
};

const GLOBAL_COMMAND_ROLES = new Set([
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
]);

export function validateBugleUpload(fileName: string, fileSize: number) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const mimeType = MIME_BY_EXTENSION[extension];
  if (!mimeType) {
    return { error: "Use um áudio MP3, WAV, OGG, M4A, AAC ou WEBM." } as const;
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return { error: "O arquivo de áudio está vazio ou inválido." } as const;
  }
  if (fileSize > MAX_BUGLE_AUDIO_SIZE) {
    return { error: "O áudio deve ter no máximo 50 MB." } as const;
  }
  return { extension, mimeType } as const;
}

export async function canManageBugleUploads(user: User | null) {
  if (!user) return false;
  if (user.role === "master" || user.role === "admin" || GLOBAL_COMMAND_ROLES.has(user.role)) {
    return true;
  }
  return (await getXerifeAssignment(user.id))?.level === "principal";
}

export async function getCurrentBugleAudioUrl(kind: BugleUploadKind, id: number) {
  const table = kind === "call" ? "pmam_bugle_calls" : "pmam_marches";
  const rows = await query<{ audio_url: string | null }>(
    `SELECT audio_url FROM ${table} WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows.length ? rows[0].audio_url : undefined;
}

export async function setBugleAudioUrl(kind: BugleUploadKind, id: number, audioUrl: string) {
  if (kind === "call") await bugleDb.updateBugleCall(id, { audioUrl });
  else await bugleDb.updateMarch(id, { audioUrl });
}
