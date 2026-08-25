import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import "dotenv/config";

const CATALOG_URL = "https://www.letras.mus.br/cancoes-de-tfm/";
const COLLECTION = "tfm";
const BASE_NUMBER = 1001;
const OUTPUT_DIR = path.resolve("tmp", "tfm-import");

const dbConfig = {
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || "4000"),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: { rejectUnauthorized: true },
};

function decodeEntities(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractTitle(html, slug) {
  const structured = html.match(/_omq\.push\(\['ui\/lyric', \{[\s\S]*?"Name":"([^"]+)"/)?.[1];
  const documentTitle = html.match(/<title>(.*?)\s+-\s+Can/i)?.[1];
  return decodeEntities(structured || documentTitle || slug.replaceAll("-", " ")).trim();
}

function extractYoutubeId(html) {
  return html.match(/YoutubeID"\s*:\s*"([^"]+)"/i)?.[1]?.trim() || null;
}

function extractDuration(html) {
  return html.match(/"duration":"(PT[^"]+)"/i)?.[1] || null;
}

function durationLabel(isoDuration) {
  if (!isoDuration) return null;
  const match = isoDuration.match(/^PT(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return isoDuration;
  const minutes = Number(match[1] || 0);
  const seconds = Number(match[2] || 0);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "Mozilla/5.0 (compatible; QGDigitalCatalogSync/1.0)",
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Falha HTTP ${response.status} ao acessar ${url}`);
  return response.text();
}

function catalogEntries(html) {
  const entries = [];
  const seen = new Set();
  const regex = /href="\/cancoes-de-tfm\/([a-z0-9-]+)\/"/gi;
  let match;
  while ((match = regex.exec(html))) {
    const slug = match[1];
    if (slug === "ouvir" || seen.has(slug)) continue;
    seen.add(slug);
    entries.push({ slug, sourceUrl: `${CATALOG_URL}${slug}/` });
  }
  return entries;
}

async function mapConcurrent(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function loadCatalog() {
  const indexHtml = await fetchHtml(CATALOG_URL);
  const entries = catalogEntries(indexHtml);
  if (entries.length < 20) {
    throw new Error(`Importação interrompida: somente ${entries.length} links encontrados no catálogo.`);
  }

  return mapConcurrent(entries, 6, async (entry) => {
    const html = await fetchHtml(entry.sourceUrl);
    const youtubeId = extractYoutubeId(html);
    return {
      ...entry,
      title: extractTitle(html, entry.slug),
      duration: extractDuration(html),
      youtubeUrl: youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null,
    };
  });
}

function assertDbConfig() {
  for (const key of ["host", "user", "password", "database"]) {
    if (!dbConfig[key]) throw new Error(`Configuração ausente: TIDB_${key.toUpperCase()}`);
  }
}

async function main() {
  assertDbConfig();
  console.log(`Lendo catálogo: ${CATALOG_URL}`);
  const songs = await loadCatalog();
  const connection = await mysql.createConnection(dbConfig);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  try {
    const [previous] = await connection.execute(
      "SELECT * FROM pmam_hymns WHERE collection = ? ORDER BY number ASC",
      [COLLECTION],
    );
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(OUTPUT_DIR, `charlie-before-${stamp}.json`);
    await fs.writeFile(backupPath, JSON.stringify(previous, null, 2), "utf8");

    const [occupiedRows] = await connection.execute(
      "SELECT number FROM pmam_hymns WHERE collection IS NULL OR collection <> ?",
      [COLLECTION],
    );
    const occupied = new Set(occupiedRows.map((row) => Number(row.number)));
    let candidate = BASE_NUMBER;
    const nextNumber = () => {
      while (occupied.has(candidate)) candidate += 1;
      occupied.add(candidate);
      return candidate++;
    };

    await connection.beginTransaction();
    await connection.execute("DELETE FROM pmam_hymns WHERE collection = ?", [COLLECTION]);

    for (const song of songs) {
      const duration = durationLabel(song.duration);
      const description = [
        "Faixa do acervo Charlie Mike.",
        duration ? `Duração de referência: ${duration}.` : null,
        `Fonte de catalogação: ${song.sourceUrl}`,
      ].filter(Boolean).join(" ");

      await connection.execute(
        `INSERT INTO pmam_hymns
          (number, title, subtitle, author, composer, category, collection, lyrics, description,
           youtube_url, instrumental_youtube_url, audio_url, instrumental_audio_url, lyrics_sync, is_active)
         VALUES (?, ?, ?, NULL, NULL, 'militar', ?, '', ?, ?, NULL, NULL, NULL, NULL, 1)`,
        [nextNumber(), song.title, "Canções de TFM", COLLECTION, description, song.youtubeUrl],
      );
    }

    await connection.commit();
    const report = {
      importedAt: new Date().toISOString(),
      source: CATALOG_URL,
      previousRecords: previous.length,
      importedRecords: songs.length,
      withYoutube: songs.filter((song) => song.youtubeUrl).length,
      withoutYoutube: songs.filter((song) => !song.youtubeUrl).map((song) => song.title),
      backupPath,
    };
    await fs.writeFile(path.join(OUTPUT_DIR, "latest-report.json"), JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
