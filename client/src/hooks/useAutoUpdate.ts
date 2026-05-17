import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'hinario_pmam_version';

/**
 * Hook de atualização automática.
 *
 * Comportamento:
 * - Ao carregar a página: verifica versão no servidor e armazena como "versão atual"
 * - Ao reconectar à internet (evento 'online'): verifica versão e recarrega se diferente
 * - A cada 5 minutos em background: verifica silenciosamente
 *
 * Garante que o usuário sempre usa a versão mais recente ao conectar à internet.
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
        // Primeira carga: armazenar versão atual
        currentVersionRef.current = version;
        localStorage.setItem(STORAGE_KEY, version);
        console.log(`[AutoUpdate] Version stored on first load: ${version}`);
        return;
      }

      if (stored !== version) {
        console.log(`[AutoUpdate] Update detected (${source}): ${stored} → ${version}. Reloading...`);
        isReloadingRef.current = true;
        currentVersionRef.current = version;
        localStorage.setItem(STORAGE_KEY, version);

        // Limpar caches do Service Worker antes de recarregar
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
        }

        // Pequena pausa para o SW processar, depois recarregar
        setTimeout(() => {
          window.location.reload();
        }, 300);
      }
    } catch {
      // Sem internet ou servidor indisponível — ignorar silenciosamente
    }
  };

  useEffect(() => {
    // Verificação inicial ao carregar a página
    checkAndUpdate('page-load');

    // Ao reconectar à internet: verificar imediatamente
    const handleOnline = () => {
      console.log('[AutoUpdate] Back online — checking for updates...');
      checkAndUpdate('online-event');
    };

    // Verificação periódica a cada 5 minutos (em background)
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
