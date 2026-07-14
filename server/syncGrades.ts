import { query as dbQuery } from "./mysql";
import mysql from "mysql2/promise";
import { ENV } from './_core/env';

/**
 * Script para sincronizar notas entre TiDB (produção) e MySQL local (desenvolvimento)
 * Executa: pnpm exec tsx server/syncGrades.ts
 */

interface SyncConfig {
  source: 'tidb' | 'local';
  target: 'tidb' | 'local';
}

// Conexão com TiDB (produção)
async function getTiDBConnection() {
  if (!ENV.tidbConfigured) {
    throw new Error('TiDB não configurado. Configure TIDB_HOST, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE');
  }

  return mysql.createConnection({
    host: ENV.tidbHost,
    port: ENV.tidbPort,
    user: ENV.tidbUser,
    password: ENV.tidbPassword,
    database: ENV.tidbDatabase,
    ssl: {
      rejectUnauthorized: true,
    },
  });
}

// Conexão com MySQL local (desenvolvimento)
async function getLocalConnection() {
  return mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'hinario_pmam',
  });
}

async function syncGrades(config: SyncConfig) {
  let sourceConn, targetConn;

  try {
    console.log(`\n📊 Iniciando sincronização de notas...`);
    console.log(`📤 Origem: ${config.source}`);
    console.log(`📥 Destino: ${config.target}\n`);

    // Conectar aos bancos
    sourceConn = config.source === 'tidb' ? await getTiDBConnection() : await getLocalConnection();
    targetConn = config.target === 'tidb' ? await getTiDBConnection() : await getLocalConnection();

    // 1. Sincronizar disciplinas
    console.log('📚 Sincronizando disciplinas...');
    const [disciplines] = await sourceConn.execute(
      'SELECT * FROM pmam_disciplines'
    );

    for (const discipline of disciplines as any[]) {
      await targetConn.execute(
        `INSERT INTO pmam_disciplines (id, name, description, created_by, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         is_active = VALUES(is_active),
         updated_at = VALUES(updated_at)`,
        [
          discipline.id,
          discipline.name,
          discipline.description,
          discipline.created_by,
          discipline.is_active,
          discipline.created_at,
          discipline.updated_at,
        ]
      );
    }
    console.log(`✅ ${(disciplines as any[]).length} disciplinas sincronizadas\n`);

    // 2. Sincronizar alunos de notas
    console.log('👥 Sincronizando alunos...');
    const [students] = await sourceConn.execute(
      'SELECT * FROM pmam_grade_students'
    );

    for (const student of students as any[]) {
      await targetConn.execute(
        `INSERT INTO pmam_grade_students (id, student_number, cpf, full_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         updated_at = VALUES(updated_at)`,
        [
          student.id,
          student.student_number,
          student.cpf,
          student.full_name,
          student.created_at,
          student.updated_at,
        ]
      );
    }
    console.log(`✅ ${(students as any[]).length} alunos sincronizados\n`);

    // 3. Sincronizar notas
    console.log('📝 Sincronizando notas...');
    const [grades] = await sourceConn.execute(
      'SELECT * FROM pmam_student_grades'
    );

    for (const grade of grades as any[]) {
      await targetConn.execute(
        `INSERT INTO pmam_student_grades (id, student_id, discipline_id, professor_name, grade, evaluation_date, observation, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         professor_name = VALUES(professor_name),
         grade = VALUES(grade),
         evaluation_date = VALUES(evaluation_date),
         observation = VALUES(observation),
         updated_at = VALUES(updated_at)`,
        [
          grade.id,
          grade.student_id,
          grade.discipline_id,
          grade.professor_name,
          grade.grade,
          grade.evaluation_date,
          grade.observation,
          grade.created_at,
          grade.updated_at,
        ]
      );
    }
    console.log(`✅ ${(grades as any[]).length} notas sincronizadas\n`);

    console.log('✨ Sincronização concluída com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro durante sincronização:', error);
    process.exit(1);
  } finally {
    if (sourceConn) await sourceConn.end();
    if (targetConn) await targetConn.end();
  }
}

// Determinar direção da sincronização
const direction = process.argv[2] || 'tidb-to-local';

if (direction === 'tidb-to-local') {
  syncGrades({ source: 'tidb', target: 'local' });
} else if (direction === 'local-to-tidb') {
  syncGrades({ source: 'local', target: 'tidb' });
} else {
  console.log('Uso: pnpm exec tsx server/syncGrades.ts [tidb-to-local|local-to-tidb]');
  console.log('\nExemplos:');
  console.log('  pnpm exec tsx server/syncGrades.ts tidb-to-local  # Sincronizar TiDB → MySQL local');
  console.log('  pnpm exec tsx server/syncGrades.ts local-to-tidb  # Sincronizar MySQL local → TiDB');
  process.exit(1);
}
