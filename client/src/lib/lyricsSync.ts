export interface LyricsSyncItem {
  time: number;
  text: string;
}

export type LyricsSyncInput = LyricsSyncItem[] | string | null | undefined;

function splitLyrics(lyrics: string): string[] {
  return lyrics
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function isLyricsSectionLabel(text: string): boolean {
  const normalized = normalizeText(text);
  return /^(?:\d+(?:ª|a|o)? parte|parte \d+|refrao|coro|estrofe|i{1,3}|iv|v|vi{0,3}|ix|x)$/.test(
    normalized,
  );
}

export function parseLyricsSync(raw: LyricsSyncInput): LyricsSyncItem[] {
  if (!raw) return [];

  let parsed: unknown = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const timeValue = (item as { time?: unknown }).time;
      const textValue = (item as { text?: unknown }).text;

      if (typeof textValue !== "string") return null;

      return {
        time: typeof timeValue === "number" && Number.isFinite(timeValue) ? timeValue : -1,
        text: textValue.trim(),
      };
    })
    .filter((item): item is LyricsSyncItem => Boolean(item && item.text));
}

export function buildLyricsSyncLines(lyrics: string, rawLyricsSync: LyricsSyncInput): LyricsSyncItem[] {
  const lyricLines = splitLyrics(lyrics);
  const parsedSync = parseLyricsSync(rawLyricsSync);

  if (parsedSync.length === 0) {
    return lyricLines.map((text) => ({ time: -1, text }));
  }

  if (parsedSync.length === lyricLines.length) {
    return lyricLines.map((text, index) => ({
      time: parsedSync[index]?.time ?? -1,
      text,
    }));
  }

  const mergedLines = lyricLines.map((text) => ({ time: -1, text }));
  let syncIndex = 0;

  for (let lyricIndex = 0; lyricIndex < lyricLines.length; lyricIndex += 1) {
    const currentSync = parsedSync[syncIndex];

    if (!currentSync) break;

    if (normalizeText(currentSync.text) === normalizeText(lyricLines[lyricIndex])) {
      mergedLines[lyricIndex] = {
        time: currentSync.time,
        text: lyricLines[lyricIndex],
      };
      syncIndex += 1;
    }
  }

  return mergedLines;
}

function getEstimatedWeight(text: string): number {
  const compactText = text.replace(/\s+/g, " ").trim();
  if (!compactText) return 8;

  return Math.max(18, Math.min(80, compactText.length + 10));
}

export function estimateLyricsSyncLines(lyrics: string, duration: number): LyricsSyncItem[] {
  const lyricLines = splitLyrics(lyrics);

  if (lyricLines.length === 0) {
    return [];
  }

  if (!(duration > 0)) {
    return lyricLines.map((text) => ({ time: -1, text }));
  }

  const timedEntries = lyricLines
    .map((text, index) => ({ text, index }))
    .filter((entry) => !isLyricsSectionLabel(entry.text));

  if (timedEntries.length === 0) {
    return lyricLines.map((text) => ({ time: -1, text }));
  }

  const averageLineDuration = duration / timedEntries.length;
  const introLeadIn = Math.min(Math.max(duration * 0.06, averageLineDuration * 0.85, 3.5), 12);
  const outroReserve = Math.min(Math.max(averageLineDuration * 0.35, 0.8), 4);
  const sectionPause = Math.min(Math.max(averageLineDuration * 0.22, 0.45), 1.8);

  const sectionPauseTotal = timedEntries.reduce((total, entry, index) => {
    if (index === 0) return total;
    return isLyricsSectionLabel(lyricLines[entry.index - 1]) ? total + sectionPause : total;
  }, 0);

  const weights = timedEntries.map((entry) => getEstimatedWeight(entry.text));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || timedEntries.length;
  const usableDuration = Math.max(
    duration - introLeadIn - outroReserve - sectionPauseTotal,
    timedEntries.length,
  );

  const timesByIndex = new Map<number, number>();
  let elapsed = introLeadIn;

  timedEntries.forEach((entry, index) => {
    if (index > 0 && isLyricsSectionLabel(lyricLines[entry.index - 1])) {
      elapsed += sectionPause;
    }

    timesByIndex.set(entry.index, Number(elapsed.toFixed(2)));
    elapsed += usableDuration * (weights[index] / totalWeight);
  });

  return lyricLines.map((text, index) => ({
    time: timesByIndex.get(index) ?? -1,
    text,
  }));
}

export function hasLyricsSyncData(lines: LyricsSyncItem[]): boolean {
  return lines.some((line) => line.time >= 0);
}

export function getNextUnsyncedLineIndex(lines: LyricsSyncItem[]): number {
  const nextIndex = lines.findIndex((line) => line.time < 0 && !isLyricsSectionLabel(line.text));
  return nextIndex === -1 ? lines.length : nextIndex;
}
