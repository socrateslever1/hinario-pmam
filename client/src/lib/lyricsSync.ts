export interface LyricsSyncItem {
  time: number;
  text: string;
}

export type LyricsSyncInput = LyricsSyncItem[] | string | null | undefined;

type KnownLyricsSyncTemplate = {
  hymnTitle: string;
  lines: LyricsSyncItem[];
};

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

const KNOWN_LYRICS_SYNC_TEMPLATES: KnownLyricsSyncTemplate[] = [
  {
    hymnTitle: "Hino Nacional Brasileiro",
    lines: [
      { time: 21, text: "Ouviram do Ipiranga as margens plácidas" },
      { time: 25, text: "De um povo heroico o brado retumbante" },
      { time: 29, text: "E o Sol da liberdade, em raios fúlgidos" },
      { time: 33, text: "Brilhou no céu da pátria nesse instante" },
      { time: 37, text: "Se o penhor dessa igualdade" },
      { time: 41, text: "Conseguimos conquistar com braço forte" },
      { time: 45, text: "Em teu seio, ó liberdade" },
      { time: 49, text: "Desafia o nosso peito a própria morte!" },
      { time: 53, text: "Ó Pátria amada" },
      { time: 56, text: "Idolatrada" },
      { time: 59, text: "Salve! Salve!" },
      { time: 63, text: "Brasil, um sonho intenso, um raio vívido" },
      { time: 67, text: "De amor e de esperança à terra desce" },
      { time: 71, text: "Se em teu formoso céu, risonho e límpido" },
      { time: 75, text: "A imagem do Cruzeiro resplandece" },
      { time: 79, text: "Gigante pela própria natureza" },
      { time: 83, text: "És belo, és forte, impávido colosso" },
      { time: 87, text: "E o teu futuro espelha essa grandeza" },
      { time: 91, text: "Terra adorada" },
      { time: 94, text: "Entre outras mil" },
      { time: 97, text: "És tu, Brasil" },
      { time: 100, text: "Ó Pátria amada!" },
      { time: 103, text: "Dos filhos deste solo és mãe gentil" },
      { time: 107, text: "Pátria amada Brasil!" },
      { time: 123, text: "Deitado eternamente em berço esplêndido" },
      { time: 127, text: "Ao som do mar e à luz do céu profundo" },
      { time: 131, text: "Fulguras, ó Brasil, florão da América" },
      { time: 135, text: "Iluminado ao Sol do Novo Mundo!" },
      { time: 139, text: "Do que a terra mais garrida" },
      { time: 143, text: "Teus risonhos, lindos campos têm mais flores" },
      { time: 147, text: "Nossos bosques têm mais vida" },
      { time: 151, text: "Nossa vida, no teu seio, mais amores" },
      { time: 155, text: "Ó Pátria amada" },
      { time: 158, text: "Idolatrada" },
      { time: 161, text: "Salve! Salve!" },
      { time: 165, text: "Brasil, de amor eterno seja símbolo" },
      { time: 169, text: "O lábaro que ostentas estrelado" },
      { time: 173, text: "E diga o verde-louro dessa flâmula" },
      { time: 177, text: "Paz no futuro e glória no passado" },
      { time: 181, text: "Mas, se ergues da justiça a clava forte" },
      { time: 185, text: "Verás que um filho teu não foge à luta" },
      { time: 189, text: "Nem teme, quem te adora, a própria morte" },
      { time: 193, text: "Terra adorada" },
      { time: 196, text: "Entre outras mil" },
      { time: 199, text: "És tu, Brasil" },
      { time: 202, text: "Ó Pátria amada!" },
      { time: 205, text: "Dos filhos deste solo és mãe gentil" },
      { time: 209, text: "Pátria amada Brasil!" },
    ],
  },
];

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

export function buildKnownLyricsSyncLines(hymnTitle: string, lyrics: string): LyricsSyncItem[] | null {
  const lyricLines = splitLyrics(lyrics);
  const normalizedTitle = normalizeText(hymnTitle);

  for (const template of KNOWN_LYRICS_SYNC_TEMPLATES) {
    if (normalizeText(template.hymnTitle) !== normalizedTitle) {
      continue;
    }

    if (template.lines.length !== lyricLines.length) {
      continue;
    }

    const matches = template.lines.every((entry, index) => normalizeText(entry.text) === normalizeText(lyricLines[index]));

    if (!matches) {
      continue;
    }

    return lyricLines.map((text, index) => ({
      text,
      time: template.lines[index]?.time ?? -1,
    }));
  }

  return null;
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

export function buildAutomaticLyricsSyncLines(
  hymnTitle: string,
  lyrics: string,
  duration: number,
): LyricsSyncItem[] {
  const knownLines = buildKnownLyricsSyncLines(hymnTitle, lyrics);
  if (knownLines) {
    return knownLines;
  }

  return estimateLyricsSyncLines(lyrics, duration);
}

export function hasLyricsSyncData(lines: LyricsSyncItem[]): boolean {
  return lines.some((line) => line.time >= 0);
}

export function getNextUnsyncedLineIndex(lines: LyricsSyncItem[]): number {
  const nextIndex = lines.findIndex((line) => line.time < 0 && !isLyricsSectionLabel(line.text));
  return nextIndex === -1 ? lines.length : nextIndex;
}
