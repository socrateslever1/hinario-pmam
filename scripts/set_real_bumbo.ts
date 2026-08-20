import fs from 'fs';
import path from 'path';

const mp3Buffer = fs.readFileSync(path.resolve('uploads', 'bumbo.mp3'));
const b64 = mp3Buffer.toString('base64');
const dataUri = `data:audio/mpeg;base64,${b64}`;

const targetPath = path.resolve('client', 'src', 'lib', 'bumboSound.ts');
fs.writeFileSync(targetPath, `export const HIGH_FIDELITY_BUMBO_DATA_URI = ${JSON.stringify(dataUri)};\n`);

console.log('Successfully embedded real bumbo.mp3 into client/src/lib/bumboSound.ts');
