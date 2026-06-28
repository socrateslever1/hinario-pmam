import { useEffect } from "react";
import { studyModules } from "@/content/studyModules";
import { usePWA } from "./usePWA";

const CRITICAL_API_URLS = [
  "/api/trpc/hymns.list?batch=1",
  "/api/trpc/drill.list?batch=1",
  "/api/trpc/blog.list?batch=1",
];

const CRITICAL_STATIC_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo/IMG_7728.PNG",
  "/documents/peculio_cfsd_2026.pdf",
  "/documents/modelo_de_parte.docx",
  "/documents/matriz_curricular_cfsd2025.docx",
  ...studyModules.map((module) => module.textPath),
];

export function useOfflineCache() {
  const { swReady, isOnline, precacheAssets } = usePWA();

  useEffect(() => {
    if (!swReady || !isOnline) return;

    const precacheData = async () => {
      try {
        console.log("[OfflineCache] Iniciando pre-cache de dados criticos");

        const criticalUrls = [...CRITICAL_STATIC_URLS, ...CRITICAL_API_URLS];
        await precacheAssets(criticalUrls);

        console.log("[OfflineCache] Pre-cache concluido");
      } catch (err) {
        console.error("[OfflineCache] Erro ao pre-cachear:", err);
      }
    };

    precacheData();
    const interval = window.setInterval(precacheData, 3600000);

    return () => clearInterval(interval);
  }, [swReady, isOnline, precacheAssets]);
}
