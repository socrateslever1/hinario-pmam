import type { User } from "../shared/types";
import { getXerifeAssignment } from "./serviceScaleDb";

export const MAX_GENERIC_UPLOAD_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf", "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
]);

const COMMAND_ROLES = new Set([
  "master", "admin", "comandante_corpo", "subcomandante_corpo",
  "sub_comandante_corpo", "comandante_cfap", "subcomandante_cfap",
  "sub_comandante_cfap", "comandante_cia", "comandante_pel",
]);

export async function canUseGenericUpload(user: User | null) {
  if (!user || user.role === "student") return false;
  if (COMMAND_ROLES.has(user.role)) return true;
  return Boolean(await getXerifeAssignment(user.id));
}

export function validateGenericUpload(file: { name: string; type: string; size: number }) {
  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { error: "Formato não permitido. Envie imagem, PDF ou documento de escritório." } as const;
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { error: "O arquivo está vazio ou inválido." } as const;
  }
  if (file.size > MAX_GENERIC_UPLOAD_SIZE) {
    return { error: "O arquivo deve ter no máximo 20 MB." } as const;
  }
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return { mimeType, extension } as const;
}
