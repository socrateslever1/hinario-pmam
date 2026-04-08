import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  buildAutomaticLyricsSyncLines,
  buildLyricsSyncLines,
  hasLyricsSyncData,
  isLyricsSectionLabel,
  type LyricsSyncInput,
} from "@/lib/lyricsSync";

interface SyncedLyricsPanelProps {
  hymnTitle: string;
  lyrics: string;
  lyricsSync?: LyricsSyncInput;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  titleLabel?: string;
  descriptionLabel?: string;
  className?: string;
  maxHeightClassName?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function SyncedLyricsPanel({
  hymnTitle,
  lyrics,
  lyricsSync,
  currentTime,
  duration,
  onSeek,
  titleLabel = "Letra sincronizada",
  descriptionLabel = "A letra acompanha a faixa atual. Toque em um verso para ir direto ao trecho.",
  className = "",
  maxHeightClassName = "max-h-[18rem] md:max-h-[24rem] xl:max-h-[28rem]",
}: SyncedLyricsPanelProps) {
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [autoScroll, setAutoScroll] = useState(false);

  const manualLines = useMemo(() => buildLyricsSyncLines(lyrics, lyricsSync), [lyrics, lyricsSync]);
  const hasManualSync = useMemo(() => hasLyricsSyncData(manualLines), [manualLines]);
  const lines = useMemo(() => {
    if (hasManualSync) return manualLines;
    return buildAutomaticLyricsSyncLines(hymnTitle, lyrics, duration);
  }, [duration, hasManualSync, hymnTitle, lyrics, manualLines]);
  const hasSync = useMemo(() => hasLyricsSyncData(lines), [lines]);

  useEffect(() => {
    setActiveLineIndex(-1);
    setAutoScroll(false);
  }, [hymnTitle, lyrics]);

  useEffect(() => {
    if (!hasSync) {
      if (activeLineIndex !== -1) setActiveLineIndex(-1);
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
    if (!autoScroll || activeLineIndex < 0 || !lyricsContainerRef.current) return;

    const container = lyricsContainerRef.current;
    const activeElement = container.querySelector<HTMLElement>(`[data-line-index="${activeLineIndex}"]`);
    if (!activeElement) return;

    const currentScroll = container.scrollTop;
    const viewportTop = currentScroll + container.clientHeight * 0.18;
    const viewportBottom = currentScroll + container.clientHeight * 0.82;
    const elementTop = activeElement.offsetTop;
    const elementBottom = elementTop + activeElement.offsetHeight;

    if (elementTop >= viewportTop && elementBottom <= viewportBottom) return;

    const targetScroll = elementTop - container.clientHeight * 0.32;
    const distance = Math.abs(currentScroll - targetScroll);

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: distance > container.clientHeight * 0.85 ? "auto" : "smooth",
    });
  }, [activeLineIndex, autoScroll]);

  const handleLineClick = (time: number) => {
    if (time < 0 || !onSeek) return;
    onSeek(time);
  };

  if (!lyrics.trim()) {
    return (
      <Card className={`overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-lg ${className}`.trim()}>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma letra disponivel para a faixa atual.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden border border-[#1a3a2a]/10 bg-white shadow-lg ${className}`.trim()}>
      <CardContent className="p-0">
        <div className="border-b border-[#1a3a2a]/8 bg-[#f8faf8] px-4 py-3 sm:px-5 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a3a2a]/72 md:text-sm">{titleLabel}</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-sm">{descriptionLabel}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#1a3a2a]/6 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a3a2a]/75">
                {hasManualSync ? "Sync manual" : hasSync ? "Sync estimado" : "Leitura livre"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a3a2a]/60">Auto-scroll</span>
                <Switch checked={autoScroll} onCheckedChange={setAutoScroll} disabled={!hasSync} className="data-[state=checked]:bg-[#1a3a2a]" />
              </div>
            </div>
          </div>
        </div>

        <div ref={lyricsContainerRef} className={`${maxHeightClassName} space-y-2.5 overflow-y-auto px-3 py-3 sm:px-4 md:px-6 md:py-4`}>
          {lines.length > 0 ? (
            lines.map((line, index) => {
              const isSection = isLyricsSectionLabel(line.text);
              const isActive = activeLineIndex === index;
              return (
                <div
                  key={`${index}-${line.text}`}
                  data-line-index={index}
                  onClick={() => handleLineClick(line.time)}
                  className={`rounded-xl px-4 py-3 transition-all ${
                    isSection
                      ? "cursor-default bg-[#f4f6f4] text-center text-xs font-black uppercase tracking-[0.18em] text-[#1a3a2a]/55"
                      : isActive
                        ? "border border-[#c4a84b]/35 bg-[#fff6da] text-[#1a3a2a] shadow-sm"
                        : onSeek && line.time >= 0
                          ? "cursor-pointer border border-transparent text-[#31443a] hover:border-[#1a3a2a]/8 hover:bg-[#f7faf8]"
                          : "border border-transparent text-[#31443a]"
                  }`}
                >
                  {!isSection && line.time >= 0 && (
                    <div className={`mb-1 text-[10px] font-black uppercase tracking-[0.18em] ${isActive ? "text-[#8d6c0c]" : "text-[#1a3a2a]/35"}`}>
                      {formatTime(line.time)}
                    </div>
                  )}
                  <p className={isSection ? "leading-none" : "text-[14px] leading-[1.55] md:text-[15px] md:leading-[1.65] xl:text-base xl:leading-[1.7]"}>{line.text}</p>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-muted-foreground">Nenhuma letra disponivel</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
