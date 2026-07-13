export type FoType = "positive" | "negative";

export interface FoCodeDefinition {
  code: string;
  type: FoType;
  label: string;
  category: string;
  manualRef: string;
}

export const FO_LC_THRESHOLD = 2;

export const FO_CODE_CATALOG: FoCodeDefinition[] = [
  {
    code: "A1",
    type: "negative",
    category: "Assiduidade",
    label: "Faltar aula ou instrucao",
    manualRef: "Manual do Aluno, Art. 19, VII; Anexo A, A1",
  },
  {
    code: "A2",
    type: "negative",
    category: "Assiduidade",
    label: "Faltar as revistas",
    manualRef: "Manual do Aluno, Anexo A, A2",
  },
  {
    code: "B1",
    type: "negative",
    category: "Pontualidade",
    label: "Chegar atrasado nas aulas e instrucoes",
    manualRef: "Manual do Aluno, Art. 19, VIII; Anexo A, B1",
  },
  {
    code: "B2",
    type: "negative",
    category: "Pontualidade",
    label: "Nao levantar ao toque de alvorada",
    manualRef: "Manual do Aluno, Anexo A, B2",
  },
  {
    code: "C1",
    type: "negative",
    category: "Uniformes",
    label: "Uniforme sujo, amarrotado ou irregular",
    manualRef: "Manual do Aluno, Anexo A, C1",
  },
  {
    code: "C2",
    type: "negative",
    category: "Uniformes",
    label: "Uso de uniforme alterado, nao previsto ou troca em local inapropriado",
    manualRef: "Manual do Aluno, Art. 19, XX; Anexo A, C2",
  },
  {
    code: "D1",
    type: "negative",
    category: "Correcao de atitudes",
    label: "Promiscuidade com pracas de outros circulos",
    manualRef: "Manual do Aluno, Anexo A, D1",
  },
  {
    code: "D2",
    type: "negative",
    category: "Correcao de atitudes",
    label: "Apresentacao individual incorreta ou fora do padrao",
    manualRef: "Manual do Aluno, Anexo A, D2",
  },
  {
    code: "D3",
    type: "negative",
    category: "Correcao de atitudes",
    label: "Falta de proatividade",
    manualRef: "Manual do Aluno, Anexo A, D3",
  },
  {
    code: "D4",
    type: "negative",
    category: "Correcao de atitudes",
    label: "Falta de camaradagem",
    manualRef: "Manual do Aluno, Anexo A, D4",
  },
  {
    code: "D5",
    type: "negative",
    category: "Correcao de atitudes",
    label: "Dormir em sala de aula ou local de atividade pedagogica/instrucao",
    manualRef: "Manual do Aluno, Art. 19, IV; Anexo A, D5",
  },
  {
    code: "D6",
    type: "negative",
    category: "Correcao de atitudes",
    label: "Apresentar odor etilico, embriaguez, sinal de substancia ou fumar no CFAP",
    manualRef: "Manual do Aluno, Art. 19, XVI; Anexo A, D6",
  },
  {
    code: "E1",
    type: "negative",
    category: "Ordem e organizacao",
    label: "Objetos, materiais de estudo ou pecas de uso diario abandonados",
    manualRef: "Manual do Aluno, Anexo A, E1",
  },
  {
    code: "E2",
    type: "negative",
    category: "Ordem e organizacao",
    label: "Cama desarrumada",
    manualRef: "Manual do Aluno, Anexo A, E2",
  },
  {
    code: "E3",
    type: "negative",
    category: "Ordem e organizacao",
    label: "Documentos mal redigidos",
    manualRef: "Manual do Aluno, Anexo A, E3",
  },
  {
    code: "E4",
    type: "negative",
    category: "Ordem e organizacao",
    label: "Chefe de turma deixar de manter a ordem e o controle da turma",
    manualRef: "Manual do Aluno, Art. 19, X; Anexo A, E4",
  },
  {
    code: "F1",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Execucao incorreta dos movimentos comandados",
    manualRef: "Manual do Aluno, Anexo A, F1",
  },
  {
    code: "F2",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Deixar de cumprir ordens do chefe de turma",
    manualRef: "Manual do Aluno, Art. 19, XI; Anexo A, F2",
  },
  {
    code: "F3",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Dificultar o comando do chefe de turma",
    manualRef: "Manual do Aluno, Anexo A, F3",
  },
  {
    code: "F4",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Responder grosseiramente ao chefe de turma",
    manualRef: "Manual do Aluno, Anexo A, F4",
  },
  {
    code: "F5",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Perturbar o silencio ou o estudo alheio",
    manualRef: "Manual do Aluno, Anexo A, F5",
  },
  {
    code: "F6",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Falta de presteza ao cumprimento de ordens ou nao dar o pronto",
    manualRef: "Manual do Aluno, Anexo A, F6",
  },
  {
    code: "F7",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Uso de palavras ofensivas",
    manualRef: "Manual do Aluno, Anexo A, F7",
  },
  {
    code: "F8",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Promover desordem",
    manualRef: "Manual do Aluno, Anexo A, F8",
  },
  {
    code: "F9",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Falta de postura e compostura no ambiente escolar e de instrucao",
    manualRef: "Manual do Aluno, Art. 19, V; Anexo A, F9",
  },
  {
    code: "F10",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Falta de postura e compostura em paradas, formaturas e solenidades",
    manualRef: "Manual do Aluno, Art. 19, XV; Anexo A, F10",
  },
  {
    code: "F11",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Portar-se desrespeitosamente perante professor, instrutor ou superior",
    manualRef: "Manual do Aluno, Art. 19, VI; Anexo A, F11",
  },
  {
    code: "F12",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Ausentar-se da sala durante instrucao ou horario vago sem autorizacao",
    manualRef: "Manual do Aluno, Art. 19, IX; Anexo A, F12",
  },
  {
    code: "F13",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Ausentar-se do local em que deve permanecer por ordem, escala ou medida administrativa",
    manualRef: "Manual do Aluno, Art. 19, XIII; Anexo A, F13",
  },
  {
    code: "F14",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Deixar de cumprir deveres e obrigacoes escolares",
    manualRef: "Manual do Aluno, Art. 19, XVII; Anexo A, F14",
  },
  {
    code: "F15",
    type: "negative",
    category: "Espirito de disciplina",
    label: "Nao prestar saudacoes regulamentares e sinais de respeito",
    manualRef: "Manual do Aluno, Art. 19, XIX; Anexo A, F15",
  },
  {
    code: "G1",
    type: "negative",
    category: "Conservacao do material",
    label: "Armamento sujo ou mal conservado",
    manualRef: "Manual do Aluno, Anexo A, G1",
  },
  {
    code: "G2",
    type: "negative",
    category: "Conservacao do material",
    label: "Equipamento ou material sujo ou mal conservado",
    manualRef: "Manual do Aluno, Anexo A, G2",
  },
  {
    code: "G3",
    type: "negative",
    category: "Conservacao do material",
    label: "Abandonar armamento, equipamento ou material",
    manualRef: "Manual do Aluno, Anexo A, G3",
  },
  {
    code: "G4",
    type: "negative",
    category: "Conservacao do material",
    label: "Extraviar, danificar ou fazer uso inadequado de material escolar ou patrimonio",
    manualRef: "Manual do Aluno, Art. 19, XII",
  },
  {
    code: "H1",
    type: "negative",
    category: "Higiene e apresentacao",
    label: "Falta de higiene",
    manualRef: "Manual do Aluno, Art. 19, XIV",
  },
  {
    code: "H2",
    type: "negative",
    category: "Higiene e apresentacao",
    label: "Corte de cabelo fora do padrao estabelecido",
    manualRef: "Manual do Aluno, Art. 19, XVIII",
  },
  {
    code: "I1",
    type: "negative",
    category: "Probidade escolar",
    label: "Utilizar processos ou meios ilicitos em avaliacoes",
    manualRef: "Manual do Aluno, Art. 19, I",
  },
  {
    code: "I2",
    type: "negative",
    category: "Probidade escolar",
    label: "Consultar ou auxiliar outrem em avaliacao individual",
    manualRef: "Manual do Aluno, Art. 19, II",
  },
  {
    code: "I3",
    type: "negative",
    category: "Probidade escolar",
    label: "Contribuir para obtencao ilicita de questoes de avaliacao",
    manualRef: "Manual do Aluno, Art. 19, III",
  },
  {
    code: "I4",
    type: "negative",
    category: "Conduta publica",
    label: "Usar midias ou sites para expor negativamente a PMAM ou a profissao",
    manualRef: "Manual do Aluno, Art. 19, XXI",
  },

  {
    code: "A1",
    type: "positive",
    category: "Assiduidade",
    label: "Assiduidade exemplar em aulas e instrucoes",
    manualRef: "Manual do Aluno, Art. 6, X",
  },
  {
    code: "A2",
    type: "positive",
    category: "Assiduidade",
    label: "Comparecimento exemplar as revistas",
    manualRef: "Manual do Aluno, Art. 6, IX",
  },
  {
    code: "B1",
    type: "positive",
    category: "Pontualidade",
    label: "Pontualidade exemplar nas aulas, instrucoes e formaturas",
    manualRef: "Manual do Aluno, Art. 6, IX e XXV",
  },
  {
    code: "B2",
    type: "positive",
    category: "Pontualidade",
    label: "Prontidao exemplar ao toque de alvorada",
    manualRef: "Manual do Aluno, Art. 6, XII",
  },
  {
    code: "C1",
    type: "positive",
    category: "Uniformes",
    label: "Fardamento limpo, alinhado e impecavel",
    manualRef: "Manual do Aluno, Art. 6, XVI",
  },
  {
    code: "C2",
    type: "positive",
    category: "Uniformes",
    label: "Uso correto do uniforme previsto para a instrucao",
    manualRef: "Manual do Aluno, Art. 6, XVI",
  },
  {
    code: "D1",
    type: "positive",
    category: "Correcao de atitudes",
    label: "Conduta respeitosa entre circulos e tratamento adequado",
    manualRef: "Manual do Aluno, Anexo A, D1; deveres disciplinares",
  },
  {
    code: "D2",
    type: "positive",
    category: "Correcao de atitudes",
    label: "Apresentacao individual correta e exemplar",
    manualRef: "Manual do Aluno, Art. 6, XXXII",
  },
  {
    code: "D3",
    type: "positive",
    category: "Correcao de atitudes",
    label: "Proatividade destacada nas atividades do curso",
    manualRef: "Manual do Aluno, Art. 6, XV e XXXIX",
  },
  {
    code: "D4",
    type: "positive",
    category: "Correcao de atitudes",
    label: "Camaradagem e cooperacao exemplar",
    manualRef: "Manual do Aluno, Art. 6, XXVIII",
  },
  {
    code: "D5",
    type: "positive",
    category: "Correcao de atitudes",
    label: "Atencao e resistencia exemplar durante instrucao",
    manualRef: "Manual do Aluno, Art. 6, XXIII",
  },
  {
    code: "D6",
    type: "positive",
    category: "Correcao de atitudes",
    label: "Conduta sobria e respeito as proibicoes no CFAP",
    manualRef: "Manual do Aluno, Art. 19, XVI",
  },
  {
    code: "E1",
    type: "positive",
    category: "Ordem e organizacao",
    label: "Material de estudo e pecas de uso diario organizados",
    manualRef: "Manual do Aluno, Art. 6, XIII e XXXV",
  },
  {
    code: "E2",
    type: "positive",
    category: "Ordem e organizacao",
    label: "Cama e alojamento mantidos em padrao exemplar",
    manualRef: "Manual do Aluno, Art. 6, XIII",
  },
  {
    code: "E3",
    type: "positive",
    category: "Ordem e organizacao",
    label: "Documentos escolares bem redigidos e apresentados",
    manualRef: "Manual do Aluno, Art. 6, XXXVIII",
  },
  {
    code: "E4",
    type: "positive",
    category: "Ordem e organizacao",
    label: "Chefia de turma exercida com ordem e controle",
    manualRef: "Manual do Aluno, atribuicoes do chefe de turma",
  },
  {
    code: "F1",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Execucao correta e destacada dos movimentos comandados",
    manualRef: "Manual do Aluno, disciplina e ordem unida",
  },
  {
    code: "F2",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Cumprimento exemplar das ordens do chefe de turma",
    manualRef: "Manual do Aluno, Art. 6, XXIV",
  },
  {
    code: "F3",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Trato correto e cordial com pares, superiores e subordinados",
    manualRef: "Manual do Aluno, Art. 6, XXVIII",
  },
  {
    code: "F4",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Zelo no cumprimento de ordens, avisos e formaturas",
    manualRef: "Manual do Aluno, Art. 6, I e XV",
  },
  {
    code: "F5",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Preservacao exemplar do silencio e do estudo alheio",
    manualRef: "Manual do Aluno, Art. 6, XXIII",
  },
  {
    code: "F6",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Presteza e pronto cumprimento de ordens recebidas",
    manualRef: "Manual do Aluno, Art. 6, VIII e XLII",
  },
  {
    code: "F7",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Participacao disciplinada em sala de aula e instrucao",
    manualRef: "Manual do Aluno, Art. 6, IV e XV",
  },
  {
    code: "F8",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Zelo e uso correto do material da fazenda",
    manualRef: "Manual do Aluno, Art. 6, VII e XXXV",
  },
  {
    code: "F9",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Postura e compostura exemplar no ambiente escolar e de instrucao",
    manualRef: "Manual do Aluno, Art. 6, IV e XXXII",
  },
  {
    code: "F10",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Postura exemplar em paradas, formaturas e solenidades",
    manualRef: "Manual do Aluno, Art. 6, XXV",
  },
  {
    code: "F11",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Respeito exemplar a professores, instrutores e superiores",
    manualRef: "Manual do Aluno, Art. 6, XXVIII",
  },
  {
    code: "F12",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Respeito a documentos, publicacoes e objetos institucionais",
    manualRef: "Manual do Aluno, Art. 6, XV e XXXVIII",
  },
  {
    code: "F13",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Respeito aos padroes de filmagem e divulgacao institucional",
    manualRef: "Manual do Aluno, Art. 6, XV",
  },
  {
    code: "F14",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Cumprimento exemplar dos deveres e obrigacoes escolares",
    manualRef: "Manual do Aluno, Art. 6",
  },
  {
    code: "F15",
    type: "positive",
    category: "Espirito de disciplina",
    label: "Saudacoes regulamentares e sinais de respeito executados com destaque",
    manualRef: "Manual do Aluno, Art. 6, XXX",
  },
  {
    code: "G1",
    type: "positive",
    category: "Conservacao do material",
    label: "Correcao no transito interno e cumprimento das prescricoes de circulacao",
    manualRef: "Manual do Aluno, Art. 6, XV",
  },
  {
    code: "G2",
    type: "positive",
    category: "Conservacao do material",
    label: "Equipamento e material mantidos em excelente estado",
    manualRef: "Manual do Aluno, Art. 6, VII e XXXV",
  },
  {
    code: "G3",
    type: "positive",
    category: "Conservacao do material",
    label: "Comunicacao imediata de incidentes ou acidentes",
    manualRef: "Manual do Aluno, Art. 6, XV",
  },
  {
    code: "G4",
    type: "positive",
    category: "Conservacao do material",
    label: "Preservacao da limpeza e do asseio das dependencias",
    manualRef: "Manual do Aluno, Art. 6, VII e XXXII",
  },
  {
    code: "H1",
    type: "positive",
    category: "Higiene e apresentacao",
    label: "Higiene pessoal exemplar",
    manualRef: "Manual do Aluno, Art. 6, XXXII",
  },
  {
    code: "H2",
    type: "positive",
    category: "Higiene e apresentacao",
    label: "Uso responsavel de equipamentos eletronicos conforme autorizacao",
    manualRef: "Manual do Aluno, Art. 6, XV",
  },
  {
    code: "I1",
    type: "positive",
    category: "Probidade escolar",
    label: "Probidade exemplar na execucao de trabalhos e avaliacoes",
    manualRef: "Manual do Aluno, Art. 6, XXXVIII",
  },
  {
    code: "I2",
    type: "positive",
    category: "Probidade escolar",
    label: "Compromisso com avaliacoes, estudos e trabalhos",
    manualRef: "Manual do Aluno, Art. 16, II",
  },
  {
    code: "I3",
    type: "positive",
    category: "Probidade escolar",
    label: "Postura e silencio adequados nos ambientes de aula e estudo",
    manualRef: "Manual do Aluno, Art. 6, IV",
  },
  {
    code: "I4",
    type: "positive",
    category: "Probidade escolar",
    label: "Cumprimento dos ritos de continencia e sinais de respeito",
    manualRef: "Manual do Aluno, Art. 6, XXX",
  },
  {
    code: "P1",
    type: "positive",
    category: "Merito",
    label: "Destaque intelectual em avaliacoes ou trabalhos",
    manualRef: "Manual do Aluno, Art. 16, II",
  },
  {
    code: "P2",
    type: "positive",
    category: "Merito",
    label: "Espirito de corpo exemplar e cooperacao ativa",
    manualRef: "Manual do Aluno, valores e deveres dos discentes",
  },
  {
    code: "P3",
    type: "positive",
    category: "Merito",
    label: "Iniciativa positiva em beneficio do pelotao ou da companhia",
    manualRef: "Manual do Aluno, qualidades do policial militar",
  },
  {
    code: "P4",
    type: "positive",
    category: "Merito",
    label: "Honestidade, verdade ou probidade militar exemplar",
    manualRef: "Manual do Aluno, Art. 6, XXXVIII; preceitos eticos",
  },
];

