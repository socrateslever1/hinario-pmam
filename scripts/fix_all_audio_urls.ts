import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { query } from '../server/mysql';

function detectMimeAndExt(buffer: Buffer): { mime: string; ext: string } {
  const hex = buffer.slice(0, 16).toString('hex');
  if (hex.startsWith('52494646')) {
    return { mime: 'audio/wav', ext: 'wav' };
  }
  if (hex.includes('66747970') || hex.startsWith('0000001866747970') || hex.startsWith('0000002066747970')) {
    return { mime: 'audio/mp4', ext: 'm4a' };
  }
  if (hex.startsWith('fffb') || hex.startsWith('fffa') || hex.startsWith('fff3') || hex.startsWith('494433')) {
    return { mime: 'audio/mpeg', ext: 'mp3' };
  }
  if (hex.startsWith('4f676753')) {
    return { mime: 'audio/ogg', ext: 'ogg' };
  }
  return { mime: 'audio/mpeg', ext: 'mp3' };
}

async function fixTable(table: string, idCol: string, nameCol: string, audioCol: string) {
  const rows = await query(`SELECT ${idCol} as id, ${nameCol} as name, ${audioCol} as audioUrl FROM ${table} WHERE ${audioCol} IS NOT NULL AND ${audioCol} != ''`);
  const uploadsDir = path.resolve('uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  for (const r of rows) {
    const rawUrl = r.audioUrl as string;
    if (rawUrl.startsWith('data:')) {
      const match = rawUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const b64Data = match[2];
        const buffer = Buffer.from(b64Data, 'base64');
        const { ext } = detectMimeAndExt(buffer);
        const safeName = String(r.name || 'audio').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
        const fileName = `${table}_${r.id}_${safeName}.${ext}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);
        const newUrl = `/uploads/${fileName}`;
        await query(`UPDATE ${table} SET ${audioCol} = ? WHERE ${idCol} = ?`, [newUrl, r.id]);
        console.log(`[${table}] Fixed ${r.name} (${r.id}): saved ${buffer.length} bytes -> ${newUrl}`);
      }
    }
  }
}

async function main() {
  try {
    console.log('--- Fixing Bugle Calls ---');
    await fixTable('pmam_bugle_calls', 'id', 'name', 'audio_url');

    console.log('--- Fixing Marches ---');
    await fixTable('pmam_marches', 'id', 'title', 'audio_url');

    console.log('--- Fixing Ordem Unida Audio ---');
    await fixTable('pmam_ordem_unida_audios', 'id', 'item_title', 'audio_url');

    console.log('All tables inspected and converted to clean static /uploads/ URLs!');
  } catch (err) {
    console.error('Error during fix:', err);
  }
  process.exit(0);
}

main();
