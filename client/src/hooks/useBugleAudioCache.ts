import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export function useBugleAudioCache() {
  const { data } = trpc.buglePanel.list.useQuery(undefined, {
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!data || !("serviceWorker" in navigator)) return;

    const calls = Array.isArray(data.calls) ? data.calls : [];
    const marches = Array.isArray(data.marches) ? data.marches : [];
    const urls = [...calls, ...marches]
      .map((item) => item.audioUrl)
      .filter((url): url is string => Boolean(url));

    if (!urls.length) return;

    navigator.serviceWorker.ready
      .then((registration) => {
        const worker = navigator.serviceWorker.controller || registration.active;
        worker?.postMessage({ type: "CACHE_AUDIO_URLS", urls });
      })
      .catch((error) => console.warn("[BugleAudioCache] Falha ao preparar áudios:", error));
  }, [data]);
}
