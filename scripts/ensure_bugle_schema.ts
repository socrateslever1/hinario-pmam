import 'dotenv/config';
import { query } from '../server/mysql';

async function main() {
  console.log('1. Checking pmam_bugle_calls...');
  await query(`CREATE TABLE IF NOT EXISTS \`pmam_bugle_calls\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`audio_url\` longtext,
    \`icon_key\` varchar(64) DEFAULT 'music',
    \`troop_state\` varchar(120),
    \`category\` varchar(100) DEFAULT 'geral',
    \`source_url\` longtext,
    \`sort_order\` int DEFAULT 0,
    \`is_active\` boolean DEFAULT true,
    \`created_at\` timestamp DEFAULT (now()),
    \`updated_at\` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`pmam_bugle_calls_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`pmam_bugle_calls_name_unique\` UNIQUE(\`name\`)
  )`);

  console.log('2. Checking pmam_marches...');
  await query(`CREATE TABLE IF NOT EXISTS \`pmam_marches\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`composer\` varchar(255),
    \`audio_url\` longtext,
    \`source_url\` longtext,
    \`sort_order\` int DEFAULT 0,
    \`is_active\` boolean DEFAULT true,
    \`created_at\` timestamp DEFAULT (now()),
    \`updated_at\` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`pmam_marches_id\` PRIMARY KEY(\`id\`)
  )`);

  console.log('3. Inserting initial bugle calls...');
  await query(`INSERT IGNORE INTO \`pmam_bugle_calls\`
    (\`name\`, \`audio_url\`, \`icon_key\`, \`troop_state\`, \`category\`, \`source_url\`, \`sort_order\`)
  VALUES
    ('À vontade', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/01-a_vontade.mp3', 'relaxed', 'À vontade', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 1),
    ('Acelerado', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/02-acelerado.mp3', 'gauge', 'Em acelerado', 'marcha', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 2),
    ('Ajudante-geral', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/03-ajudante_geral.mp3', 'user', NULL, 'autoridades', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 3),
    ('Alto', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/04-alto.mp3', 'hand', 'Alto', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 4),
    ('Alvorada', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/05-alvorada.mp3', 'sun', NULL, 'rotina', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 5),
    ('Apresentar arma', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/06-apresentar_arma.mp3', 'shield', 'Apresentar arma', 'armas', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 6),
    ('Avançar ao rancho', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/07-avancar_ao_rancho.mp3', 'utensils', 'Avançar ao rancho', 'rotina', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 7),
    ('Bandeira Nacional', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/08-bandeira_nacional.mp3', 'flag', NULL, 'cerimonial', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 8),
    ('Batalhão', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/09-batalhao.mp3', 'users', NULL, 'frações', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 9),
    ('Bombeiro', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/10-bombeiro.mp3', 'flame', NULL, 'institucional', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 10),
    ('Cavalaria', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/11-cavalaria.mp3', 'shield', NULL, 'institucional', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 11),
    ('Chefe do Estado-Maior', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/12-chefe_estado_maior.mp3', 'user', NULL, 'autoridades', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 12),
    ('Comandante de batalhão', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/13-cmt_batalhao.mp3', 'user', NULL, 'autoridades', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 13),
    ('Comandante de companhia', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/14-cmt_companhia.mp3', 'user', NULL, 'autoridades', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 14),
    ('Comandante-geral', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/15-cmt_geral.mp3', 'user', NULL, 'autoridades', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 15),
    ('Cobrir', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/16-cobrir.mp3', 'users', 'Cobrir', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 16),
    ('Companhia', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/17-companhia.mp3', 'users', NULL, 'frações', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 17),
    ('Contingente', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/18-contingente.mp3', 'users', NULL, 'frações', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 18),
    ('Cruzar arma', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/19-cruzar_arma.mp3', 'shield', 'Cruzar arma', 'armas', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 19),
    ('Descansar', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/20-descansar.mp3', 'relaxed', 'Descansar', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 20),
    ('Descansar arma', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/21-descansar_arma.mp3', 'shield', 'Descansar arma', 'armas', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 21),
    ('Direita volver', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/22-direita_volver.mp3', 'rotate', 'Direita volver', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 22),
    ('Em continência', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/23-em_continencia.mp3', 'salute', 'Em continência', 'cerimonial', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 23),
    ('Em direção à direita', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/24-em_direcao_a_direita.mp3', 'arrow-right', 'Em direção à direita', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 24),
    ('Em direção à esquerda', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/25-em_direcao_a_esquerda.mp3', 'arrow-left', 'Em direção à esquerda', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 25),
    ('Escola', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/26-escola.mp3', 'school', NULL, 'institucional', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 26),
    ('Esquerda volver', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/27-esquerda_volver.mp3', 'rotate', 'Esquerda volver', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 27),
    ('Firme', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/28-firme.mp3', 'shield', 'Firme', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 28),
    ('Governador', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/29-governador.mp3', 'user', NULL, 'autoridades', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 29),
    ('Granadeira', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/30-granadeira.mp3', 'shield', NULL, 'institucional', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 30),
    ('Início do expediente', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/31-inicio_expediente.mp3', 'clock', 'Início do expediente', 'rotina', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 31),
    ('Inspeções policiais', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/32-inspecoes_policiais.mp3', 'search', NULL, 'institucional', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 32),
    ('Marcar passo', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/33-marcar_passo.mp3', 'footprints', 'Marcar passo', 'marcha', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 33),
    ('Marcha batida', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/34-marcha_batida.mp3', 'footprints', 'Em marcha', 'marcha', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 34),
    ('Meia-volta volver', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/35-meia_volta_volver.mp3', 'rotate', 'Meia-volta volver', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 35),
    ('Oficial superior', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/36-oficial_superior.mp3', 'user', NULL, 'autoridades', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 36),
    ('Olhar à direita', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/37-olhar_a_direita.mp3', 'eye', 'Olhar à direita', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 37),
    ('Olhar em frente', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/38-olhar_em_frente.mp3', 'eye', 'Olhar em frente', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 38),
    ('Ombro arma', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/39-ombro_arma.mp3', 'shield', 'Ombro arma', 'armas', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 39),
    ('Ordem', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/40-ordem.mp3', 'volume', NULL, 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 40),
    ('Ordinário marche', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/41-ordinario_marche.mp3', 'footprints', 'Em marcha', 'marcha', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 41),
    ('Para prontidão', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/42-para_a_prontidao.mp3', 'bell', 'Em prontidão', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 42),
    ('Pelotão', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/43-pelotao.mp3', 'users', NULL, 'frações', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 43),
    ('Polícia Militar', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/44-policia_militar.mp3', 'shield', NULL, 'institucional', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 44),
    ('Presidente', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/45-presidente.mp3', 'user', NULL, 'autoridades', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 45),
    ('Reunir', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/46-reunir.mp3', 'users', 'Reunir', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 46),
    ('Revista do recolher', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/47-revista_do_recolher.mp3', 'search', 'Revista do recolher', 'rotina', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 47),
    ('Sentido', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/48-sentido.mp3', 'shield', 'Sentido', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 48),
    ('Silêncio', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/49-silencio.mp3', 'volume-off', 'Em silêncio', 'rotina', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 49),
    ('Término do expediente', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/50-termino_expediente.mp3', 'clock', 'Término do expediente', 'rotina', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 50),
    ('Última forma', 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/51-ultima_forma.mp3', 'users', 'Última forma', 'comandos', 'https://cpmlondrina.com.br/alunos/toques-corneta/', 51)
  `);

  const calls = await query('SELECT count(*) as total FROM pmam_bugle_calls');
  const marches = await query('SELECT count(*) as total FROM pmam_marches');
  console.log(`4. Done! Calls in DB: ${calls[0]?.total}, Marches in DB: ${marches[0]?.total}`);
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
