import { useEffect, useState } from 'react';

/**
 * Hook para cachear dados em IndexedDB para offline
 * Sincroniza com Service Worker via postMessage
 */

const DB_NAME = 'hinario-pmam-offline';
const DB_VERSION = 1;

interface OfflineStore {
  key: string;
  data: any;
  timestamp: number;
}

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains('offline-data')) {
        database.createObjectStore('offline-data', { keyPath: 'key' });
      }
    };
  });
}

export async function saveOfflineData(key: string, data: any): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction(['offline-data'], 'readwrite');
    const store = transaction.objectStore('offline-data');

    await new Promise((resolve, reject) => {
      const request = store.put({
        key,
        data,
        timestamp: Date.now(),
      });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(undefined);
    });

    console.log('[Offline] Saved:', key);
  } catch (error) {
    console.error('[Offline] Failed to save:', key, error);
  }
}

export async function getOfflineData(key: string): Promise<any | null> {
  try {
    const database = await initDB();
    const transaction = database.transaction(['offline-data'], 'readonly');
    const store = transaction.objectStore('offline-data');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log('[Offline] Loaded:', key);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('[Offline] Failed to load:', key, error);
    return null;
  }
}

export async function clearOfflineData(): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction(['offline-data'], 'readwrite');
    const store = transaction.objectStore('offline-data');

    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(undefined);
    });

    console.log('[Offline] Cleared all data');
  } catch (error) {
    console.error('[Offline] Failed to clear:', error);
  }
}

export function useOfflineData(key: string) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getOfflineData(key).then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, [key]);

  return { data, isLoading };
}
