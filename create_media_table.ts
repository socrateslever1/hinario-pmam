import 'dotenv/config';
import { query } from './server/mysql';

async function run() {
  try {
    console.log('Iniciando criação da tabela...');
    await query(`
      CREATE TABLE IF NOT EXISTS pmam_mission_media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mission_id INT NOT NULL,
        type ENUM('image', 'video', 'audio', 'pdf', 'document') NOT NULL,
        title VARCHAR(255),
        description TEXT,
        url VARCHAR(512) NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        duration INT,
        thumbnail VARCHAR(512),
        \`order\` INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        uploaded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela pmam_mission_media criada ou já existente.');
  } catch (err) {
    console.error('Erro ao criar tabela:', err);
    process.exit(1);
  }
}

run();
