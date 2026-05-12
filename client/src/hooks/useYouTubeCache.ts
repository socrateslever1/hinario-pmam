import { useEffect, useState, useCallback } from 'react';

export interface CachedYouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration?: number;
  watchedAt: number;
  duration_seconds?: number;
}

interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  duration?: number;
}

const CACHE_KEY = 'hinario-pmam-youtube-cache';
const THUMBNAIL_CACHE_PREFIX = 'yt-thumb-';
const MAX_CACHED_VIDEOS = 50;

/**
 * Hook para gerenciar cache de vídeos YouTube assistidos
 * Armazena thumbnails, metadados e histórico de visualização
 */
export function useYouTubeCache() {
  const [cachedVideos, setCachedVideos] = useState<CachedYouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar cache ao montar
  useEffect(() => {
    loadCachedVideos();
  }, []);

  const loadCachedVideos = useCallback(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const videos = JSON.parse(stored) as CachedYouTubeVideo[];
        setCachedVideos(videos);
      }
    } catch (error) {
      console.error('[YouTubeCache] Failed to load cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCachedVideos = useCallback((videos: CachedYouTubeVideo[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(videos));
    } catch (error) {
      console.error('[YouTubeCache] Failed to save cache:', error);
    }
  }, []);

  /**
   * Extrair ID do vídeo de URL do YouTube
   */
  const extractVideoId = useCallback((url: string): string | null => {
    if (!url) return null;

    // Formatos suportados:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID

    let videoId: string | null = null;

    if (url.includes('youtube.com/watch')) {
      const match = url.match(/[?&]v=([^&]+)/);
      videoId = match?.[1] || null;
    } else if (url.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([^?]+)/);
      videoId = match?.[1] || null;
    } else if (url.includes('youtube.com/embed/')) {
      const match = url.match(/embed\/([^?]+)/);
      videoId = match?.[1] || null;
    }

    return videoId;
  }, []);

  /**
   * Obter URL da thumbnail do YouTube
   */
  const getThumbnailUrl = useCallback((videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }, []);

  /**
   * Cachear thumbnail do YouTube
   */
  const cacheThumbnail = useCallback(async (videoId: string): Promise<string | null> => {
    try {
      // Verificar se já está em cache
      const cached = localStorage.getItem(`${THUMBNAIL_CACHE_PREFIX}${videoId}`);
      if (cached) {
        return cached;
      }

      const thumbnailUrl = getThumbnailUrl(videoId);

      // Tentar fazer fetch da thumbnail
      const response = await fetch(thumbnailUrl);
      if (!response.ok) {
        // Fallback para qualidade menor
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }

      // Salvar URL em cache (não salvamos blob para economizar espaço)
      localStorage.setItem(`${THUMBNAIL_CACHE_PREFIX}${videoId}`, thumbnailUrl);
      return thumbnailUrl;
    } catch (error) {
      console.error('[YouTubeCache] Failed to cache thumbnail:', error);
      return getThumbnailUrl(videoId);
    }
  }, [getThumbnailUrl]);

  /**
   * Registrar vídeo como assistido
   */
  const markVideoAsWatched = useCallback(
    async (youtubeUrl: string, metadata?: YouTubeVideoMetadata) => {
      const videoId = metadata?.videoId || extractVideoId(youtubeUrl);
      if (!videoId) return;

      try {
        // Cachear thumbnail
        const thumbnail = await cacheThumbnail(videoId);

        // Criar ou atualizar registro
        const newVideo: CachedYouTubeVideo = {
          videoId,
          title: metadata?.title || `Vídeo ${videoId}`,
          thumbnail: thumbnail || getThumbnailUrl(videoId),
          duration: metadata?.duration,
          watchedAt: Date.now(),
        };

        // Atualizar cache (remover duplicatas, manter ordem recente)
        const updated = [
          newVideo,
          ...cachedVideos.filter((v) => v.videoId !== videoId),
        ].slice(0, MAX_CACHED_VIDEOS);

        setCachedVideos(updated);
        saveCachedVideos(updated);

        console.log('[YouTubeCache] Video marked as watched:', videoId);
      } catch (error) {
        console.error('[YouTubeCache] Failed to mark video as watched:', error);
      }
    },
    [cachedVideos, extractVideoId, cacheThumbnail, getThumbnailUrl, saveCachedVideos]
  );

  /**
   * Verificar se vídeo está em cache
   */
  const isVideoCached = useCallback(
    (youtubeUrl: string): boolean => {
      const videoId = extractVideoId(youtubeUrl);
      return videoId ? cachedVideos.some((v) => v.videoId === videoId) : false;
    },
    [cachedVideos, extractVideoId]
  );

  /**
   * Obter vídeo em cache
   */
  const getCachedVideo = useCallback(
    (youtubeUrl: string): CachedYouTubeVideo | undefined => {
      const videoId = extractVideoId(youtubeUrl);
      return videoId ? cachedVideos.find((v) => v.videoId === videoId) : undefined;
    },
    [cachedVideos, extractVideoId]
  );

  /**
   * Limpar cache de vídeos
   */
  const clearCache = useCallback(() => {
    try {
      // Limpar localStorage
      localStorage.removeItem(CACHE_KEY);

      // Limpar thumbnails
      cachedVideos.forEach((video) => {
        localStorage.removeItem(`${THUMBNAIL_CACHE_PREFIX}${video.videoId}`);
      });

      setCachedVideos([]);
      console.log('[YouTubeCache] Cache cleared');
    } catch (error) {
      console.error('[YouTubeCache] Failed to clear cache:', error);
    }
  }, [cachedVideos]);

  /**
   * Remover vídeo específico do cache
   */
  const removeVideo = useCallback(
    (videoId: string) => {
      try {
        const updated = cachedVideos.filter((v) => v.videoId !== videoId);
        setCachedVideos(updated);
        saveCachedVideos(updated);
        localStorage.removeItem(`${THUMBNAIL_CACHE_PREFIX}${videoId}`);
        console.log('[YouTubeCache] Video removed:', videoId);
      } catch (error) {
        console.error('[YouTubeCache] Failed to remove video:', error);
      }
    },
    [cachedVideos, saveCachedVideos]
  );

  /**
   * Obter tamanho do cache em bytes (estimado)
   */
  const getCacheSize = useCallback((): number => {
    let size = 0;
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        size += stored.length * 2; // UTF-16 encoding
      }
      // Adicionar tamanho das thumbnails (estimado)
      cachedVideos.forEach((video) => {
        const thumb = localStorage.getItem(`${THUMBNAIL_CACHE_PREFIX}${video.videoId}`);
        if (thumb) {
          size += thumb.length * 2;
        }
      });
    } catch (error) {
      console.error('[YouTubeCache] Failed to calculate cache size:', error);
    }
    return size;
  }, [cachedVideos]);

  return {
    cachedVideos,
    isLoading,
    markVideoAsWatched,
    isVideoCached,
    getCachedVideo,
    clearCache,
    removeVideo,
    getCacheSize,
    extractVideoId,
    getThumbnailUrl,
  };
}
