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
  isOffline?: boolean;
}): string | null {
  // If an explicit audio file (MP3 / WAV / OGG / Data URL / remote audio) is provided and is NOT a YouTube link, prioritize the MP3!
  if (input.audioUrl && input.audioUrl.trim() !== "" && !isYouTubeUrl(input.audioUrl)) {
    return input.audioUrl;
  }

  // Fallback to YouTube URL if available
  const youtubeUrl = normalizeYouTubeUrl(input.youtubeUrl);
  if (youtubeUrl) return youtubeUrl;

  const audioAsYoutube = normalizeYouTubeUrl(input.audioUrl);
  if (audioAsYoutube) return audioAsYoutube;

  return input.audioUrl || null;
}
