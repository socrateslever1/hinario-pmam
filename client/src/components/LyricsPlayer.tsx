import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Pause, Play, RotateCcw, Volume2, Repeat, List, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { LyricsSyncInput } from "@/lib/lyricsSync";
import SyncedLyricsPanel from "@/components/SyncedLyricsPanel";
import { isYouTubeUrl, resolvePlayableMediaUrl } from "@/lib/media";
import { usePWA } from "@/hooks/usePWA";

interface LyricsPlayerProps {
  hymnTitle: string;
  lyrics: string;
  lyricsSync?: LyricsSyncInput;
  audioUrl?: string | null;
  instrumentalAudioUrl?: string | null;
  youtubeUrl?: string | null;
  instrumentalYoutubeUrl?: string | null;
  /** Chamado quando a faixa termina (para modo "tocar todas") */
  onEnded?: () => void;
}

type PlayMode = "once" | "all" | "repeat";
type AudioVariant = "voice" | "instrumental";

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
  instrumentalAudioUrl,
  youtubeUrl,
  instrumentalYoutubeUrl,
  onEnded,
}: LyricsPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playMode, setPlayMode] = useState<PlayMode>("once");
  const [audioVariant, setAudioVariant] = useState<AudioVariant>("voice");
  
  const { isOnline } = usePWA();
  const playerRef = useRef<MediaPlayerElement | null>(null);
  const timeBeforeVariantChange = useRef<number | null>(null);
  const mediaUrl = audioVariant === "instrumental"
    ? resolvePlayableMediaUrl({
        youtubeUrl: isOnline ? instrumentalYoutubeUrl : null,
        audioUrl: instrumentalAudioUrl,
        isOffline: !isOnline,
      })
    : resolvePlayableMediaUrl({ youtubeUrl, audioUrl, isOffline: !isOnline });
  const isYoutube = isYouTubeUrl(mediaUrl);
  
  useEffect(() => {
    if (playerRef.current && timeBeforeVariantChange.current !== null) {
      const savedTime = timeBeforeVariantChange.current;
      timeBeforeVariantChange.current = null;
      const timer = setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.currentTime = savedTime;
          setCurrentTime(savedTime);
          setPlaying(true);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
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

  useEffect(() => {
    if (audioVariant === "instrumental" && !instrumentalYoutubeUrl && !instrumentalAudioUrl) {
      setAudioVariant("voice");
    }
  }, [audioVariant, instrumentalAudioUrl, instrumentalYoutubeUrl]);

  const mediaLabel = audioVariant === "instrumental"
    ? "Instrumental"
    : isYoutube
      ? "Streaming do YouTube"
      : mediaUrl
        ? (!isOnline ? "🔴 Áudio Offline" : "Áudio do sistema")
        : "Sem mídia";

  const availabilityLabel = !mediaUrl
    ? "Midia indisponivel"
    : !isOnline
      ? "Salvo offline"
      : isYoutube
        ? "Video online"
        : "Audio online";

  return (
    <div className="mx-auto w-full max-w-[58rem] space-y-4 md:space-y-5">
      <Card className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0b3323]/78 shadow-[0_22px_60px_rgba(0,0,0,.28)] md:rounded-lg md:border-[#1a3a2a]/10 md:bg-card md:shadow-xl">
        <CardContent className="p-0">
          {/* Vídeo YouTube (visível apenas se for YouTube) */}
          {mediaUrl ? (
            <div className="overflow-hidden border-b border-white/10 bg-black md:border-[#1a3a2a]/10">
              <div className={isYoutube ? "mx-auto aspect-video w-full bg-black" : "h-0 overflow-hidden"}>
                {React.createElement(ReactPlayer as any, {
                  key: mediaUrl,
                  ref: playerRef,
                  url: mediaUrl,
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

          <div className="p-4 sm:p-5 md:p-6 bg-card text-card-foreground dark:bg-[#0b1720] border-t border-border/40">
            {/* Linha única: ícone + nome + botões de controle */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Ícone animado */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c4a84b]/30 bg-[#1a3a2a] shadow-md sm:h-14 sm:w-14 dark:bg-[#102419]"
                style={playing ? { animation: "player-spin 12s linear infinite" } : undefined}
              >
                <Music className="h-5 w-5 text-[#c4a84b] sm:h-6 sm:w-6" />
              </div>

              {/* Nome do hino — ocupa o espaço disponível */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-extrabold tracking-normal text-foreground dark:text-[#fff8e8] sm:text-lg md:text-xl">
                  {hymnTitle}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="inline-block rounded-full bg-[#1a3a2a]/10 dark:bg-[#c4a84b]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1a3a2a] dark:text-[#f0bd3a]">
                    {mediaLabel}
                  </span>
                  <span className="inline-block rounded-full bg-[#c4a84b]/20 dark:bg-[#c4a84b]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#755b08] dark:text-[#e4c75f]">
                    {availabilityLabel}
                  </span>
                </div>
              </div>

              {/* Botões de controle: reiniciar + play/pause */}
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => seekTo(0)}
                  className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95"
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
                  className="h-12 w-12 rounded-full border-2 border-[#c4a84b]/40 bg-[#c4a84b] text-[#17251d] shadow-md transition-all hover:bg-[#d6b64c] active:scale-95 sm:h-14 sm:w-14 dark:bg-[#c4a84b] dark:text-[#0c140f] dark:hover:bg-[#e4ca6f]"
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
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-[#a0b0a5] font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controles compactos */}
            <div className="mt-3 grid gap-3 border-t border-border/40 pt-3 md:grid-cols-[minmax(8rem,10rem)_minmax(0,1fr)_auto] md:items-center">
              <div className="flex items-center gap-2 md:min-w-0">
                <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Slider
                  value={[volume * 100]}
                  max={100}
                  onValueChange={handleVolumeChange}
                  disabled={!mediaUrl}
                  className="w-full min-w-24"
                />
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fonte:
                </span>
                <div className="grid min-w-0 grid-cols-2 overflow-hidden rounded-md border border-border/50 bg-muted/30 p-0.5">
                {(["voice", "instrumental"] as AudioVariant[]).map((variant) => {
                  const isActive = audioVariant === variant;
                  return (
                    <Button
                      key={variant}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (playerRef.current && Number.isFinite(playerRef.current.currentTime)) {
                          timeBeforeVariantChange.current = playerRef.current.currentTime;
                        }
                        setAudioVariant(variant);
                      }}
                      className={`h-8 rounded px-3 text-[10px] font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? "bg-[#1a3a2a] text-white shadow-xs dark:bg-[#c4a84b] dark:text-[#0c140f]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {variant === "voice" ? "Voz" : "Instrumental"}
                    </Button>
                  );
                })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
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
                      title={cfg.label}
                      className={`h-8 gap-1 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? "bg-[#1a3a2a] text-white shadow-xs dark:bg-[#c4a84b] dark:text-[#0c140f]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {cfg.icon}
                      <span className="hidden sm:inline">{cfg.label}</span>
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
