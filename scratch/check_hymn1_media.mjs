import 'dotenv/config';
import { connect } from '@tidbcloud/serverless';

const url = process.env.DATABASE_URL || process.env.TIDB_URL;
const connection = connect({ url });

async function checkHymn1() {
  const rows = await connection.execute("SELECT id, number, title, audio_url, instrumental_audio_url, youtube_url, instrumental_youtube_url FROM pmam_hymns WHERE id = 1 OR number = 1");
  console.log(JSON.stringify(rows.rows || rows, null, 2));
}

checkHymn1();
