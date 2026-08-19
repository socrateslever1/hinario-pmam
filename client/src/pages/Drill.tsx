import { useEffect, useMemo, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommandSoundButton } from "@/components/CommandSoundButton";
import { useAuth } from "@/_core/hooks/useAuth";
import { useBugleAudioCache } from "@/hooks/useBugleAudioCache";
import { toast } from "sonner";
import {
  AudioLines,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Footprints,
  Link2,
  Minus,
  Music2,
  Pause,
  Plus,
  RotateCcw,
  Save,
  Trash2,
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
  voiceProfileKey: string;
  voiceAuthorName: string | null;
  voiceAuthorPhotoUrl: string | null;
};

const PREPARED_STORAGE_KEY = "pmam-bugle-prepared-v2";
const TROOP_STATE_STORAGE_KEY = "pmam-bugle-troop-state-v2";
const MARCH_COMBINATIONS_STORAGE_KEY = "pmam-bugle-march-combinations-v1";
const SEQUENCE_DELAY_STORAGE_KEY = "pmam-bugle-sequence-delay-v1";
const SEQUENCE_MEDIA_STORAGE_KEY = "pmam-bugle-sequence-media-v2";
const SEQUENCE_ITEMS_STORAGE_KEY = "pmam-bugle-sequence-items-v1";
const USER_SELECTION_STORAGE_PREFIX = "pmam-bugle-user-selection-v1";
const VALID_DRILL_STATES = new Set<DrillState>(Object.keys(DRILL_STATE_LABELS) as DrillState[]);
type SequenceMedia = { key: string; label: string; audioUrl: string; kind: "hino" | "instrumental" | "dobrado" };
type SequenceItem =
  | { key: string; type: "call"; callId: number }
  | { key: string; type: "voice"; voiceId: number }
  | { key: string; type: "media"; media: SequenceMedia };
type SavedDrillSelection = {
  preparedIds: number[];
  sequenceMedia: SequenceMedia[];
  sequenceItems?: SequenceItem[];
  selectedPreparedMarchId: string;
  sequenceDelaySeconds: number;
};

function userSelectionKey(userId?: number | null) {
  return userId ? `${USER_SELECTION_STORAGE_PREFIX}:${userId}` : `${USER_SELECTION_STORAGE_PREFIX}:visitante`;
}

function readStoredSequenceMedia(): SequenceMedia[] {
  try {
    const value = JSON.parse(localStorage.getItem(SEQUENCE_MEDIA_STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item) => item && typeof item.key === "string" && typeof item.label === "string" && typeof item.audioUrl === "string") : [];
  } catch { return []; }
}

function readStoredSequenceItems(): SequenceItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(SEQUENCE_ITEMS_STORAGE_KEY) || "[]");
    const stored = Array.isArray(value) ? value.filter((item) => item && typeof item.key === "string" && (item.type === "call" || item.type === "voice" || item.type === "media")) : [];
    if (stored.length) return stored;

    const legacyIds = JSON.parse(localStorage.getItem(PREPARED_STORAGE_KEY) || "[]");
    const legacyMedia = readStoredSequenceMedia();
    return [
      ...(Array.isArray(legacyIds) ? legacyIds.filter(Number.isInteger).map((callId, index) => ({ key: `legacy-call-${callId}-${index}`, type: "call" as const, callId })) : []),
      ...legacyMedia.map((media, index) => ({ key: `legacy-media-${media.key}-${index}`, type: "media" as const, media })),
    ];
  } catch { return []; }
}

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
  "cessar o a vontade": "Cessar o À Vontade",
  "cessar a vontade": "Cessar o À Vontade",
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

function favoriteLabel(label: string) {
  return label
    .replace(/^Ajudante-geral$/i, "Aj.-geral")
    .replace(/^Comandante de batalhão$/i, "Cmt. Batalhão")
    .replace(/^Comandante de companhia$/i, "Cmt. Companhia")
    .replace(/^Comandante-geral$/i, "Cmt.-geral")
    .replace(/^Chefe do Estado-Maior$/i, "Ch. Estado-Maior");
}

function safeSetLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[localStorage] Impossível salvar '${key}' (cota excedida):`, err);
  }
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
  useBugleAudioCache();
  const { user } = useAuth();
  const { data, isLoading, isError } = trpc.buglePanel.list.useQuery();
  const voiceAudioQuery = trpc.ordemUnidaAudio.list.useQuery();
  const voiceProfilesQuery = trpc.ordemUnidaAudio.listVoiceProfiles.useQuery(undefined, { staleTime: 5 * 60_000 });
  const hymnsQuery = trpc.hymns.list.useQuery(undefined, { staleTime: 60_000 });
  const audioRef = useRef<HTMLAudioElement>(null);
  const sfxAudioRef = useRef<HTMLAudioElement>(null);
  const audioQueueRef = useRef<PreparedSequenceStep[]>([]);
  const sequenceDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drillAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preparedIds, setPreparedIds] = useState<number[]>(readStoredIds);
  const [marchCombinations, setMarchCombinations] = useState<MarchCombination[]>(readStoredMarchCombinations);
  const [selectedMarchCallId, setSelectedMarchCallId] = useState("");
  const [selectedMarchId, setSelectedMarchId] = useState("");
  const [selectedPreparedMarchId, setSelectedPreparedMarchId] = useState("");
  const [sequenceMedia, setSequenceMedia] = useState<SequenceMedia[]>(readStoredSequenceMedia);
  const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>(readStoredSequenceItems);
  const [sequenceDelaySeconds, setSequenceDelaySeconds] = useState(readStoredSequenceDelay);
  const [drillState, setDrillState] = useState<DrillState>(readStoredDrillState);
  const [callUsage, setCallUsage] = useState<Record<number, number>>(() => {
    try { return JSON.parse(localStorage.getItem("pmam-bugle-usage") || "{}"); } catch { return {}; }
  });
  const [isDeletingFavorites, setIsDeletingFavorites] = useState(false);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [playingLabel, setPlayingLabel] = useState<string | null>(null);
  const [drillAlert, setDrillAlert] = useState<string | null>(null);
  const [callSearch, setCallSearch] = useState("");
  const [selectionLoadedFor, setSelectionLoadedFor] = useState<string | null>(null);
  const [selectedVoiceProfileKey, setSelectedVoiceProfileKey] = useState("");

  const calls = (data?.calls || []) as BugleCall[];
  const marches = (data?.marches || []) as March[];
  const voiceCommands = ((voiceAudioQuery.data || []) as VoiceCommand[]).filter((audio) => audio.itemType === "voz");
  const voiceProfiles = (voiceProfilesQuery.data ?? []).map((profile) => ({
    key: profile.profileKey,
    name: profile.name,
    photoUrl: profile.photoUrl,
  }));
  const selectedVoiceProfile = voiceProfiles.find((profile) => profile.key === selectedVoiceProfileKey) || voiceProfiles[0];
  const selectedVoiceCommands = selectedVoiceProfile
    ? voiceCommands.filter((voice) => (voice.voiceProfileKey || "default") === selectedVoiceProfile.key)
    : [];
  const marchCalls = calls.filter((call) => /^(ordinario marche|marcha batida|acelerado)$/.test(normalizeDrillCommand(call.name)));
  const filteredCalls = calls
    .filter((call) => normalizeDrillCommand(call.name).includes(normalizeDrillCommand(callSearch)))
    .sort((a, b) => {
      const usageA = callUsage[a.id] || 0;
      const usageB = callUsage[b.id] || 0;
      if (usageA !== usageB) return usageB - usageA;
      return a.name.localeCompare(b.name);
    });
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
  const preparedWorkItems = useMemo(() => {
    const currentItems = sequenceItems.length
      ? sequenceItems
      : [
        ...preparedIds.map((id) => ({ key: `legacy-call-${id}`, type: "call" as const, callId: id })),
        ...sequenceMedia.map((media) => ({ key: `legacy-media-${media.key}`, type: "media" as const, media })),
      ];
    return currentItems
      .map((item) => {
        if (item.type === "call") return { ...item, call: calls.find((call) => call.id === item.callId) };
        if (item.type === "voice") return { ...item, voice: voiceCommands.find((voice) => voice.id === item.voiceId) };
        return item;
      })
      .filter((item) => item.type === "media" || (item.type === "call" ? Boolean(item.call) : Boolean(item.voice)));
  }, [calls, preparedIds, sequenceItems, sequenceMedia, voiceCommands]);

  useEffect(() => {
    if (voiceProfiles.length && !voiceProfiles.some((profile) => profile.key === selectedVoiceProfileKey)) {
      setSelectedVoiceProfileKey(voiceProfiles[0].key);
    }
  }, [selectedVoiceProfileKey, voiceProfiles]);

  useEffect(() => {
    safeSetLocalStorage(PREPARED_STORAGE_KEY, JSON.stringify(preparedIds));
  }, [preparedIds]);
  useEffect(() => {
    if (preparedWorkItems.length === 0) setIsDeletingFavorites(false);
  }, [preparedWorkItems.length]);
  useEffect(() => {
    safeSetLocalStorage(SEQUENCE_ITEMS_STORAGE_KEY, JSON.stringify(sequenceItems));
  }, [sequenceItems]);

  useEffect(() => {
    safeSetLocalStorage(TROOP_STATE_STORAGE_KEY, drillState);
  }, [drillState]);

  useEffect(() => {
    safeSetLocalStorage(MARCH_COMBINATIONS_STORAGE_KEY, JSON.stringify(marchCombinations));
  }, [marchCombinations]);

  useEffect(() => {
    safeSetLocalStorage(SEQUENCE_DELAY_STORAGE_KEY, String(sequenceDelaySeconds));
  }, [sequenceDelaySeconds]);

  useEffect(() => {
    const sanitizedMedia = sequenceMedia.map((media) => ({
      ...media,
      audioUrl: media.audioUrl.startsWith("data:") ? "" : media.audioUrl,
    }));
    safeSetLocalStorage(SEQUENCE_MEDIA_STORAGE_KEY, JSON.stringify(sanitizedMedia));
  }, [sequenceMedia]);

  useEffect(() => {
    const key = userSelectionKey(user?.id);
    if (selectionLoadedFor === key) return;
    setSelectionLoadedFor(key);
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null") as SavedDrillSelection | null;
      if (!saved) return;
      if (Array.isArray(saved.preparedIds)) setPreparedIds(saved.preparedIds.filter(Number.isInteger));
      if (Array.isArray(saved.sequenceMedia)) setSequenceMedia(saved.sequenceMedia);
      if (Array.isArray(saved.sequenceItems)) setSequenceItems(saved.sequenceItems);
      if (typeof saved.selectedPreparedMarchId === "string") setSelectedPreparedMarchId(saved.selectedPreparedMarchId);
      setSequenceDelaySeconds(sanitizeSequenceDelay(String(saved.sequenceDelaySeconds || sequenceDelaySeconds)));
    } catch {
      // Preferencia local invalida nao deve travar a pagina operacional.
    }
  }, [selectionLoadedFor, sequenceDelaySeconds, user?.id]);

  useEffect(() => () => {
    if (sequenceDelayTimerRef.current) clearTimeout(sequenceDelayTimerRef.current);
    if (drillAlertTimerRef.current) clearTimeout(drillAlertTimerRef.current);
  }, []);

  const showDrillAlert = (message: string) => {
    if (drillAlertTimerRef.current) clearTimeout(drillAlertTimerRef.current);
    setDrillAlert(message);
    drillAlertTimerRef.current = setTimeout(() => {
      setDrillAlert(null);
      drillAlertTimerRef.current = null;
    }, 2800);
  };

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
    const sfx = sfxAudioRef.current;
    if (sfx) {
      sfx.pause();
      sfx.currentTime = 0;
      sfx.removeAttribute("src");
    }
    setPlayingKey(null);
    setPlayingLabel(null);
  };

  const startQueuedAudio = async (queued: PreparedSequenceStep, useSfx = false) => {
    sequenceDelayTimerRef.current = null;
    const audio = useSfx ? sfxAudioRef.current : audioRef.current;
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

  const handleAudioEnded = (isSfx = false) => {
    const otherAudio = isSfx ? audioRef.current : sfxAudioRef.current;
    if (otherAudio && !otherAudio.paused && otherAudio.currentTime > 0) {
      return; // A transição em crossfade ocorreu, o outro canal assumiu.
    }

    const [queued, ...remaining] = audioQueueRef.current;
    audioQueueRef.current = remaining;
    if (!queued) {
      setPlayingKey(null);
      setPlayingLabel(null);
      return;
    }

    const delayMs = sequenceDelaySeconds * 1000;
    setPlayingKey(`wait-${queued.key}`);
    setPlayingLabel(delayMs > 0 ? `Próximo em ${sequenceDelaySeconds}s: ${queued.label}` : `Iniciando: ${queued.label}`);
    sequenceDelayTimerRef.current = setTimeout(() => {
      void startQueuedAudio(queued, isSfx);
    }, delayMs);
  };

  const handleTimeUpdate = (isSfx = false) => {
    const audio = isSfx ? sfxAudioRef.current : audioRef.current;
    if (!audio) return;
    
    const nextQueued = audioQueueRef.current[0];
    if (!nextQueued) return;

    const currentLabel = playingLabel || "";
    const isNextBumbo = nextQueued.label.toLowerCase().includes("bumbo");
    const isMarcheAndDobrado = /ordin(a|á)rio marche|marcha batida|acelerado/.test(currentLabel.toLowerCase()) && nextQueued.label.toLowerCase().includes("dobrado");
    
    const overlapTime = isNextBumbo ? 1.5 : (isMarcheAndDobrado ? 1.5 : 0);
    
    if (overlapTime > 0 && audio.duration && (audio.duration - audio.currentTime) <= overlapTime) {
      audioQueueRef.current.shift();
      void startQueuedAudio(nextQueued, !isSfx);
    }
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
    const sfx = sfxAudioRef.current;
    if (audio) { audio.pause(); audio.loop = false; }
    if (sfx) { sfx.pause(); sfx.loop = false; }
    if (!audio) return false;

    const primaryUrl = audioUrl;
    const fallbackUrl = audioUrl.endsWith(".wav")
      ? audioUrl.replace(/\.wav$/, ".mp3")
      : audioUrl.endsWith(".mp3")
      ? audioUrl.replace(/\.mp3$/, ".wav")
      : null;

    audio.src = primaryUrl;
    audio.load();
    try {
      await audio.play();
      setPlayingKey(key);
      setPlayingLabel(label);
      return true;
    } catch (primaryErr) {
      if (fallbackUrl) {
        try {
          audio.src = fallbackUrl;
          audio.load();
          await audio.play();
          setPlayingKey(key);
          setPlayingLabel(label);
          return true;
        } catch {
          // ignore fallback failure and report primary error
        }
      }
      console.warn("[Drill Audio] Falha ao reproduzir áudio:", primaryUrl, primaryErr);
      setPlayingKey(null);
      setPlayingLabel(null);
      toast.error(`Não foi possível reproduzir "${label}". Verifique a conexão ou envie o arquivo no painel.`);
      return false;
    }
  };

  const incrementCallUsage = (id: number) => {
    setCallUsage((curr) => {
      const next = { ...curr, [id]: (curr[id] || 0) + 1 };
      safeSetLocalStorage("pmam-bugle-usage", JSON.stringify(next));
      return next;
    });
  };

  const playCall = async (call: BugleCall) => {
    incrementCallUsage(call.id);
    const key = `call-${call.id}`;
    if (playingKey === key) {
      stopAudio();
      return;
    }

    if (!isDrillCommandAllowed(call.name, drillState)) {
      const reqSequence = getRequiredCommandSequence(call.name, drillState);
      const firstReq = reqSequence[0];
      const transVoice = voiceCommands.find(
        (v) => (v.voiceProfileKey || "default") === selectedVoiceProfile?.key && normalizeDrillCommand(v.itemTitle) === normalizeDrillCommand(firstReq)
      ) || voiceCommands.find((v) => normalizeDrillCommand(v.itemTitle) === normalizeDrillCommand(firstReq));
      const transCall = calls.find((c) => normalizeDrillCommand(c.name) === normalizeDrillCommand(firstReq));
      const transUrl = transVoice?.audioUrl || transCall?.audioUrl;

      if (transUrl && call.audioUrl) {
        stopAudio();
        const transState = applyDrillCommand(firstReq, drillState);
        const finalState = applyDrillCommand(call.name, transState);
        audioQueueRef.current = [{
          key,
          label: call.name,
          audioUrl: call.audioUrl,
          nextState: finalState,
        }];
        const started = await playAudio(`call-preparatory-${firstReq}`, `${commandLabel(firstReq)}`, transUrl);
        if (started) {
          setDrillState(transState);
        } else {
          audioQueueRef.current = [];
        }
        return;
      }
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
    await playAudio(key, march.title, march.audioUrl);
  };

  const playVoiceCommand = async (voice: VoiceCommand) => {
    const key = `voice-${voice.id}`;
    if (playingKey === key) {
      stopAudio();
      return;
    }

    if (!isDrillCommandAllowed(voice.itemTitle, drillState)) {
      const reqSequence = getRequiredCommandSequence(voice.itemTitle, drillState);
      const firstReq = reqSequence[0];
      const transVoice = voiceCommands.find(
        (v) => (v.voiceProfileKey || "default") === selectedVoiceProfile?.key && normalizeDrillCommand(v.itemTitle) === normalizeDrillCommand(firstReq)
      ) || voiceCommands.find((v) => normalizeDrillCommand(v.itemTitle) === normalizeDrillCommand(firstReq));
      const transCall = calls.find((c) => normalizeDrillCommand(c.name) === normalizeDrillCommand(firstReq));
      const transUrl = transVoice?.audioUrl || transCall?.audioUrl;

      if (transUrl && voice.audioUrl) {
        stopAudio();
        const transState = applyDrillCommand(firstReq, drillState);
        const finalState = applyDrillCommand(voice.itemTitle, transState);
        audioQueueRef.current = [{
          key,
          label: voice.itemTitle,
          audioUrl: voice.audioUrl,
          nextState: finalState,
        }];
        const started = await playAudio(`voice-preparatory-${firstReq}`, `${commandLabel(firstReq)}`, transUrl);
        if (started) {
          setDrillState(transState);
        } else {
          audioQueueRef.current = [];
        }
        return;
      }
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
    stopAudio();

    const plan = buildMarchCombinationPlan(combination.call, combination.march, drillState);
    if (!plan.ok) {
      if (plan.requiredCommands?.length) {
        showDrillAlert(`Comando bloqueado. Execute antes: ${plan.requiredCommands.map(commandLabel).join(" → ")}.`);
      } else {
        showDrillAlert(plan.reason);
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
    stopAudio();

    const preparedQueue: PreparedSequenceStep[] = [];
    let currentState = drillState;
    for (const item of preparedWorkItems) {
      if (item.type === "media") {
        preparedQueue.push({ key: `sequence-${item.media.key}`, label: item.media.label, audioUrl: item.media.audioUrl });
        continue;
      }
      const commandItem = item.type === "call"
        ? (() => { const call = item.call as BugleCall; return { id: call.id, name: call.name, audioUrl: call.audioUrl, kind: "call" as const }; })()
        : (() => { const voice = item.voice as VoiceCommand; return { id: voice.id, name: voice.itemTitle, audioUrl: voice.audioUrl, kind: "voice" as const }; })();

      if (!commandItem.audioUrl) {
        continue;
      }

      if (!isDrillCommandAllowed(commandItem.name, currentState)) {
        const reqSequence = getRequiredCommandSequence(commandItem.name, currentState);
        // Atualiza a máquina de estado silenciosamente para seguir a sequência de movimentos
        for (const reqCmd of reqSequence) {
          currentState = applyDrillCommand(reqCmd, currentState);
        }
      } else {
        // Se já era permitido, só aplica o estado do comando
        currentState = applyDrillCommand(commandItem.name, currentState);
      }

      // Adiciona na fila apenas o áudio que o usuário realmente adicionou aos favoritos
      preparedQueue.push({
        key: `sequence-${commandItem.kind}-${commandItem.id}-${preparedQueue.length}`,
        label: commandItem.name,
        audioUrl: commandItem.audioUrl,
        nextState: currentState,
      });
    }

    if (preparedQueue.length === 0) {
      toast.error("Adicione toques ou comandos de voz à sequência personalizada antes de executar.");
      return;
    }

    const [first, ...remaining] = preparedQueue;
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
    incrementCallUsage(id);
    setPreparedIds((current) => (current.includes(id) ? current : [...current, id]));
    setSequenceItems((current) => [...current, { key: `call-${id}-${Date.now()}-${current.length}`, type: "call", callId: id }]);
  };

  const addSequenceMedia = (item: SequenceMedia) => {
    const media = { ...item, key: `${item.key}-${Date.now()}-${sequenceMedia.length}` };
    setSequenceMedia((current) => [...current, media]);
    setSequenceItems((current) => [...current, { key: `media-${media.key}`, type: "media", media }]);
    toast.success(`${item.label} adicionado ao final da área personalizada.`);
  };
  const moveSequenceItem = (key: string, direction: -1 | 1) => setSequenceItems((current) => {
    const index = current.findIndex((item) => item.key === key);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= current.length) return current;
    const copy = [...current];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    return copy;
  });
  const removeSequenceItem = (item: SequenceItem) => {
    setSequenceItems((current) => {
      const remaining = current.filter((entry) => entry.key !== item.key);
      if (item.type === "call" && !remaining.some((entry) => entry.type === "call" && entry.callId === item.callId)) {
        setPreparedIds((ids) => ids.filter((id) => id !== item.callId));
      }
      return remaining;
    });
    if (item.type === "media") setSequenceMedia((current) => current.filter((entry) => entry.key !== item.media.key));
  };
  const saveSelectionPreference = () => {
    const sanitizedMedia = sequenceMedia.map((media) => ({
      ...media,
      audioUrl: media.audioUrl.startsWith("data:") ? "" : media.audioUrl,
    }));
    const payload: SavedDrillSelection = { preparedIds, sequenceMedia: sanitizedMedia, sequenceItems, selectedPreparedMarchId, sequenceDelaySeconds };
    safeSetLocalStorage(userSelectionKey(user?.id), JSON.stringify(payload));
    toast.success(user?.id ? "Favoritos salvos neste aparelho para este usuário." : "Favoritos salvos neste aparelho.");
  };

  const addVoiceToFavorites = (voice: VoiceCommand) => {
    setSequenceItems((current) => [...current, { key: `voice-${voice.id}-${Date.now()}-${current.length}`, type: "voice", voiceId: voice.id }]);
    toast.success(`${voice.itemTitle} (${voice.voiceAuthorName || "voz padrão"}) adicionado aos favoritos.`);
  };

  const clearFavorites = () => {
    if (!confirm("Excluir todos os toques favoritos?")) return;
    setPreparedIds([]);
    setSequenceMedia([]);
    setSequenceItems([]);
    setIsDeletingFavorites(false);
  };

  const playSequenceMedia = async (item: SequenceMedia) => {
    const key = `sequence-${item.key}`;
    if (playingKey === key) {
      stopAudio();
      return;
    }
    if (playingKey) {
      showDrillAlert("Desfaça ou pare o áudio anterior antes de executar outro.");
      return;
    }
    await playAudio(key, item.label, item.audioUrl);
  };

  return (
    <div className="mobile-safe-bottom min-h-screen bg-[#f2efe4] text-[#15251d] dark:bg-[#141a16] dark:text-[#f4f0df]">
      <Navbar />
      <audio ref={audioRef} preload="none" loop={false} onEnded={() => handleAudioEnded(false)} onTimeUpdate={() => handleTimeUpdate(false)} />
      <audio ref={sfxAudioRef} preload="none" loop={false} onEnded={() => handleAudioEnded(true)} onTimeUpdate={() => handleTimeUpdate(true)} />

      <main className="container space-y-4 px-3 py-3 sm:px-4 md:space-y-6 md:py-7">
        <section className="sticky top-2 z-30 overflow-hidden rounded-2xl bg-[#10281d] text-white shadow-xl md:top-4 md:rounded-3xl">
          <div className="p-3 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8c46a] md:text-xs">
                <AudioLines className="h-4 w-4" /> Painel de corneta
              </div>
              <p className="text-xs text-white/65 md:text-sm">Situação atual da tropa</p>
              <h1 className="mt-0.5 text-2xl font-black leading-tight sm:text-3xl md:text-[2.15rem]" aria-live="polite">
                Está: <span className="!text-[#ead46e]">{DRILL_STATE_LABELS[drillState]}</span>
              </h1>
              <p className="mt-1 min-h-5 text-xs text-white/75 md:text-sm" aria-live="polite">
                {playingLabel ? `Executando agora: ${playingLabel}` : "Nenhum toque em execução"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:w-[23rem]">
              <Button
                type="button"
                variant="outline"
                onClick={stopAudio}
                disabled={!playingKey}
                className="h-9 border-white/30 bg-white/10 px-2 text-xs text-white hover:bg-white/20 hover:text-white md:h-10 md:text-sm"
              >
                <Pause className="mr-2 h-4 w-4" /> Parar áudio
              </Button>
              <Button type="button" variant="ghost" onClick={resetOperation} className="h-9 px-2 text-xs text-white/75 hover:bg-white/10 hover:text-white md:h-10 md:text-sm">
                <RotateCcw className="mr-2 h-4 w-4" /> Nova execução
              </Button>
            </div>
            </div>
          </div>
          <div className="max-h-12 overflow-y-auto border-t border-white/10 px-3 py-2 text-xs leading-relaxed text-white/70 md:max-h-none md:px-5">
            <strong className="text-white">Próximos comandos de posição:</strong> {nextPositionCommands.join(" • ") || "nenhum"}
          </div>
        </section>

        {drillAlert && (
          <div
            role="alert"
            aria-live="assertive"
            className="fixed left-1/2 top-1/2 z-50 w-[min(88vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#d8c46a]/70 bg-[#10281d] px-4 py-3 text-sm font-bold text-white shadow-2xl md:sticky md:left-auto md:top-24 md:w-full md:translate-x-0 md:translate-y-0"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-[#ead46e]" />
              <span>{drillAlert}</span>
            </div>
          </div>
        )}

        <Card className="border-[#c4a84b]/40 bg-white/90 shadow-sm dark:border-[#c4a84b]/30 dark:bg-[#202720]/95">
          <CardContent className="p-3 md:p-5">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-base font-black md:text-lg">Toques favoritos</h2>
              <div className="flex shrink-0 gap-1 sm:gap-2">
                {preparedWorkItems.length > 0 && (
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={saveSelectionPreference} className="h-8 px-2 text-xs">
                      <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDeletingFavorites((current) => !current)}
                      aria-pressed={isDeletingFavorites}
                      className={`h-8 px-2 text-xs ${isDeletingFavorites ? "border-red-600 bg-red-600 text-white hover:bg-red-700 hover:text-white" : ""}`}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {isDeletingFavorites ? "Concluir" : "Excluir"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={clearFavorites} className="h-8 px-2 text-xs">Limpar</Button>
                  </>
                )}
              </div>
            </div>
            {isDeletingFavorites && preparedWorkItems.length > 0 && (
              <p className="mb-2 text-xs font-semibold text-red-700 dark:text-red-300">Toque no sinal − apenas nos favoritos que deseja excluir.</p>
            )}
            {preparedWorkItems.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[#1a3a2a]/20 px-3 py-3 text-center text-xs text-muted-foreground md:text-sm">
                Nenhum item adicionado. Use <Plus className="mx-1 inline h-4 w-4" /> para incluir um toque, hino ou dobrado.
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-5 gap-x-1.5 gap-y-4 pb-2 pt-1 sm:gap-x-3 md:grid-cols-6 lg:grid-cols-8">
                  {preparedWorkItems.map((item, index) => {
                    const isCall = item.type === "call";
                    const isVoice = item.type === "voice";
                    const call = isCall ? (item.call as BugleCall) : null;
                    const voice = isVoice ? (item.voice as VoiceCommand) : null;
                    const media = item.type === "media" ? item.media : null;
                    const itemLabel = isCall ? call?.name || "Toque" : isVoice ? voice?.itemTitle || "Voz" : media?.label || "Áudio";
                    return (
                      <div key={item.key} className="relative min-w-0">
                        <div className={isDeletingFavorites ? "favorite-delete-wiggle" : ""}>
                          <CommandSoundButton
                            compact
                            title={favoriteLabel(itemLabel)}
                            iconKey={isCall ? call?.iconKey : isVoice ? "volume" : "music"}
                            isPlaying={isCall ? playingKey === `call-${call?.id}` || playingKey === `sequence-call-${call?.id}` : isVoice ? playingKey === `voice-${voice?.id}` || playingKey === `sequence-voice-${voice?.id}` : playingKey === `sequence-${media?.key}`}
                            isAllowed={isCall ? isDrillCommandAllowed(call?.name || "", drillState) : isVoice ? isDrillCommandAllowed(voice?.itemTitle || "", drillState) : true}
                            onClick={() => isCall && call ? playCall(call) : isVoice && voice ? playVoiceCommand(voice) : media ? playSequenceMedia(media) : undefined}
                            action={isDeletingFavorites ? (
                              <button
                                type="button"
                                onClick={() => removeSequenceItem(item as SequenceItem)}
                                aria-label={`Remover ${itemLabel} dos favoritos`}
                                className="absolute right-0 top-0 z-10 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-red-700 text-white shadow-md sm:h-6 sm:w-6"
                              >
                                <Minus className="h-3 w-3" strokeWidth={3} />
                              </button>
                            ) : undefined}
                          />
                        </div>
                        <div className="mx-auto mt-1 flex w-full max-w-[4.25rem] justify-between gap-1">
                          <button type="button" disabled={index === 0} onClick={() => moveSequenceItem(item.key, -1)} className="grid h-6 flex-1 place-items-center rounded-full border border-[#1a3a2a]/25 bg-background disabled:opacity-20" aria-label="Mover para a esquerda" title="Mover para a esquerda"><ArrowLeft className="h-3.5 w-3.5" /></button>
                          <button type="button" disabled={index === preparedWorkItems.length - 1} onClick={() => moveSequenceItem(item.key, 1)} className="grid h-6 flex-1 place-items-center rounded-full border border-[#1a3a2a]/25 bg-background disabled:opacity-20" aria-label="Mover para a direita" title="Mover para a direita"><ArrowRight className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-col gap-2 border-t border-[#1a3a2a]/15 pt-3 dark:border-white/15">
                  <Select value={String(sequenceDelaySeconds)} onValueChange={(value) => setSequenceDelaySeconds(sanitizeSequenceDelay(value))}>
                    <SelectTrigger className="w-full" aria-label="Intervalo entre os áudios"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5].map((seconds) => <SelectItem key={seconds} value={String(seconds)}>{seconds} {seconds === 1 ? "segundo" : "segundos"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={playPreparedSequence} disabled={preparedWorkItems.length === 0 || Boolean(playingKey)} className="bg-[#1a3a2a] font-bold text-white hover:bg-[#24513b] dark:bg-[#c4a84b] dark:text-[#15251d] dark:hover:bg-[#d7bc56]">
                    <AudioLines className="mr-1.5 h-4 w-4" /> Executar sequência completa
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Sequência: {preparedWorkItems.map((item) => item.type === "call" ? (item.call as BugleCall).name : item.type === "voice" ? (item.voice as VoiceCommand).itemTitle : item.media.label).join(" → ")}. Pausa de {sequenceDelaySeconds}s entre cada áudio.
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

          <div className="mb-4">
            <label htmlFor="bugle-call-search" className="mb-1.5 block text-xs font-black uppercase tracking-wide text-muted-foreground">Buscar toque pelo nome</label>
            <input id="bugle-call-search" type="search" value={callSearch} onChange={(event) => setCallSearch(event.target.value)} placeholder="Ex.: Sentido, Alvorada, Ordinário marche..." className="h-11 w-full rounded-xl border border-[#1a3a2a]/20 bg-white px-4 text-sm outline-none transition focus:border-[#c4a84b] focus:ring-2 focus:ring-[#c4a84b]/25 dark:bg-[#202720]" />
          </div>

          {isLoading ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">Carregando painel...</div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-center text-red-800">Não foi possível carregar os toques.</div>
          ) : filteredCalls.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">{calls.length === 0 ? "Nenhum toque ativo cadastrado." : "Nenhum toque encontrado para esta busca."}</div>
          ) : (
            <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {filteredCalls.map((call) => {
                const isPlaying = playingKey === `call-${call.id}`;
                const isAllowed = isDrillCommandAllowed(call.name, drillState);
                return (
                  <CommandSoundButton
                    key={call.id}
                    title={call.name}
                    iconKey={call.iconKey}
                    isPlaying={isPlaying}
                    isAllowed={isAllowed}
                    onClick={() => playCall(call)}
                    action={<button type="button" onClick={() => addPrepared(call.id)} aria-label={`Adicionar ${call.name} ao final dos favoritos`} className="absolute right-0 top-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#142d21] text-white shadow-md"><Plus className="h-3.5 w-3.5" /></button>}
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
            <div>
              <div className="mb-5 grid gap-3 rounded-2xl border border-[#1a3a2a]/15 bg-[#1a3a2a]/5 p-3 sm:grid-cols-[auto_1fr] sm:items-center">
                <Avatar className="h-16 w-16 border-2 border-[#c4a84b]">
                  <AvatarImage src={selectedVoiceProfile?.photoUrl || undefined} alt={selectedVoiceProfile?.name || "Militar"} className="object-cover" />
                  <AvatarFallback className="bg-[#1a3a2a] font-black text-white">{selectedVoiceProfile?.name?.slice(0, 2).toUpperCase() || "VZ"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <label htmlFor="voice-profile" className="mb-1 block text-xs font-black uppercase tracking-wide text-muted-foreground">Voz do militar</label>
                  <Select value={selectedVoiceProfile?.key || ""} onValueChange={setSelectedVoiceProfileKey}>
                    <SelectTrigger id="voice-profile" className="w-full"><SelectValue placeholder="Escolha o militar" /></SelectTrigger>
                    <SelectContent>{voiceProfiles.map((profile) => <SelectItem key={profile.key} value={profile.key}>{profile.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{selectedVoiceProfile?.name || "Voz padrão"}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                {selectedVoiceCommands.map((voice) => (
                  <CommandSoundButton
                    key={voice.id}
                    title={voice.itemTitle}
                    subtitle={voice.voiceAuthorName || voice.fileName}
                    iconKey="volume"
                    isPlaying={playingKey === `voice-${voice.id}`}
                    isAllowed={isDrillCommandAllowed(voice.itemTitle, drillState)}
                    onClick={() => playVoiceCommand(voice)}
                    action={<button type="button" onClick={() => addVoiceToFavorites(voice)} aria-label={`Adicionar ${voice.itemTitle} na voz de ${voice.voiceAuthorName || "militar"} aos favoritos`} className="absolute right-0 top-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#142d21] text-white shadow-md"><Plus className="h-3.5 w-3.5" /></button>}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <details className="rounded-2xl border border-[#c4a84b]/40 bg-white/90 p-3 shadow-sm dark:bg-[#202720]/95">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-black"><span className="flex items-center gap-2"><Music2 className="h-5 w-5 text-[#806919]" />Importar hinos do sistema</span><Plus className="h-4 w-4" /></summary>
          <div className="mt-3 space-y-2 border-t pt-3">
            {(hymnsQuery.data ?? []).filter((hymn: any) => hymn.audioUrl || hymn.instrumentalAudioUrl).map((hymn: any) => <div key={hymn.id} className="rounded-lg border bg-background p-2"><p className="mb-2 text-xs font-black">{hymn.title}</p><div className="space-y-1.5">{hymn.audioUrl && <button type="button" onClick={() => addSequenceMedia({ key: `hymn-${hymn.id}`, label: hymn.title, audioUrl: hymn.audioUrl, kind: "hino" })} className="flex w-full items-center justify-between rounded-md bg-[#1a3a2a] px-3 py-2 text-xs font-bold text-white"><span className="flex items-center gap-2"><Music2 className="h-4 w-4" />Hino cantado</span><Plus className="h-4 w-4" /></button>}{hymn.instrumentalAudioUrl && <button type="button" onClick={() => addSequenceMedia({ key: `instrumental-${hymn.id}`, label: `${hymn.title} (instrumental)`, audioUrl: hymn.instrumentalAudioUrl, kind: "instrumental" })} className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs font-bold"><span className="flex items-center gap-2"><Music2 className="h-4 w-4" />Somente instrumental</span><Plus className="h-4 w-4" /></button>}</div></div>)}
            {hymnsQuery.isLoading && <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Carregando hinos...</p>}
            {!hymnsQuery.isLoading && !(hymnsQuery.data ?? []).some((hymn: any) => hymn.audioUrl || hymn.instrumentalAudioUrl) && <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Nenhum hino com áudio no sistema.</p>}
          </div>
        </details>

        <section aria-labelledby="marches-title" className="rounded-3xl bg-[#1a3a2a] p-4 text-white md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#c4a84b] text-[#15251d]"><Footprints className="h-7 w-7" /></span>
            <div>
              <h2 id="marches-title" className="text-2xl font-black">Dobrados</h2>
              <p className="text-sm text-white/65">Músicas para marcha e deslocamento da tropa.</p>
              <p className="mt-1 text-xs font-semibold text-[#e4cf87]">Envio: Dashboard → Ordem Unida → Dobrados.</p>
            </div>
          </div>
          <div className="hidden">
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
                    isAllowed
                    action={<button type="button" disabled={!march.audioUrl} onClick={() => march.audioUrl && addSequenceMedia({ key: `march-${march.id}`, label: `Dobrado: ${march.title}`, audioUrl: march.audioUrl, kind: "dobrado" })} className="mx-auto mt-1 grid h-7 w-7 place-items-center rounded-full bg-[#c4a84b] text-[#15251d] disabled:opacity-30" title="Adicionar dobrado à sequência"><Plus className="h-4 w-4" /></button>}
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
