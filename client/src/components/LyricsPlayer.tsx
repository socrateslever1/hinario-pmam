import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  buildLyricsSyncLines,
  estimateLyricsSyncLines,
  hasLyricsSyncData,
  isLyricsSectionLabel,
  type LyricsSyncInput,
} from "@/lib/lyricsSync";

type LyricsPlayerProps = {
  hymnTitle: string;
  lyrics: string;
  lyricsSync?: LyricsSyncInput;
  audioUrl?: string | null;
  youtubeUrl?: string | null;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function LyricsPlayer({
  hymnTitle,
  lyrics,
  lyricsSync,
  audioUrl,
  youtubeUrl,
}: LyricsPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [autoScroll, setAutoScroll] = useState(true);

  const playerRef = useRef<any>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const mediaUrl = youtubeUrl || audioUrl || null;

  const manualLines = useMemo(() => buildLyricsSyncLines(lyrics, lyricsSync), [lyrics, lyricsSync]);
  const hasManualSync = useMemo(() => hasLyricsSyncData(manualLines), [manualLines]);
  const lines = useMemo(() => {
    if (hasManualSync) {
      return manualLines;
    }
    return estimateLyricsSyncLines(lyrics, duration);
  }, [duration, hasManualSync, lyrics, manualLines]);
  const hasSync = useMemo(() => hasLyricsSyncData(lines), [lines]);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setActiveLineIndex(-1);
  }, [mediaUrl, hymnTitle]);

  useEffect(() => {
    if (!hasSync) {
      if (activeLineIndex !== -1) {
        setActiveLineIndex(-1);
      }
      return;
    }

    let nextIndex = -1;
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (line.time >= 0 && !isLyricsSectionLabel(line.text) && currentTime + 0.15 >= line.time) {
        nextIndex = index;
        continue;
      }
      if (line.time >= 0 && currentTime + 0.15 < line.time) {
        break;
      }
    }

    if (nextIndex !== activeLineIndex) {
      setActiveLineIndex(nextIndex);
    }
  }, [activeLineIndex, currentTime, hasSync, lines]);

  useEffect(() => {
    if (!autoScroll || activeLineIndex < 0 || !lyricsContainerRef.current) {
      return;
    }

    const container = lyricsContainerRef.current;
    const activeElement = container.querySelector<HTMLElement>(`[data-line-index="${activeLineIndex}"]`);

    if (!activeElement) {
      return;
    }

    const currentScroll = container.scrollTop;
    const viewportTop = currentScroll + container.clientHeight * 0.18;
    const viewportBottom = currentScroll + container.clientHeight * 0.62;
    const elementTop = activeElement.offsetTop;
    const elementBottom = elementTop + activeElement.offsetHeight;

    if (elementTop >= viewportTop && elementBottom <= viewportBottom) {
      return;
    }

    const targetScroll = elementTop - container.clientHeight * 0.22;
    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: "smooth",
    });
  }, [activeLineIndex, autoScroll]);

  const handleProgress = useCallback((state: any) => {
    if (typeof state?.playedSeconds === 'number') {
      setCurrentTime(state.playedSeconds);
    }
  }, []);

  const handleDuration = useCallback((duration: any) => {
    if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
      setDuration(duration);
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (!playerRef.current) return;
    const safeTime = Math.max(0, Math.min(duration, time));
    playerRef.current.seekTo(safeTime, "seconds");
    setCurrentTime(safeTime);
  }, [duration]);

  const handleSeek = useCallback((values: number[]) => {
    seekTo(values[0] ?? 0);
  }, [seekTo]);

  const handleLineClick = useCallback((time: number) => {
    if (time < 0 || !mediaUrl) return;
    seekTo(time);
    setPlaying(true);
  }, [mediaUrl, seekTo]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 md:px-0">
      <Card className="overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-xl">
        <CardContent className="p-0">
          {youtubeUrl && (
            <div className="aspect-video w-full bg-black">
              {/* @ts-expect-error - ReactPlayer types are not fully compatible */}
              <ReactPlayer
                ref={playerRef as any}
                url={youtubeUrl as any}
                playing={playing}
                volume={volume}
                muted={volume === 0}
                playsInline
                width="100%"
                height="100%"
                onReady={() => {}}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                progressInterval={100}
                config={{ youtube: { playerVars: { rel: 0, modestbranding: 1 } } as any }}
              />
            </div>
          )}
          {audioUrl && !youtubeUrl && (
            <div className="hidden">
              {/* @ts-expect-error */}
              <ReactPlayer
                ref={playerRef as any}
                url={audioUrl as any}
                playing={playing}
                volume={volume}
                muted={volume === 0}
                playsInline
                onProgress={handleProgress}
                onDuration={handleDuration}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                progressInterval={100 as any}
              />
            </div>
          )}

          <div className="bg-gradient-to-br from-[#f8f5ea] via-white to-[#f7f9f6] p-4 md:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c4a84b]/25 bg-[#1a3a2a] shadow-lg md:h-14 md:w-14"
                    style={playing ? { animation: "player-spin 12s linear infinite" } : undefined}
                  >
                    <Music className="h-5 w-5 text-[#c4a84b] md:h-6 md:w-6" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold tracking-tight text-[#1d2b23] md:text-xl">
                      {hymnTitle}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground md:text-[11px]">
                      <span
                        className={`h-2 w-2 rounded-full ${playing ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
                      />
                      {youtubeUrl ? "Streaming do YouTube" : audioUrl ? "Áudio do sistema" : "Sem mídia disponível"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => seekTo(0)}
                    className="h-10 w-10 rounded-full text-muted-foreground transition-all hover:bg-[#1a3a2a]/8 hover:text-[#1a3a2a] active:scale-95 md:h-11 md:w-11"
                    disabled={!mediaUrl}
                  >
                    <RotateCcw className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => mediaUrl && setPlaying(!playing)}
                    disabled={!mediaUrl}
                    className="h-14 w-14 rounded-full border-4 border-[#c4a84b]/10 bg-[#1a3a2a] text-white shadow-[0_10px_30px_rgba(26,58,42,0.22)] transition-all hover:bg-[#1a3a2a]/95 active:scale-95 md:h-16 md:w-16"
                  >
                    {playing ? <Pause className="h-6 w-6 md:h-8 md:w-8" /> : <Play className="ml-1 h-6 w-6 md:h-8 md:w-8" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  disabled={!mediaUrl}
                  className="cursor-pointer py-1"
                />
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 md:text-[11px]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-[#1a3a2a]/8 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[volume * 100]}
                    max={100}
                    onValueChange={(value) => setVolume((value[0] ?? 80) / 100)}
                    disabled={!mediaUrl}
                    className="w-24 md:w-32"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="rounded-full bg-[#1a3a2a]/6 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#1a3a2a]/75 md:text-[10px]">
                    {hasManualSync ? "Sincronização manual" : hasSync ? "Sincronização automática" : "Leitura livre"}
                  </span>

                  <div className="flex items-center gap-3 rounded-full border border-border/40 bg-muted/20 px-3 py-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground md:text-[10px]">
                      Auto-scroll
                    </span>
                    <button
                      type="button"
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoScroll ? "bg-[#1a3a2a]" : "bg-input"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                          autoScroll ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSync && (
        <Card className="overflow-hidden border border-[#1a3a2a]/10">
          <CardContent className="p-4 md:p-6">
            <div
              ref={lyricsContainerRef}
              className="space-y-3 overflow-y-auto pr-2 md:space-y-4"
              style={{ maxHeight: "400px" }}
            >
              {lines.map((line, index) => (
                <div
                  key={index}
                  data-line-index={index}
                  onClick={() => handleLineClick(line.time)}
                  className={`transition-all ${
                    isLyricsSectionLabel(line.text)
                      ? "text-center text-xs font-bold uppercase text-muted-foreground/60 md:text-sm"
                      : `cursor-pointer rounded-lg px-3 py-2 text-sm md:px-4 md:py-3 md:text-base ${
                          activeLineIndex === index
                            ? "bg-[#1a3a2a] text-white shadow-lg"
                            : "text-foreground hover:bg-muted/50"
                        }`
                  }`}
                >
                  {line.text}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
