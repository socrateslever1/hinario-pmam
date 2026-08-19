import 'dotenv/config';
import { WaveFile } from 'wavefile';
import { query } from './server/mysql';

async function run() {
  const sampleRate = 44100;
  const duration = 0.3; // 0.3 seconds
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Pitch drops from 150 to 50
    const freq = 50 + 100 * Math.exp(-t * 20);
    // Volume envelope
    const env = Math.exp(-t * 15);
    phase += (freq * 2 * Math.PI) / sampleRate;
    let sample = Math.sin(phase) * env;
    samples[i] = sample;
  }

  // Create a perfectly compliant WAV file
  const wav = new WaveFile();
  wav.fromScratch(1, sampleRate, '32f', samples);
  // Convert to 16-bit to be safe
  wav.toBitDepth('16');

  const b64 = wav.toDataURI(); // this returns data:audio/wav;base64,...

  try {
    await query("UPDATE pmam_bugle_calls SET audio_url = ? WHERE name = 'Bumbo Seco'", [b64]);
    console.log("Updated DB with valid WaveFile base64!");
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
