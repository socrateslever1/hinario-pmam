import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SAMPLE_RATE = 44_100;
const BPM = 108;
const BEAT_SECONDS = 60 / BPM;
const LEAD_IN_SECONDS = 0.16;
const TAIL_SECONDS = 0.55;
const OUTPUT = resolve("client/public/audio/toques/cessar-a-vontade.wav");

// A partitura e escrita para instrumento em Si bemol. As frequencias abaixo
// sao as alturas reais: Do5->Sib4, Mi5->Re5 e Sol5->Fa5.
const PITCH = {
  Bb4: 466.1637615,
  D5: 587.3295358,
  F5: 698.4564629,
};

const triplet = 1 / 3;
const score = [
  ["F5", 1],
  ["Bb4", triplet], ["Bb4", triplet], ["Bb4", triplet],
  ["D5", 1],
  ["Bb4", triplet], ["Bb4", triplet], ["Bb4", triplet],
  ["D5", 1],
  ["Bb4", triplet], ["F5", triplet], ["D5", triplet],
  ["Bb4", 1.35],
  [null, 0.65],
];

const musicalSeconds = score.reduce((sum, [, beats]) => sum + beats * BEAT_SECONDS, 0);
const length = Math.ceil((LEAD_IN_SECONDS + musicalSeconds + TAIL_SECONDS) * SAMPLE_RATE);
const dry = new Float64Array(length);

let seed = 0x43534152;
function noise() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 0xffffffff * 2 - 1;
}

function renderNote(startSeconds, durationSeconds, frequency, isFinal = false) {
  const start = Math.round(startSeconds * SAMPLE_RATE);
  const duration = Math.round(durationSeconds * SAMPLE_RATE);
  const sounding = Math.max(1, Math.round(duration * (isFinal ? 0.97 : durationSeconds < 0.25 ? 0.82 : 0.9)));
  const harmonics = [0.62, 0.78, 0.55, 0.32, 0.18, 0.1, 0.055, 0.03];

  for (let i = 0; i < sounding && start + i < dry.length; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / sounding;
    const attack = Math.min(1, t / (durationSeconds < 0.25 ? 0.012 : 0.022));
    const releaseSeconds = isFinal ? 0.12 : durationSeconds < 0.25 ? 0.028 : 0.055;
    const release = Math.min(1, (sounding - i) / (releaseSeconds * SAMPLE_RATE));
    const breathShape = 0.91 + 0.09 * Math.sin(Math.PI * progress);
    const envelope = attack * release * breathShape;
    const scoop = 1 - 0.012 * Math.exp(-t / 0.035);
    const vibrato = 1 + 0.0013 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t / 0.18);
    const phase = 2 * Math.PI * frequency * scoop * vibrato * t;

    let brass = 0;
    for (let harmonic = 1; harmonic <= harmonics.length; harmonic++) {
      brass += harmonics[harmonic - 1] * Math.sin(harmonic * phase + harmonic * 0.035);
    }
    brass = Math.tanh(brass * 0.72);
    const breath = noise() * 0.018 * (0.35 + 0.65 * attack);
    dry[start + i] += envelope * (brass * 0.72 + breath);
  }
}

let cursor = LEAD_IN_SECONDS;
for (let index = 0; index < score.length; index++) {
  const [pitch, beats] = score[index];
  const duration = beats * BEAT_SECONDS;
  if (pitch) renderNote(cursor, duration, PITCH[pitch], index === score.length - 2);
  cursor += duration;
}

// Reflexoes discretas imitam a ambiencia curta presente nos demais toques.
const mixed = new Float64Array(dry);
for (const [delaySeconds, gain] of [[0.074, 0.17], [0.129, 0.105], [0.213, 0.06]]) {
  const delay = Math.round(delaySeconds * SAMPLE_RATE);
  for (let i = delay; i < mixed.length; i++) mixed[i] += dry[i - delay] * gain;
}

let peak = 0;
for (const sample of mixed) peak = Math.max(peak, Math.abs(sample));
const gain = 0.89 / Math.max(peak, 1e-9);
const pcm = new Int16Array(length);
for (let i = 0; i < length; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, mixed[i] * gain)) * 32767);

function wavBuffer(samples) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) buffer.writeInt16LE(samples[i], 44 + i * 2);
  return buffer;
}

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, wavBuffer(pcm));
console.log(JSON.stringify({ output: OUTPUT, sampleRate: SAMPLE_RATE, bpm: BPM, durationSeconds: length / SAMPLE_RATE }, null, 2));
