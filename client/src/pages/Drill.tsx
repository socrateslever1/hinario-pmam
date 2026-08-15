import { useEffect, useMemo, useRef, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Bell,
  Clock3,
  CloudDownload,
  Eye,
  Flag,
  Flame,
  Footprints,
  Gauge,
  Hand,
  Lock,
  Music,
  Pause,
  Play,
  Plus,
  RotateCw,
  RotateCcw,
  School,
  Search,
  Shield,
  Sun,
  UserRound,
  Users,
  Utensils,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  applyDrillCommand,
  DRILL_STATE_LABELS,
  getPositionCommandsAllowedFrom,
  getRequiredCommandSequence,
  isDrillCommandAllowed,
  MARCH_STATES,
  type DrillState,
} from "@/lib/drillStateMachine";

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

const iconMap: Record<string, LucideIcon> = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  bell: Bell,
  clock: Clock3,
  eye: Eye,
  flag: Flag,
  flame: Flame,
  footprints: Footprints,
  gauge: Gauge,
  hand: Hand,
  relaxed: Pause,
  rotate: RotateCw,
  salute: Hand,
  school: School,
  search: Search,
  shield: Shield,
  sun: Sun,
  user: UserRound,
  users: Users,
  utensils: Utensils,
  volume: Volume2,
  "volume-off": VolumeX,
  music: Music,
};

const PREPARED_STORAGE_KEY = "pmam-bugle-prepared-v1";
const TROOP_STATE_STORAGE_KEY = "pmam-bugle-troop-state-v2";
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

