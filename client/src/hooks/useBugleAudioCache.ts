import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export function useBugleAudioCache() {
  const { data } = trpc.buglePanel.list.useQuery(undefined, {
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
  const { data: ordemUnidaAudios } = trpc.ordemUnidaAudio.list.useQuery(undefined, {
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
  const { data: hymns } = trpc.hymns.list.useQuery(undefined, {
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const calls = Array.isArray(data?.calls) ? data.calls : [];
    const marches = Array.isArray(data?.marches) ? data.marches : [];
    const uploadedAudios = Array.isArray(ordemUnidaAudios) ? ordemUnidaAudios : [];
    const hymnList = Array.isArray(hymns) ? hymns : [];

    const urls = [
      ...calls.map((item: any) => item.audioUrl),
      ...marches.map((item: any) => item.audioUrl),
      ...uploadedAudios.map((item: any) => item.audioUrl),
      ...hymnList.flatMap((h: any) => [h.audioUrl, h.instrumentalAudioUrl]),
    ].filter((url): url is string => Boolean(url && typeof url === "string" && !url.startsWith("data:")));

    if (!urls.length) return;

    navigator.serviceWorker.ready
      .then((registration) => {
        const worker = navigator.serviceWorker.controller || registration.active;
        worker?.postMessage({ type: "CACHE_AUDIO_URLS", urls });
      })
      .catch((error) => console.warn("[BugleAudioCache] Falha ao preparar áudios:", error));
  }, [data, ordemUnidaAudios, hymns]);
}

