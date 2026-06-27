import { useEffect } from 'react';
import { usePWA } from './usePWA';

/**
 * Hook para sincronizar dados em background quando voltar online
 * Detecta quando o app volta online e sincroniza dados
 */
export function useBackgroundSync() {
  const { isOnline, swReady } = usePWA();

  useEffect(() => {
    if (!swReady) return;

    const handleOnline = async () => {
      console.log('[BackgroundSync] Voltou online, sincronizando...');

      try {
        // Atualizar dados críticos
        const criticalUrls = [
          '/api/trpc/hymns.list?batch=1',
          '/api/trpc/education.listModules?batch=1',
          '/api/trpc/drill.list?batch=1',
          '/api/trpc/blog.list?batch=1',
        ];

        for (const url of criticalUrls) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              const cache = await caches.open('hinario-pmam-cache-v2');
              await cache.put(url, response.clone());
              console.log('[BackgroundSync] Atualizado:', url);
            }
          } catch (err) {
            console.warn('[BackgroundSync] Erro ao atualizar:', url, err);
          }
        }

        // Enviar evento para o Service Worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SYNC_DATA',
            timestamp: Date.now(),
          });
        }

        console.log('[BackgroundSync] Sincronização concluída');
      } catch (err) {
        console.error('[BackgroundSync] Erro durante sincronização:', err);
      }
    };

    const handleOffline = () => {
      console.log('[BackgroundSync] Ficou offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Se já está online, sincronizar imediatamente
    if (isOnline) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, swReady]);
}