export default function Drill() {
  const { data, isLoading, isError } = trpc.buglePanel.list.useQuery();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [preparedIds, setPreparedIds] = useState<number[]>(readStoredIds);
  const [drillState, setDrillState] = useState<DrillState>(readStoredDrillState);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [playingLabel, setPlayingLabel] = useState<string | null>(null);

  const calls = (data?.calls || []) as BugleCall[];
  const marches = (data?.marches || []) as March[];
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

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
    }
    setPlayingKey(null);
    setPlayingLabel(null);
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
    <div className="mobile-safe-bottom min-h-screen bg-[#f2efe4] text-[#15251d]">
      <Navbar />
      <audio ref={audioRef} preload="none" loop={false} onEnded={() => { setPlayingKey(null); setPlayingLabel(null); }} />

      <main className="container space-y-5 px-3 py-4 sm:px-4 md:space-y-7 md:py-8">
        <section className="overflow-hidden rounded-3xl bg-[#10281d] text-white shadow-xl">
          <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#d8c46a]">
                <AudioLines className="h-5 w-5" /> Painel de corneta
              </div>
              <p className="text-sm text-white/65">Situação atual da tropa</p>
              <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl" aria-live="polite">
                Está: <span className="text-[#ead46e]">{DRILL_STATE_LABELS[drillState]}</span>
              </h1>
              <p className="mt-3 min-h-6 text-sm text-white/75" aria-live="polite">
                {playingLabel ? `Executando agora: ${playingLabel}` : "Nenhum toque em execução"}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:min-w-48">
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={stopAudio}
                disabled={!playingKey}
                className="h-14 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Pause className="mr-2 h-5 w-5" /> Parar áudio
              </Button>
              <Button type="button" variant="ghost" onClick={resetOperation} className="text-white/75 hover:bg-white/10 hover:text-white">
                <RotateCcw className="mr-2 h-4 w-4" /> Nova execução
              </Button>
            </div>
          </div>
          <div className="border-t border-white/10 px-5 py-3 text-sm text-white/70 md:px-8">
            <strong className="text-white">Próximos comandos de posição:</strong> {nextPositionCommands.join(" • ") || "nenhum"}
          </div>
        </section>

        <Card className="border-[#c4a84b]/40 bg-white/90 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black">Toques preparados</h2>
              <p className="text-sm text-muted-foreground">Fixe aqui os comandos que serão usados durante a execução.</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700"><CloudDownload className="h-3.5 w-3.5" /> Os áudios são baixados automaticamente para uso com conexão lenta.</p>
              </div>
              {prepared.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setPreparedIds([])}>Limpar</Button>
              )}
            </div>
            {prepared.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[#1a3a2a]/20 px-4 py-7 text-center text-sm text-muted-foreground">
                Use o botão <Plus className="mx-1 inline h-4 w-4" /> nos toques abaixo para preparar sua sequência.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {prepared.map((call) => (
                  <div key={call.id} className="relative min-w-40">
                    <Button
                      type="button"
                      onClick={() => playCall(call)}
                      className={`h-20 w-full whitespace-normal px-4 text-left ${playingKey === `call-${call.id}` ? "bg-[#c4a84b] text-[#15251d] hover:bg-[#b89b3e]" : "bg-[#1a3a2a] text-white hover:bg-[#10281d]"}`}
                    >
                      <Play className="mr-2 h-5 w-5 shrink-0" /> {call.name}
                    </Button>
                    <button
                      type="button"
                      aria-label={`Remover ${call.name} dos preparados`}
                      onClick={() => removePrepared(call.id)}
                      className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full bg-red-700 text-white shadow"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <section aria-labelledby="bugle-calls-title">
          <div className="mb-4">
            <h2 id="bugle-calls-title" className="text-2xl font-black">Toques de corneta</h2>
            <p className="text-sm text-muted-foreground">Toque em um botão para executar. Toque no <Plus className="inline h-4 w-4" /> para prepará-lo.</p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">Carregando painel...</div>
          ) : isError ? (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-center text-red-800">Não foi possível carregar os toques.</div>
          ) : calls.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">Nenhum toque ativo cadastrado.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {calls.map((call) => {
                const Icon = iconMap[call.iconKey] || Music;
                const isPlaying = playingKey === `call-${call.id}`;
                const isPrepared = preparedIds.includes(call.id);
                const isAllowed = isDrillCommandAllowed(call.name, drillState);
                return (
                  <Card key={call.id} className={`relative overflow-hidden border-2 shadow-sm transition ${isPlaying ? "border-[#c4a84b] bg-[#fff9d9]" : "border-transparent bg-white"}`}>
                    <button
                      type="button"
                      onClick={() => playCall(call)}
                      className={`flex min-h-36 w-full flex-col items-center justify-center gap-3 p-4 text-center outline-none focus-visible:ring-4 focus-visible:ring-[#c4a84b]/50 ${!isAllowed && !isPlaying ? "cursor-not-allowed opacity-45" : ""}`}
                      aria-disabled={!isAllowed && !isPlaying}
                      aria-label={`${isPlaying ? "Parar" : isAllowed ? "Executar" : "Bloqueado"} toque ${call.name}`}
                    >
                      <span className={`grid h-14 w-14 place-items-center rounded-2xl ${isPlaying ? "bg-[#c4a84b] text-[#15251d]" : "bg-[#1a3a2a] text-[#ead46e]"}`}>
                        {isPlaying ? <Pause className="h-7 w-7" /> : isAllowed ? <Icon className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
                      </span>
                      <span className="text-sm font-extrabold leading-tight">{call.name}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isPrepared}
                      onClick={() => addPrepared(call.id)}
                      aria-label={`Adicionar ${call.name} aos preparados`}
                      className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border bg-white text-[#1a3a2a] shadow-sm disabled:opacity-35"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="marches-title" className="rounded-3xl bg-[#1a3a2a] p-4 text-white md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#c4a84b] text-[#15251d]"><Footprints className="h-7 w-7" /></span>
            <div>
              <h2 id="marches-title" className="text-2xl font-black">Dobrados</h2>
              <p className="text-sm text-white/65">Músicas para marcha e deslocamento da tropa.</p>
            </div>
          </div>
          {marches.length === 0 ? (
            <div className="rounded-2xl border border-white/20 bg-white/5 px-5 py-8 text-center text-sm text-white/65">
              Espaço pronto. Cadastre os dobrados no dashboard para exibi-los aqui.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {marches.map((march) => {
                const isPlaying = playingKey === `march-${march.id}`;
                return (
                  <Button
                    key={march.id}
                    type="button"
                    variant="outline"
                    onClick={() => playMarch(march)}
                    aria-disabled={!MARCH_STATES.includes(drillState) && !isPlaying}
                    className={`h-auto min-h-20 justify-start whitespace-normal border-white/20 px-4 py-3 text-left ${isPlaying ? "bg-[#c4a84b] text-[#15251d]" : MARCH_STATES.includes(drillState) ? "bg-white/10 text-white hover:bg-white/20 hover:text-white" : "cursor-not-allowed bg-white/5 text-white/40"}`}
                  >
                    {isPlaying ? <Pause className="mr-3 h-6 w-6 shrink-0" /> : MARCH_STATES.includes(drillState) ? <Music className="mr-3 h-6 w-6 shrink-0" /> : <Lock className="mr-3 h-6 w-6 shrink-0" />}
                    <span><strong className="block">{march.title}</strong>{march.composer && <small className="opacity-70">{march.composer}</small>}</span>
                  </Button>
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
