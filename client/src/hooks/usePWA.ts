import { useCallback, useEffect, useState } from "react";

const CACHE_NAME = "hinario-pmam-cache-v3";
let registrationStarted = false;
let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;
let updateIntervalId: number | null = null;

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  swReady: boolean;
  updateAvailable: boolean;
}

async function cacheEach(urls: string[]) {
  if (!("caches" in window)) return;

  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Falha ao cachear ${url}: ${response.status}`);
      }
      await cache.put(url, response.clone());
    }),
  );
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
    if ("serviceWorker" in navigator) {
      if (!registrationStarted) {
        registrationStarted = true;
        registrationPromise = navigator.serviceWorker.register("/sw.js");
      }

      registrationPromise
        ?.then((reg) => {
          console.log("[PWA] Service Worker registered:", reg);
          setState((prev) => ({ ...prev, swReady: true }));

          if (updateIntervalId === null) {
            updateIntervalId = window.setInterval(() => {
              reg.update().catch(() => undefined);
            }, 3600000);
          }
        })
        .catch((err) => console.error("[PWA] SW registration failed:", err));
    }

    const handleOnline = () => {
      console.log("[PWA] Online");
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      console.log("[PWA] Offline");
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    const handleBeforeInstallPrompt = (event: any) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setState((prev) => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    if (mediaQuery.matches) {
      setState((prev) => ({ ...prev, isInstalled: true }));
    }

    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      setState((prev) => ({ ...prev, isInstalled: event.matches }));
    };

    mediaQuery.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      mediaQuery.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setState((prev) => ({ ...prev, isInstalled: true }));
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const updateApp = useCallback(() => window.location.reload(), []);

  const clearCache = useCallback(async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      console.log("[PWA] Cache cleared");
    }
  }, []);

  const cacheUrls = useCallback(async (urls: string[]) => {
    await cacheEach(urls);
    console.log("[PWA] URLs cached:", urls);
  }, []);

  const precacheAssets = useCallback(async (assets: string[]) => {
    await cacheEach(assets);
    console.log("[PWA] Assets precached:", assets);
  }, []);

  return {
    ...state,
    installApp,
    updateApp,
    clearCache,
    cacheUrls,
    precacheAssets,
  };
}
