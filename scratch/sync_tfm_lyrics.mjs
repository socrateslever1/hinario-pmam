import 'dotenv/config';
import { connect } from '@tidbcloud/serverless';
import fs from 'node:fs/promises';
import path from 'node:path';

const url = process.env.DATABASE_URL || process.env.TIDB_URL;
if (!url) {
  console.error("DATABASE_URL / TIDB_URL missing");
  process.exit(1);
}

const connection = connect({ url });
const CATALOG_URL = "https://www.letras.mus.br/cancoes-de-tfm/";
const COLLECTION = "tfm";
const BASE_NUMBER = 1001;

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

function extractLyrics(html) {
  const lyricMatch = html.match(/<div class="lyric-original">([\s\S]*?)<\/div>/i) ||
                     html.match(/<div class="cnt-lyric[^"]*">([\s\S]*?)<\/div>/i) ||
                     html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!lyricMatch) return "";

  return lyricMatch[1]
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  console.log("=== INICIANDO RASPAGEM E ATUALIZAÇÃO DAS LETRAS DO TFM ===");
  console.log("Buscando catálogo:", CATALOG_URL);
  
  const indexResp = await fetch(CATALOG_URL, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
  });
  const indexHtml = await indexResp.text();

  const regex = /href="\/cancoes-de-tfm\/([a-z0-9-]+)\/"/gi;
  const entries = [];
  const seen = new Set();
  let m;
  while ((m = regex.exec(indexHtml))) {
    const slug = m[1];
    if (slug !== "ouvir" && !seen.has(slug)) {
      seen.add(slug);
      entries.push({ slug, sourceUrl: `${CATALOG_URL}${slug}/` });
    }
  }

  console.log(`Encontradas ${entries.length} canções de TFM no Letras.mus.br.`);

  const scrapedSongs = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    console.log(`[${i + 1}/${entries.length}] Baixando letra: ${entry.slug}...`);
    try {
      const resp = await fetch(entry.sourceUrl, {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      });
      const html = await resp.text();
      const title = extractTitle(html, entry.slug);
      const youtubeId = extractYoutubeId(html);
      const lyrics = extractLyrics(html);

      scrapedSongs.push({
        slug: entry.slug,
        title,
        lyrics,
        youtubeUrl: youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null,
      });
    } catch (e) {
      console.error(`Erro ao baixar ${entry.slug}:`, e.message);
    }
    // Small delay to prevent rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nRaspagem concluída! ${scrapedSongs.length} músicas obtidas com sucesso.`);
  const withLyrics = scrapedSongs.filter(s => s.lyrics && s.lyrics.length > 10);
  console.log(`Músicas com letras completas: ${withLyrics.length}/${scrapedSongs.length}`);

  // Now update database
  console.log("\nAtualizando banco de dados TiDB...");

  // Delete old TFM entries
  await connection.execute("DELETE FROM pmam_hymns WHERE collection = 'tfm'");

  let songNum = BASE_NUMBER;
  for (const song of scrapedSongs) {
    const description = "Faixa do acervo Charlie Mike — TFM.";
    await connection.execute(
      `INSERT INTO pmam_hymns
        (number, title, subtitle, author, composer, category, collection, lyrics, description,
         youtube_url, instrumental_youtube_url, audio_url, instrumental_audio_url, lyrics_sync, is_active)
       VALUES (?, ?, ?, NULL, NULL, 'militar', 'tfm', ?, ?, ?, NULL, NULL, NULL, NULL, 1)`,
      [songNum++, song.title, "Canções de TFM", song.lyrics, description, song.youtubeUrl]
    );
  }

  console.log(`✅ Sucesso! ${scrapedSongs.length} canções TFM inseridas com letras no banco de dados.`);

  // Also update global-hymns.json if present
  try {
    const jsonPath = path.resolve("shared", "data", "global-hymns.json");
    const jsonContent = await fs.readFile(jsonPath, "utf8");
    const hymnsList = JSON.parse(jsonContent);
    
    // Remove old tfm items from global-hymns.json
    const nonTfm = hymnsList.filter(h => h.collection !== "tfm");
    let jsonNum = BASE_NUMBER;
    for (const song of scrapedSongs) {
      nonTfm.push({
        id: jsonNum,
        number: jsonNum,
        title: song.title,
        subtitle: "Canções de TFM",
        author: null,
        composer: null,
        category: "militar",
        collection: "tfm",
        lyrics: song.lyrics,
        description: "Faixa do acervo Charlie Mike — TFM.",
        youtubeUrl: song.youtubeUrl,
        instrumentalYoutubeUrl: null,
        audioUrl: null,
        instrumentalAudioUrl: null,
        lyricsSync: null,
        isActive: true,
        likesCount: 0,
        viewsCount: 0,
      });
      jsonNum++;
    }
    await fs.writeFile(jsonPath, JSON.stringify(nonTfm, null, 2), "utf8");
    console.log("✅ Arquivo global-hymns.json atualizado com sucesso!");
  } catch (e) {
    console.warn("Aviso ao atualizar global-hymns.json:", e.message);
  }
}

main().catch(console.error);
