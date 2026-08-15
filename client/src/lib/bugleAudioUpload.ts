export const BUGLE_AUDIO_ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/x-m4a,audio/aac";
export const BUGLE_AUDIO_MAX_SIZE = 50 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(["mp3", "wav", "ogg", "m4a", "aac", "webm"]);

export function validateBugleAudioFile(file: Pick<File, "name" | "size">) {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase() || "";
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "Use um áudio MP3, WAV, OGG, M4A, AAC ou WEBM.";
  }
  if (file.size <= 0) return "O arquivo de áudio está vazio.";
  if (file.size > BUGLE_AUDIO_MAX_SIZE) return "O áudio deve ter no máximo 50 MB.";
  return null;
}
