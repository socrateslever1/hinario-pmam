import { applyDrillCommand, getRequiredCommandSequence, isDrillCommandAllowed, type DrillState } from "./drillStateMachine";

export type MarchCombination = {
  id: string;
  callId: number;
  marchId: number;
};

export function movePreparedItem(ids: number[], id: number, direction: -1 | 1) {
  const currentIndex = ids.indexOf(id);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ids.length) return ids;

  const reordered = [...ids];
  [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
  return reordered;
}

export function sanitizeMarchCombinations(value: unknown): MarchCombination[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<MarchCombination[]>((items, candidate) => {
    if (!candidate || typeof candidate !== "object") return items;
    const raw = candidate as Partial<MarchCombination>;
    if (typeof raw.id !== "string" || !Number.isInteger(raw.callId) || !Number.isInteger(raw.marchId)) return items;
    if (items.some((item) => item.id === raw.id)) return items;
    items.push({ id: raw.id.slice(0, 80), callId: Number(raw.callId), marchId: Number(raw.marchId) });
    return items;
  }, []);
}

export function buildMarchCombinationPlan(
  call: { name: string; audioUrl: string | null },
  march: { title: string; audioUrl: string | null },
  state: DrillState,
) {
  if (!call.audioUrl) return { ok: false as const, reason: "Toque de marcha sem áudio." };
  if (!march.audioUrl) return { ok: false as const, reason: "Dobrado sem áudio." };
  if (!isDrillCommandAllowed(call.name, state)) {
    return {
      ok: false as const,
      reason: "Comando bloqueado.",
      requiredCommands: getRequiredCommandSequence(call.name, state),
    };
  }

  return {
    ok: true as const,
    nextState: applyDrillCommand(call.name, state),
    first: { label: call.name, audioUrl: call.audioUrl },
    second: { label: march.title, audioUrl: march.audioUrl },
  };
}
