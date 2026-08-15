import { useEffect, useMemo, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommandSoundButton } from "@/components/CommandSoundButton";
import { toast } from "sonner";
import {
  AudioLines,
  ArrowLeft,
  ArrowRight,
  CloudDownload,
  Footprints,
  Link2,
  Pause,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import {
  applyDrillCommand,
  DRILL_STATE_LABELS,
  getPositionCommandsAllowedFrom,
  getRequiredCommandSequence,
  isDrillCommandAllowed,
  MARCH_STATES,
  normalizeDrillCommand,
  type DrillState,
} from "@/lib/drillStateMachine";
import {
  buildMarchCombinationPlan,
  buildPreparedSequencePlan,
  movePreparedItem,
  sanitizeMarchCombinations,
  sanitizeSequenceDelay,
  type MarchCombination,
  type PreparedSequenceStep,
} from "@/lib/drillPanelPreferences";

type BugleCall = {
  id: number;
  name: string;
  audioUrl: string | null;
  iconKey: string;
  troopState: string | null;
  category: string;
};

type March = {
  id: number;
  title: string;
  composer: string | null;
  audioUrl: string | null;
};

type VoiceCommand = {
  id: number;
  itemId: string;
  itemTitle: string;
  audioUrl: string;
  fileName: string;
  itemType: "corneta" | "dobrado" | "voz";
};

const PREPARED_STORAGE_KEY = "pmam-bugle-prepared-v1";
const TROOP_STATE_STORAGE_KEY = "pmam-bugle-troop-state-v2";
const MARCH_COMBINATIONS_STORAGE_KEY = "pmam-bugle-march-combinations-v1";
const SEQUENCE_DELAY_STORAGE_KEY = "pmam-bugle-sequence-delay-v1";
const VALID_DRILL_STATES = new Set<DrillState>(Object.keys(DRILL_STATE_LABELS) as DrillState[]);

function readStoredDrillState(): DrillState {
  try {
    const stored = localStorage.getItem(TROOP_STATE_STORAGE_KEY) as DrillState | null;
    return stored && VALID_DRILL_STATES.has(stored) ? stored : "descansar";
  } catch {
    return "descansar";
  }
}

const COMMAND_LABELS: Record<string, string> = {
  "a vontade": "À vontade",
  "descansar": "Descansar",
  "sentido": "Sentido",
  "ombro arma": "Ombro arma",
  "apresentar arma": "Apresentar arma",
  "cruzar arma": "Cruzar arma",
  "descansar arma": "Descansar arma",
  "cobrir": "Cobrir",
  "firme": "Firme",
  "olhar a direita": "Olhar à direita",
  "olhar a esquerda": "Olhar à esquerda",
  "olhar em frente": "Olhar em frente",
  "ordinario marche": "Ordinário marche",
  "marcha batida": "Marcha batida",
  "marcar passo": "Marcar passo",
  "acelerado": "Acelerado",
  "alto": "Alto",
};

function commandLabel(command: string) {
  return COMMAND_LABELS[command] || (command.charAt(0).toLocaleUpperCase("pt-BR") + command.slice(1));
}

function readStoredIds() {
  try {
    const value = JSON.parse(localStorage.getItem(PREPARED_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

function readStoredMarchCombinations() {
  try {
    return sanitizeMarchCombinations(JSON.parse(localStorage.getItem(MARCH_COMBINATIONS_STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

function readStoredSequenceDelay() {
  try {
    return sanitizeSequenceDelay(localStorage.getItem(SEQUENCE_DELAY_STORAGE_KEY));
  } catch {
    return 2;
  }
}

export default function Drill() {
  const { data, isLoading, isError } = trpc.buglePanel.list.useQuery();
  const voiceAudioQuery = trpc.ordemUnidaAudio.list.useQuery();
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioQueueRef = useRef<PreparedSequenceStep[]>([]);
  const sequenceDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preparedIds, setPreparedIds] = useState<number[]>(readStoredIds);
  const [marchCombinations, setMarchCombinations] = useState<MarchCombination[]>(readStoredMarchCombinations);
  const [selectedMarchCallId, setSelectedMarchCallId] = useState("");
  const [selectedMarchId, setSelectedMarchId] = useState("");
  const [selectedPreparedMarchId, setSelectedPreparedMarchId] = useState("");
  const [sequenceDelaySeconds, setSequenceDelaySeconds] = useState(readStoredSequenceDelay);
  const [drillState, setDrillState] = useState<DrillState>(readStoredDrillState);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [playingLabel, setPlayingLabel] = useState<string | null>(null);

  const calls = (data?.calls || []) as BugleCall[];
  const marches = (data?.marches || []) as March[];
  const voiceCommands = ((voiceAudioQuery.data || []) as VoiceCommand[]).filter((audio) => audio.itemType === "voz");
  const marchCalls = calls.filter((call) => /^(ordinario marche|marcha batida|acelerado)$/.test(normalizeDrillCommand(call.name)));
  const resolvedMarchCombinations = marchCombinations
    .map((combination) => ({
      ...combination,
      call: calls.find((call) => call.id === combination.callId),
      march: marches.find((march) => march.id === combination.marchId),
    }))
    .filter((combination): combination is MarchCombination & { call: BugleCall; march: March } => Boolean(combination.call && combination.march));
  const prepared = useMemo(
    () => preparedIds.map((id) => calls.find((call) => call.id === id)).filter(Boolean) as BugleCall[],
    [calls, preparedIds],
  );

  useEffect(() => {
    localStorage.setItem(PREPARED_STORAGE_KEY, JSON.stringify(preparedIds));
  }, [preparedIds]);

  useEffect(() => {
    localStorage.setItem(TROOP_STATE_STORAGE_KEY, drillState);
  }, [drillState]);

  useEffect(() => {
    localStorage.setItem(MARCH_COMBINATIONS_STORAGE_KEY, JSON.stringify(marchCombinations));
  }, [marchCombinations]);

  useEffect(() => {
    localStorage.setItem(SEQUENCE_DELAY_STORAGE_KEY, String(sequenceDelaySeconds));
  }, [sequenceDelaySeconds]);

  useEffect(() => () => {
    if (sequenceDelayTimerRef.current) clearTimeout(sequenceDelayTimerRef.current);
  }, []);

  const stopAudio = () => {
    audioQueueRef.current = [];
    if (sequenceDelayTimerRef.current) {
      clearTimeout(sequenceDelayTimerRef.current);
      sequenceDelayTimerRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
    }
    setPlayingKey(null);
    setPlayingLabel(null);
  };

  const startQueuedAudio = async (queued: PreparedSequenceStep) => {
    sequenceDelayTimerRef.current = null;
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = false;
    audio.src = queued.audioUrl;
    audio.load();
    try {
      await audio.play();
      setPlayingKey(queued.key);
      setPlayingLabel(queued.label);
      if (queued.nextState) setDrillState(queued.nextState);
    } catch {
      audioQueueRef.current = [];
      setPlayingKey(null);
      setPlayingLabel(null);
      toast.error("O toque terminou, mas não foi possível iniciar o próximo áudio da sequência.");
    }
  };

  const handleAudioEnded = () => {
    const [queued, ...remaining] = audioQueueRef.current;
    audioQueueRef.current = remaining;
    if (!queued) {
      setPlayingKey(null);
      setPlayingLabel(null);
      return;
    }

    setPlayingKey(`wait-${queued.key}`);
    setPlayingLabel(`Próximo em ${sequenceDelaySeconds}s: ${queued.label}`);
    sequenceDelayTimerRef.current = setTimeout(() => {
      void startQueuedAudio(queued);
    }, sequenceDelaySeconds * 1000);
  };

  const playAudio = async (key: string, label: string, audioUrl: string | null) => {
    if (!audioUrl) {
      toast.error("Este item ainda não possui áudio. Adicione-o no dashboard.");
      return false;
    }

    if (playingKey === key) {
      stopAudio();
      return false;
    }

    const audio = audioRef.current;
    if (!audio) return false;
    audio.pause();
    audio.loop = false;
    audio.src = audioUrl;
    audio.load();
    try {
      await audio.play();
      setPlayingKey(key);
      setPlayingLabel(label);
      return true;
    } catch {
      setPlayingKey(null);
      setPlayingLabel(null);
      toast.error("Não foi possível reproduzir este áudio.");
      return false;
    }
  };

  const playCall = async (call: BugleCall) => {
    const key = `call-${call.id}`;
    if (playingKey === key) {
      stopAudio();
      return;
    }
    if (playingKey) {
      toast.error("Aguarde o toque atual terminar ou use “Parar áudio”.");
      return;
    }
    if (!isDrillCommandAllowed(call.name, drillState)) {
      const sequence = getRequiredCommandSequence(call.name, drillState).map(commandLabel).join(" → ");
      toast.error(`Comando bloqueado. Execute antes: ${sequence}.`);
      return;
    }
    if (await playAudio(key, call.name, call.audioUrl)) {
      setDrillState((current) => applyDrillCommand(call.name, current));
    }
  };

  const playMarch = async (march: March) => {
    const key = `march-${march.id}`;
    if (playingKey === key) {
      stopAudio();
      return;
    }
    if (playingKey) {
      toast.error("Aguarde o áudio atual terminar ou use “Parar áudio”.");
      return;
    }
    if (!MARCH_STATES.includes(drillState)) {
      const prefix = drillState === "descansar" ? "Sentido → Ordinário marche" : "Ordinário marche";
      toast.error(`Dobrado bloqueado. Coloque a tropa em marcha: ${prefix}.`);
      return;
    }
    await playAudio(key, march.title, march.audioUrl);
  };

  const playVoiceCommand = async (voice: VoiceCommand) => {
    const key = `voice-${voice.id}`;
    if (playingKey === key) {
      stopAudio();
      return;
    }
    if (playingKey) {
      toast.error("Aguarde o áudio atual terminar ou use “Parar áudio”.");
      return;
    }
    if (!isDrillCommandAllowed(voice.itemTitle, drillState)) {
      const sequence = getRequiredCommandSequence(voice.itemTitle, drillState).map(commandLabel).join(" → ");
      toast.error(`Comando bloqueado. Execute antes: ${sequence}.`);
      return;
    }
    if (await playAudio(key, voice.itemTitle, voice.audioUrl)) {
      setDrillState((current) => applyDrillCommand(voice.itemTitle, current));
    }
  };

  const addMarchCombination = () => {
    const callId = Number(selectedMarchCallId);
    const marchId = Number(selectedMarchId);
    if (!callId || !marchId) {
      toast.error("Escolha o toque de marcha e o dobrado.");
      return;
    }
    if (marchCombinations.some((combination) => combination.callId === callId && combination.marchId === marchId)) {
      toast.error("Esta combinação já foi adicionada.");
      return;
    }
    setMarchCombinations((current) => [...current, { id: `${callId}-${marchId}-${Date.now()}`, callId, marchId }]);
    toast.success("Combinação adicionada.");
  };

  const playMarchCombination = async (combination: MarchCombination & { call: BugleCall; march: March }) => {
    if (playingKey) {
      toast.error("Aguarde o áudio atual terminar ou use “Parar áudio”.");
      return;
    }

    const plan = buildMarchCombinationPlan(combination.call, combination.march, drillState);
    if (!plan.ok) {
      if (plan.requiredCommands?.length) {
        toast.error(`Comando bloqueado. Execute antes: ${plan.requiredCommands.map(commandLabel).join(" → ")}.`);
      } else {
        toast.error(plan.reason);
      }
      return;
    }

    audioQueueRef.current = [{
      key: `combination-${combination.id}-march`,
      label: `Dobrado: ${plan.second.label}`,
      audioUrl: plan.second.audioUrl,
    }];
    const started = await playAudio(`combination-${combination.id}-call`, `${plan.first.label} → ${plan.second.label}`, plan.first.audioUrl);
    if (!started) {
      audioQueueRef.current = [];
      return;
    }
    setDrillState(plan.nextState);
  };

  const playPreparedSequence = async () => {
    if (playingKey) {
      toast.error("Aguarde o áudio atual terminar ou use “Parar áudio”.");
      return;
    }

    const selectedMarch = marches.find((march) => march.id === Number(selectedPreparedMarchId));
    const plan = buildPreparedSequencePlan(prepared, selectedMarch, drillState);
    if (!plan.ok) {
      if (plan.requiredCommands?.length) {
        toast.error(`${plan.reason} Ordem necessária: ${plan.requiredCommands.map(commandLabel).join(" → ")}.`);
      } else {
        toast.error(plan.reason);
      }
      return;
    }

    const [first, ...remaining] = plan.steps;
    audioQueueRef.current = remaining;
    const started = await playAudio(first.key, first.label, first.audioUrl);
    if (!started) {
      audioQueueRef.current = [];
      return;
    }
    if (first.nextState) setDrillState(first.nextState);
  };

  const resetOperation = () => {
    if (!confirm("Iniciar uma nova execução na posição Descansar?")) return;
    stopAudio();
    setDrillState("descansar");
  };

  const nextPositionCommands = getPositionCommandsAllowedFrom(drillState).map(commandLabel);

  const addPrepared = (id: number) => {
    setPreparedIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const removePrepared = (id: number) => {
    setPreparedIds((current) => current.filter((item) => item !== id));
  };

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f2efe4] text-[#15251d] dark:bg-[#141a16] dark:text-[#f4f0df]">
      <Navbar />
      <audio ref={audioRef} preload="none" loop={false} onEnded={handleAudioEnded} />

      <main className="container space-y-4 px-3 py-3 sm:px-4 md:space-y-6 md:py-7">
        <section className="overflow-hidden rounded-2xl bg-[#10281d] text-white shadow-xl md:rounded-3xl">
          <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center md:p-7">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8c46a] md:text-xs">
                <AudioLines className="h-4 w-4" /> Painel de corneta
              </div>
              <p className="text-xs text-white/65 md:text-sm">Situação atual da tropa</p>
              <h1 className="mt-0.5 text-2xl font-black leading-tight sm:text-3xl md:text-4xl" aria-live="polite">
                Está: <span className="!text-[#ead46e]">{DRILL_STATE_LABELS[drillState]}</span>
              </h1>
              <p className="mt-1 min-h-5 text-xs text-white/75 md:mt-2 md:text-sm" aria-live="polite">
                {playingLabel ? `Executando agora: ${playingLabel}` : "Nenhum toque em execução"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:min-w-48 md:grid-cols-1">
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={stopAudio}
                disabled={!playingKey}
                className="h-10 border-white/30 bg-white/10 px-2 text-xs text-white hover:bg-white/20 hover:text-white md:h-12 md:text-sm"
              >
                <Pause className="mr-2 h-5 w-5" /> Parar áudio
              </Button>
              <Button type="button" variant="ghost" onClick={resetOperation} className="h-10 px-2 text-xs text-white/75 hover:bg-white/10 hover:text-white md:text-sm">
                <RotateCcw className="mr-2 h-4 w-4" /> Nova execução
              </Button>
            </div>
          </div>
          <div className="max-h-14 overflow-y-auto border-t border-white/10 px-4 py-2 text-xs leading-relaxed text-white/70 md:max-h-none md:px-7 md:text-sm">
            <strong className="text-white">Próximos comandos de posição:</strong> {nextPositionCommands.join(" • ") || "nenhum"}
          </div>
        </section>

        <Card className="border-[#c4a84b]/40 bg-white/90 shadow-sm dark:border-[#c4a84b]/30 dark:bg-[#202720]/95">
          <CardContent className="p-3 md:p-5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black md:text-lg">Toques preparados</h2>
              <p className="text-xs text-muted-foreground md:text-sm">Monte e organize a sequência que será usada.</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700 dark:!text-emerald-400"><CloudDownload className="h-3.5 w-3.5" /> Os áudios são baixados automaticamente para uso com conexão lenta.</p>
              </div>
              {prepared.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPreparedIds([])}>Limpar</Button>
              )}
            </div>
            {prepared.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[#1a3a2a]/20 px-3 py-3 text-center text-xs text-muted-foreground md:text-sm">
                Use o botão <Plus className="mx-1 inline h-4 w-4" /> nos toques abaixo para preparar sua sequência.
              </div>
            ) : (
              <div>
                <div className="flex gap-3 overflow-x-auto px-1 pb-2 pt-1">
                  {prepared.map((call, index) => (
                    <div key={call.id} className="min-w-20">
                      <CommandSoundButton
                        compact
                        title={call.name}
                        iconKey={call.iconKey}
                        isPlaying={playingKey === `sequence-call-${call.id}` || playingKey === `call-${call.id}`}
                        isAllowed={isDrillCommandAllowed(call.name, drillState)}
                        onClick={() => playCall(call)}
                        action={<div className="mt-1 flex items-center justify-center gap-1"><button type="button" disabled={index === 0} aria-label={`Mover ${call.name} para antes`} onClick={() => setPreparedIds((current) => movePreparedItem(current, call.id, -1))} className="grid h-6 w-6 place-items-center rounded-full border bg-white text-[#1a3a2a] disabled:opacity-25"><ArrowLeft className="h-3.5 w-3.5" /></button><button type="button" disabled={index === prepared.length - 1} aria-label={`Mover ${call.name} para depois`} onClick={() => setPreparedIds((current) => movePreparedItem(current, call.id, 1))} className="grid h-6 w-6 place-items-center rounded-full border bg-white text-[#1a3a2a] disabled:opacity-25"><ArrowRight className="h-3.5 w-3.5" /></button><button type="button" aria-label={`Remover ${call.name} dos preparados`} onClick={() => removePrepared(call.id)} className="grid h-6 w-6 place-items-center rounded-full bg-red-700 text-white"><X className="h-3.5 w-3.5" /></button></div>}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 border-t border-[#1a3a2a]/15 pt-3 dark:border-white/15 sm:grid-cols-[1fr_auto_auto]">
                  <Select value={selectedPreparedMarchId} onValueChange={setSelectedPreparedMarchId}>
                    <SelectTrigger aria-label="Dobrado ao final da sequência"><SelectValue placeholder="Escolha o dobrado final" /></SelectTrigger>
                    <SelectContent>{marches.map((march) => <SelectItem key={march.id} value={String(march.id)}>{march.title}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={String(sequenceDelaySeconds)} onValueChange={(value) => setSequenceDelaySeconds(sanitizeSequenceDelay(value))}>
                    <SelectTrigger className="sm:w-36" aria-label="Intervalo entre os áudios"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5].map((seconds) => <SelectItem key={seconds} value={String(seconds)}>{seconds} {seconds === 1 ? "segundo" : "segundos"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={playPreparedSequence} disabled={prepared.length === 0 || marches.length === 0 || Boolean(playingKey)} className="bg-[#1a3a2a] font-bold text-white hover:bg-[#24513b] dark:bg-[#c4a84b] dark:text-[#15251d] dark:hover:bg-[#d7bc56]">
                    <AudioLines className="mr-1.5 h-4 w-4" /> Executar sequência completa
                  </Button>
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    Ordem automática: {DRILL_STATE_LABELS[drillState]} → {prepared.map((call) => call.name).join(" → ")} → dobrado escolhido. Pausa de {sequenceDelaySeconds}s entre cada áudio.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <section aria-labelledby="bugle-calls-title">
          <div className="mb-4">
            <h2 id="bugle-calls-title" className="text-2xl font-black">Toques de corneta</h2>
            <p className="text-sm text-muted-foreground">Toque em um botão para executar. Toque no <Plus className="inline h-4 w-4" /> para prepará-lo.</p>
            <p className="mt-1 text-xs font-semibold text-[#6f5914] dark:!text-[#d8c46a]">Envio de áudio: Dashboard → Ordem Unida → Toques.</p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">Carregando painel...</div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-center text-red-800">Não foi possível carregar os toques.</div>
          ) : calls.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">Nenhum toque ativo cadastrado.</div>
          ) : (
            <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {calls.map((call) => {
                const isPlaying = playingKey === `call-${call.id}`;
                const isPrepared = preparedIds.includes(call.id);
                const isAllowed = isDrillCommandAllowed(call.name, drillState);
                return (
                  <CommandSoundButton
                    key={call.id}
                    title={call.name}
                    iconKey={call.iconKey}
                    isPlaying={isPlaying}
                    isAllowed={isAllowed}
                    onClick={() => playCall(call)}
                    action={<button type="button" disabled={isPrepared} onClick={() => addPrepared(call.id)} aria-label={`Adicionar ${call.name} aos preparados`} className="absolute right-0 top-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#142d21] text-white shadow-md disabled:opacity-35"><Plus className="h-3.5 w-3.5" /></button>}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="voice-commands-title" className="rounded-3xl border border-[#c4a84b]/35 bg-white/90 p-4 shadow-sm dark:border-[#c4a84b]/30 dark:bg-[#202720]/95 md:p-7">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8b6d12] dark:!text-[#d8c46a]">Gravações do comando</p>
            <h2 id="voice-commands-title" className="text-2xl font-black">Comandos de voz</h2>
            <p className="text-sm text-muted-foreground">As gravações enviadas pelo dashboard aparecem aqui e obedecem às mesmas travas operacionais.</p>
            <p className="mt-1 text-xs font-semibold text-[#6f5914] dark:!text-[#d8c46a]">Envio: Dashboard → Comandos de voz → escolha Firme, Sentido ou outro comando.</p>
          </div>
          {voiceAudioQuery.isLoading ? (
            <div className="rounded-2xl border border-dashed p-7 text-center text-sm text-muted-foreground">Carregando comandos de voz...</div>
          ) : voiceCommands.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#1a3a2a]/20 px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma voz enviada. No dashboard, abra “Comandos de voz” e envie a gravação de Firme ou de outro comando.</div>
          ) : (
            <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
              {voiceCommands.map((voice) => (
                <CommandSoundButton
                  key={voice.id}
                  title={voice.itemTitle}
                  subtitle={voice.fileName}
                  iconKey="volume"
                  isPlaying={playingKey === `voice-${voice.id}`}
                  isAllowed={isDrillCommandAllowed(voice.itemTitle, drillState)}
                  onClick={() => playVoiceCommand(voice)}
                />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="marches-title" className="rounded-3xl bg-[#1a3a2a] p-4 text-white md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#c4a84b] text-[#15251d]"><Footprints className="h-7 w-7" /></span>
            <div>
              <h2 id="marches-title" className="text-2xl font-black">Dobrados</h2>
              <p className="text-sm text-white/65">Músicas para marcha e deslocamento da tropa.</p>
              <p className="mt-1 text-xs font-semibold text-[#e4cf87]">Envio: Dashboard → Ordem Unida → Dobrados.</p>
            </div>
          </div>
          <div className="mb-5 rounded-2xl border border-white/15 bg-white/10 p-3">
            <div className="mb-3 flex items-start gap-2">
              <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-[#e4cf87]" />
              <div>
                <h3 className="font-black">Combinar toque de marcha + dobrado</h3>
                <p className="text-xs text-white/65">Ao tocar a combinação, o toque de marcha é executado primeiro e o dobrado começa automaticamente quando ele terminar.</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Select value={selectedMarchCallId} onValueChange={setSelectedMarchCallId}>
                <SelectTrigger className="border-white/20 bg-white text-[#15251d] dark:bg-[#15251d] dark:text-[#f4f0df]"><SelectValue placeholder="Toque de marcha" /></SelectTrigger>
                <SelectContent>{marchCalls.map((call) => <SelectItem key={call.id} value={String(call.id)}>{call.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={selectedMarchId} onValueChange={setSelectedMarchId}>
                <SelectTrigger className="border-white/20 bg-white text-[#15251d] dark:bg-[#15251d] dark:text-[#f4f0df]"><SelectValue placeholder="Dobrado" /></SelectTrigger>
                <SelectContent>{marches.map((march) => <SelectItem key={march.id} value={String(march.id)}>{march.title}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" onClick={addMarchCombination} disabled={marchCalls.length === 0 || marches.length === 0} className="bg-[#c4a84b] font-bold text-[#15251d] hover:bg-[#d7bc56]"><Plus className="mr-1.5 h-4 w-4" /> Combinar</Button>
            </div>
            {resolvedMarchCombinations.length > 0 && (
              <div className="mt-3 space-y-2">
                {resolvedMarchCombinations.map((combination) => (
                  <div key={combination.id} className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/15 p-2">
                    <button type="button" onClick={() => playMarchCombination(combination)} className="min-w-0 flex-1 text-left text-sm font-bold text-white hover:text-[#ead46e]">
                      {combination.call.name} <span className="text-[#e4cf87]">→</span> {combination.march.title}
                    </button>
                    <button type="button" onClick={() => setMarchCombinations((current) => current.filter((item) => item.id !== combination.id))} aria-label={`Remover combinação ${combination.call.name} com ${combination.march.title}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {marches.length === 0 ? (
            <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-8 text-center text-sm text-white/65">
              Espaço pronto. Cadastre os dobrados no dashboard para exibi-los aqui.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
              {marches.map((march) => {
                const isPlaying = playingKey === `march-${march.id}`;
                return (
                  <CommandSoundButton
                    key={march.id}
                    title={march.title}
                    subtitle={march.composer}
                    iconKey="music"
                    darkSurface
                    onClick={() => playMarch(march)}
                    isPlaying={isPlaying}
                    isAllowed={MARCH_STATES.includes(drillState)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
