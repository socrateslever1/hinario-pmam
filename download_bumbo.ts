import 'dotenv/config';
import { query } from "./server/mysql";

async function run() {
  try {
    const url = "https://cdn.freesound.org/previews/171/171104_2437358-lq.mp3";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch: " + response.statusText);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const b64 = buffer.toString('base64');
    const dataUri = `data:audio/mpeg;base64,${b64}`;
    
    await query("UPDATE pmam_bugle_calls SET audio_url = ? WHERE name = 'Bumbo Seco'", [dataUri]);
    console.log("Downloaded real MP3 using fetch! Length:", dataUri.length);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
