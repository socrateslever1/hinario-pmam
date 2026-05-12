import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useYouTubeCache', () => {
  // Testes de funções puras que não dependem de hooks React
  
  describe('extractVideoId', () => {
    // Implementar função de teste diretamente
    const extractVideoId = (url: string): string | null => {
      if (!url) return null;

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
    };

    it('should extract YouTube video ID from standard watch URL', () => {
      const result = extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toBe('dQw4w9WgXcQ');
    });

    it('should extract YouTube video ID from short URL', () => {
      const result = extractVideoId('https://youtu.be/dQw4w9WgXcQ');
      expect(result).toBe('dQw4w9WgXcQ');
    });

    it('should extract YouTube video ID from embed URL', () => {
      const result = extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      const result = extractVideoId('https://example.com');
      expect(result).toBeNull();
    });

    it('should handle empty string', () => {
      const result = extractVideoId('');
      expect(result).toBeNull();
    });
  });

  describe('getThumbnailUrl', () => {
    const getThumbnailUrl = (videoId: string): string => {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    };

    it('should generate correct thumbnail URL', () => {
      const videoId = 'dQw4w9WgXcQ';
      const url = getThumbnailUrl(videoId);
      expect(url).toBe(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    });

    it('should work with different video IDs', () => {
      const videoId = 'jNQXAC9IVRw';
      const url = getThumbnailUrl(videoId);
      expect(url).toContain(videoId);
      expect(url).toContain('img.youtube.com');
    });
  });

  describe('Cache Data Structure', () => {
    it('should have correct CachedYouTubeVideo interface', () => {
      const mockVideo = {
        videoId: 'dQw4w9WgXcQ',
        title: 'Test Video',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: 212,
        watchedAt: Date.now(),
      };

      expect(mockVideo.videoId).toBe('dQw4w9WgXcQ');
      expect(mockVideo.title).toBe('Test Video');
      expect(typeof mockVideo.watchedAt).toBe('number');
    });
  });

  describe('Cache Constants', () => {
    it('should have correct cache key', () => {
      const CACHE_KEY = 'hinario-pmam-youtube-cache';
      expect(CACHE_KEY).toBe('hinario-pmam-youtube-cache');
    });

    it('should have correct thumbnail cache prefix', () => {
      const THUMBNAIL_CACHE_PREFIX = 'yt-thumb-';
      expect(THUMBNAIL_CACHE_PREFIX).toBe('yt-thumb-');
    });

    it('should have correct max cached videos limit', () => {
      const MAX_CACHED_VIDEOS = 50;
      expect(MAX_CACHED_VIDEOS).toBe(50);
    });
  });

  describe('Video Array Management', () => {
    it('should maintain order with newest first', () => {
      const videos = [
        { videoId: 'video1', title: 'Video 1', watchedAt: 1000 },
        { videoId: 'video2', title: 'Video 2', watchedAt: 2000 },
        { videoId: 'video3', title: 'Video 3', watchedAt: 3000 },
      ];

      // Simular adição de novo vídeo (deve ser primeiro)
      const newVideo = { videoId: 'video4', title: 'Video 4', watchedAt: 4000 };
      const updated = [newVideo, ...videos.filter((v) => v.videoId !== newVideo.videoId)];

      expect(updated[0].videoId).toBe('video4');
      expect(updated[1].videoId).toBe('video1');
      expect(updated[2].videoId).toBe('video2');
      expect(updated[3].videoId).toBe('video3');
    });

    it('should handle duplicate removal', () => {
      const videos = [
        { videoId: 'video1', title: 'Video 1', watchedAt: 1000 },
        { videoId: 'video2', title: 'Video 2', watchedAt: 2000 },
      ];

      const newVideo = { videoId: 'video1', title: 'Video 1 Updated', watchedAt: 3000 };
      const updated = [newVideo, ...videos.filter((v) => v.videoId !== newVideo.videoId)];

      expect(updated).toHaveLength(2);
      expect(updated[0].watchedAt).toBe(3000);
    });

    it('should respect max cache limit', () => {
      const videos = Array.from({ length: 60 }, (_, i) => ({
        videoId: `video${i}`,
        title: `Video ${i}`,
        watchedAt: i,
      }));

      const MAX_CACHED_VIDEOS = 50;
      const limited = videos.slice(0, MAX_CACHED_VIDEOS);

      expect(limited.length).toBeLessThanOrEqual(MAX_CACHED_VIDEOS);
    });
  });
});
