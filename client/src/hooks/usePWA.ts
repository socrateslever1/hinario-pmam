import { useCallback, useEffect, useState } from "react";

const CACHE_NAME = "hinario-pmam-cache-v6";
let registrationStarted = false;
let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;
let updateIntervalId: number | null = null;

export interface CachedUrlsResult {
  cachedUrls: string[];
  failedUrls: string[];
}

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  swReady: boolean;
  updateAvailable: boolean;
}

function uniqueUrls(urls: string[]) {
  return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
}

export async function cacheUrlsForOffline(urls: string[]): Promise<CachedUrlsResult> {
  const unique = uniqueUrls(urls);
  if (typeof caches === "undefined") {
    return { cachedUrls: [], failedUrls: unique };
  }

  const cache = await caches.open(CACHE_NAME);
  const results = await Promise.all(unique.map(async (url) => {
    try {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok && response.type !== "opaque") {
        throw new Error(`Falha ao cachear ${url}: ${response.status}`);
      }
      const contentType = response.headers.get("content-type") || "";
      if (/\.(?:m?js|css)(?:$|\?)/i.test(url) && /text\/html/i.test(contentType)) {
        throw new Error(`Resposta invÃ¡lida ao cachear asset ${url}`);
      }
      await cache.put(url, response.clone());
      return { url, cached: true };
    } catch {
      return { url, cached: false };
    }
  }));

  return {
    cachedUrls: results.filter((result) => result.cached).map((result) => result.url),
    failedUrls: results.filter((result) => !result.cached).map((result) => result.url),
  };
}

export async function getOfflineCachedUrls(urls: string[]): Promise<string[]> {
  const unique = uniqueUrls(urls);
  if (typeof caches === "undefined") return [];

  const cache = await caches.open(CACHE_NAME);
  const results = await Promise.all(unique.map(async (url) => ({ url, response: await cache.match(url) })));
  return results.filter((result) => Boolean(result.response)).map((result) => result.url);
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
    const result = await cacheUrlsForOffline(urls);
    console.log("[PWA] URLs cached:", result.cachedUrls);
    return result;
  }, []);

  const precacheAssets = useCallback(async (assets: string[]) => {
    const result = await cacheUrlsForOffline(assets);
    console.log("[PWA] Assets precached:", result.cachedUrls);
    return result;
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
