import { applyDrillCommand, getRequiredCommandSequence, isDrillCommandAllowed, MARCH_STATES, type DrillState } from "./drillStateMachine";

export type MarchCombination = {
  id: string;
  callId: number;
  marchId: number;
};

export type PreparedSequenceStep = {
  key: string;
  label: string;
  audioUrl: string;
  nextState?: DrillState;
};

export const DEFAULT_SEQUENCE_DELAY_SECONDS = 2;

export function sanitizeSequenceDelay(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 10
    ? Math.round(parsed)
    : DEFAULT_SEQUENCE_DELAY_SECONDS;
}

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

export function buildPreparedSequencePlan(
  calls: Array<{ id: number; name: string; audioUrl: string | null }>,
  march: { id: number; title: string; audioUrl: string | null } | undefined,
  initialState: DrillState,
) {
  if (calls.length === 0) return { ok: false as const, reason: "Adicione os comandos que serão executados." };

  const steps: PreparedSequenceStep[] = [];
  let currentState = initialState;

  for (const call of calls) {
    if (!call.audioUrl) return { ok: false as const, reason: `${call.name} está sem áudio.` };
    if (!isDrillCommandAllowed(call.name, currentState)) {
      return {
        ok: false as const,
        reason: `Sequência bloqueada em ${call.name}.`,
        blockedCommand: call.name,
        requiredCommands: getRequiredCommandSequence(call.name, currentState),
      };
    }

    currentState = applyDrillCommand(call.name, currentState);
    steps.push({
      key: `sequence-call-${call.id}`,
      label: call.name,
      audioUrl: call.audioUrl,
      nextState: currentState,
    });
  }

  if (march && !MARCH_STATES.includes(currentState)) {
    return {
      ok: false as const,
      reason: "A sequência precisa terminar com Ordinário marche, Marcha batida ou Acelerado antes do dobrado.",
    };
  }
  if (!march) return { ok: true as const, steps, finalState: currentState };
  if (!march.audioUrl) return { ok: false as const, reason: `${march.title} está sem áudio.` };

  steps.push({
    key: `sequence-march-${march.id}`,
    label: `Dobrado: ${march.title}`,
    audioUrl: march.audioUrl,
  });

  return { ok: true as const, steps, finalState: currentState };
}
