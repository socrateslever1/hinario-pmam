import { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Music,
  Trash2,
  CheckCircle2,
  Minus,
  Plus,

  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ListMusic,
  WandSparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useMobile";
import {
  buildAutomaticLyricsSyncLines,
  buildLyricsSyncLines,
  getNextUnsyncedLineIndex,
  hasLyricsSyncData,
  isLyricsSectionLabel,
  type LyricsSyncInput,
} from "@/lib/lyricsSync";

const Player = ReactPlayer as any;
const DRAFT_STORAGE_PREFIX = "lyrics-sync-draft";

type MediaPlayerElement = HTMLMediaElement & {
  currentTime: number;
  duration: number;
};

interface LyricsMarkerProps {
  hymn: {
    id: number;
    number?: number;
    title: string;
    lyrics: string;
    audioUrl?: string;
    youtubeUrl?: string;
    lyricsSync?: LyricsSyncInput;
  };
  onSuccess?: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatEditableTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "";
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.round((seconds - Math.floor(seconds)) * 100);

  if (centiseconds === 100) {
    return formatEditableTime(Math.round((seconds + 0.01) * 100) / 100);
  }

  return `${mins}:${secs.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

function parseEditableTime(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;

  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    const seconds = Number(normalized);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
  }

  const parts = normalized.split(":");
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);

    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || minutes < 0 || seconds < 0) {
      return null;
    }

    return Number((minutes * 60 + seconds).toFixed(2));
  }

  return null;
}

function findNextMarkableIndex(lines: string[], startIndex: number): number {
  for (let index = Math.max(0, startIndex); index < lines.length; index += 1) {
    if (!isLyricsSectionLabel(lines[index])) {
      return index;
    }
  }

  return lines.length;
}

function findPreviousMarkableIndex(lines: string[], startIndex: number): number {
  for (let index = Math.min(startIndex, lines.length - 1); index >= 0; index -= 1) {
    if (!isLyricsSectionLabel(lines[index])) {
      return index;
    }
  }

  return 0;
}

function getLastMarkedIndexAtOrBefore(indexes: number[], currentIndex: number) {
  for (let index = indexes.length - 1; index >= 0; index -= 1) {
    if (indexes[index] <= currentIndex) {
      return indexes[index];
    }
  }

  return indexes[indexes.length - 1];
}

export default function LyricsMarker({ hymn, onSuccess }: LyricsMarkerProps) {
  const isMobile = useIsMobile();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [syncData, setSyncData] = useState<{ time: number; text: string }[]>([]);
  const [timeDrafts, setTimeDrafts] = useState<Record<number, string>>({});
  const [mobileTab, setMobileTab] = useState<"marker" | "lines">("marker");
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const playerRef = useRef<MediaPlayerElement | null>(null);
  const draftHydratedRef = useRef(false);
  const serverSnapshotRef = useRef("");
  const linesScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionRef = useRef<number>(0);

  const lines = useMemo(
    () => hymn.lyrics.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
    [hymn.lyrics],
  );

  const normalizedCurrentLineIndex = useMemo(() => {
    if (lines.length === 0) return 0;
    if (currentLineIndex >= lines.length) return lines.length;
    if (currentLineIndex < 0) return findNextMarkableIndex(lines, 0);
    if (!isLyricsSectionLabel(lines[currentLineIndex])) return currentLineIndex;

    const nextIndex = findNextMarkableIndex(lines, currentLineIndex + 1);
    if (nextIndex < lines.length) return nextIndex;

    return findPreviousMarkableIndex(lines, currentLineIndex - 1);
  }, [currentLineIndex, lines]);

  const markableCount = useMemo(
    () => lines.filter((line) => !isLyricsSectionLabel(line)).length,
    [lines],
  );

  const syncedCount = useMemo(
    () => syncData.filter((entry) => entry.time >= 0 && !isLyricsSectionLabel(entry.text)).length,
    [syncData],
  );

  const draftStorageKey = useMemo(() => `${DRAFT_STORAGE_PREFIX}:${hymn.id}`, [hymn.id]);

  const buildDraftMap = (entries: { time: number; text: string }[]) =>
    Object.fromEntries(
      entries.map((entry, index) => [index, entry.time >= 0 ? formatEditableTime(entry.time) : ""]),
    );

  const buildSnapshot = (entries: { time: number; text: string }[], drafts: Record<number, string>, lineIndex: number, tab: "marker" | "lines") =>
    JSON.stringify({
      syncData: entries.map((entry) => ({ time: entry.time, text: entry.text })),
      timeDrafts: Object.fromEntries(Object.entries(drafts).sort(([left], [right]) => Number(left) - Number(right))),
      currentLineIndex: lineIndex,
      mobileTab: tab,
    });

  const createServerState = () => {
    const normalizedSyncData = buildLyricsSyncLines(hymn.lyrics, hymn.lyricsSync);
    return {
      syncData: normalizedSyncData,
      timeDrafts: buildDraftMap(normalizedSyncData),
      currentLineIndex: getNextUnsyncedLineIndex(normalizedSyncData),
      mobileTab: "marker" as const,
    };
  };

  const clearStoredDraft = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(draftStorageKey);
    }
    setHasLocalDraft(false);
    setDraftSavedAt(null);
  };

  const discardLocalDraft = () => {
    const serverState = createServerState();
    clearStoredDraft();
    setSyncData(serverState.syncData);
    setTimeDrafts(serverState.timeDrafts);
    setCurrentLineIndex(serverState.currentLineIndex);
    setMobileTab(serverState.mobileTab);
    toast.success("Rascunho descartado. Voltamos para a versao salva do hino.");
  };

  const draftStatusLabel = draftSavedAt
    ? new Date(draftSavedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  useEffect(() => {
    const serverState = createServerState();
    serverSnapshotRef.current = buildSnapshot(
      serverState.syncData,
      serverState.timeDrafts,
      serverState.currentLineIndex,
      serverState.mobileTab,
    );

    let nextState: {
      syncData: { time: number; text: string }[];
      timeDrafts: Record<number, string>;
      currentLineIndex: number;
      mobileTab: "marker" | "lines";
    } = serverState;
    let restoredDraft = false;

    if (typeof window !== "undefined") {
      const rawDraft = window.localStorage.getItem(draftStorageKey);
      if (rawDraft) {
        try {
          const parsedDraft = JSON.parse(rawDraft);
          if (parsedDraft?.hymnId === hymn.id && parsedDraft?.lyrics === hymn.lyrics) {
            const restoredSyncData = buildLyricsSyncLines(hymn.lyrics, parsedDraft.syncData);
            const restoredTimeDrafts =
              parsedDraft.timeDrafts && typeof parsedDraft.timeDrafts === "object"
                ? Object.fromEntries(
                    Object.entries(parsedDraft.timeDrafts).map(([key, value]) => [Number(key), typeof value === "string" ? value : ""]),
                  )
                : buildDraftMap(restoredSyncData);
            const restoredLineIndex =
              typeof parsedDraft.currentLineIndex === "number"
                ? parsedDraft.currentLineIndex
                : getNextUnsyncedLineIndex(restoredSyncData);
            const restoredTab = parsedDraft.mobileTab === "lines" ? "lines" : "marker";
            const restoredSnapshot = buildSnapshot(restoredSyncData, restoredTimeDrafts, restoredLineIndex, restoredTab);

            if (restoredSnapshot !== serverSnapshotRef.current) {
              nextState = {
                syncData: restoredSyncData,
                timeDrafts: restoredTimeDrafts,
                currentLineIndex: restoredLineIndex,
                mobileTab: restoredTab,
              };
              restoredDraft = true;
              setHasLocalDraft(true);
              setDraftSavedAt(typeof parsedDraft.savedAt === "string" ? parsedDraft.savedAt : null);
            } else {
              clearStoredDraft();
            }
          } else {
            clearStoredDraft();
          }
        } catch {
          clearStoredDraft();
        }
      } else {
        setHasLocalDraft(false);
        setDraftSavedAt(null);
      }
    }

    setSyncData(nextState.syncData);
    setTimeDrafts(nextState.timeDrafts);
    setCurrentLineIndex(nextState.currentLineIndex);
    setMobileTab(nextState.mobileTab);
    draftHydratedRef.current = true;

    if (restoredDraft) {
      toast.success("Rascunho local restaurado. Voce voltou exatamente de onde parou.");
    }
  }, [draftStorageKey, hymn.id, hymn.lyrics, hymn.lyricsSync]);

  useEffect(() => {
    if (!draftHydratedRef.current || typeof window === "undefined") {
      return;
    }

    const nextSnapshot = buildSnapshot(syncData, timeDrafts, currentLineIndex, mobileTab);
    if (nextSnapshot === serverSnapshotRef.current) {
      clearStoredDraft();
      return;
    }

    const timeout = window.setTimeout(() => {
      const payload = {
        hymnId: hymn.id,
        lyrics: hymn.lyrics,
        syncData,
        timeDrafts,
        currentLineIndex,
        mobileTab,
        savedAt: new Date().toISOString(),
      };

      window.localStorage.setItem(draftStorageKey, JSON.stringify(payload));
      setHasLocalDraft(true);
      setDraftSavedAt(payload.savedAt);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [currentLineIndex, draftStorageKey, hymn.id, hymn.lyrics, mobileTab, syncData, timeDrafts]);

  const utils = trpc.useUtils();
  const updateMut = trpc.hymns.update.useMutation({
    onSuccess: async () => {
      clearStoredDraft();
      toast.success("Sincronizacao salva com sucesso.");
      await Promise.all([
        utils.hymns.list.invalidate(),
        utils.hymns.listAll.invalidate(),
        utils.hymns.getById.invalidate({ id: hymn.id }),
        ...(typeof hymn.number === "number" ? [utils.hymns.getByNumber.invalidate({ number: hymn.number })] : []),
      ]);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  const readMediaState = (media = playerRef.current) => {
    if (!media) return;

    if (Number.isFinite(media.currentTime)) {
      setCurrentTime(media.currentTime);
    }

    if (Number.isFinite(media.duration) && media.duration > 0) {
      setDuration(media.duration);
    }
  };

  const syncMediaState = (media?: MediaPlayerElement | null) => {
    if (!media) return;

    playerRef.current = media;
    readMediaState(media);
  };

  const seekTo = (time: number) => {
    if (!playerRef.current) return;

    const safeTime = Math.max(0, Math.min(duration || time, time));
    playerRef.current.currentTime = safeTime;
    setCurrentTime(safeTime);
  };

  const handleSeek = (values: number[]) => {
    seekTo(values[0] ?? 0);
  };

  const nudgeTime = (delta: number) => {
    seekTo(currentTime + delta);
  };

  const focusLine = (index: number, nextTab?: "marker" | "lines") => {
    if (index < 0 || index >= lines.length) {
      return;
    }

    setCurrentLineIndex(index);
    if (nextTab) {
      setMobileTab(nextTab);
    }

    const existingTime = syncData[index]?.time;
    if (typeof existingTime === "number" && existingTime >= 0) {
      seekTo(existingTime);
    }
  };

  const updateLineTime = (index: number, nextTime: number) => {
    if (index < 0 || index >= lines.length || isLyricsSectionLabel(lines[index])) {
      return;
    }

    const safeTime = Math.max(0, Number(nextTime.toFixed(2)));
    const nextSyncData = [...syncData];
    while (nextSyncData.length < lines.length) {
      nextSyncData.push({ time: -1, text: lines[nextSyncData.length] });
    }

    nextSyncData[index] = {
      time: safeTime,
      text: lines[index],
    };

    setSyncData(nextSyncData);
    setTimeDrafts(buildDraftMap(nextSyncData));
  };

  const clearLineTime = (index: number) => {
    if (index < 0 || index >= lines.length || isLyricsSectionLabel(lines[index])) {
      return;
    }

    const nextSyncData = [...syncData];
    while (nextSyncData.length < lines.length) {
      nextSyncData.push({ time: -1, text: lines[nextSyncData.length] });
    }

    nextSyncData[index] = { time: -1, text: lines[index] };
    setSyncData(nextSyncData);
    setTimeDrafts(buildDraftMap(nextSyncData));
    setCurrentLineIndex(index);
  };

  const commitDraftTime = (index: number, options?: { focusMarker?: boolean; silent?: boolean }) => {
    const parsed = parseEditableTime(timeDrafts[index] ?? "");
    if (parsed === null) {
      if (!options?.silent) {
        toast.error("Informe um tempo valido. Ex.: 1:23.45");
      }
      return false;
    }

    updateLineTime(index, parsed);
    focusLine(index, (options?.focusMarker ?? isMobile) ? "marker" : undefined);
    return true;
  };

  const markCurrentLine = () => {
    if (normalizedCurrentLineIndex >= lines.length) return;
    const alreadyMarked = (syncData[normalizedCurrentLineIndex]?.time ?? -1) >= 0;

    // Preservar scroll position em mobile
    if (linesScrollContainerRef.current) {
      scrollPositionRef.current = linesScrollContainerRef.current.scrollTop;
    }

    // Ler tempo atual diretamente do player em vez de usar state desatualizado
    const liveCurrentTime = playerRef.current?.currentTime ?? currentTime;
    updateLineTime(normalizedCurrentLineIndex, liveCurrentTime);

    if (!alreadyMarked) {
      const nextMarkable = findNextMarkableIndex(lines, normalizedCurrentLineIndex + 1);
      setCurrentLineIndex(nextMarkable);
    }

    // Restaurar scroll position apos atualizacao
    setTimeout(() => {
      if (linesScrollContainerRef.current) {
        linesScrollContainerRef.current.scrollTop = scrollPositionRef.current;
      }
    }, 0);
  };

  const applyAutomaticSync = () => {
    if (!(duration > 0)) {
      toast.error("De play e aguarde a duracao da midia carregar antes do auto-sync.");
      return;
    }

    const nextSyncData = buildAutomaticLyricsSyncLines(hymn.title, hymn.lyrics, duration);

    if (!hasLyricsSyncData(nextSyncData)) {
      toast.error("Nao foi possivel gerar uma sincronizacao automatica para este hino.");
      return;
    }

    setSyncData(nextSyncData);
    setTimeDrafts(buildDraftMap(nextSyncData));
    setCurrentLineIndex(getNextUnsyncedLineIndex(nextSyncData));
    setMobileTab("marker");

    const firstTimedLine = nextSyncData.find((entry) => entry.time >= 0 && !isLyricsSectionLabel(entry.text));
    if (firstTimedLine) {
      seekTo(firstTimedLine.time);
    }

    toast.success("Sincronizacao automatica gerada. Revise os tempos e finalize no rodape quando estiver tudo certo.");
  };

  const handleUndo = () => {
    const markedIndexes = syncData
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.time >= 0 && !isLyricsSectionLabel(entry.text))
      .map(({ index }) => index);

    const targetIndex = getLastMarkedIndexAtOrBefore(markedIndexes, normalizedCurrentLineIndex);
    if (targetIndex === undefined) return;

    const nextSyncData = [...syncData];
    nextSyncData[targetIndex] = { time: -1, text: lines[targetIndex] };
    setSyncData(nextSyncData);
    setTimeDrafts(buildDraftMap(nextSyncData));
    setCurrentLineIndex(targetIndex);
    setMobileTab("marker");
  };

  const resetSync = () => {
    if (!confirm("Deseja resetar toda a sincronizacao?")) {
      return;
    }

    const resetData = lines.map((text) => ({ time: -1, text }));
    setSyncData(resetData);
    setTimeDrafts(buildDraftMap(resetData));
    setCurrentLineIndex(findNextMarkableIndex(lines, 0));
    setCurrentTime(0);
    setPlaying(false);
    setMobileTab("marker");

    if (playerRef.current) {
      playerRef.current.currentTime = 0;
    }
  };

  const handleSave = () => {
    updateMut.mutate({
      id: hymn.id,
      lyricsSync: syncData,
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)) return;

      switch (event.code) {
        case "Space":
        case "Enter":
          event.preventDefault();
          markCurrentLine();
          break;
        case "ArrowUp":
          event.preventDefault();
          focusLine(findPreviousMarkableIndex(lines, normalizedCurrentLineIndex - 1));
          break;
        case "ArrowDown":
          event.preventDefault();
          focusLine(findNextMarkableIndex(lines, normalizedCurrentLineIndex + 1));
          break;
        case "ArrowLeft":
          event.preventDefault();
          nudgeTime(-1);
          break;
        case "ArrowRight":
          event.preventDefault();
          nudgeTime(1);
          break;
        case "Backspace":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleUndo();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, currentLineIndex, lines, normalizedCurrentLineIndex, syncData]);

  const url = hymn.youtubeUrl || hymn.audioUrl;

  useEffect(() => {
    if (!url) {
      return;
    }

    readMediaState();

    const interval = window.setInterval(() => {
      readMediaState();
    }, playing ? 100 : 300);

    return () => window.clearInterval(interval);
  }, [playing, url]);

  const selectedLineHasTime =
    normalizedCurrentLineIndex < lines.length && (syncData[normalizedCurrentLineIndex]?.time ?? -1) >= 0;

  if (!url) {
    return (
      <div className="rounded-xl border-2 border-dashed border-destructive/20 bg-destructive/5 p-8 text-center sm:p-12">
        <Music className="mx-auto mb-4 h-12 w-12 text-destructive/40" />
        <p className="text-base font-bold text-destructive sm:text-lg">Este hino nao possui audio ou video para sincronizar.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Adicione uma URL do YouTube ou faca upload de um audio primeiro.
        </p>
      </div>
    );
  }

  const renderMediaArea = (compact: boolean) => (
    <Card className="overflow-hidden border-0 bg-[#0a1a13] shadow-2xl ring-1 ring-white/10 rounded-b-none border-b border-white/5">
      <div
        className={
          hymn.youtubeUrl
            ? "aspect-video w-full max-h-[25vh] sm:max-h-[35vh] md:max-h-[45vh] mx-auto bg-black"
            : hymn.audioUrl
              ? "flex h-20 items-center bg-gradient-to-r from-[#1a3a2a] to-[#10281d] px-4 sm:px-6"
              : "hidden"
        }
      >
        <Player
          ref={playerRef as any}
          src={url}
          playing={playing}
          playsInline
          width="100%"
          height="100%"
          onReady={() => syncMediaState(playerRef.current)}
          onTimeUpdate={(event: any) => syncMediaState(event.currentTarget as MediaPlayerElement)}
          onDurationChange={(event: any) => syncMediaState(event.currentTarget as MediaPlayerElement)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          config={
            hymn.youtubeUrl
              ? { youtube: { playerVars: { rel: 0, modestbranding: 1, playsinline: 1 } } }
              : undefined
          }
        />
        {!hymn.youtubeUrl && (
          <div className="flex flex-1 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c4a84b]/20">
                <Music className="h-5 w-5 text-[#c4a84b]" />
              </div>
              <span className="truncate text-sm font-bold text-white/80">Audio do Sistema</span>
            </div>
            <div className="text-xl font-black text-[#c4a84b] sm:text-2xl">{formatTime(currentTime)}</div>
          </div>
        )}
      </div>
    </Card>
  );

  const renderControlBar = (compact: boolean) => (
    <Card className="overflow-hidden border-0 bg-[#0a1a13] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/10 rounded-t-none">
      <CardContent className={compact ? "bg-[#10281d] p-3 text-white sm:p-4" : "bg-[#10281d] p-4 text-white"}>
        <div className="flex flex-col gap-4">
          <div className="flex w-full items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 shrink-0 rounded-full bg-white/10 text-white shadow-xl hover:bg-white/20 active:scale-95"
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
            </Button>
            
            <div className="flex shrink-0 items-baseline gap-2 px-1">
              <span className="text-xl font-black tabular-nums tracking-tighter text-white">{formatTime(currentTime)}</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-[#c4a84b]/70 sm:inline">
                Progresso {Math.round((currentTime / duration) * 100 || 0)}%
              </span>
            </div>

            <div className="flex-1" />

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" onClick={applyAutomaticSync} disabled={!(duration > 0)} className="h-9 w-9 border-[#c4a84b]/30 bg-[#c4a84b] text-[#10281d] hover:bg-[#c4a84b]/90" title="Sincronização Automática">
                <WandSparkles className="h-4 w-4" />
              </Button>

              <div className="flex h-9 items-center rounded-lg bg-black/40 ring-1 ring-white/10">
                <Button variant="ghost" size="icon" className="h-full w-8 rounded-none rounded-l-lg text-white/70 hover:text-white" onClick={() => nudgeTime(-1)} title="-1s"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="min-w-[28px] border-x border-white/10 bg-white/5 px-1 text-center text-[10px] font-black uppercase tracking-widest text-[#c4a84b]">1s</span>
                <Button variant="ghost" size="icon" className="h-full w-8 rounded-none rounded-r-lg text-white/70 hover:text-white" onClick={() => nudgeTime(1)} title="+1s"><ChevronRight className="h-4 w-4" /></Button>
              </div>

              <div className="flex h-9 items-center rounded-lg bg-black/40 ring-1 ring-white/10">
                <Button variant="ghost" size="icon" className="h-full w-8 rounded-none rounded-l-lg text-white/70 hover:text-white" onClick={() => nudgeTime(-0.1)} title="-0.1s"><Minus className="h-3 w-3" /></Button>
                <span className="min-w-[32px] border-x border-white/10 bg-white/5 px-1 text-center text-[10px] font-black uppercase tracking-widest text-white/50">0.1s</span>
                <Button variant="ghost" size="icon" className="h-full w-8 rounded-none rounded-r-lg text-white/70 hover:text-white" onClick={() => nudgeTime(0.1)} title="+0.1s"><Plus className="h-3 w-3" /></Button>
              </div>

              <div className="flex h-9 items-center gap-1 rounded-lg bg-black/40 p-1 ring-1 ring-white/10">
                <Button variant="ghost" size="icon" onClick={handleUndo} disabled={syncedCount === 0} className="h-7 w-7 text-white hover:bg-white/10" title="Desfazer">
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" onClick={resetSync} className="h-7 w-7 text-red-500 hover:bg-red-500/20 hover:text-red-400" title="Resetar">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Slider value={[currentTime]} max={duration || 100} step={0.01} onValueChange={handleSeek} className="cursor-pointer" />
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
              <span>Inicio</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {!compact && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/65 ring-1 ring-white/10">
              <span>{hasLocalDraft ? `Rascunho local salvo ${draftStatusLabel ? `as ${draftStatusLabel}` : "nesta sessao"}` : "Sem rascunho local pendente"}</span>
              {hasLocalDraft && (
                <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full px-3 text-[10px] font-black uppercase text-white hover:bg-white/10" onClick={discardLocalDraft}>
                  Descartar rascunho
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentLineCard = (compact: boolean) => (
    <Card className="relative overflow-hidden border-0 bg-white shadow-2xl ring-1 ring-black/5">
      <div className="absolute top-0 h-1.5 w-full bg-[#c4a84b]" />
      <CardContent className={compact ? "p-4 pt-5 sm:p-6" : "p-6 md:p-8"}>
        {normalizedCurrentLineIndex < lines.length ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verso em foco</p>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {selectedLineHasTime ? `Marcado em ${formatEditableTime(syncData[normalizedCurrentLineIndex]?.time ?? 0)}` : "Aguardando marcacao"}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <h2 className={compact ? "text-xl font-black leading-tight tracking-tight text-[#1a3a2a] sm:text-2xl" : "text-3xl font-black tracking-tight text-[#1a3a2a] md:text-4xl"}>
                  {lines[normalizedCurrentLineIndex]}
                </h2>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
                  {normalizedCurrentLineIndex + 1}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[auto_auto_1fr] sm:items-center">
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button variant="outline" className="h-11 sm:h-12 sm:w-12" onClick={() => focusLine(normalizedCurrentLineIndex - 1, compact ? "marker" : undefined)}>
                  <ArrowUp className="h-5 w-5" />
                </Button>
                <Button variant="outline" className="h-11 sm:h-12 sm:w-12" onClick={() => focusLine(normalizedCurrentLineIndex + 1, compact ? "marker" : undefined)}>
                  <ArrowDown className="h-5 w-5" />
                </Button>
              </div>

              <Button
                variant="outline"
                className="h-11 border-[#1a3a2a]/15 bg-[#1a3a2a]/5 font-bold text-[#1a3a2a] hover:bg-[#1a3a2a]/10"
                onClick={markCurrentLine}
              >
                <Clock className="mr-2 h-4 w-4" />
                Marcar agora
              </Button>

              <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1.5"><kbd className="rounded border bg-slate-100 px-1.5 py-0.5 shadow-sm">Espaco</kbd> Marcar</span>
                <span className="flex items-center gap-1.5"><kbd className="rounded border bg-slate-100 px-1.5 py-0.5 shadow-sm">Setas</kbd> Navegar</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center sm:py-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-inner sm:h-20 sm:w-20">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <h2 className="text-xl font-black text-[#1a3a2a] sm:text-2xl">Sincronizacao finalizada</h2>
            <p className="text-sm text-slate-400">Revise as marcacoes abaixo e use o salvar no final do editor.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSaveBar = (compact: boolean) => (
    <Card className="shrink-0 border-0 bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur">
      <CardContent className={compact ? "space-y-3 p-4" : "flex flex-wrap items-center justify-between gap-4 p-4 md:p-5"}>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <span>{syncedCount}/{markableCount} versos marcados</span>
            {!hasLyricsSyncData(syncData) && <span className="text-amber-600">Aguardando marcacoes</span>}
            {hasLocalDraft && <span className="text-[#1a3a2a]">Rascunho salvo {draftStatusLabel ? `as ${draftStatusLabel}` : "nesta sessao"}</span>}
          </div>
          <p className="text-sm text-slate-500">
            O rascunho local ja fica salvo automaticamente. Use este botao so quando quiser publicar a sincronizacao oficial do hino.
          </p>
        </div>

        <div className={compact ? "grid grid-cols-1 gap-2" : "flex flex-wrap items-center gap-2"}>
          {compact && (
            <Button variant="outline" className="h-11 font-bold" onClick={markCurrentLine}>
              <Clock className="mr-2 h-4 w-4" /> Marcar agora
            </Button>
          )}
          {compact && (
            <Button variant="outline" className="h-11 font-bold" onClick={() => setMobileTab("lines")}>
              Revisar linhas
            </Button>
          )}
          {hasLocalDraft && (
            <Button type="button" variant="outline" className="h-11 font-bold" onClick={discardLocalDraft}>
              Descartar rascunho
            </Button>
          )}
          <Button
            className="h-11 bg-[#1a3a2a] px-5 font-bold text-white hover:bg-[#10281d]"
            onClick={handleSave}
            disabled={updateMut.isPending || !hasLyricsSyncData(syncData)}
          >
            {updateMut.isPending ? "Salvando..." : "Salvar sincronizacao"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderLinesPanel = (compact: boolean) => (
    <Card className={`flex flex-col border-0 bg-white shadow-xl ring-1 ring-black/5 ${compact ? "" : "h-full min-h-0 overflow-hidden"}`}>
      <div className="flex items-center justify-between gap-3 border-b bg-slate-50/70 px-4 py-3">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Lista completa</span>
        <span className="rounded-full bg-[#1a3a2a]/10 px-2 py-0.5 text-[10px] font-black text-[#1a3a2a]">
          {syncedCount}/{markableCount} versos
        </span>
      </div>

      <CardContent ref={linesScrollContainerRef} className={`p-0 ${compact ? "" : "flex-1 overflow-y-auto"}`}>
        <div className="divide-y divide-slate-50">
          {lines.map((line, index) => {
            const isHeading = isLyricsSectionLabel(line);
            const isCurrent = index === normalizedCurrentLineIndex;
            const syncEntry = syncData[index];
            const hasTime = Boolean(syncEntry && syncEntry.time >= 0);

            if (isHeading) {
              return (
                <div key={index} className="bg-slate-100/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {line}
                </div>
              );
            }

            return (
              <div
                key={index}
                data-line-index={index}
                className={`px-4 py-3 transition-all ${
                  isCurrent
                    ? "bg-[#1a3a2a] text-white shadow-inner"
                    : hasTime
                      ? "bg-white text-slate-600 hover:bg-slate-50"
                      : "bg-white text-slate-400 hover:bg-slate-50"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full flex-col gap-1 text-left"
                  onClick={() => focusLine(index, compact ? "marker" : undefined)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold ${isCurrent ? "text-white/60" : "text-slate-300"}`}>
                      #{index + 1}
                    </span>
                    {hasTime && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${isCurrent ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                        {formatTime(syncEntry.time)}
                      </span>
                    )}
                  </div>
                  <p className={`leading-relaxed ${isCurrent ? "font-bold text-white" : "font-medium"} ${compact ? "text-sm" : "text-sm"}`}>
                    {line}
                  </p>
                </button>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <Input
                    value={timeDrafts[index] ?? ""}
                    onChange={(event) =>
                      setTimeDrafts((current) => ({
                        ...current,
                        [index]: event.target.value,
                      }))
                    }
                    onFocus={() => focusLine(index, compact ? "lines" : undefined)}
                    onBlur={() => {
                      if ((timeDrafts[index] ?? "").trim()) {
                        commitDraftTime(index, { silent: true });
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitDraftTime(index);
                      }
                    }}
                    placeholder="0:00.00"
                    className={`h-9 w-full text-xs font-bold sm:w-28 ${
                      isCurrent
                        ? "border-white/20 bg-white/10 text-white placeholder:text-white/40"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`h-9 justify-center px-3 text-[10px] font-black uppercase sm:w-auto ${
                      isCurrent ? "border-white/20 bg-white/10 text-white hover:bg-white/20" : ""
                    }`}
                    onClick={() => {
                      updateLineTime(index, currentTime);
                      focusLine(index, compact ? "marker" : undefined);
                    }}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    Marcar agora
                  </Button>
                  {hasTime && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`h-9 justify-center px-2 text-[10px] font-black uppercase sm:w-auto ${
                        isCurrent ? "text-white hover:bg-white/10 hover:text-white" : "text-red-500"
                      }`}
                      onClick={() => clearLineTime(index)}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col gap-2 overflow-y-auto overflow-x-hidden pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
        <div className="shrink-0 animate-in fade-in slide-in-from-top-4">
          {renderMediaArea(true)}
        </div>

        <div className="sticky top-0 z-50 shrink-0 bg-[#0a0a0a] px-1 py-2 shadow-xl">
          {renderControlBar(true)}
        </div>

        <Tabs value={mobileTab} onValueChange={(value) => setMobileTab(value as "marker" | "lines")} className="w-full mt-2">
          <div className="px-1 mb-2">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-[#edf1ed] p-1 shadow-sm">
              <TabsTrigger value="marker" className="min-h-10 text-xs font-bold uppercase tracking-[0.16em]">
                <Zap className="mr-2 h-4 w-4" /> Foco
              </TabsTrigger>
              <TabsTrigger value="lines" className="min-h-10 text-xs font-bold uppercase tracking-[0.16em]">
                <ListMusic className="mr-2 h-4 w-4" /> Linhas
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-1">
            <TabsContent value="marker" className="mt-0 w-full pb-1">
              {renderCurrentLineCard(true)}
            </TabsContent>
            <TabsContent value="lines" className="mt-0 w-full pb-1">
              {renderLinesPanel(true)}
            </TabsContent>
          </div>
        </Tabs>

        <div className="mt-4 shrink-0">
          {renderSaveBar(true)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-2 sm:p-4">
      <div className="grid min-h-0 flex-1 gap-4 lg:gap-6 md:grid-cols-[minmax(0,1fr)_280px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-h-0 overflow-y-auto pr-1">
          <div className="shrink-0 mb-0">
            {renderMediaArea(false)}
          </div>
          <div className="sticky top-0 z-50 bg-[#0a0a0a] pb-4 pt-0 mb-2">
            {renderControlBar(false)}
          </div>
          <div className="pb-4">
            {renderCurrentLineCard(false)}
          </div>
        </div>
        <div className="flex min-h-0 flex-col">{renderLinesPanel(false)}</div>
      </div>
      {renderSaveBar(false)}
    </div>
  );
}

