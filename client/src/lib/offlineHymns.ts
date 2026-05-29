import type { Hymn } from '@shared/types';

const DB_NAME = 'hinario-pmam-hymns-offline';
const DB_VERSION = 2;
const HYMNS_STORE = 'hymns';
const AUDIO_STORE = 'audio-v2';

export type HymnAudioVariant = 'voice' | 'instrumental';

export type CachedHymn = Hymn & {
  cachedAt: number;
  audioCachedAt?: number | null;
  audioCacheError?: string | null;
};

type CachedAudioRecord = {
  key: string;
  hymnId: number;
  variant: HymnAudioVariant;
  sourceUrl: string;
  blob: Blob;
  mimeType: string;
  cachedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function openOfflineHymnsDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(HYMNS_STORE)) {
        database.createObjectStore(HYMNS_STORE, { keyPath: 'id' });
      }

      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE, { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
}

function runStoreOperation<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  return openOfflineHymnsDB().then((database) => (
    new Promise<T | undefined>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve(request ? request.result : undefined);
    })
  ));
}

export async function saveCachedHymn(hymn: Hymn, patch: Partial<CachedHymn> = {}) {
  const existing = await getCachedHymn(hymn.id);
  const record: CachedHymn = {
    ...hymn,
    cachedAt: Date.now(),
    audioCachedAt: existing?.audioCachedAt ?? null,
    audioCacheError: existing?.audioCacheError ?? null,
    ...patch,
  };

  await runStoreOperation(HYMNS_STORE, 'readwrite', (store) => store.put(record));
  return record;
}

export async function getCachedHymn(id: number): Promise<CachedHymn | null> {
  const record = await runStoreOperation<CachedHymn>(HYMNS_STORE, 'readonly', (store) => store.get(id));
  return record ?? null;
}

export async function getCachedHymns(): Promise<CachedHymn[]> {
  const records = await runStoreOperation<CachedHymn[]>(HYMNS_STORE, 'readonly', (store) => store.getAll());
  return (records ?? []).sort((a, b) => a.number - b.number);
}

function getAudioKey(id: number, variant: HymnAudioVariant) {
  return `${id}:${variant}`;
}

function getAudioSourceUrl(hymn: Hymn, variant: HymnAudioVariant) {
  return variant === 'instrumental' ? hymn.instrumentalAudioUrl : hymn.audioUrl;
}

export async function getCachedHymnAudio(
  id: number,
  sourceUrl?: string | null,
  variant: HymnAudioVariant = 'voice',
): Promise<Blob | null> {
  const record = await runStoreOperation<CachedAudioRecord>(AUDIO_STORE, 'readonly', (store) => store.get(getAudioKey(id, variant)));
  if (!record) return null;
  if (sourceUrl && record.sourceUrl !== sourceUrl) return null;
  return record.blob;
}

export async function cacheHymnForOffline(
  hymn: Hymn,
  variants: HymnAudioVariant[] = ['voice', 'instrumental'],
): Promise<CachedHymn> {
  let cached = await saveCachedHymn(hymn);

  for (const variant of variants) {
    const sourceUrl = getAudioSourceUrl(hymn, variant);
    if (!sourceUrl) continue;

    const existingAudio = await getCachedHymnAudio(hymn.id, sourceUrl, variant);
    if (existingAudio) {
      cached = await saveCachedHymn(hymn, {
        audioCachedAt: cached.audioCachedAt ?? Date.now(),
        audioCacheError: null,
      });
      continue;
    }

    try {
      const response = await fetch(sourceUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Arquivo de audio vazio');
      }

      const audioRecord: CachedAudioRecord = {
        key: getAudioKey(hymn.id, variant),
        hymnId: hymn.id,
        variant,
        sourceUrl,
        blob,
        mimeType: blob.type || response.headers.get('content-type') || 'audio/mpeg',
        cachedAt: Date.now(),
      };

      await runStoreOperation(AUDIO_STORE, 'readwrite', (store) => store.put(audioRecord));
      cached = await saveCachedHymn(hymn, {
        audioCachedAt: audioRecord.cachedAt,
        audioCacheError: null,
      });
    } catch (error) {
      cached = await saveCachedHymn(hymn, {
        audioCacheError: error instanceof Error ? error.message : 'Falha ao baixar audio',
      });
    }
  }

  return cached;
}
