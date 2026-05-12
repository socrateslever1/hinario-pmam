import 'dotenv/config';
import { query } from './server/mysql';

async function run() {
  try {
    console.log('Adicionando coluna last_module_slug...');
    await query(`
      ALTER TABLE pmam_study_students 
      ADD COLUMN IF NOT EXISTS last_module_slug VARCHAR(96)
    `);
    console.log('Coluna adicionada com sucesso.');
  } catch (err) {
    console.error('Erro ao atualizar tabela:', err);
    process.exit(1);
  }
}

run();
