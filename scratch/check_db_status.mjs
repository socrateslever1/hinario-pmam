import 'dotenv/config';
import { connect } from '@tidbcloud/serverless';

const url = process.env.DATABASE_URL || process.env.TIDB_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = connect({ url });

async function main() {
  const tables = [
    'pmam_users',
    'pmam_hymns',
    'pmam_cfap_missions',
    'pmam_drill',
    'pmam_bugle_calls',
    'pmam_marches',
    'pmam_students',
    'pmam_disciplines',
    'pmam_student_grades',
    'pmam_fato_observado',
    'pmam_fato_observado_provas',
    'pmam_ordem_unida_audios',
    'pmam_administrative_daily'
  ];

  console.log("=== CONTAGEM DE REGISTROS NO BANCO (TiDB) ===");
  for (const t of tables) {
    try {
      const res = await connection.execute(`SELECT COUNT(*) as cnt FROM ${t}`);
      const rows = res.rows || res;
      console.log(`${t}: ${rows[0]?.cnt} registros`);
    } catch (e) {
      console.log(`${t}: Erro / Tabela não existe (${e.message})`);
    }
  }
}

main();