export function normalizeFoCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function getFoCodesByType(type: FoType) {
  return FO_CODE_CATALOG.filter((item) => item.type === type);
}

export function getFoCodeDefinition(type: FoType, code: string) {
  const normalized = normalizeFoCode(code);
  return FO_CODE_CATALOG.find((item) => item.type === type && item.code === normalized) ?? null;
}

export function getFoCodeLabel(type: FoType, code: string) {
  return getFoCodeDefinition(type, code)?.label ?? normalizeFoCode(code);
}

export interface FoTextClassification {
  definition: FoCodeDefinition;
  score: number;
  matchedTerms: string[];
}

const FO_TEXT_HINTS: Record<FoType, Record<string, string[]>> = {
  negative: {
    A1: ["faltou aula", "falta aula", "nao compareceu aula", "ausencia aula", "faltou instrucao", "falta instrucao"],
    A2: ["faltou revista", "falta revista", "nao compareceu revista"],
    B1: ["atraso", "atrasado", "chegou atrasado", "atrasou", "atraso aula", "atraso instrucao", "atraso formatura"],
    B2: ["alvorada", "nao levantou", "toque de alvorada"],
    C1: ["fardamento sujo", "uniforme sujo", "uniforme amarrotado", "fardamento irregular", "fardamento desalinhado"],
    C2: ["uniforme alterado", "uniforme nao previsto", "troca de uniforme", "uniforme irregular"],
    D1: ["promiscuidade", "outro circulo", "circulos"],
    D2: ["apresentacao incorreta", "fora do padrao", "barba", "cabelo", "apresentacao individual"],
    D3: ["falta de proatividade", "sem proatividade", "nao colaborou", "omisso"],
    D4: ["falta de camaradagem", "sem camaradagem", "nao cooperou", "falta de cooperacao"],
    D5: ["dormiu", "dormir", "sonolencia", "dormindo", "dormiu em sala", "dormiu na instrucao"],
    D6: ["odor etilico", "embriaguez", "bebida alcoolica", "alcool", "substancia", "fumou", "fumar"],
    E1: ["material abandonado", "objetos abandonados", "pecas abandonadas", "material largado"],
    E2: ["cama desarrumada", "cama baguncada", "alojamento desarrumado"],
    E3: ["documento mal redigido", "documentos mal redigidos", "redacao inadequada"],
    E4: ["chefe de turma", "nao manteve ordem", "controle da turma", "ordem da turma"],
    F1: ["movimento incorreto", "movimentos comandados", "ordem unida incorreta"],
    F2: ["ordem do chefe", "descumpriu ordem", "nao cumpriu ordem", "deixar de cumprir ordem"],
    F3: ["dificultou comando", "dificultar comando", "atrapalhou chefe"],
    F4: ["respondeu grosseiramente", "grosseiro", "resposta grosseira", "respondeu mal"],
    F5: ["perturbou silencio", "barulho", "conversa", "conversas paralelas", "perturbou estudo"],
    F6: ["falta de presteza", "sem presteza", "nao deu pronto", "pronto", "demora ordem"],
    F7: ["palavra ofensiva", "palavras ofensivas", "ofendeu", "ofensa", "xingou"],
    F8: ["desordem", "promoveu desordem", "bagunca", "tumulto"],
    F9: ["falta de postura", "sem postura", "compostura", "postura inadequada", "sala de aula"],
    F10: ["parada", "formatura", "solenidade", "postura em formatura"],
    F11: ["desrespeito", "desrespeitoso", "professor", "instrutor", "superior", "desacatou"],
    F12: ["ausentou da sala", "saiu da sala", "sem autorizacao", "horario vago"],
    F13: ["ausentou do local", "abandonou posto", "escala", "medida administrativa"],
    F14: ["dever escolar", "obrigacao escolar", "nao cumpriu dever", "atividade escolar"],
    F15: ["saudacao", "continencia", "nao saudou", "sinal de respeito"],
    G1: ["armamento sujo", "arma suja", "armamento mal conservado"],
    G2: ["equipamento sujo", "material sujo", "material mal conservado", "equipamento mal conservado"],
    G3: ["abandonou armamento", "abandonou equipamento", "abandonou material"],
    G4: ["extraviou", "danificou", "dano", "uso inadequado", "patrimonio"],
    H1: ["falta de higiene", "higiene", "asseio", "odor", "sujo"],
    H2: ["corte de cabelo", "cabelo fora", "fora do padrao", "padrao cabelo"],
    I1: ["meio ilicito", "cola", "colou", "avaliacao", "fraude"],
    I2: ["consultou", "auxiliou", "ajudou na prova", "avaliacao individual"],
    I3: ["questoes de avaliacao", "obteve questoes", "vazamento de prova"],
    I4: ["midia", "site", "rede social", "exposicao negativa", "expor pmam"],
  },
  positive: {
    A1: ["assiduidade", "presenca exemplar", "compareceu aula", "compareceu instrucao"],
    A2: ["compareceu revista", "revista exemplar"],
    B1: ["pontualidade", "pontual", "chegou no horario", "sem atraso"],
    B2: ["prontidao", "alvorada", "levantou no horario"],
    C1: ["fardamento impecavel", "uniforme limpo", "uniforme alinhado", "fardamento limpo"],
    C2: ["uniforme correto", "uniforme previsto", "uso correto do uniforme"],
    D1: ["tratamento adequado", "conduta respeitosa", "respeito entre circulos"],
    D2: ["apresentacao exemplar", "apresentacao correta", "padrao exemplar"],
    D3: ["proatividade", "iniciativa", "colaborou", "solucionou"],
    D4: ["camaradagem", "cooperacao", "espirito de corpo"],
    D5: ["atencao exemplar", "resistencia exemplar", "disposicao em instrucao"],
    D6: ["conduta sobria", "respeitou proibicoes"],
    E1: ["material organizado", "objetos organizados", "pecas organizadas"],
    E2: ["cama arrumada", "alojamento organizado"],
    E3: ["documento bem redigido", "boa redacao", "documento bem apresentado"],
    E4: ["chefia de turma", "controle exemplar da turma", "ordem da turma"],
    F1: ["movimento correto", "ordem unida", "execucao destacada"],
    F2: ["cumpriu ordem", "ordens do chefe", "disciplina"],
    F3: ["trato cordial", "tratamento correto", "cordialidade"],
    F4: ["cumprimento de avisos", "zelo em formatura", "ordens e avisos"],
    F5: ["silencio preservado", "estudo alheio", "ambiente de estudo"],
    F6: ["presteza", "pronto cumprimento", "deu pronto"],
    F7: ["participacao disciplinada", "disciplina em sala"],
    F8: ["zelo com material", "uso correto do material"],
    F9: ["postura exemplar", "compostura exemplar"],
    F10: ["postura em parada", "postura em formatura", "solenidade"],
    F11: ["respeito exemplar", "respeitou professor", "respeitou instrutor", "respeitou superior"],
    F12: ["respeito a documentos", "publicacoes", "objetos institucionais"],
    F13: ["filmagem institucional", "divulgacao institucional"],
    F14: ["cumpriu deveres", "obrigacoes escolares", "dever escolar"],
    F15: ["saudacao regulamentar", "continencia", "sinais de respeito"],
    G1: ["transito interno", "prescricoes de circulacao"],
    G2: ["material excelente", "equipamento excelente", "material conservado"],
    G3: ["comunicou incidente", "comunicou acidente"],
    G4: ["limpeza das dependencias", "asseio das dependencias"],
    H1: ["higiene exemplar", "asseio exemplar"],
    H2: ["uso responsavel", "equipamento eletronico autorizado"],
    I1: ["probidade", "honestidade em avaliacao"],
    I2: ["compromisso com estudos", "trabalhos", "avaliacoes"],
    I3: ["silencio adequado", "postura em estudo"],
    I4: ["ritos de continencia", "sinais de respeito"],
    P1: ["destaque intelectual", "avaliacao", "trabalho"],
    P2: ["espirito de corpo", "cooperacao ativa"],
    P3: ["iniciativa positiva", "beneficio do pelotao", "beneficio da companhia"],
    P4: ["honestidade", "verdade", "probidade militar"],
  },
};

