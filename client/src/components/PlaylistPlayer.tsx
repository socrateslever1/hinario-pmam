import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ListMusic,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  Youtube,
  Radio,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import type { LyricsSyncInput } from "@/lib/lyricsSync";
import SyncedLyricsPanel from "@/components/SyncedLyricsPanel";
import { useIsMobile } from "@/hooks/useMobile";
import { isYouTubeUrl, resolvePlayableMediaUrl } from "@/lib/media";
import { usePWA } from "@/hooks/usePWA";
import { cacheHymnForOffline, getCachedHymnAudio } from "@/lib/offlineHymns";

interface PlaylistItem {
  id: number;
  number: number;
  title: string;
  subtitle?: string | null;
  author?: string | null;
  category?: string | null;
  lyrics?: string | null;
  lyricsSync?: LyricsSyncInput;
  youtubeUrl?: string | null;
  instrumentalYoutubeUrl?: string | null;
  audioUrl?: string | null;
  instrumentalAudioUrl?: string | null;
}

interface PlaylistPlayerProps {
  title: string;
  description?: string;
  items: PlaylistItem[];
  accentColor?: string;
}

type RepeatMode = "off" | "all" | "one";
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

function audioCacheKey(id: number, variant: AudioVariant) {
  return `${id}:${variant}`;
}

function getVoiceOnlineMediaUrl(item: PlaylistItem) {
  return resolvePlayableMediaUrl({ youtubeUrl: item.youtubeUrl, audioUrl: item.audioUrl });
}

function getInstrumentalOnlineMediaUrl(item: PlaylistItem) {
  return resolvePlayableMediaUrl({
    youtubeUrl: item.instrumentalYoutubeUrl,
    audioUrl: item.instrumentalAudioUrl,
  });
}

function getOnlineMediaUrl(item: PlaylistItem, variant: AudioVariant) {
  if (variant === "instrumental") {
    return getInstrumentalOnlineMediaUrl(item) ?? getVoiceOnlineMediaUrl(item);
  }
  return getVoiceOnlineMediaUrl(item);
}

