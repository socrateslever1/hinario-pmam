import { useEffect, useState } from 'react';

const SW_CLEANUP_RELOAD_KEY = 'hinario_pmam_sw_cleanup_reloaded';

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
<<<<<<< HEAD
    // Offline via Service Worker foi desabilitado. Remove registros antigos para
    // impedir que um SW legado continue servindo a tela "Modo Offline".
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });

          if (registrations.length > 0) {
            console.log('[PWA] Service Worker disabled and unregistered');
          }

          if (registrations.length > 0 && navigator.serviceWorker.controller) {
            const alreadyReloaded = sessionStorage.getItem(SW_CLEANUP_RELOAD_KEY);
            if (!alreadyReloaded) {
              sessionStorage.setItem(SW_CLEANUP_RELOAD_KEY, '1');
              window.location.reload();
            }
          } else {
            sessionStorage.removeItem(SW_CLEANUP_RELOAD_KEY);
          }
        })
        .catch((error) => {
          console.error('[PWA] Failed to unregister Service Worker:', error);
        });
    }

    if ('caches' in window) {
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch((error) => {
          console.error('[PWA] Failed to clear legacy caches:', error);
        });
    }
=======
    // Service Worker desabilitado — usando apenas detecção de online/offline
    setState((prev) => ({ ...prev, swReady: true }));
>>>>>>> 0c1a881781b503d0bbc0990de154febaf209f35f

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

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setState((prev) => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    if (displayModeQuery.matches) {
      setState((prev) => ({ ...prev, isInstalled: true }));
    }

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setState((prev) => ({ ...prev, isInstalled: e.matches }));
    };

    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);

    if (outcome === 'accepted') {
      setState((prev) => ({ ...prev, isInstalled: true }));
    }

    setDeferredPrompt(null);
  };

<<<<<<< HEAD
=======
  const updateApp = () => {
    window.location.reload();
  };

  const clearCache = () => {
    // Cache desabilitado
  };

  const cacheUrls = (urls: string[]) => {
    // Cache desabilitado
  };

  const precacheAssets = (assets: string[]) => {
    // Cache desabilitado
  };

>>>>>>> 0c1a881781b503d0bbc0990de154febaf209f35f
  return {
    ...state,
    installApp,
  };
}
