import { useEffect, useState } from 'react';
import type { Hymn } from '@shared/types';
import {
  cacheHymnForOffline,
  getCachedHymn,
  getCachedHymnAudio,
  getCachedHymns,
  saveCachedHymn,
  type CachedHymn,
} from '@/lib/offlineHymns';

type CacheStatus = 'idle' | 'saving' | 'ready' | 'metadata-only' | 'error';

export function useCachedHymn(hymnId: number, onlineHymn?: Hymn | null) {
  const [cachedHymn, setCachedHymn] = useState<CachedHymn | null>(null);
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);
  const [cachedInstrumentalAudioUrl, setCachedInstrumentalAudioUrl] = useState<string | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    async function loadObjectUrl(id: number, sourceUrl: string | null | undefined, variant: 'voice' | 'instrumental') {
      if (!sourceUrl) return null;
      const blob = await getCachedHymnAudio(id, sourceUrl, variant);
      if (!blob) return null;
      const objectUrl = URL.createObjectURL(blob);
      objectUrls.push(objectUrl);
      return objectUrl;
    }

    async function loadCachedHymn() {
      setIsLoadingCache(true);

      try {
        const record = await getCachedHymn(hymnId);
        if (cancelled) return;

        setCachedHymn(record);

        if (record) {
          const [voiceUrl, instrumentalUrl] = await Promise.all([
            loadObjectUrl(record.id, record.audioUrl, 'voice'),
            loadObjectUrl(record.id, record.instrumentalAudioUrl, 'instrumental'),
          ]);
          if (cancelled) return;

          setCachedAudioUrl(voiceUrl);
          setCachedInstrumentalAudioUrl(instrumentalUrl);
          setCacheStatus(voiceUrl || instrumentalUrl ? 'ready' : 'metadata-only');
        } else {
          setCacheStatus('metadata-only');
        }
      } catch {
        if (!cancelled) setCacheStatus('error');
      } finally {
        if (!cancelled) setIsLoadingCache(false);
      }
    }

    loadCachedHymn();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [hymnId]);

  useEffect(() => {
    if (!onlineHymn) return;

    let cancelled = false;
    const objectUrls: string[] = [];

    async function saveOnlineHymn() {
      setCacheStatus('saving');

      try {
        const record = await cacheHymnForOffline(onlineHymn);
        if (cancelled) return;

        setCachedHymn(record);

        const [voiceBlob, instrumentalBlob] = await Promise.all([
          record.audioUrl ? getCachedHymnAudio(record.id, record.audioUrl, 'voice') : null,
          record.instrumentalAudioUrl ? getCachedHymnAudio(record.id, record.instrumentalAudioUrl, 'instrumental') : null,
        ]);
        if (cancelled) return;

        const voiceUrl = voiceBlob ? URL.createObjectURL(voiceBlob) : null;
        const instrumentalUrl = instrumentalBlob ? URL.createObjectURL(instrumentalBlob) : null;
        if (voiceUrl) objectUrls.push(voiceUrl);
        if (instrumentalUrl) objectUrls.push(instrumentalUrl);

        setCachedAudioUrl((current) => {
          if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
          return voiceUrl;
        });
        setCachedInstrumentalAudioUrl((current) => {
          if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
          return instrumentalUrl;
        });

        if (voiceUrl || instrumentalUrl) {
          setCacheStatus('ready');
          return;
        }

        setCacheStatus('metadata-only');
      } catch {
        if (!cancelled) setCacheStatus('error');
      }
    }

    saveOnlineHymn();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [onlineHymn]);

  return {
    cachedHymn,
    cachedAudioUrl,
    cachedInstrumentalAudioUrl,
    isLoadingCache,
    cacheStatus,
  };
}

export function useCachedHymnCatalog(onlineHymns?: Hymn[] | null) {
  const [cachedHymns, setCachedHymns] = useState<CachedHymn[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setIsLoadingCache(true);
      const records = await getCachedHymns();
      if (!cancelled) {
        setCachedHymns(records);
        setIsLoadingCache(false);
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onlineHymns || onlineHymns.length === 0) return;

    let cancelled = false;

    async function saveCatalog() {
      await Promise.all(onlineHymns.map((hymn) => saveCachedHymn(hymn)));
      if (!cancelled) {
        setCachedHymns(await getCachedHymns());
      }
    }

    saveCatalog();

    return () => {
      cancelled = true;
    };
  }, [onlineHymns]);

  return {
    cachedHymns,
    isLoadingCache,
  };
}
