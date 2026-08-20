import { useEffect } from "react";
import { studyModules } from "@/content/studyModules";
import { usePWA } from "./usePWA";
import { PWA_CACHE_NAME } from "./usePWA";
const CRITICAL_URLS = [
  "/api/trpc/hymns.list?batch=1",
  "/api/trpc/ordemUnidaAudio.list?batch=1",
  "/api/trpc/buglePanel.list?batch=1",
  "/api/trpc/blog.list?batch=1",
  ...studyModules.map((module) => module.textPath),
];

export function useBackgroundSync() {
  const { swReady } = usePWA();

  useEffect(() => {
    if (!swReady) return;

    const handleOnline = async () => {
      console.log("[BackgroundSync] Voltou online, sincronizando...");

      try {
        const cache = await caches.open(PWA_CACHE_NAME);

        for (const url of CRITICAL_URLS) {
          try {
            const response = await fetch(url, { credentials: "include" });
            if (response.ok) {
              await cache.put(url, response.clone());
              console.log("[BackgroundSync] Atualizado:", url);
            }
          } catch (err) {
            console.warn("[BackgroundSync] Erro ao atualizar:", url, err);
          }
        }

        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SYNC_DATA",
            timestamp: Date.now(),
          });
        }

        console.log("[BackgroundSync] Sincronizacao concluida");
      } catch (err) {
        console.error("[BackgroundSync] Erro durante sincronizacao:", err);
      }
    };

    const handleOffline = () => {
      console.log("[BackgroundSync] Ficou offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [swReady]);
}
