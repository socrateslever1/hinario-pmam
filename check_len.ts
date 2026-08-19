import 'dotenv/config';
import { query } from "./server/mysql";

async function run() {
  const [row] = await query("SELECT length(audio_url) as len FROM pmam_bugle_calls WHERE name = 'Bumbo Seco'");
  console.log("Length: ", row.len);
  process.exit(0);
}

run();
