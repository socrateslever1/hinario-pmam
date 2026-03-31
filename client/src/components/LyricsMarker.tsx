import { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Music,
  Trash2,
  CheckCircle2,
  SkipBack,
  SkipForward,
  Minus,
  Plus,
  Youtube,
  Check,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  buildLyricsSyncLines,
  getNextUnsyncedLineIndex,
  hasLyricsSyncData,
  isLyricsSectionLabel,
  type LyricsSyncInput,
} from "@/lib/lyricsSync";

const Player = ReactPlayer as any;

type MediaPlayerElement = HTMLMediaElement & {
  currentTime: number;
  duration: number;
};

interface LyricsMarkerProps {
  hymn: {
    id: number;
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

export default function LyricsMarker({ hymn, onSuccess }: LyricsMarkerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [syncData, setSyncData] = useState<{ time: number; text: string }[]>([]);
  const playerRef = useRef<MediaPlayerElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const normalizedSyncData = buildLyricsSyncLines(hymn.lyrics, hymn.lyricsSync);
    setSyncData(normalizedSyncData);
    setCurrentLineIndex(getNextUnsyncedLineIndex(normalizedSyncData));
  }, [hymn.lyrics, hymn.lyricsSync]);

  const utils = trpc.useUtils();
  const updateMut = trpc.hymns.update.useMutation({
    onSuccess: () => {
      toast.success("Sincronização salva!");
      utils.hymns.invalidate();
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message),
  });

  const syncMediaState = (media?: MediaPlayerElement | null) => {
    if (!media) return;

    playerRef.current = media;

    if (Number.isFinite(media.currentTime)) {
      setCurrentTime(media.currentTime);
    }

    if (Number.isFinite(media.duration) && media.duration > 0) {
      setDuration(media.duration);
    }
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

  const focusLine = (index: number) => {
    if (index < 0 || index >= lines.length) {
      return;
    }

    setCurrentLineIndex(index);
    const existingTime = syncData[index]?.time;
    if (typeof existingTime === "number" && existingTime >= 0) {
      seekTo(existingTime);
    }
  };

  const markCurrentLine = () => {
    if (normalizedCurrentLineIndex >= lines.length) return;

    const nextSyncData = [...syncData];
    while (nextSyncData.length < lines.length) {
      nextSyncData.push({ time: -1, text: lines[nextSyncData.length] });
    }

    nextSyncData[normalizedCurrentLineIndex] = {
      time: currentTime,
      text: lines[normalizedCurrentLineIndex],
    };

    setSyncData(nextSyncData);
    
    // Avançar para a próxima linha que pode ser marcada
    const nextMarkable = findNextMarkableIndex(lines, normalizedCurrentLineIndex + 1);
    setCurrentLineIndex(nextMarkable);
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
  }, [playing, currentLineIndex, currentTime, syncData, normalizedCurrentLineIndex, lines]);

