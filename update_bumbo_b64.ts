import 'dotenv/config';
import fs from 'fs';
import { query } from "./server/mysql";

async function run() {
  try {
    const wav = fs.readFileSync('uploads/bumbo_seco.wav');
    const b64 = wav.toString('base64');
    const dataUri = `data:audio/wav;base64,${b64}`;
    
    await query("UPDATE pmam_bugle_calls SET audio_url = ? WHERE name = ?", [dataUri, "Bumbo Seco"]);
    console.log("Updated Bumbo Seco to use Data URI!");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
