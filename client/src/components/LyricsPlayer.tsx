import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  buildAutomaticLyricsSyncLines,
  buildLyricsSyncLines,
  hasLyricsSyncData,
  isLyricsSectionLabel,
  type LyricsSyncInput,
} from "@/lib/lyricsSync";

interface LyricsPlayerProps {
  hymnTitle: string;
  lyrics: string;
  lyricsSync?: LyricsSyncInput;
  audioUrl?: string | null;
  youtubeUrl?: string | null;
}

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

    return buildAutomaticLyricsSyncLines(hymnTitle, lyrics, duration);
  }, [duration, hasManualSync, hymnTitle, lyrics, manualLines]);
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

      if (line.time >= 0 && !isLyricsSectionLabel(line.text) && currentTime + 0.08 >= line.time) {
        nextIndex = index;
        continue;
      }

      if (line.time >= 0 && currentTime + 0.08 < line.time) {
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

  const seekTo = (time: number) => {
    if (!playerRef.current) return;
    const safeTime = Math.max(0, Math.min(duration || time, time));
    playerRef.current.seekTo(safeTime, "seconds");
    setCurrentTime(safeTime);
  };

  const handleSeek = (values: number[]) => {
    seekTo(values[0] ?? 0);
  };

  const handleLineClick = (time: number) => {
    if (time < 0 || !mediaUrl) return;
    seekTo(time);
    setPlaying(true);
  };

  const handleProgress = (state: any) => {
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (dur: any) => {
    setDuration(dur);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Card className="overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-xl">
        <CardContent className="p-0">
          {youtubeUrl ? (
            <div className="aspect-video bg-black">
              {React.createElement(ReactPlayer as any, {
                ref: playerRef,
                url: youtubeUrl,
                playing,
                volume,
                muted: volume === 0,
                playsInline: true,
                width: "100%",
                height: "100%",
                onProgress: handleProgress,
                onDuration: handleDuration,
                onPlay: () => setPlaying(true),
                onPause: () => setPlaying(false),
                onEnded: () => setPlaying(false),
              })}
            </div>
          ) : audioUrl ? (
            <div className="h-0 overflow-hidden">
              {React.createElement(ReactPlayer as any, {
                ref: playerRef,
                url: audioUrl,
                playing,
                volume,
                muted: volume === 0,
                playsInline: true,
                onProgress: handleProgress,
                onDuration: handleDuration,
                onPlay: () => setPlaying(true),
                onPause: () => setPlaying(false),
                onEnded: () => setPlaying(false),
              })}
            </div>
          ) : null}

          <div className="bg-gradient-to-br from-[#f8f5ea] via-white to-[#f7f9f6] p-6 md:p-7">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#c4a84b]/25 bg-[#1a3a2a] shadow-lg"
                    style={playing ? { animation: "player-spin 12s linear infinite" } : undefined}
                  >
                    <Music className="h-6 w-6 text-[#c4a84b]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-extrabold tracking-tight text-[#1d2b23] md:text-2xl">
                      {hymnTitle}
                    </h3>
                    <p className="mt-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                      <span
                        className={`h-2 w-2 rounded-full ${playing ? "bg-green-500 animate-pulse" : "bg-slate-400"}`}
                      />
                      {youtubeUrl ? "Streaming do YouTube" : audioUrl ? "Áudio do sistema" : "Sem mídia disponível"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => seekTo(0)}
                    className="h-11 w-11 rounded-full text-muted-foreground transition-all hover:bg-[#1a3a2a]/8 hover:text-[#1a3a2a] active:scale-95"
                    disabled={!mediaUrl}
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => mediaUrl && setPlaying(!playing)}
                    disabled={!mediaUrl}
                    className="h-16 w-16 rounded-full border-4 border-[#c4a84b]/10 bg-[#1a3a2a] text-white shadow-[0_10px_30px_rgba(26,58,42,0.22)] transition-all hover:bg-[#1a3a2a]/95 active:scale-95"
                  >
                    {playing ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
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
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
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
                    className="w-28 md:w-32"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[#1a3a2a]/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3a2a]/75">
                    {hasManualSync ? "Sincronização manual" : hasSync ? "Sincronização automática" : "Leitura livre"}
                  </span>
                  {hasSync && (
                    <Switch
                      checked={autoScroll}
                      onCheckedChange={setAutoScroll}
                      className="data-[state=checked]:bg-[#1a3a2a]"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {lyrics && (
        <Card className="overflow-hidden border border-[#1a3a2a]/10">
          <CardContent className="p-0">
            <div
              ref={lyricsContainerRef}
              className="max-h-96 space-y-2 overflow-y-auto p-6 md:p-7"
            >
              {lines.length > 0 ? (
                lines.map((line, index) => (
                  <div
                    key={index}
                    data-line-index={index}
                    onClick={() => handleLineClick(line.time)}
                    className={`cursor-pointer rounded-lg px-3 py-2 transition-all ${
                      isLyricsSectionLabel(line.text)
                        ? "text-center text-sm font-bold text-[#1a3a2a]/60"
                        : activeLineIndex === index
                          ? "bg-[#c4a84b]/15 text-[#1a3a2a] font-semibold"
                          : "text-muted-foreground hover:bg-[#1a3a2a]/5"
                    }`}
                  >
                    {line.text}
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground">Nenhuma letra disponível</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
