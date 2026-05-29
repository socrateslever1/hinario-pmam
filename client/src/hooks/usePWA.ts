import { useCallback, useEffect, useState } from 'react';

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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => undefined);
    }

    if ('caches' in window) {
      caches.keys()
        .then((keys) => {
          keys
            .filter((key) => key.startsWith('hinario-pmam'))
            .forEach((key) => caches.delete(key));
        })
        .catch(() => undefined);
    }

    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }));

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

  return {
    ...state,
    installApp,
    updateApp: useCallback(() => window.location.reload(), []),
    clearCache: useCallback(() => undefined, []),
    cacheUrls: useCallback((_urls: string[]) => undefined, []),
    precacheAssets: useCallback((_assets: string[]) => undefined, []),
  };
}
