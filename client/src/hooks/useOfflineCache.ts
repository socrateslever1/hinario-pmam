import { useEffect } from 'react';
import { usePWA } from './usePWA';

/**
 * Hook para pré-cachear dados críticos para offline
 * Executa quando o app inicia e periodicamente
 */
export function useOfflineCache() {
  const { swReady, isOnline, precacheAssets } = usePWA();

  useEffect(() => {
    if (!swReady || !isOnline) return;

    const precacheData = async () => {
      try {
        console.log('[OfflineCache] Iniciando pré-cache de dados críticos');

        // URLs críticas para pré-cachear
        const criticalUrls = [
          // Hinos
          '/api/trpc/hymns.list?batch=1',
          
          // Estudos
          '/api/trpc/education.listModules?batch=1',
          
          // Drill
          '/api/trpc/drill.list?batch=1',
          
          // Blog
          '/api/trpc/blog.list?batch=1',
        ];

        // Pré-cachear assets
        await precacheAssets(criticalUrls);
        console.log('[OfflineCache] Pré-cache concluído');

        // Fazer fetch das URLs para cachear as respostas
        for (const url of criticalUrls) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              const cache = await caches.open('hinario-pmam-cache-v2');
              await cache.put(url, response.clone());
              console.log('[OfflineCache] Cacheado:', url);
            }
          } catch (err) {
            console.warn('[OfflineCache] Erro ao cachear:', url, err);
          }
        }
      } catch (err) {
        console.error('[OfflineCache] Erro ao pré-cachear:', err);
      }
    };

    // Executar pré-cache imediatamente
    precacheData();

    // Repetir a cada 1 hora
    const interval = setInterval(precacheData, 3600000);

    return () => clearInterval(interval);
  }, [swReady, isOnline, precacheAssets]);
}
