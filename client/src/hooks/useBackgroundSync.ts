import { useEffect } from "react";
import { studyModules } from "@/content/studyModules";
import { usePWA } from "./usePWA";

const CACHE_NAME = "hinario-pmam-cache-v3";
const CRITICAL_URLS = [
  "/api/trpc/hymns.list?batch=1",
  "/api/trpc/drill.list?batch=1",
  "/api/trpc/blog.list?batch=1",
  ...studyModules.map((module) => module.textPath),
];

export function useBackgroundSync() {
  const { isOnline, swReady } = usePWA();

  useEffect(() => {
    if (!swReady) return;

    const handleOnline = async () => {
      console.log("[BackgroundSync] Voltou online, sincronizando...");

      try {
        const cache = await caches.open(CACHE_NAME);

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

    if (isOnline) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnline, swReady]);
}
