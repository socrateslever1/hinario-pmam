import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.TIDB_HOST || 'gateway03.us-east-1.prod.aws.tidbcloud.com',
  port: Number(process.env.TIDB_PORT || '4000'),
  user: process.env.TIDB_USER || 'CZ6fqEVQpCUKFJb.9db839fe7bfc',
  password: process.env.TIDB_PASSWORD || 'etH2wXWdiR822X4tgm9p',
  database: process.env.TIDB_DATABASE || 'oYQqDtLooPR5vbQ65ChDb9',
  ssl: { rejectUnauthorized: true },
};

async function renumber() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('Fetching TFM songs...');
  
  // Get all TFM songs, ordered by their current number (1001+)
  const [songs] = await connection.execute(
    'SELECT id, number, title FROM pmam_hymns WHERE collection = "tfm" ORDER BY number ASC'
  );

  console.log(`Found ${songs.length} TFM songs. Starting renumbering...`);

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const newNumber = i + 1;
    
    console.log(`Updating [${song.id}] ${song.title}: ${song.number} -> ${newNumber}`);
    
    await connection.execute(
      'UPDATE pmam_hymns SET number = ? WHERE id = ?',
      [newNumber, song.id]
    );
  }

  console.log('Renumbering complete!');
  await connection.end();
}

renumber().catch((err) => {
  console.error('Fatal error during renumbering:', err);
  process.exit(1);
});
