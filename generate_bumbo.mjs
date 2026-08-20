import fs from 'fs';

const sampleRate = 44100;
const duration = 0.5; // half a second
const numSamples = Math.floor(sampleRate * duration);
const buffer = new Float32Array(numSamples);

let phase = 0;
for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Pitch envelope: drops exponentially from 150Hz to 40Hz
    const freq = 40 + 110 * Math.exp(-t * 20);
    
    // Volume envelope: sharp attack, exponential decay
    const env = Math.exp(-t * 15);
    
    // Sine wave oscillator
    phase += (freq * 2 * Math.PI) / sampleRate;
    let sample = Math.sin(phase) * env;
    
    // Add some soft clipping/distortion for punch
    sample = Math.tanh(sample * 3) / Math.tanh(3);
    
    buffer[i] = sample;
}

// Convert to 16-bit PCM WAV
const wavHeader = Buffer.alloc(44);
wavHeader.write('RIFF', 0);
wavHeader.writeUInt32LE(36 + numSamples * 2, 4);
wavHeader.write('WAVE', 8);
wavHeader.write('fmt ', 12);
wavHeader.writeUInt32LE(16, 16);
wavHeader.writeUInt16LE(1, 20);
wavHeader.writeUInt16LE(1, 22);
wavHeader.writeUInt32LE(sampleRate, 24);
wavHeader.writeUInt32LE(sampleRate * 2, 28);
wavHeader.writeUInt16LE(2, 32);
wavHeader.writeUInt16LE(16, 34);
wavHeader.write('data', 36);
wavHeader.writeUInt32LE(numSamples * 2, 40);

const pcmData = Buffer.alloc(numSamples * 2);
for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, buffer[i]));
    pcmData.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, i * 2);
}

fs.writeFileSync('uploads/bumbo_seco.wav', Buffer.concat([wavHeader, pcmData]));
console.log('uploads/bumbo_seco.wav generated.');
