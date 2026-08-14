import 'dotenv/config';
import { query } from '../server/mysql';

async function main() {
  try {
    const calls = await query("SELECT id, name, length(audio_url) as len, substr(audio_url, 1, 80) as preview FROM pmam_bugle_calls WHERE audio_url IS NOT NULL");
    console.log("=== Bugle Calls in DB ===");
    for (const c of calls) {
      console.log(`${c.id}: ${c.name} [len: ${c.len}] -> ${c.preview}`);
    }

    const marches = await query("SELECT id, title, length(audio_url) as len, substr(audio_url, 1, 80) as preview FROM pmam_marches");
    console.log("=== Marches in DB ===");
    for (const m of marches) {
      console.log(`${m.id}: ${m.title} [len: ${m.len}] -> ${m.preview}`);
    }

    const voice = await query("SELECT id, item_title, length(audio_url) as len, substr(audio_url, 1, 80) as preview FROM pmam_ordem_unida_audios");
    console.log("=== Voice Audios in DB ===");
    for (const v of voice) {
      console.log(`${v.id}: ${v.item_title} [len: ${v.len}] -> ${v.preview}`);
    }
  } catch (err) {
    console.error("DB error:", err);
  }
  process.exit(0);
}

main();
