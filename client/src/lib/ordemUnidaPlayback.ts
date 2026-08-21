import type { OrdemUnidaPanelItem } from "./ordemUnidaPanel";

export type OrdemUnidaPlaybackPlan =
  | { mode: "audio"; audioUrl: string }
  | { mode: "speech"; text: string }
  | { mode: "none" };

export function getOrdemUnidaPlaybackPlan(item: OrdemUnidaPanelItem, audioUrl?: string | null): OrdemUnidaPlaybackPlan {
  const normalizedAudioUrl = audioUrl?.trim();
  if (normalizedAudioUrl) {
    return { mode: "audio", audioUrl: normalizedAudioUrl };
  }

  if (item.type === "voz") {
    return { mode: "speech", text: item.title };
  }

  return { mode: "none" };
}
