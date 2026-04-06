import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.TIDB_HOST || 'gateway03.us-east-1.prod.aws.tidbcloud.com',
  port: Number(process.env.TIDB_PORT || '4000'),
  user: process.env.TIDB_USER || 'CZ6fqEVQpCUKFJb.9db839fe7bfc',
  password: process.env.TIDB_PASSWORD || 'etH2wXWdiR822X4tgm9p',
  database: process.env.TIDB_DATABASE || 'oYQqDtLooPR5vbQ65ChDb9',
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
