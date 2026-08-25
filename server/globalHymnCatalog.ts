import catalogJson from "../shared/data/global-hymns.json";
import { query } from "./mysql";

export type GlobalHymn = (typeof catalogJson)[number];

export const globalHymnCatalog: GlobalHymn[] = catalogJson as GlobalHymn[];

export function bundledActiveHymns() {
  return globalHymnCatalog.filter((hymn) => hymn.isActive && hymn.collection !== "tfm");
}

export function bundledHymnsByCollection(collection: string) {
  return globalHymnCatalog.filter((hymn) => hymn.isActive && hymn.collection === collection);
}

export function bundledHymnsByCategory(category: string) {
  return bundledActiveHymns().filter((hymn) => hymn.category === category);
}

export function bundledHymnById(id: number) {
  return globalHymnCatalog.find((hymn) => hymn.id === id);
}

export function bundledHymnByNumber(number: number) {
  return globalHymnCatalog.find((hymn) => hymn.number === number);
}

function insertParams(hymn: GlobalHymn) {
  return [
    hymn.number,
    hymn.title,
    hymn.subtitle,
    hymn.author,
    hymn.composer,
    hymn.category,
    hymn.collection,
    hymn.lyrics,
    hymn.description,
    hymn.youtubeUrl,
    hymn.instrumentalYoutubeUrl,
    hymn.audioUrl,
    hymn.instrumentalAudioUrl,
    hymn.lyricsSync ? JSON.stringify(hymn.lyricsSync) : null,
    hymn.isActive ? 1 : 0,
  ];
}

let restorePromise: Promise<void> | null = null;

export function restoreBundledHymnsIfNeeded() {
  restorePromise ??= (async () => {
    const existingRows = await query<{ number: number | string }>("SELECT number FROM pmam_hymns");
    const existingNumbers = new Set(existingRows.map((row) => Number(row.number)));
    const databaseIsEmpty = existingNumbers.size === 0;
    const missingHymns = globalHymnCatalog.filter((hymn) => !existingNumbers.has(hymn.number));

    for (const hymn of missingHymns) {
      if (databaseIsEmpty) {
        await query(
          `INSERT IGNORE INTO pmam_hymns
            (id, number, title, subtitle, author, composer, category, collection, lyrics, description,
             youtube_url, instrumental_youtube_url, audio_url, instrumental_audio_url, lyrics_sync, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [hymn.id, ...insertParams(hymn)],
        );
      } else {
        await query(
          `INSERT IGNORE INTO pmam_hymns
            (number, title, subtitle, author, composer, category, collection, lyrics, description,
             youtube_url, instrumental_youtube_url, audio_url, instrumental_audio_url, lyrics_sync, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          insertParams(hymn),
        );
      }
    }
  })().catch((error) => {
    restorePromise = null;
    throw error;
  });

  return restorePromise;
}
