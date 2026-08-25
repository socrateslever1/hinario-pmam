import mysql from 'mysql2/promise';
import 'dotenv/config';

const dbConfig = {
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || '4000'),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: { rejectUnauthorized: true },
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM pmam_hymns WHERE collection = "tfm"');
  console.log(`TFM Songs in DB: ${rows[0].count}`);
  
  const [missingYoutube] = await connection.execute('SELECT COUNT(*) as count FROM pmam_hymns WHERE collection = "tfm" AND (youtube_url IS NULL OR youtube_url = "")');
  console.log(`Missing YouTube URL: ${missingYoutube[0].count}`);
  const [missingLyrics] = await connection.execute('SELECT COUNT(*) as count FROM pmam_hymns WHERE collection = "tfm" AND (lyrics IS NULL OR lyrics = "")');
  console.log(`Missing Lyrics: ${missingLyrics[0].count}`);
  
  await connection.end();
}

check().catch(console.error);
