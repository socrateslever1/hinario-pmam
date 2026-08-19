import 'dotenv/config';
import { query } from "./server/mysql";

async function run() {
  try {
    await query("UPDATE pmam_bugle_calls SET audio_url = REPLACE(audio_url, 'data:audio/mp3;', 'data:audio/mpeg;') WHERE name = 'Bumbo Seco'");
    console.log("Fixed MIME type!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
