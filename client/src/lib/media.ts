export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;

  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|watch\?.+&v=)|music\.youtube\.com\/watch\?v=)([^&?\s]+)/i,
  );

  return match ? match[1] : null;
}

export function normalizeYouTubeUrl(url?: string | null): string | null {
  const videoId = extractYouTubeId(url);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

export function isYouTubeUrl(url?: string | null): boolean {
  return Boolean(extractYouTubeId(url));
}

export function resolvePlayableMediaUrl(input: {
  youtubeUrl?: string | null;
  audioUrl?: string | null;
}): string | null {
  const youtubeUrl = normalizeYouTubeUrl(input.youtubeUrl);
  if (youtubeUrl) return youtubeUrl;

  const audioAsYoutube = normalizeYouTubeUrl(input.audioUrl);
  if (audioAsYoutube) return audioAsYoutube;

  return input.audioUrl || null;
}

export function isLocalAudio(url?: string | null): boolean {
  if (!url) return false;
  const isYoutube = isYouTubeUrl(url);
  if (isYoutube) return false;

  // Verifica extensões comuns de áudio
  return /\.(mp3|wav|m4a|ogg|aac|flac)(\?.*)?$/i.test(url) || 
         url.includes('manus.space') || 
         url.includes('cloudfront.net');
}
