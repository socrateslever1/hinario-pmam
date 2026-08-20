import 'dotenv/config';
import { query } from "./server/mysql";

async function run() {
  try {
    await query("INSERT INTO pmam_bugle_calls (name, audio_url, category, icon_key, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)", ["Bumbo Seco", "/uploads/bumbo_seco.wav", "geral", "music", 1, 0]);
    console.log("Inserted Bumbo Seco");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
