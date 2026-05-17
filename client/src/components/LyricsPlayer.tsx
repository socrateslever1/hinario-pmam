import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Pause, Play, RotateCcw, Volume2, Repeat, List, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { LyricsSyncInput } from "@/lib/lyricsSync";
import SyncedLyricsPanel from "@/components/SyncedLyricsPanel";
import { isYouTubeUrl, resolvePlayableMediaUrl } from "@/lib/media";

interface LyricsPlayerProps {
  hymnTitle: string;
  lyrics: string;
  lyricsSync?: LyricsSyncInput;
  audioUrl?: string | null;
  youtubeUrl?: string | null;
  /** Chamado quando a faixa termina (para modo "tocar todas") */
  onEnded?: () => void;
}

type PlayMode = "once" | "all" | "repeat";

type MediaPlayerElement = HTMLMediaElement & {
  currentTime: number;
  duration: number;
  volume?: number;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function readTimeValue(value: any, fallback: MediaPlayerElement | null): number | null {
  const media = value?.currentTarget ?? fallback;
  if (media && Number.isFinite(media.currentTime)) return media.currentTime;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function readDurationValue(value: any, fallback: MediaPlayerElement | null): number | null {
  const media = value?.currentTarget ?? fallback;
  if (media && Number.isFinite(media.duration) && media.duration > 0) return media.duration;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  return null;
}

const playModeConfig: Record<PlayMode, { label: string; icon: React.ReactNode; next: PlayMode }> = {
  once: {
    label: "Tocar 1x",
    icon: <PlayCircle className="h-4 w-4" />,
    next: "all",
  },
  all: {
    label: "Tocar todas",
    icon: <List className="h-4 w-4" />,
    next: "repeat",
  },
  repeat: {
    label: "Repetir",
    icon: <Repeat className="h-4 w-4" />,
    next: "once",
  },
};

export default function LyricsPlayer({
  hymnTitle,
  lyrics,
  lyricsSync,
  audioUrl,
  youtubeUrl,
  onEnded,
}: LyricsPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playMode, setPlayMode] = useState<PlayMode>("once");

  const playerRef = useRef<MediaPlayerElement | null>(null);
  const mediaUrl = resolvePlayableMediaUrl({ youtubeUrl, audioUrl });
  const isYoutube = isYouTubeUrl(mediaUrl);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [mediaUrl, hymnTitle]);

  const syncMediaState = (media?: MediaPlayerElement | null) => {
    if (!media) return;
    playerRef.current = media;
    if (Number.isFinite(media.currentTime)) setCurrentTime(media.currentTime);
    if (Number.isFinite(media.duration) && media.duration > 0) setDuration(media.duration);
  };

  useEffect(() => {
    if (!mediaUrl) return;
    const interval = window.setInterval(() => {
      syncMediaState(playerRef.current);
    }, playing ? 100 : 300);
    return () => window.clearInterval(interval);
  }, [mediaUrl, playing]);

  const seekTo = (time: number) => {
    if (!playerRef.current) return;
    const safeTime = Math.max(0, Math.min(duration || time, time));
    playerRef.current.currentTime = safeTime;
    setCurrentTime(safeTime);
  };

  const handleEnded = useCallback(() => {
    if (playMode === "repeat") {
      seekTo(0);
      setPlaying(true);
    } else if (playMode === "all" && onEnded) {
      onEnded();
    } else {
      setPlaying(false);
    }
  }, [playMode, onEnded]);

  const handleSeek = (values: number[]) => seekTo(values[0] ?? 0);

  const handleVolumeChange = (values: number[]) => {
    const nextVolume = Math.max(0, Math.min(100, values[0] ?? 80)) / 100;
    setVolume(nextVolume);
    if (playerRef.current && typeof playerRef.current.volume === "number") {
      playerRef.current.volume = nextVolume;
    }
  };

  const cyclePlayMode = () => {
    setPlayMode((prev) => playModeConfig[prev].next);
  };

  const modeConfig = playModeConfig[playMode];

  return (
    <div className="mx-auto w-full max-w-[58rem] space-y-4 md:space-y-5">
      <Card className="overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-xl">
        <CardContent className="p-0">
          {/* Vídeo YouTube (visível apenas se for YouTube) */}
          {mediaUrl ? (
            <div className="overflow-hidden border-b border-[#1a3a2a]/10 bg-black">
              <div className={isYoutube ? "mx-auto aspect-video w-full bg-black" : "h-0 overflow-hidden"}>
                {React.createElement(ReactPlayer as any, {
                  key: mediaUrl,
                  ref: playerRef,
                  src: mediaUrl,
                  playing,
                  volume,
                  muted: volume === 0,
                  playsInline: true,
                  width: "100%",
                  height: "100%",
                  onReady: () => syncMediaState(playerRef.current),
                  onTimeUpdate: (value: any) => {
                    const nextTime = readTimeValue(value, playerRef.current);
                    if (nextTime !== null) setCurrentTime(nextTime);
                  },
                  onDurationChange: (value: any) => {
                    const nextDuration = readDurationValue(value, playerRef.current);
                    if (nextDuration !== null) setDuration(nextDuration);
                  },
                  onPlay: () => setPlaying(true),
                  onPause: () => setPlaying(false),
                  onEnded: handleEnded,
                })}
              </div>
            </div>
          ) : null}

          <div className="bg-gradient-to-br from-[#f8f5ea] via-white to-[#f7f9f6] p-4 sm:p-5 md:p-6">
            {/* Linha única: ícone + nome + botões de controle */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Ícone animado */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c4a84b]/25 bg-[#1a3a2a] shadow-lg sm:h-14 sm:w-14"
                style={playing ? { animation: "player-spin 12s linear infinite" } : undefined}
              >
                <Music className="h-5 w-5 text-[#c4a84b] sm:h-6 sm:w-6" />
              </div>

              {/* Nome do hino — ocupa o espaço disponível */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-extrabold tracking-tight text-[#1d2b23] sm:text-lg md:text-xl">
                  {hymnTitle}
                </h3>
                <span className="mt-0.5 inline-block rounded-full bg-[#1a3a2a]/6 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a3a2a]/70">
                  {isYoutube ? "Streaming do YouTube" : mediaUrl ? "Áudio do sistema" : "Sem mídia"}
                </span>
              </div>

              {/* Botões de controle: reiniciar + play/pause */}
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => seekTo(0)}
                  className="h-9 w-9 rounded-full text-muted-foreground transition-all hover:bg-[#1a3a2a]/8 hover:text-[#1a3a2a] active:scale-95"
                  disabled={!mediaUrl}
                  title="Reiniciar"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => mediaUrl && setPlaying(!playing)}
                  disabled={!mediaUrl}
                  className="h-12 w-12 rounded-full border-4 border-[#c4a84b]/10 bg-[#1a3a2a] text-white shadow-[0_8px_24px_rgba(26,58,42,0.22)] transition-all hover:bg-[#1a3a2a]/95 active:scale-95 sm:h-14 sm:w-14"
                >
                  {playing ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="ml-0.5 h-5 w-5 sm:h-6 sm:w-6" />}
                </Button>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="mt-4 space-y-1.5">
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

            {/* Volume + modos de reprodução */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#1a3a2a]/8 pt-3">
              {/* Volume */}
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Slider
                  value={[volume * 100]}
                  max={100}
                  onValueChange={handleVolumeChange}
                  disabled={!mediaUrl}
                  className="w-24 md:w-28"
                />
              </div>

              {/* Modos de reprodução */}
              <div className="flex items-center gap-1.5">
                {(["once", "all", "repeat"] as PlayMode[]).map((mode) => {
                  const cfg = playModeConfig[mode];
                  const isActive = playMode === mode;
                  return (
                    <Button
                      key={mode}
                      variant="ghost"
                      size="sm"
                      onClick={() => setPlayMode(mode)}
                      disabled={!mediaUrl}
                      className={`h-8 gap-1.5 rounded-full px-3 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                        isActive
                          ? "bg-[#1a3a2a] text-white shadow-sm hover:bg-[#1a3a2a]/90"
                          : "text-[#1a3a2a]/60 hover:bg-[#1a3a2a]/8 hover:text-[#1a3a2a]"
                      }`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SyncedLyricsPanel
        hymnTitle={hymnTitle}
        lyrics={lyrics}
        lyricsSync={lyricsSync}
        currentTime={currentTime}
        duration={duration}
        onSeek={(time) => {
          seekTo(time);
          setPlaying(true);
        }}
        titleLabel="Letra do hino"
      />
    </div>
  );
}
