import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const ROOT = process.cwd();
const TFM_DIR = path.join(ROOT, 'tmp_tfm_import', 'www.letras.mus.br', 'cancoes-de-tfm');
const REPORT_PATH = path.join(ROOT, 'tmp_tfm_import', 'tfm-import-report.json');
const COLLECTION = 'tfm';
const BASE_NUMBER = 1001;

const dbConfig = {
  host: process.env.TIDB_HOST || 'gateway03.us-east-1.prod.aws.tidbcloud.com',
  port: Number(process.env.TIDB_PORT || '4000'),
  user: process.env.TIDB_USER || 'CZ6fqEVQpCUKFJb.9db839fe7bfc',
  password: process.env.TIDB_PASSWORD || 'etH2wXWdiR822X4tgm9p',
  database: process.env.TIDB_DATABASE || 'oYQqDtLooPR5vbQ65ChDb9',
  ssl: { rejectUnauthorized: true },
};

function normalize(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function decodeEntities(value = '') {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-');
}

function extractTitle(html, fallbackSlug) {
  const fromLyricPush = html.match(/_omq\.push\(\['ui\/lyric', \{[\s\S]*?"Name":"([^"]+)"/)?.[1];
  const fromTitle = html.match(/<title>(.*?) - Can/i)?.[1];
  return decodeEntities(fromLyricPush || fromTitle || fallbackSlug).trim();
}

function extractLyrics(html) {
  const raw = html.match(/<div class="lyric-original">([\s\S]*?)<\/div>/i)?.[1];
  if (!raw) return '';
  const text = decodeEntities(
    raw
      .replace(/<\/?div[^>]*>/gi, '')
      .replace(/<\/?span[^>]*>/gi, '')
      .replace(/<\/?strong[^>]*>/gi, '')
      .replace(/<\/?em[^>]*>/gi, '')
      .replace(/<\/?i[^>]*>/gi, '')
      .replace(/<\/?a[^>]*>/gi, '')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

function extractYoutubeId(html) {
  return html.match(/YoutubeID\"\s*:\s*\"([^\"]*)\"/i)?.[1]?.trim() || '';
}

function extractDuration(html) {
  return html.match(/"duration":"(PT[^"]+)"/i)?.[1] || null;
}

function parseSearchResults(html) {
  const candidates = [];
  const seen = new Set();
  const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  let match;
  while ((match = regex.exec(html)) && candidates.length < 15) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const snippet = html.slice(match.index, match.index + 1200);
    const title = decodeEntities(snippet.match(/"title":\{"runs":\[\{"text":"([^"]+)/)?.[1] || '');
    const owner = decodeEntities(snippet.match(/"ownerText":\{"runs":\[\{"text":"([^"]+)/)?.[1] || '');
    if (!title) continue;
    candidates.push({ id, title, owner });
  }
  return candidates;
}

function scoreCandidate(songTitle, candidate) {
  const songNorm = normalize(songTitle);
  const titleNorm = normalize(candidate.title);
  const songWords = songNorm.split(' ').filter((word) => word.length > 2);
  const overlap = songWords.filter((word) => titleNorm.includes(word));
  let score = overlap.length * 12;
  if (titleNorm.includes(songNorm)) score += 80;
  if (titleNorm.includes('tfm')) score += 24;
  if (titleNorm.includes('cancoes de tfm')) score += 30;
  if (titleNorm.includes('cancao')) score += 8;
  if (titleNorm.includes('charlie mike')) score += 4;
  if (normalize(candidate.owner).includes('tfm')) score += 10;
  if (/legendado|oficial|cancoes/.test(titleNorm)) score += 5;
  return { score, overlapCount: overlap.length, songWordCount: songWords.length };
}

async function searchYoutubeId(songTitle) {
  try {
    const query = encodeURIComponent(`${songTitle} Can??es de TFM`);
    const html = await fetch(`https://www.youtube.com/results?search_query=${query}`, {
      headers: { 'user-agent': 'Mozilla/5.0' },
      redirect: 'follow',
    }).then((response) => response.text());

    const candidates = parseSearchResults(html);
    let best = null;
    for (const candidate of candidates) {
      const metrics = scoreCandidate(songTitle, candidate);
      if (!best || metrics.score > best.score) {
        best = { ...candidate, ...metrics };
      }
    }

    if (!best) return null;
    const minOverlap = Math.max(2, Math.ceil(best.songWordCount * 0.45));
    if (best.score < 32 || best.overlapCount < minOverlap) return null;
    return { id: best.id, matchedTitle: best.title, owner: best.owner, score: best.score };
  } catch {
    return null;
  }
}

async function ensureSchema(connection) {
  const [columnRows] = await connection.execute(`
    SELECT COLUMN_NAME
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'pmam_hymns' AND COLUMN_NAME = 'collection'
  `);

  if (columnRows.length === 0) {
    await connection.execute(`ALTER TABLE pmam_hymns ADD COLUMN collection VARCHAR(64) NULL AFTER category`);
  }

  const [indexRows] = await connection.execute(`
    SELECT INDEX_NAME
    FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'pmam_hymns' AND INDEX_NAME = 'idx_pmam_hymns_collection'
  `);

  if (indexRows.length === 0) {
    await connection.execute(`CREATE INDEX idx_pmam_hymns_collection ON pmam_hymns (collection)`);
  }
}

function buildSongs() {
  const dirs = fs.readdirSync(TFM_DIR, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  const songs = [];

  for (const dir of dirs) {
    const file = path.join(TFM_DIR, dir.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    const title = extractTitle(html, dir.name);
    const lyrics = extractLyrics(html);
    const youtubeId = extractYoutubeId(html);
    const duration = extractDuration(html);

    songs.push({
      slug: dir.name,
      title,
      subtitle: 'Canções de TFM',
      category: 'militar',
      collection: COLLECTION,
      lyrics,
      youtubeId,
      duration,
      sourceUrl: `https://www.letras.mus.br/cancoes-de-tfm/${dir.name}/`,
    });
  }

  songs.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  return songs;
}

const connection = await mysql.createConnection(dbConfig);
await ensureSchema(connection);

const songs = buildSongs();
const [existingRows] = await connection.execute(
  `SELECT id, number, title FROM pmam_hymns WHERE collection = ? ORDER BY number ASC`,
  [COLLECTION]
);
const existingByTitle = new Map(existingRows.map((row) => [row.title, row]));
const usedNumbers = new Set(existingRows.map((row) => Number(row.number)));
let nextNumber = BASE_NUMBER;
const nextAvailableNumber = () => {
  while (usedNumbers.has(nextNumber)) nextNumber += 1;
  const assigned = nextNumber;
  usedNumbers.add(assigned);
  nextNumber += 1;
  return assigned;
};

const report = {
  importedAt: new Date().toISOString(),
  totalFound: songs.length,
  imported: 0,
  updated: 0,
  inserted: 0,
  youtubeEmbedded: 0,
  youtubeSearched: 0,
  youtubeMissing: 0,
  emptyLyrics: [],
  unresolvedYoutube: [],
  matches: [],
};

for (const song of songs) {
  if (!song.lyrics) {
    report.emptyLyrics.push(song.title);
  }

  let youtubeId = song.youtubeId;
  let youtubeSource = youtubeId ? 'embedded' : null;

  if (!youtubeId) {
    const searchResult = await searchYoutubeId(song.title);
    if (searchResult?.id) {
      youtubeId = searchResult.id;
      youtubeSource = 'search';
      report.matches.push({ title: song.title, matchedTitle: searchResult.matchedTitle, owner: searchResult.owner, score: searchResult.score, youtubeId });
    } else {
      report.unresolvedYoutube.push(song.title);
    }
    await new Promise((resolve) => setTimeout(resolve, 180));
  }

  const youtubeUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null;
  if (youtubeSource === 'embedded') report.youtubeEmbedded += 1;
  else if (youtubeSource === 'search') report.youtubeSearched += 1;
  else report.youtubeMissing += 1;

  const existing = existingByTitle.get(song.title);
  const assignedNumber = existing?.number ? Number(existing.number) : nextAvailableNumber();
  const description = [
    'Coleção Charlie Mike importada do acervo TFM.',
    song.duration ? `Duração de referência: ${song.duration}.` : null,
    youtubeSource === 'search' ? 'Link de vídeo complementado por busca automática.' : null,
    !youtubeUrl ? 'Sem vídeo associado no acervo importado.' : null,
  ].filter(Boolean).join(' ');

  if (existing) {
    await connection.execute(
      `UPDATE pmam_hymns
       SET number = ?, subtitle = ?, author = NULL, composer = NULL, category = ?, collection = ?, lyrics = ?, description = ?, youtube_url = ?, audio_url = NULL, lyrics_sync = NULL, is_active = 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [assignedNumber, song.subtitle, song.category, song.collection, song.lyrics, description, youtubeUrl, existing.id]
    );
    report.updated += 1;
  } else {
    await connection.execute(
      `INSERT INTO pmam_hymns
       (number, title, subtitle, author, composer, category, collection, lyrics, description, youtube_url, audio_url, lyrics_sync, is_active)
       VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, NULL, NULL, 1)`,
      [assignedNumber, song.title, song.subtitle, song.category, song.collection, song.lyrics, description, youtubeUrl]
    );
    report.inserted += 1;
  }

  report.imported += 1;
}

const importedTitles = songs.map((song) => song.title);
if (importedTitles.length > 0) {
  const placeholders = importedTitles.map(() => '?').join(',');
  await connection.execute(
    `DELETE FROM pmam_hymns WHERE collection = ? AND title NOT IN (${placeholders})`,
    [COLLECTION, ...importedTitles]
  );
}

fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
await connection.end();