const FO_TEXT_STOP_WORDS = new Set([
  "a", "ao", "aos", "as", "com", "da", "das", "de", "do", "dos", "e", "em",
  "na", "nas", "no", "nos", "o", "os", "ou", "para", "por", "que", "sem",
  "um", "uma", "aluno", "aluna", "fato", "observado", "manual", "art",
]);

function normalizeFoText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getFoTextTokens(value: string) {
  return normalizeFoText(value)
    .split(" ")
    .filter((token) => token.length > 2 && !FO_TEXT_STOP_WORDS.has(token));
}

export function classifyFoText(type: FoType, text: string): FoTextClassification | null {
  const normalizedText = normalizeFoText(text);
  if (normalizedText.length < 3) return null;

  const textTokens = new Set(getFoTextTokens(text));
  let best: FoTextClassification | null = null;

  for (const definition of getFoCodesByType(type)) {
    let score = 0;
    const matchedTerms = new Set<string>();
    const code = normalizeFoText(definition.code);
    if (textTokens.has(code)) {
      score += 12;
      matchedTerms.add(definition.code);
    }

    const hintTerms = FO_TEXT_HINTS[type][definition.code] ?? [];
    for (const term of hintTerms) {
      const normalizedTerm = normalizeFoText(term);
      if (!normalizedTerm) continue;
      const termTokens = normalizedTerm.split(" ").filter(Boolean);
      const isMatched = termTokens.length > 1
        ? normalizedText.includes(normalizedTerm)
        : textTokens.has(normalizedTerm);
      if (isMatched) {
        score += termTokens.length > 1 ? 5 + termTokens.length : 4;
        matchedTerms.add(term);
      }
    }

    const labelTokens = getFoTextTokens(`${definition.label} ${definition.category}`);
    for (const token of labelTokens) {
      if (textTokens.has(token)) {
        score += 1;
        matchedTerms.add(token);
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = {
        definition,
        score,
        matchedTerms: Array.from(matchedTerms),
      };
    }
  }

  return best && best.score >= 2 ? best : null;
}

export function calculateFoNetCount(negativeCount: number, positiveCount: number) {
  return Math.max(0, negativeCount - positiveCount);
}

export function isLcEligible(negativeCount: number, positiveCount: number) {
  return calculateFoNetCount(negativeCount, positiveCount) >= FO_LC_THRESHOLD;
}
