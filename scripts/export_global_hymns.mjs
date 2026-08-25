import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const outputPath = path.resolve("shared", "data", "global-hymns.json");
const connection = await mysql.createConnection({
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || "4000"),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: { rejectUnauthorized: true },
});

function repairText(value) {
  if (typeof value !== "string" || !/[ÃÂ]/.test(value)) return value;
  const repaired = Buffer.from(value, "latin1").toString("utf8");
  return repaired.includes("�") ? value : repaired;
}

try {
  const [rows] = await connection.execute(`
    SELECT id, number, title, subtitle, author, composer, category, collection, lyrics, description,
           youtube_url, instrumental_youtube_url, audio_url, instrumental_audio_url, lyrics_sync,
           is_active, likes_count, views_count
    FROM pmam_hymns
    WHERE is_active = 1
    ORDER BY number ASC
  `);

  if (rows.length < 20) {
    throw new Error(`Exportação interrompida: o banco retornou somente ${rows.length} hinos.`);
  }

  const catalog = rows.map((row) => ({
    id: Number(row.id),
    number: Number(row.number),
    title: repairText(row.title),
    subtitle: repairText(row.subtitle),
    author: repairText(row.author),
    composer: repairText(row.composer),
    category: row.category,
    collection: row.collection,
    lyrics: repairText(row.lyrics || ""),
    description: repairText(row.description),
    youtubeUrl: row.youtube_url,
    instrumentalYoutubeUrl: row.instrumental_youtube_url,
    audioUrl: row.audio_url,
    instrumentalAudioUrl: row.instrumental_audio_url,
    lyricsSync: typeof row.lyrics_sync === "string" ? JSON.parse(row.lyrics_sync) : row.lyrics_sync,
    isActive: Boolean(row.is_active),
    likesCount: Number(row.likes_count || 0),
    viewsCount: Number(row.views_count || 0),
  }));

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`CATALOG_PATH=${outputPath}`);
  console.log(`CATALOG_ITEMS=${catalog.length}`);
} finally {
  await connection.end();
}
