import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'hinario_pmam_version';

/**
 * Hook de atualizacao automatica.
 *
 * Comportamento:
 * - Ao carregar a pagina: verifica versao no servidor e armazena como versao atual
 * - Ao reconectar a internet: verifica versao e recarrega se diferente
 * - A cada 5 minutos em background: verifica silenciosamente
 */
export function useAutoUpdate() {
  const currentVersionRef = useRef<string | null>(localStorage.getItem(STORAGE_KEY));
  const isReloadingRef = useRef(false);

  const checkAndUpdate = async (source: string) => {
    if (isReloadingRef.current) return;

    try {
      const response = await fetch('/api/version', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) return;

      const { version } = await response.json() as { version: string };
      const stored = currentVersionRef.current;

      if (!stored) {
        currentVersionRef.current = version;
        localStorage.setItem(STORAGE_KEY, version);
        console.log(`[AutoUpdate] Version stored on first load: ${version}`);
        return;
      }

      if (stored !== version) {
        console.log(`[AutoUpdate] Update detected (${source}): ${stored} -> ${version}. Reloading...`);
        isReloadingRef.current = true;
        currentVersionRef.current = version;
        localStorage.setItem(STORAGE_KEY, version);
        window.location.reload();
      }
    } catch {
      // Sem internet ou servidor indisponivel: ignorar silenciosamente.
    }
  };

  useEffect(() => {
    checkAndUpdate('page-load');

    const handleOnline = () => {
      console.log('[AutoUpdate] Back online - checking for updates...');
      checkAndUpdate('online-event');
    };

    const interval = setInterval(() => {
      checkAndUpdate('periodic');
    }, 5 * 60 * 1000);

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);
}
