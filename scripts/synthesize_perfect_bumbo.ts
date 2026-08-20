import fs from 'fs';
import path from 'path';

function createThunderousBoomingBassDrum(): { buffer: Buffer; dataUri: string } {
  const sampleRate = 44100;
  const duration = 1.75; // 1.75 seconds of deep, booming acoustic resonance ("BUUUUUUM")
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);

  let phaseMain = 0;
  let phaseResonance = 0;
  let phaseHarmonic = 0;
  let phaseSub = 0;
  let phaseAir = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // 1. Pitch Envelopes (Natural big drum pitch glide: drops from 95Hz to deep 46Hz)
    const pitchEnv = Math.exp(-t * 14);
    const freqMain = 45 + 50 * pitchEnv;
    const freqResonance = 51 + 40 * pitchEnv; // Membrane interaction (beating frequency)
    const freqHarmonic = 92 + 70 * pitchEnv;  // Warm 2nd harmonic
    const freqSub = 34 + 20 * pitchEnv;       // Deep earth-shaking sub-bass rumble
    const freqAir = 138 + 90 * pitchEnv;      // 3rd harmonic body

    // 2. Phase Accumulation
    phaseMain += (freqMain * 2 * Math.PI) / sampleRate;
    phaseResonance += (freqResonance * 2 * Math.PI) / sampleRate;
    phaseHarmonic += (freqHarmonic * 2 * Math.PI) / sampleRate;
    phaseSub += (freqSub * 2 * Math.PI) / sampleRate;
    phaseAir += (freqAir * 2 * Math.PI) / sampleRate;

    // 3. Oscillators (Rich acoustic waves)
    const oscMain = Math.sin(phaseMain);
    const oscResonance = Math.sin(phaseResonance) * 0.55;
    const oscHarmonic = Math.sin(phaseHarmonic) * 0.35;
    const oscSub = Math.sin(phaseSub) * 0.65;
    const oscAir = Math.sin(phaseAir) * 0.15;

    // 4. Amplitude Envelopes (Long, sustained "BUUUUUM" decay)
    const attack = Math.min(1, i / (sampleRate * 0.005)); // 5ms smooth attack
    const decayBoom = Math.exp(-t * 2.0);      // Long, deep boom decay (rings past 1.5s)
    const decaySub = Math.exp(-t * 1.7);       // Extended sub-bass resonance
    const decayHarmonic = Math.exp(-t * 4.5);  // Harmonics settle into pure low fundamental

    // 5. Heavy Mallet Impact Transient (Deep, muffled felt head thud)
    const malletDecay = Math.exp(-t * 45);
    const malletThud = Math.sin(t * 2 * Math.PI * 140) * malletDecay * 0.4;
    const skinRumble = (Math.random() * 2 - 1) * Math.exp(-t * 30) * 0.18;

    // 6. Layer Combination
    let sample = (
      (oscMain * decayBoom * 0.70) +
      (oscResonance * decayBoom * 0.45) +
      (oscSub * decaySub * 0.60) +
      (oscHarmonic * decayHarmonic * 0.30) +
      (oscAir * decayHarmonic * 0.12) +
      malletThud +
      skinRumble
    ) * attack;

    // 7. Warm Analog Saturation (Gives massive body, presence and punch without harshness)
    const drive = 2.2;
    sample = Math.tanh(sample * drive);

    samples[i] = sample;
  }

  // Normalize to 98% peak volume
  let maxAmp = 0;
  for (let i = 0; i < numSamples; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAmp) maxAmp = abs;
  }
  if (maxAmp > 0) {
    const normFactor = 0.98 / maxAmp;
    for (let i = 0; i < numSamples; i++) {
      samples[i] *= normFactor;
    }
  }

  // 16-bit PCM WAV Creation
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + numSamples * 2, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20); // PCM
  wavHeader.writeUInt16LE(1, 22); // Mono
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(sampleRate * 2, 28);
  wavHeader.writeUInt16LE(2, 32);
  wavHeader.writeUInt16LE(16, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(numSamples * 2, 40);

  const pcmData = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcmData.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, i * 2);
  }

  const finalWavBuffer = Buffer.concat([wavHeader, pcmData]);
  const b64 = finalWavBuffer.toString('base64');
  const dataUri = `data:audio/wav;base64,${b64}`;

  return { buffer: finalWavBuffer, dataUri };
}

async function main() {
  const { buffer, dataUri } = createThunderousBoomingBassDrum();
  
  // 1. Save WAV files
  fs.writeFileSync(path.resolve('uploads', 'bumbo_seco.wav'), buffer);
  fs.writeFileSync(path.resolve('uploads', 'bumbo.wav'), buffer);
  console.log(`Generated thunderous BUUUUUM bass drum (${buffer.length} bytes, 1.75s duration)`);

  // 2. Save client embedded constant
  const clientLibPath = path.resolve('client', 'src', 'lib', 'bumboSound.ts');
  fs.writeFileSync(clientLibPath, `export const HIGH_FIDELITY_BUMBO_DATA_URI = "${dataUri}";\n`);
  console.log(`Saved client constant to: ${clientLibPath}`);

  // 3. Update database if reachable
  try {
    const { query } = await import('../server/mysql');
    await query(
      "UPDATE pmam_bugle_calls SET audio_url = ? WHERE name = 'Bumbo Seco' OR name LIKE '%Bumbo%'",
      [dataUri]
    );
    console.log("Updated database with booming bumbo audio.");
  } catch (err) {
    console.warn("DB update skipped (local files updated successfully).");
  }

  process.exit(0);
}

main();
