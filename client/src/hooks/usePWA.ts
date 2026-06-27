import { useEffect, useState } from 'react';

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  swReady: boolean;
  updateAvailable: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
    swReady: false,
    updateAvailable: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Registrar Service Worker em todos os ambientes (localhost e produção)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg);
          setState(prev => ({ ...prev, swReady: true }));
          
          // Verificar atualizações a cada 1 hora
          setInterval(() => {
            reg.update().catch(() => undefined);
          }, 3600000);
        })
        .catch((err) => console.error('[PWA] SW registration failed:', err));
    }

    // NÃO deletar cache - deixar o SW gerenciar
    // O cache é importante para funcionalidade offline

    const handleOnline = () => {
      console.log('[PWA] Online');
      setState((prev) => ({ ...prev, isOnline: true }));
    };
    
    const handleOffline = () => {
      console.log('[PWA] Offline');
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (event: any) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setState((prev) => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.matches) {
      setState((prev) => ({ ...prev, isInstalled: true }));
    }

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setState((prev) => ({ ...prev, isInstalled: event.matches }));
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setState((prev) => ({ ...prev, isInstalled: true }));
    }

    setDeferredPrompt(null);
  };

  const updateApp = () => window.location.reload();
  
  const clearCache = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      console.log('[PWA] Cache cleared');
    }
  };
  
  const cacheUrls = async (urls: string[]) => {
    if ('caches' in window) {
      const cache = await caches.open('hinario-pmam-cache-v2');
      await cache.addAll(urls);
      console.log('[PWA] URLs cached:', urls);
    }
  };
  
  const precacheAssets = async (assets: string[]) => {
    if ('caches' in window) {
      const cache = await caches.open('hinario-pmam-cache-v2');
      await cache.addAll(assets);
      console.log('[PWA] Assets precached:', assets);
    }
  };

  return {
    ...state,
    installApp,
    updateApp,
    clearCache,
    cacheUrls,
    precacheAssets,
  };
}
