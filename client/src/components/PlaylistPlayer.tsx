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
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { LyricsSyncInput } from "@/lib/lyricsSync";
import SyncedLyricsPanel from "@/components/SyncedLyricsPanel";
import { useIsMobile } from "@/hooks/useMobile";
import { isYouTubeUrl, resolvePlayableMediaUrl } from "@/lib/media";

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
  audioUrl?: string | null;
}

interface PlaylistPlayerProps {
  title: string;
  description?: string;
  items: PlaylistItem[];
  accentColor?: string;
}

type RepeatMode = "off" | "all" | "one";

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

function getMediaUrl(item: PlaylistItem) {
  return resolvePlayableMediaUrl({ youtubeUrl: item.youtubeUrl, audioUrl: item.audioUrl });
}

export default function PlaylistPlayer({
  title,
  description,
  items,
  accentColor = "#c4a84b",
}: PlaylistPlayerProps) {
  const isMobile = useIsMobile();
  const queue = useMemo(() => items.filter((item) => Boolean(getMediaUrl(item))), [items]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const playerRef = useRef<MediaPlayerElement | null>(null);

  useEffect(() => {
    if (queue.length === 0) {
      setCurrentIndex(0);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    setCurrentIndex((current) => Math.min(current, queue.length - 1));
  }, [queue.length]);

  const currentItem = queue[currentIndex] ?? null;
  const currentMediaUrl = currentItem ? getMediaUrl(currentItem) : null;
  const isYoutube = isYouTubeUrl(currentMediaUrl);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentMediaUrl]);

  const syncMediaState = (media?: MediaPlayerElement | null) => {
    if (!media) return;
    playerRef.current = media;

    if (Number.isFinite(media.currentTime)) setCurrentTime(media.currentTime);
    if (Number.isFinite(media.duration) && media.duration > 0) setDuration(media.duration);
  };

  useEffect(() => {
    if (!currentMediaUrl) return;

    const interval = window.setInterval(() => {
      syncMediaState(playerRef.current);
    }, playing ? 100 : 300);

    return () => window.clearInterval(interval);
  }, [currentMediaUrl, playing]);

  const goToIndex = (nextIndex: number, shouldPlay = playing) => {
    if (queue.length === 0) return;
    const boundedIndex = Math.max(0, Math.min(queue.length - 1, nextIndex));
    setCurrentIndex(boundedIndex);
    setPlaying(shouldPlay);
    setCurrentTime(0);
    if (isMobile) setPlaylistOpen(false);
  };

  const seekTo = (time: number) => {
    if (!playerRef.current) return;
    const safeTime = Math.max(0, Math.min(duration || time, time));
    playerRef.current.currentTime = safeTime;
    setCurrentTime(safeTime);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;

    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    if (currentIndex === 0) {
      goToIndex(repeatMode === "all" ? queue.length - 1 : 0);
      return;
    }

    goToIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (queue.length === 0) return;

    if (repeatMode === "one") {
      seekTo(0);
      setPlaying(true);
      return;
    }

    if (currentIndex < queue.length - 1) {
      goToIndex(currentIndex + 1, true);
      return;
    }

    if (repeatMode === "all") {
      goToIndex(0, true);
      return;
    }

    setPlaying(false);
  };

  const handleEnded = () => {
    if (!autoAdvance) {
      if (repeatMode === "one") {
        seekTo(0);
        setPlaying(true);
      } else {
        setPlaying(false);
      }
      return;
    }

    handleNext();
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
      <Card className="overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-xl">
        <CardContent className="p-6 text-center sm:p-8">
          <ListMusic className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum item desta selecao possui audio ou YouTube configurado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Layout Mobile: Player compacto + Playlist em drawer
  if (isMobile) {
    return (
      <div className="space-y-3 md:space-y-4">
        {/* Player Compacto */}
        <Card className="overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-lg">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-[#0f2017] via-[#183225] to-[#10281d] text-white">
              {/* Video YouTube (se houver) */}
              {currentMediaUrl && isYoutube && (
                <div className="overflow-hidden border-b border-white/10 bg-black">
                  <div className="mx-auto aspect-video w-full bg-black">
                    {React.createElement(ReactPlayer as any, {
                      key: currentMediaUrl,
                      ref: playerRef,
                      src: currentMediaUrl,
                      playing,
                      volume,
                      muted: volume === 0,
                      playsInline: true,
                      width: "100%",
                      height: "100%",
                      onReady: () => syncMediaState(playerRef.current),
                      onTimeUpdate: (event: any) => syncMediaState(event.currentTarget as MediaPlayerElement),
                      onDurationChange: (event: any) => syncMediaState(event.currentTarget as MediaPlayerElement),
                      onPlay: () => setPlaying(true),
                      onPause: () => setPlaying(false),
                      onEnded: handleEnded,
                      config: isYoutube
                        ? { youtube: { playerVars: { rel: 0, modestbranding: 1, playsinline: 1 } } }
                        : undefined,
                    })}
                  </div>
                </div>
              )}

              {/* Player de Áudio (se não for YouTube) */}
              {currentMediaUrl && !isYoutube && (
                <div className="overflow-hidden border-b border-white/10 px-3 pt-3">
                  {React.createElement(ReactPlayer as any, {
                    key: currentMediaUrl,
                    ref: playerRef,
                    src: currentMediaUrl,
                    playing,
                    volume,
                    muted: volume === 0,
                    playsInline: true,
                    width: "0",
                    height: "0",
                    onReady: () => syncMediaState(playerRef.current),
                    onTimeUpdate: (event: any) => syncMediaState(event.currentTarget as MediaPlayerElement),
                    onDurationChange: (event: any) => syncMediaState(event.currentTarget as MediaPlayerElement),
                    onPlay: () => setPlaying(true),
                    onPause: () => setPlaying(false),
                    onEnded: handleEnded,
                  })}
                </div>
              )}

              {/* Informações Compactas */}
              <div className="space-y-3 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
                      {isYoutube ? "YouTube" : "Audio"} • {currentIndex + 1}/{queue.length}
                    </p>
                    <h4 className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight text-white">
                      {currentItem?.title}
                    </h4>
                    <p className="mt-0.5 line-clamp-1 text-xs text-white/60">
                      {currentItem?.subtitle || currentItem?.author || "Faixa atual"}
                    </p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-1">
                  <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="cursor-pointer py-1" />
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controles Compactos */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full" onClick={handlePrev}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-10 w-10 rounded-full bg-white text-[#10281d] hover:bg-white/90"
                      onClick={() => setPlaying((current) => !current)}
                    >
                      {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                    </Button>
                    <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full" onClick={handleNext}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Botão Playlist */}
                  <Sheet open={playlistOpen} onOpenChange={setPlaylistOpen}>
                    <SheetTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full">
                        <ListMusic className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full p-0 sm:w-96">
                      <div className="flex h-full flex-col bg-[#f6faf6]">
                        <div className="border-b border-[#1a3a2a]/10 px-4 py-3 flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a3a2a]/55">
                            Fila ({queue.length})
                          </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                          {queue.map((item, index) => {
                            const isCurrent = index === currentIndex;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => goToIndex(index, true)}
                                className={`mb-2 flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-all ${
                                  isCurrent ? "bg-[#1a3a2a] text-white shadow-md" : "bg-white text-[#243329] ring-1 ring-[#1a3a2a]/8 hover:bg-[#f0f5f0]"
                                }`}
                              >
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-[10px] font-black ${
                                    isCurrent ? "bg-white/15 text-white" : "bg-[#1a3a2a]/8 text-[#1a3a2a]"
                                  }`}
                                >
                                  {String(item.number).padStart(2, "0")}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`line-clamp-1 text-xs font-bold leading-tight ${isCurrent ? "text-white" : "text-[#1d2b23]"}`}>
                                    {item.title}
                                  </p>
                                  <p className={`mt-0.5 line-clamp-1 text-[10px] ${isCurrent ? "text-white/65" : "text-[#1d2b23]/60"}`}>
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

                {/* Status Compacto */}
                <div className="flex flex-wrap items-center gap-1 text-[8px] font-bold uppercase tracking-[0.15em] text-white/45">
                  <span className="rounded-full bg-white/10 px-2 py-0.5">Repeat: {repeatMode}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5">Auto: {autoAdvance ? "on" : "off"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Letras Sincronizadas */}
        {currentItem && (
          <Card className="overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-lg">
            <CardContent className="p-3">
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
                titleLabel={`Letra`}
                descriptionLabel="Sincronizada em tempo real"
                className="shadow-none"
                maxHeightClassName="max-h-[16rem]"
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Layout Desktop: Grid com playlist lateral
  return (
    <Card className="overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-xl">
      <CardContent className="p-0">
        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 bg-gradient-to-br from-[#0f2017] via-[#183225] to-[#10281d] text-white">
            {currentMediaUrl ? (
              <div className="overflow-hidden border-b border-white/10 bg-black">
                <div className={isYoutube ? "mx-auto aspect-video w-full bg-black" : "h-0 overflow-hidden"}>
                  {React.createElement(ReactPlayer as any, {
                    key: currentMediaUrl,
                    ref: playerRef,
                    src: currentMediaUrl,
                    playing,
                    volume,
                    muted: volume === 0,
                    playsInline: true,
                    width: "100%",
                    height: "100%",
                    onReady: () => syncMediaState(playerRef.current),
                    onTimeUpdate: (event: any) => syncMediaState(event.currentTarget as MediaPlayerElement),
                    onDurationChange: (event: any) => syncMediaState(event.currentTarget as MediaPlayerElement),
                    onPlay: () => setPlaying(true),
                    onPause: () => setPlaying(false),
                    onEnded: handleEnded,
                    config: isYoutube
                      ? { youtube: { playerVars: { rel: 0, modestbranding: 1, playsinline: 1 } } }
                      : undefined,
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-3 p-4 sm:p-4 md:p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/55">Playlist ativa</p>
                  <h3 className="mt-1 text-xl font-black tracking-tight sm:text-2xl" style={{ color: accentColor }}>
                    {title}
                  </h3>
                  {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">{description}</p>}
                </div>

                <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                  {currentIndex + 1}/{queue.length}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                    {isYoutube ? <Youtube className="h-6 w-6" style={{ color: accentColor }} /> : <Music className="h-6 w-6" style={{ color: accentColor }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                      {isYoutube ? "YouTube" : "Audio"}
                    </p>
                    <h4 className="mt-1 line-clamp-2 text-base font-bold leading-tight text-white sm:text-lg xl:text-xl">
                      {currentItem?.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-sm text-white/60">
                      {currentItem?.subtitle || currentItem?.author || "Faixa atual da playlist"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="cursor-pointer py-1" />
                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/55">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <Button variant="secondary" size="icon" className="h-11 w-11 rounded-full" onClick={handlePrev}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full bg-white text-[#10281d] hover:bg-white/90"
                  onClick={() => setPlaying((current) => !current)}
                >
                  {playing ? <Pause className="h-6 w-6 sm:h-7 sm:w-7" /> : <Play className="ml-0.5 h-6 w-6 sm:h-7 sm:w-7" />}
                </Button>
                <Button variant="secondary" size="icon" className="h-11 w-11 rounded-full" onClick={handleNext}>
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button
                  variant={autoAdvance ? "default" : "secondary"}
                  className="rounded-full px-3.5 text-[11px] font-bold uppercase tracking-[0.16em]"
                  onClick={() => setAutoAdvance((value) => !value)}
                >
                  Proxima auto
                </Button>
                <Button variant="secondary" size="icon" className="h-11 w-11 rounded-full" onClick={cycleRepeatMode}>
                  {repeatMode === "off" ? <Repeat className="h-5 w-5" /> : repeatMode === "all" ? <Repeat className="h-5 w-5 text-white" /> : <Repeat1 className="h-5 w-5 text-white" />}
                </Button>
              </div>

              <div className="flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 text-white/70" />
                  <Slider value={[volume * 100]} max={100} onValueChange={handleVolumeChange} className="w-28 md:w-32" />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                  <span className="rounded-full bg-white/10 px-3 py-1">Repeat: {repeatMode}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">Auto: {autoAdvance ? "ligado" : "desligado"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 border-t border-[#1a3a2a]/10 bg-[#f6faf6] lg:border-l lg:border-t-0">
            <div className="border-b border-[#1a3a2a]/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#1a3a2a]/55">
              Fila da playlist
            </div>
            <div className="max-h-[20rem] overflow-y-auto p-2 sm:max-h-[24rem] lg:max-h-[34rem]">
              {queue.map((item, index) => {
                const isCurrent = index === currentIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToIndex(index, true)}
                    className={`mb-2 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                      isCurrent ? "bg-[#1a3a2a] text-white shadow-lg" : "bg-white text-[#243329] ring-1 ring-[#1a3a2a]/8 hover:bg-[#f0f5f0]"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                        isCurrent ? "bg-white/15 text-white" : "bg-[#1a3a2a]/8 text-[#1a3a2a]"
                      }`}
                    >
                      {String(item.number).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`line-clamp-2 text-sm font-bold leading-tight ${isCurrent ? "text-white" : "text-[#1d2b23]"}`}>
                          {item.title}
                        </p>
                        {item.youtubeUrl ? <Youtube className="h-4 w-4 shrink-0" /> : <Music className="h-4 w-4 shrink-0" />}
                      </div>
                      <p className={`mt-1 line-clamp-2 text-xs ${isCurrent ? "text-white/65" : "text-[#1d2b23]/60"}`}>
                        {item.subtitle || item.author || "Selecionar faixa"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {currentItem && (
          <div className="border-t border-[#1a3a2a]/10 bg-[#f7faf7] p-3 sm:p-4 md:p-5">
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
              titleLabel={`Letra da faixa atual`}
              descriptionLabel="A letra da musica em execucao ja aparece aqui embaixo. Quando houver sincronizacao salva, ela acompanha em tempo real; caso contrario, entra uma estimativa automatica."
              className="shadow-none"
              maxHeightClassName="max-h-[18rem] md:max-h-[22rem] xl:max-h-[24rem]"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