export default function PlaylistPlayer({
  title,
  description,
  items,
  accentColor = "#f0bd3a",
}: PlaylistPlayerProps) {
  const isMobile = useIsMobile();
  const { isOnline } = usePWA();
  const [offlineAudios, setOfflineAudios] = useState<Record<string, string>>({});
  const [isPreparingOffline, setIsPreparingOffline] = useState(false);
  const [audioVariant, setAudioVariant] = useState<AudioVariant>("voice");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const playerRef = useRef<any>(null);
  const timeBeforeVariantChange = useRef<number | null>(null);

  // Carregar áudios em cache offline
  useEffect(() => {
    let isMounted = true;
    async function loadCachedAudios() {
      const nextMap: Record<string, string> = {};
      for (const item of items) {
        for (const variant of ["voice", "instrumental"] as const) {
          const cachedBlob = await getCachedHymnAudio(item.id, variant).catch(() => null);
          if (cachedBlob && isMounted) {
            nextMap[audioCacheKey(item.id, variant)] = URL.createObjectURL(cachedBlob);
          }
        }
      }
      if (isMounted) setOfflineAudios(nextMap);
    }
    loadCachedAudios();
    return () => {
      isMounted = false;
      Object.values(offlineAudios).forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [items]);

  const queue = useMemo(() => {
    return items.filter((item) => {
      if (isOnline) {
        return Boolean(
          item.youtubeUrl ||
            item.audioUrl ||
            item.instrumentalYoutubeUrl ||
            item.instrumentalAudioUrl
        );
      }
      return Boolean(
        offlineAudios[audioCacheKey(item.id, "voice")] ||
          offlineAudios[audioCacheKey(item.id, "instrumental")]
      );
    });
  }, [items, isOnline, offlineAudios]);

  const currentItem = queue[currentIndex] ?? null;

  const currentMediaUrl = useMemo(() => {
    if (!currentItem) return null;
    const cacheKey = audioCacheKey(currentItem.id, audioVariant);
    const cachedUrl = offlineAudios[cacheKey];
    if (cachedUrl) return cachedUrl;

    if (audioVariant === "instrumental") {
      const voiceCacheKey = audioCacheKey(currentItem.id, "voice");
      const cachedVoice = offlineAudios[voiceCacheKey];
      if (!isOnline && cachedVoice) return cachedVoice;
    }

    if (isOnline) return getOnlineMediaUrl(currentItem, audioVariant);
    return null;
  }, [currentItem, audioVariant, offlineAudios, isOnline]);

  const isYoutube = isYouTubeUrl(currentMediaUrl);

  const isUsingFallbackVoice =
    audioVariant === "instrumental" &&
    currentItem &&
    !offlineAudios[audioCacheKey(currentItem.id, "instrumental")] &&
    !getInstrumentalOnlineMediaUrl(currentItem) &&
    Boolean(getVoiceOnlineMediaUrl(currentItem));

  const selectedMediaConfigured = useMemo(() => {
    if (!currentItem) return false;
    if (audioVariant === "instrumental") {
      return Boolean(
        offlineAudios[audioCacheKey(currentItem.id, "instrumental")] ||
          getInstrumentalOnlineMediaUrl(currentItem)
      );
    }
    return Boolean(
      offlineAudios[audioCacheKey(currentItem.id, "voice")] ||
        getVoiceOnlineMediaUrl(currentItem)
    );
  }, [currentItem, audioVariant, offlineAudios]);

  const mediaModeLabel = isYoutube
    ? "YouTube • Vídeo"
    : currentMediaUrl?.startsWith("blob:")
    ? "Áudio Offline"
    : "Áudio Online";

  const availabilityLabel = !isOnline
    ? "Modo Offline"
    : isUsingFallbackVoice
    ? "Voz (Instrumental não disponível)"
    : audioVariant === "instrumental"
    ? "Instrumental"
    : "Hino com Voz";

  const syncMediaState = (media: MediaPlayerElement | null) => {
    if (!media) return;
    if (Number.isFinite(media.currentTime)) setCurrentTime(media.currentTime);
    if (Number.isFinite(media.duration) && media.duration > 0) setDuration(media.duration);
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    const player = playerRef.current;
    if (!player) return;
    if (typeof player.seekTo === "function") {
      player.seekTo(seconds, "seconds");
      return;
    }
    if (typeof player.currentTime === "number") {
      player.currentTime = seconds;
    }
  };

  const handleEnded = () => {
    if (repeatMode === "one") {
      seekTo(0);
      setPlaying(true);
      return;
    }
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentTime(0);
      setPlaying(true);
    } else if (repeatMode === "all") {
      setCurrentIndex(0);
      setCurrentTime(0);
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  };

  const goToIndex = (index: number, autoPlay = true) => {
    if (index < 0 || index >= queue.length) return;
    setCurrentIndex(index);
    setCurrentTime(0);
    setDuration(0);
    setPlaylistOpen(false);
    if (autoPlay) setPlaying(true);
  };

  const handlePrev = () => {
    if (currentTime > 4) {
      seekTo(0);
      return;
    }
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1, playing);
    } else if (repeatMode === "all") {
      goToIndex(queue.length - 1, playing);
    }
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      goToIndex(currentIndex + 1, playing);
    } else if (repeatMode === "all") {
      goToIndex(0, playing);
    }
  };

  const cycleRepeatMode = () => {
    setRepeatMode((current) => {
      if (current === "off") return "all";
      if (current === "all") return "one";
      return "off";
    });
  };

  const handleSeek = (values: number[]) => seekTo(values[0] ?? 0);

  const handleVolumeChange = (values: number[]) => {
    const nextVolume = Math.max(0, Math.min(100, values[0] ?? 80)) / 100;
    setVolume(nextVolume);
    if (playerRef.current && typeof playerRef.current.volume === "number") {
      playerRef.current.volume = nextVolume;
    }
  };

  if (queue.length === 0) {
    return (
      <Card className="overflow-hidden border border-[#c4a84b]/35 bg-gradient-to-br from-[#10281d] via-[#183225] to-[#244b36] text-white shadow-md">
        <CardContent className="flex flex-col items-center gap-3 p-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c4a84b]/30 bg-[#c4a84b]/15 text-[#f0bd3a]">
              <ListMusic className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-white/70">
                {isOnline
                  ? "Nenhum item desta seleção possui áudio configurado ainda."
                  : "Nenhum MP3 salvo neste aparelho para reproduzir offline."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Componente de Seleção de Variante (Voz / Instrumental)
  const renderVariantSelector = () => (
    <div className="inline-flex items-center rounded-lg border border-[#c4a84b]/35 bg-[#f7f1da] p-0.5 shadow-sm dark:border-white/15 dark:bg-black/40">
      <button
        type="button"
        onClick={() => {
          if (playerRef.current && Number.isFinite(playerRef.current.currentTime)) {
            timeBeforeVariantChange.current = playerRef.current.currentTime;
          }
          setAudioVariant("voice");
        }}
        className={`rounded-md px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-all ${
          audioVariant === "voice"
            ? "bg-[#f0bd3a] text-[#061710] shadow-sm"
            : "text-[#1a3a2a]/75 hover:bg-[#1a3a2a]/8 hover:text-[#1a3a2a] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
        }`}
      >
        Hino com Voz
      </button>
      <button
        type="button"
        onClick={() => {
          if (playerRef.current && Number.isFinite(playerRef.current.currentTime)) {
            timeBeforeVariantChange.current = playerRef.current.currentTime;
          }
          setAudioVariant("instrumental");
        }}
        className={`rounded-md px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-all ${
          audioVariant === "instrumental"
            ? "bg-[#f0bd3a] text-[#061710] shadow-sm"
            : "text-[#1a3a2a]/75 hover:bg-[#1a3a2a]/8 hover:text-[#1a3a2a] dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
        }`}
      >
        Instrumental
      </button>
    </div>
  );

  return (
    <Card className="overflow-hidden border border-[#c4a84b]/35 bg-white text-[#122016] shadow-xl dark:bg-[#0a1b12] dark:text-white">
      <CardContent className="p-0">
        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_300px]">

          {/* Lado Esquerdo / Painel Principal do Player */}
          <div className="min-w-0 bg-[#fffdf5] text-[#122016] dark:bg-gradient-to-br dark:from-[#0c1f15] dark:via-[#142d20] dark:to-[#0a1711] dark:text-white">

            {/* Player de Vídeo YouTube (se houver e estiver ativo - proporção 16:9 completa sem cortes) */}
            {currentMediaUrl && isYoutube && (
              <div className="overflow-hidden border-b border-white/10 bg-black">
                <div className="relative aspect-video w-full bg-black">
                  {React.createElement(ReactPlayer as any, {
                    key: currentMediaUrl,
                    ref: playerRef,
                    url: currentMediaUrl,
                    src: currentMediaUrl,
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
            )}

            {/* Player de Áudio Oculto (quando não for YouTube) */}
            {currentMediaUrl && !isYoutube && (
              <div className="h-0 overflow-hidden">
                {React.createElement(ReactPlayer as any, {
                  key: currentMediaUrl,
                  ref: playerRef,
                  url: currentMediaUrl,
                  src: currentMediaUrl,
                  playing,
                  volume,
                  muted: volume === 0,
                  playsInline: true,
                  width: "0",
                  height: "0",
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
            )}

            {/* CORPO COMPACTO DO PLAYER (-60% de altura / Alto Contraste) */}
            <div className="space-y-2.5 p-3 sm:p-3.5">

              {/* Cabeçalho da Playlist (Contraste Corrigido: Dourado + Branco) */}
              <div className="flex items-center justify-between gap-2 border-b border-[#1a3a2a]/10 pb-2 dark:border-white/10">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#f0bd3a]/20 text-[#8a6a0c] dark:text-[#f0bd3a]">
                    <Music className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a6a0c] dark:text-[#e5c65d]">
                        Playlist Ativa
                      </span>
                      <span className="truncate text-xs font-black text-[#1a3a2a] dark:text-white">
                        • {title}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded-full border border-[#c4a84b]/40 bg-[#f7f1da] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#1a3a2a] dark:border-[#f0bd3a]/30 dark:bg-black/40 dark:text-[#f0bd3a]">
                    {currentIndex + 1} / {queue.length}
                  </span>

                  {/* Botão para abrir fila no Mobile */}
                  <Sheet open={playlistOpen} onOpenChange={setPlaylistOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-[#1a3a2a] hover:bg-[#1a3a2a]/8 dark:text-white/80 dark:hover:bg-white/10 lg:hidden">
                        <ListMusic className="h-4 w-4 mr-1 text-[#f0bd3a]" />
                        Fila
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full p-0 sm:w-96">
                      <SheetTitle className="sr-only">Fila de reprodução</SheetTitle>
                      <div className="flex h-full flex-col bg-[#fffdf5] text-[#122016] dark:bg-[#071018] dark:text-white">
                        <div className="flex items-center justify-between border-b border-[#1a3a2a]/10 px-4 py-3 dark:border-white/10">
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a6a0c] dark:text-[#f0bd3a]">
                            Fila de Execução ({queue.length})
                          </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                          {queue.map((item, index) => {
                            const isCurrent = index === currentIndex;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => goToIndex(index, true)}
                                className={`flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-all ${
                                  isCurrent
                                    ? "border border-[#c4a84b]/50 bg-[#1a3a2a] text-white shadow-md dark:bg-[#145c3a]"
                                    : "border border-[#1a3a2a]/8 bg-[#1a3a2a]/5 text-[#1a3a2a]/80 hover:bg-[#1a3a2a]/10 dark:border-white/5 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                                }`}
                              >
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black ${
                                  isCurrent ? "bg-[#f0bd3a] text-black" : "bg-[#1a3a2a]/10 text-[#1a3a2a]/70 dark:bg-white/10 dark:text-white/70"
                                }`}>
                                  {String(item.number).padStart(2, "0")}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-bold leading-tight text-[#061710] dark:text-white">
                                    {item.title}
                                  </p>
                                  <p className="truncate text-[10px] text-[#31443a]/70 dark:text-white/60">
                                    {item.subtitle || item.author || "Faixa"}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Card da Faixa Atual (Compacto e Elegante) */}
              <div className="flex items-center gap-3 rounded-xl border border-[#c4a84b]/25 bg-[#f8f3df] p-2.5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-black/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c4a84b]/35 bg-[#1a3a2a] text-[#f0bd3a] shadow-inner dark:bg-gradient-to-br dark:from-[#1b3d2b] dark:to-[#0b1c13]">
                  {isYoutube ? <Youtube className="h-5 w-5" /> : <Music className="h-5 w-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#8a6a0c] dark:text-[#e5c65d]">
                      {mediaModeLabel}
                    </span>
                    <span className="text-[9px] text-[#1a3a2a]/35 dark:text-white/40">•</span>
                    <span className="text-[9px] font-bold text-[#1a3a2a]/70 dark:text-white/70">
                      {availabilityLabel}
                    </span>
                  </div>
                  <h4 className="truncate text-sm font-bold leading-snug text-[#061710] dark:text-white sm:text-base">
                    {currentItem?.title}
                  </h4>
                  <p className="truncate text-xs text-[#31443a] dark:text-white/75">
                    {currentItem?.subtitle || currentItem?.author || "Faixa selecionada"}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso com Timers Integrados */}
              <div className="space-y-0.5 pt-0.5">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer py-1"
                />
                <div className="flex justify-between font-mono text-[10px] font-bold text-[#1a3a2a]/65 dark:text-white/70">
                  <span className="text-[#8a6a0c] dark:text-[#f0bd3a]">{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Barra Unificada de Controles (Sleek Toolbar) */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1a3a2a]/10 pt-1 dark:border-white/10">

                {/* Controles de Reprodução */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-[#1a3a2a]/10 text-[#1a3a2a] hover:bg-[#1a3a2a]/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    onClick={handlePrev}
                    title="Anterior"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    className="h-11 w-11 rounded-full bg-[#f0bd3a] text-[#061710] hover:bg-[#ffc83b] shadow-lg shadow-[#f0bd3a]/25 transition-transform active:scale-95"
                    onClick={() => setPlaying((current) => !current)}
                    title={playing ? "Pausar" : "Tocar"}
                  >
                    {playing ? (
                      <Pause className="h-5 w-5 fill-current" />
                    ) : (
                      <Play className="ml-0.5 h-5 w-5 fill-current" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-[#1a3a2a]/10 text-[#1a3a2a] hover:bg-[#1a3a2a]/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                    onClick={handleNext}
                    title="Próxima"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full transition-colors ${
                      repeatMode !== "off"
                        ? "bg-[#f0bd3a] text-black"
                        : "bg-[#1a3a2a]/10 text-[#1a3a2a]/70 hover:bg-[#1a3a2a]/15 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20"
                    }`}
                    onClick={cycleRepeatMode}
                    title={`Repetir: ${repeatMode}`}
                  >
                    {repeatMode === "one" ? (
                      <Repeat1 className="h-4 w-4" />
                    ) : (
                      <Repeat className="h-4 w-4" />
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setAutoAdvance((v) => !v)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                      autoAdvance
                        ? "border border-[#c4a84b]/45 bg-[#1a3a2a] text-[#f0bd3a] dark:border-[#f0bd3a]/40 dark:bg-[#145c3a]"
                        : "border border-[#1a3a2a]/10 bg-[#1a3a2a]/8 text-[#1a3a2a]/55 hover:bg-[#1a3a2a]/12 dark:border-white/10 dark:bg-white/10 dark:text-white/50 dark:hover:bg-white/15"
                    }`}
                    title="Avançar automaticamente para a próxima música"
                  >
                    Próxima Auto
                  </button>
                </div>

                {/* Seletor de Áudio (Voz / Instrumental) */}
                <div className="flex items-center">
                  {renderVariantSelector()}
                </div>
              </div>

              {/* Rodapé do Player: Volume & Status em Linha Única */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1a3a2a]/8 pt-1 text-[9px] font-bold uppercase tracking-wider text-[#1a3a2a]/60 dark:border-white/5 dark:text-white/60">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-[#8a6a0c] dark:text-[#f0bd3a]" />
                  <Slider
                    value={[volume * 100]}
                    max={100}
                    onValueChange={handleVolumeChange}
                    className="w-20 sm:w-24 cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="rounded border border-[#c4a84b]/25 bg-[#f7f1da] px-2 py-0.5 text-[#8a6a0c] dark:border-white/10 dark:bg-black/40 dark:text-[#f0bd3a]">
                    Repeat: {repeatMode}
                  </span>
                  <span className="rounded border border-[#1a3a2a]/10 bg-[#1a3a2a]/5 px-2 py-0.5 dark:border-white/10 dark:bg-black/40">
                    Auto: {autoAdvance ? "Ligado" : "Desligado"}
                  </span>
                  <span className="rounded border border-[#1a3a2a]/10 bg-[#1a3a2a]/5 px-2 py-0.5 dark:border-white/10 dark:bg-black/40">
                    {selectedMediaConfigured ? "Base OK" : "Sem Variante"}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Lado Direito / Fila da Playlist (Desktop) */}
          <div className="hidden min-h-0 border-l border-[#1a3a2a]/10 bg-[#f8f3df] text-[#122016] dark:border-white/10 dark:bg-[#071018] dark:text-white lg:flex lg:flex-col">
            <div className="flex items-center justify-between border-b border-[#1a3a2a]/10 bg-[#eee6cb] px-3 py-2 dark:border-white/10 dark:bg-black/30">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#8a6a0c] dark:text-[#f0bd3a]">
                <ListMusic className="h-3.5 w-3.5" /> Fila ({queue.length})
              </span>
            </div>

            <div className="max-h-[16rem] flex-1 space-y-1 overflow-y-auto p-2">
              {queue.map((item, index) => {
                const isCurrent = index === currentIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToIndex(index, true)}
                    className={`flex w-full items-center gap-2 rounded-lg p-2 text-left transition-all ${
                      isCurrent
                        ? "border border-[#c4a84b]/50 bg-[#1a3a2a] text-white shadow-sm dark:border-[#f0bd3a]/40 dark:bg-[#145c3a]"
                        : "border border-transparent bg-white/55 text-[#1a3a2a]/80 hover:bg-white dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-black ${
                        isCurrent
                          ? "bg-[#f0bd3a] text-black"
                          : "bg-[#1a3a2a]/10 text-[#1a3a2a]/70 dark:bg-white/10 dark:text-white/70"
                      }`}
                    >
                      {String(item.number).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold leading-tight text-[#061710] dark:text-white">
                        {item.title}
                      </p>
                      <p className="truncate text-[10px] text-[#31443a]/70 dark:text-white/50">
                        {item.subtitle || item.author || "Faixa"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Letras Sincronizadas (Abaixo do Player) */}
        {currentItem && (
          <div className="border-t border-[#1a3a2a]/10 bg-[#fffdf5] p-3 text-[#122016] dark:border-white/10 dark:bg-[#061019] dark:text-white sm:p-4">
            <SyncedLyricsPanel
              hymnTitle={currentItem.title}
              lyrics={currentItem.lyrics ?? ""}
              lyricsSync={currentItem.lyricsSync}
              currentTime={currentTime}
              duration={duration}
              onSeek={(time) => {
                seekTo(time);
                setPlaying(true);
              }}
              titleLabel="Letra da faixa"
              descriptionLabel="Acompanhe a reprodução e toque em um trecho para avançar."
              className="border-[#c4a84b]/25 bg-white/80 shadow-none dark:border-white/10 dark:bg-transparent"
              maxHeightClassName="max-h-[13rem] md:max-h-[15rem]"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
