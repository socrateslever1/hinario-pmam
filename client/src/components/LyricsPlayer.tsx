import React, { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { LyricsSyncInput } from "@/lib/lyricsSync";
import SyncedLyricsPanel from "@/components/SyncedLyricsPanel";

interface LyricsPlayerProps {
  hymnTitle: string;
  lyrics: string;
  lyricsSync?: LyricsSyncInput;
  audioUrl?: string | null;
  youtubeUrl?: string | null;
}

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

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
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

  const playerRef = useRef<MediaPlayerElement | null>(null);
  const youtubeId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;
  const mediaUrl = audioUrl || null;

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [mediaUrl, hymnTitle, youtubeId]);

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

  const handleSeek = (values: number[]) => seekTo(values[0] ?? 0);

  const handleVolumeChange = (values: number[]) => {
    const nextVolume = Math.max(0, Math.min(100, values[0] ?? 80)) / 100;
    setVolume(nextVolume);
    if (playerRef.current && typeof playerRef.current.volume === "number") {
      playerRef.current.volume = nextVolume;
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 md:space-y-5">
      <Card className="overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-xl">
        <CardContent className="p-0">
          {youtubeId ? (
            <div className="overflow-hidden border-b border-[#1a3a2a]/10 bg-black">
              <div className="mx-auto aspect-video w-full bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1&controls=1`}
                  title={hymnTitle}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ border: "none" }}
                />
              </div>
            </div>
          ) : mediaUrl ? (
            <div className="overflow-hidden border-b border-[#1a3a2a]/10 bg-black">
              <div className="h-0 overflow-hidden">
                {React.createElement(ReactPlayer as any, {
                  key: mediaUrl,
                  ref: playerRef,
                  url: mediaUrl,
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
                  onEnded: () => setPlaying(false),
                })}
              </div>
            </div>
          ) : null}

          <div className="bg-gradient-to-br from-[#f8f5ea] via-white to-[#f7f9f6] p-4 sm:p-5 md:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#c4a84b]/25 bg-[#1a3a2a] shadow-lg"
                    style={playing ? { animation: "player-spin 12s linear infinite" } : undefined}
                  >
                    <Music className="h-6 w-6 text-[#c4a84b]" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold tracking-tight text-[#1d2b23] sm:text-xl md:text-2xl">
                      {hymnTitle}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#1a3a2a]/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3a2a]/75">
                        {youtubeId ? "Streaming do YouTube" : mediaUrl ? "Audio do sistema" : "Sem midia"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
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
                    onClick={() => (mediaUrl || youtubeId) && setPlaying(!playing)}
                    disabled={!mediaUrl && !youtubeId}
                    className="h-14 w-14 rounded-full border-4 border-[#c4a84b]/10 bg-[#1a3a2a] text-white shadow-[0_10px_30px_rgba(26,58,42,0.22)] transition-all hover:bg-[#1a3a2a]/95 active:scale-95 sm:h-16 sm:w-16"
                  >
                    {playing ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
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
                    onValueChange={handleVolumeChange}
                    disabled={!mediaUrl}
                    className="w-28 md:w-32"
                  />
                </div>
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