  // Auto-scroll da lista para manter a linha ativa visível
  useEffect(() => {
    if (!listContainerRef.current) return;
    const activeEl = listContainerRef.current.querySelector(`[data-line-index="${normalizedCurrentLineIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [normalizedCurrentLineIndex]);

  const handleUndo = () => {
    const markedIndexes = syncData
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.time >= 0 && !isLyricsSectionLabel(entry.text))
      .map(({ index }) => index);

    const targetIndex =
      markedIndexes.findLast((index) => index <= normalizedCurrentLineIndex) ??
      markedIndexes[markedIndexes.length - 1];

    if (targetIndex === undefined) return;

    const nextSyncData = [...syncData];
    nextSyncData[targetIndex] = { time: -1, text: lines[targetIndex] };
    setSyncData(nextSyncData);
    setCurrentLineIndex(targetIndex);
  };

  const resetSync = () => {
    if (!confirm("Deseja resetar toda a sincronização?")) {
      return;
    }

    setSyncData(lines.map((text) => ({ time: -1, text })));
    setCurrentLineIndex(findNextMarkableIndex(lines, 0));
    setCurrentTime(0);
    setPlaying(false);

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

  const url = hymn.audioUrl || hymn.youtubeUrl;

  if (!url) {
    return (
      <div className="rounded-xl border-2 border-dashed border-destructive/20 bg-destructive/5 p-12 text-center">
        <Music className="mx-auto mb-4 h-12 w-12 text-destructive/40" />
        <p className="text-lg font-bold text-destructive">Este hino não possui áudio ou vídeo para sincronizar.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Adicione uma URL do YouTube ou faça upload de um áudio primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[600px] flex-col gap-6 p-1">
      {/* Player e Controles Principais */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="overflow-hidden border-0 bg-[#0a1a13] shadow-2xl ring-1 ring-white/10">
            <div className={hymn.youtubeUrl ? "aspect-video bg-black" : hymn.audioUrl ? "h-20 bg-gradient-to-r from-[#1a3a2a] to-[#10281d] flex items-center px-6" : "hidden"}>
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
                <div className="flex flex-1 items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 animate-pulse rounded-full bg-[#c4a84b]/20 flex items-center justify-center">
                        <Music className="h-5 w-5 text-[#c4a84b]" />
                     </div>
                     <span className="text-sm font-bold text-white/80">Áudio do Sistema</span>
                   </div>
                   <div className="text-2xl font-black text-[#c4a84b]">{formatTime(currentTime)}</div>
                </div>
              )}
            </div>

            <CardContent className="bg-[#10281d] p-4 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-14 w-14 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all shadow-xl"
                    onClick={() => setPlaying(!playing)}
                  >
                    {playing ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
                  </Button>
                  <div>
                    <div className="text-3xl font-black tracking-tighter text-white">{formatTime(currentTime)}</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c4a84b]/70">
                      Progresso {Math.round((currentTime/duration)*100 || 0)}%
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-full bg-black/40 p-1 ring-1 ring-white/10">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/60 hover:text-white" onClick={() => nudgeTime(-1)}>
                       <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2 text-[10px] font-black uppercase tracking-widest text-[#c4a84b]">1s</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/60 hover:text-white" onClick={() => nudgeTime(1)}>
                       <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center rounded-full bg-black/40 p-1 ring-1 ring-white/10">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/60 hover:text-white" onClick={() => nudgeTime(-0.1)}>
                       <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-2 text-[10px] font-black uppercase tracking-widest text-white/40">0.1s</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/60 hover:text-white" onClick={() => nudgeTime(0.1)}>
                       <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button variant="outline" size="sm" onClick={handleUndo} disabled={syncedCount === 0} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                    <RotateCcw className="mr-2 h-4 w-4" /> Desfazer
                  </Button>
                  <Button variant="destructive" size="sm" onClick={resetSync} className="bg-red-500/80 hover:bg-red-500">
                    <Trash2 className="mr-2 h-4 w-4" /> Resetar
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <Slider value={[currentTime]} max={duration || 100} step={0.01} onValueChange={handleSeek} className="cursor-pointer" />
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                   <span>INÍCIO</span>
                   <span>{formatTime(duration)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Foco Central de Marcação */}
          <Card className="relative overflow-hidden border-0 bg-white shadow-2xl ring-1 ring-black/5">
             <div className="absolute top-0 h-1.5 w-full bg-[#c4a84b]" />
             <CardContent className="p-6 md:p-8">
               {normalizedCurrentLineIndex < lines.length ? (
                 <div className="space-y-6">
                    <div className="flex items-start justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verso em Foco</p>
                          <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black tracking-tight text-[#1a3a2a] md:text-4xl">
                              {lines[normalizedCurrentLineIndex]}
                            </h2>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400">
                               {normalizedCurrentLineIndex + 1}
                            </span>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row">
                       <Button 
                         className="h-16 flex-1 bg-[#1a3a2a] text-xl font-black shadow-xl hover:bg-[#10281d] hover:shadow-2xl active:scale-95 transition-all"
                         onClick={markCurrentLine}
                       >
                         <Zap className="mr-3 h-6 w-6 text-[#c4a84b] fill-[#c4a84b]" />
                         MARCAR AGORA
                       </Button>
                       
                       <div className="flex gap-2">
                          <Button variant="outline" className="h-16 w-16" onClick={() => focusLine(normalizedCurrentLineIndex - 1)}>
                             <ArrowUp className="h-6 w-6" />
                          </Button>
                          <Button variant="outline" className="h-16 w-16" onClick={() => focusLine(normalizedCurrentLineIndex + 1)}>
                             <ArrowDown className="h-6 w-6" />
                          </Button>
                       </div>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1.5"><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border shadow-sm">Espaço</kbd> Marcar</span>
                        <span className="flex items-center gap-1.5"><kbd className="bg-slate-100 px-1.5 py-0.5 rounded border shadow-sm">Setas</kbd> Navegar</span>
                      </div>
                      <Button variant="secondary" onClick={handleSave} disabled={updateMut.isPending || !hasLyricsSyncData(syncData)} className="font-bold">
                        {updateMut.isPending ? "Salvando..." : "Salvar Sincronização"}
                      </Button>
                    </div>
                 </div>
               ) : (
                 <div className="py-10 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-inner mb-4">
                       <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1a3a2a]">Sincronização Finalizada!</h2>
                    <p className="mb-6 text-slate-400">Revise as marcações na lista ao lado.</p>
                    <Button size="lg" onClick={handleSave} disabled={updateMut.isPending} className="bg-[#1a3a2a] font-bold">
                       {updateMut.isPending ? "Salvando..." : "Finalizar e Salvar"}
                    </Button>
                 </div>
               )}
             </CardContent>
          </Card>
        </div>

        {/* Lista Lateral com Scroll Independente */}
        <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
          <Card className="flex flex-1 flex-col overflow-hidden border-0 bg-white shadow-xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b bg-slate-50/50 px-4 py-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Lista Completa</span>
              <span className="rounded-full bg-[#1a3a2a]/10 px-2 py-0.5 text-[10px] font-black text-[#1a3a2a]">
                {syncedCount}/{markableCount} versos
              </span>
            </div>
            
            <CardContent className="flex-1 overflow-y-auto p-0" ref={listContainerRef}>
              <div className="divide-y divide-slate-50">
                {lines.map((line, index) => {
                  const isHeading = isLyricsSectionLabel(line);
                  const isCurrent = index === normalizedCurrentLineIndex;
                  const syncEntry = syncData[index];
                  const hasTime = Boolean(syncEntry && syncEntry.time >= 0);

                  if (isHeading) {
                    return (
                      <div key={index} className="bg-slate-100/50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                        {line}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={index}
                      data-line-index={index}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-all ${
                        isCurrent 
                          ? "bg-[#1a3a2a] text-white shadow-inner" 
                          : hasTime 
                            ? "bg-white text-slate-600 hover:bg-slate-50" 
                            : "bg-white text-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => focusLine(index)}
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
                      <p className={`text-sm ${isCurrent ? "font-bold" : "font-medium"}`}>{line}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
