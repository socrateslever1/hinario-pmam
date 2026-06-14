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
  const [autoScroll, setAutoScroll] = useState(true);
  const rafRef = useRef<number | null>(null);

  const manualLines = useMemo(() => buildLyricsSyncLines(lyrics, lyricsSync), [lyrics, lyricsSync]);
  const hasManualSync = useMemo(() => hasLyricsSyncData(manualLines), [manualLines]);
  const lines = useMemo(() => {
    if (hasManualSync) return manualLines;
    return buildAutomaticLyricsSyncLines(hymnTitle, lyrics, duration);
  }, [duration, hasManualSync, hymnTitle, lyrics, manualLines]);
  const hasSync = useMemo(() => hasLyricsSyncData(lines), [lines]);

  // Resetar ao trocar de hino (mantém autoScroll ativo)
  useEffect(() => {
    setActiveLineIndex(-1);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, [hymnTitle, lyrics]);

  // Detectar linha ativa com base no tempo atual
  useEffect(() => {
    if (!hasSync) {
      if (activeLineIndex !== -1) setActiveLineIndex(-1);
      return;
    }

    // Encontrar a última linha cujo tempo <= currentTime
    // Iterar de trás para frente é mais eficiente e evita qualquer ambiguidade
    let nextIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (isLyricsSectionLabel(line.text)) continue;
      if (line.time < 0) continue;
      if (line.time <= currentTime + 0.08) {
        nextIndex = i;
        break; // Encontrou a linha mais recente que já passou — parar
      }
    }

    if (nextIndex !== activeLineIndex) {
      setActiveLineIndex(nextIndex);
    }
  }, [currentTime, hasSync, lines]); // Removido activeLineIndex das dependências para evitar loops

  // Auto-scroll: rola a linha ativa para o centro do painel usando scrollIntoView
  // scrollIntoView calcula a posição correta automaticamente, sem aritmética manual
  useEffect(() => {
    if (!autoScroll || activeLineIndex < 0) return;

    // Cancelar RAF anterior se ainda pendente
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const container = lyricsContainerRef.current;
      if (!container) return;

      const activeEl = container.querySelector<HTMLDivElement>(
        `[data-line-index="${activeLineIndex}"]`
      );
      if (!activeEl) return;

      // Calcular posição relativa ao container usando getBoundingClientRect
      // Isso garante que apenas o painel interno role, nunca a página inteira
      const containerRect = container.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();

      // Posição do elemento relativa ao topo do container (incluindo scroll atual)
      const elRelativeTop = elRect.top - containerRect.top + container.scrollTop;
      const containerHeight = container.clientHeight;
      const elHeight = activeEl.offsetHeight;

      // Centralizar a linha ativa no container
      const targetScroll = elRelativeTop - containerHeight / 2 + elHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeLineIndex, autoScroll]);

  const handleLineClick = (time: number) => {
    if (time < 0 || !onSeek) return;
    onSeek(time);
  };

  if (!lyrics.trim()) {
    return (
      <Card className={`overflow-hidden border border-[#1a3a2a]/10 bg-white dark:bg-[#15151a] shadow-lg ${className}`.trim()}>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma letra disponivel para a faixa atual.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden border border-[#1a3a2a]/10 bg-white dark:bg-[#15151a] shadow-lg ${className}`.trim()}>
      <CardContent className="p-0">
        <div className="border-b border-[#1a3a2a]/8 dark:border-white/10 bg-[#f8faf8] dark:bg-[#1a1a1f] px-4 py-3 sm:px-5 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a3a2a] dark:text-white/90 md:text-sm">{titleLabel}</h4>
              <p className="mt-1 text-xs leading-relaxed text-[#666] dark:text-white/70 md:text-sm">{descriptionLabel}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#1a3a2a]/6 dark:bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a3a2a] dark:text-white/80">
                {hasManualSync ? "Sync manual" : hasSync ? "Sync estimado" : "Leitura livre"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a3a2a] dark:text-white/70">Auto-scroll</span>
                <Switch checked={autoScroll} onCheckedChange={setAutoScroll} className="data-[state=checked]:bg-[#1a3a2a] dark:data-[state=checked]:bg-white" />
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
                  key={index}
                  data-line-index={index}
                  onClick={() => handleLineClick(line.time)}
                  className={`rounded-xl px-4 py-3 transition-all ${
                    isSection
                      ? "cursor-default bg-[#f4f6f4] dark:bg-white/5 text-center text-xs font-black uppercase tracking-[0.18em] text-[#1a3a2a] dark:text-white/60"
                      : isActive
                        ? "border border-[#c4a84b]/35 bg-[#fff6da] dark:bg-[#c4a84b]/20 text-[#1a3a2a] dark:text-white shadow-sm"
                        : onSeek && line.time >= 0
                          ? "cursor-pointer border border-transparent text-[#31443a] dark:text-white/90 hover:border-[#1a3a2a]/8 dark:hover:border-white/10 hover:bg-[#f7faf8] dark:hover:bg-white/5"
                          : "border border-transparent text-[#31443a] dark:text-white/90"
                  }`}
                >
                  {!isSection && line.time >= 0 && (
                    <div className={`mb-1 text-[10px] font-black uppercase tracking-[0.18em] ${isActive ? "text-[#8d6c0c]" : "text-[#1a3a2a]/35 dark:text-white/40"}`}>
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
