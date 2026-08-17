import 'dotenv/config';
import { listBugleCalls, createBugleCall, updateBugleCall } from './server/bugleDb.ts';

const bugleCallsData = [
  { name: 'À vontade', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/01-a_vontade.mp3', iconKey: 'relaxed', troopState: 'À vontade', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 1 },
  { name: 'Acelerado', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/02-acelerado.mp3', iconKey: 'gauge', troopState: 'Em acelerado', category: 'marcha', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 2 },
  { name: 'Ajudante-geral', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/03-ajudante_geral.mp3', iconKey: 'user', troopState: null, category: 'autoridades', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 3 },
  { name: 'Alto', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/04-alto.mp3', iconKey: 'hand', troopState: 'Alto', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 4 },
  { name: 'Alvorada', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/05-alvorada.mp3', iconKey: 'sun', troopState: null, category: 'rotina', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 5 },
  { name: 'Apresentar arma', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/06-apresentar_arma.mp3', iconKey: 'shield', troopState: 'Apresentar arma', category: 'armas', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 6 },
  { name: 'Avançar ao rancho', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/07-avancar_ao_rancho.mp3', iconKey: 'utensils', troopState: 'Avançar ao rancho', category: 'rotina', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 7 },
  { name: 'Bandeira Nacional', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/08-bandeira_nacional.mp3', iconKey: 'flag', troopState: null, category: 'cerimonial', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 8 },
  { name: 'Batalhão', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/09-batalhao.mp3', iconKey: 'users', troopState: null, category: 'frações', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 9 },
  { name: 'Bombeiro', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/10-bombeiro.mp3', iconKey: 'flame', troopState: null, category: 'institucional', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 10 },
  { name: 'Cavalaria', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/11-cavalaria.mp3', iconKey: 'shield', troopState: null, category: 'institucional', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 11 },
  { name: 'Cessar o À Vontade', audioUrl: '/audio/toques/cessar-a-vontade.mp3', iconKey: 'relaxed', troopState: 'Descansar', category: 'comandos', sourceUrl: null, sortOrder: 12 },
  { name: 'Chefe do Estado-Maior', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/12-chefe_estado_maior.mp3', iconKey: 'user', troopState: null, category: 'autoridades', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 13 },
  { name: 'Comandante de batalhão', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/13-cmt_batalhao.mp3', iconKey: 'user', troopState: null, category: 'autoridades', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 14 },
  { name: 'Comandante de companhia', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/14-cmt_companhia.mp3', iconKey: 'user', troopState: null, category: 'autoridades', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 15 },
  { name: 'Comandante-geral', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/15-cmt_geral.mp3', iconKey: 'user', troopState: null, category: 'autoridades', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 16 },
  { name: 'Cobrir', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/16-cobrir.mp3', iconKey: 'users', troopState: 'Cobrir', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 17 },
  { name: 'Companhia', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/17-companhia.mp3', iconKey: 'users', troopState: null, category: 'frações', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 18 },
  { name: 'Contingente', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/18-contingente.mp3', iconKey: 'users', troopState: null, category: 'frações', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 19 },
  { name: 'Cruzar arma', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/19-cruzar_arma.mp3', iconKey: 'shield', troopState: 'Cruzar arma', category: 'armas', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 20 },
  { name: 'Descansar', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/20-descansar.mp3', iconKey: 'relaxed', troopState: 'Descansar', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 21 },
  { name: 'Descansar arma', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/21-descansar_arma.mp3', iconKey: 'shield', troopState: 'Descansar arma', category: 'armas', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 22 },
  { name: 'Direita volver', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/22-direita_volver.mp3', iconKey: 'rotate', troopState: 'Direita volver', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 23 },
  { name: 'Em continência', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/23-em_continencia.mp3', iconKey: 'salute', troopState: 'Em continência', category: 'cerimonial', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 24 },
  { name: 'Em direção à direita', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/24-em_direcao_a_direita.mp3', iconKey: 'arrow-right', troopState: 'Em direção à direita', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 25 },
  { name: 'Em direção à esquerda', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/25-em_direcao_a_esquerda.mp3', iconKey: 'arrow-left', troopState: 'Em direção à esquerda', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 26 },
  { name: 'Escola', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/26-escola.mp3', iconKey: 'school', troopState: null, category: 'institucional', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 27 },
  { name: 'Esquerda volver', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/27-esquerda_volver.mp3', iconKey: 'rotate', troopState: 'Esquerda volver', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 28 },
  { name: 'Firme', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/28-firme.mp3', iconKey: 'shield', troopState: 'Firme', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 29 },
  { name: 'Governador', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/29-governador.mp3', iconKey: 'user', troopState: null, category: 'autoridades', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 30 },
  { name: 'Granadeira', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/30-granadeira.mp3', iconKey: 'shield', troopState: null, category: 'institucional', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 31 },
  { name: 'Início do expediente', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/31-inicio_expediente.mp3', iconKey: 'clock', troopState: 'Início do expediente', category: 'rotina', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 32 },
  { name: 'Inspeções policiais', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/32-inspecoes_policiais.mp3', iconKey: 'search', troopState: null, category: 'institucional', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 33 },
  { name: 'Marcar passo', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/33-marcar_passo.mp3', iconKey: 'footprints', troopState: 'Marcar passo', category: 'marcha', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 34 },
  { name: 'Marcha batida', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/34-marcha_batida.mp3', iconKey: 'footprints', troopState: 'Em marcha', category: 'marcha', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 35 },
  { name: 'Meia-volta volver', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/35-meia_volta_volver.mp3', iconKey: 'rotate', troopState: 'Meia-volta volver', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 36 },
  { name: 'Oficial superior', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/36-oficial_superior.mp3', iconKey: 'user', troopState: null, category: 'autoridades', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 37 },
  { name: 'Olhar à direita', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/37-olhar_a_direita.mp3', iconKey: 'eye', troopState: 'Olhar à direita', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 38 },
  { name: 'Olhar em frente', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/38-olhar_em_frente.mp3', iconKey: 'eye', troopState: 'Olhar em frente', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 39 },
  { name: 'Ombro arma', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/39-ombro_arma.mp3', iconKey: 'shield', troopState: 'Ombro arma', category: 'armas', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 40 },
  { name: 'Ordem', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/40-ordem.mp3', iconKey: 'volume', troopState: null, category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 41 },
  { name: 'Ordinário marche', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/41-ordinario_marche.mp3', iconKey: 'footprints', troopState: 'Em marcha', category: 'marcha', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 42 },
  { name: 'Para prontidão', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/42-para_a_prontidao.mp3', iconKey: 'bell', troopState: 'Em prontidão', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 43 },
  { name: 'Pelotão', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/43-pelotao.mp3', iconKey: 'users', troopState: null, category: 'frações', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 44 },
  { name: 'Polícia Militar', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/44-policia_militar.mp3', iconKey: 'shield', troopState: null, category: 'institucional', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 45 },
  { name: 'Presidente', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/45-presidente.mp3', iconKey: 'user', troopState: null, category: 'autoridades', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 46 },
  { name: 'Reunir', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/46-reunir.mp3', iconKey: 'users', troopState: 'Reunir', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 47 },
  { name: 'Revista do recolher', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/47-revista_do_recolher.mp3', iconKey: 'search', troopState: 'Revista do recolher', category: 'rotina', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 48 },
  { name: 'Sentido', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/48-sentido.mp3', iconKey: 'shield', troopState: 'Sentido', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 49 },
  { name: 'Silêncio', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/49-silencio.mp3', iconKey: 'volume-off', troopState: 'Em silêncio', category: 'rotina', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 50 },
  { name: 'Término do expediente', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/50-termino_expediente.mp3', iconKey: 'clock', troopState: 'Término do expediente', category: 'rotina', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 51 },
  { name: 'Última forma', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/51-ultima_forma.mp3', iconKey: 'users', troopState: 'Última forma', category: 'comandos', sourceUrl: 'https://cpmlondrina.com.br/alunos/toques-corneta/', sortOrder: 52 },
];

async function seedBugleCalls() {
  console.log('Seeding bugle calls...');
  const existingCalls = await listBugleCalls(false);
  const existingByName = new Map(existingCalls.map((c) => [c.name.toLowerCase(), c]));

  for (const item of bugleCallsData) {
    const existing = existingByName.get(item.name.toLowerCase());
    if (existing) {
      await updateBugleCall(existing.id, {
        audioUrl: item.audioUrl,
        iconKey: item.iconKey,
        troopState: item.troopState,
        category: item.category,
        sourceUrl: item.sourceUrl,
        sortOrder: item.sortOrder,
      });
    } else {
      await createBugleCall(item);
    }
  }
  console.log(`Seeded ${bugleCallsData.length} bugle calls successfully.`);

  const marchesData = [
    { title: 'Batista de Melo', composer: 'Manoel Alves', audioUrl: '/audio/toques/cessar-a-vontade.mp3', sortOrder: 1 },
    { title: 'Cavalaria', composer: 'Domínio Público', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/11-cavalaria.mp3', sortOrder: 2 },
    { title: 'Granadeira', composer: 'Domínio Público', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/30-granadeira.mp3', sortOrder: 3 },
    { title: 'Início Expediente', composer: 'Domínio Público', audioUrl: 'https://cpmlondrina.com.br/wp-content/uploads/2018/06/31-inicio_expediente.mp3', sortOrder: 4 },
  ];

  const { listMarches, createMarch, updateMarch } = await import('./server/bugleDb.ts');
  const existingMarches = await listMarches(false);
  const existingMarchMap = new Map(existingMarches.map((m) => [m.title.toLowerCase(), m]));

  for (const march of marchesData) {
    const existing = existingMarchMap.get(march.title.toLowerCase());
    if (existing) {
      await updateMarch(existing.id, {
        composer: march.composer,
        audioUrl: existing.audioUrl || march.audioUrl,
        sortOrder: march.sortOrder,
      });
    } else {
      await createMarch(march);
    }
  }
  console.log(`Seeded ${marchesData.length} marches successfully.`);
}

seedBugleCalls().catch((err) => {
  console.error('Failed to seed bugle calls:', err);
  process.exit(1);
});
