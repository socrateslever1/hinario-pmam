import { StudyModule, section, question } from "../types";

export const risgServicosGeraisModule: StudyModule = {
  slug: "risg-servicos-gerais",
  title: "RISG - Regulamento Interno e dos Serviços Gerais",
  shortTitle: "RISG",
  description: "O guia mestre da engrenagem do Batalhão. Define o papel de cada Seção (S1, S2, S3, S4), a rotina do Quartel, as escalas de Oficiais de Dia e os ritos de manutenção e revistas.",
  sourceTitle: "Regulamento Interno e dos Serviços Gerais (Exército Brasileiro/PMAM)",
  sourceFileName: "RISG.pdf",
  textPath: "/study/texts/risg.txt",
  pages: 124,
  estimatedMinutes: 80,
  difficulty: "intensivo",
  studyMode: "regulation",
  studyUnitTarget: 513,
  questionTarget: 100,
  theme: "Vida interna, serviços, divisões e burocracia das unidades",
  objectives: [
    "Descortinar as engrenagens de um Quartel (O que é Corpo de Tropa e suas divisões).",
    "Dominar a alocação do Estado-Maior e os exatos escopos do S1 (Pessoal), S2 (Inteligência), S3 (Instrução/Operação) e S4 (Logística).",
    "Distinguir as responsabilidades do Comandante Geral em contraposição ao Subcomandante (SCmt).",
    "Estontear as diferenças entre Revistas (Efetivo/Bens rotineiros) e Inspeções (Averiguações profundas).",
    "Compreender a escala de serviço ininterrupto (Oficial de Dia, Sgt Adjunto, Corpo da Guarda) que mantém o Batalhão seguro à noite.",
  ],
  quickFacts: [
    "O RISG baseia-se na máxima militar de que a Tropa que não sabe de onde vêm as ordens ou a comida perde o controle; as seções (S1 a S4) dividem este peso.",
    "Comandante planeja e assina; o Subcomandante (SCmt) fiscaliza e executa a praça. O Chefe do Estado-Maior coordena as seções num grande Quartel General.",
    "A Revista diária foca tão somente na existência/presença ou saúde (estar lá ou faltar). Já a Inspeção foca em auditar qualidade e conformidade instrucional operacional.",
  ],
  sections: [
    section(
      "risg-vida-interna",
      "Corpos de Tropa e a Vida Interna",
      "Tudo o que se encontra do portão para dentro (aquartelamento) e as normativas para prover vida isolada ao grupo armado.",
      [
        "O regulamento estabelece as regras vitais para que os batalhões ('corpos de tropa') e unidades operacionais ou administrativas consigam subsistir sem colapsos mecânicos ou morais.",
        "Trato estrito com relatórios, engajamento nos horários de ranchos (refeições) e manutenções logísticas em armarias.",
        "Prescreve não apenas a rotina funcional diária dos indivíduos com suas folgas, mas as regras de convivência de Praças e Oficiais de modo perene e asseado.",
      ],
      "RISG, arts. 1 e Iniciais",
      "Compreendi a diferença entre operações nas viaturas e a gigantesca engrenagem chamada vida aquartelada."
    ),
    section(
      "risg-comando",
      "A Liderança do Nível Tático (O Comandante)",
      "O comandante representa o Estado, decide pautas do Batalhão, impulsionando pelo Exemplo.",
      [
        "O comando no RISG é função expressa por ato governamental ligada à qualificação (Posto do Oficial) e não se terceiriza na essência da assinatura.",
        "Compete ao Comandante orientar, unificar e fiscalizar todas as atividades com pulso moral, avaliando punições disciplinares sob sua ala.",
        "Os artigos do RISG deixam nítido que não há desculpas aceitáveis para falta de zelo do comandante para com o alojamento ou instrução da tropa em seu terreno.",
      ],
      "RISG, arts. 18, 20 e 21",
      "É o Comandante quem assina a batuta final e dita a honra militar, sendo o dono absoluto da chave no Batalhão."
    ),
    section(
      "risg-secoes",
      "Mecanismo Maior: Sub Comando e Seções S1 a S4",
      "Onde a mágica acontece. A inteligência que permite a farda limpa ir à rua bem armada e alimentada.",
      [
        "O Subcomandante (SCmt) é o 'operador e cão de guarda' do Batalhão e o principal auxiliar legal substituto do Comandante (chefe dos oficiais na subunidade).",
        "S1 (Primeira Seção): Trata da burocracia, férias, elogios, punições, justiça/disciplina e a emissão do Boletim Interno (BI). (Recursos Humanos).",
        "S2 (Segunda): Setor hermético, levanta Inteligência Policial, monitoramento, dossiês investigativos operacionais secretos ou informacionais à frente.",
        "S3 (Terceira): Mão da espada. Instrução, cronogramas de treinamento de tropas de choque e planejamento da Escala Operacional na rua afora.",
        "S4 (Quarta): Bolso e Garfo. Cuida da Intendência, munição gasta, galões de combustível, viaturas novas, pagamentos e o rancho alimentício do pelotão.",
      ],
      "RISG, arts. 22 a 32",
      "Estou afiado: S1 (RH), S2 (Inteligência/P2), S3 (Instrução Operacional) e S4 (Finanças e Material Logístico)."
    ),
    section(
      "risg-conferencias",
      "Revistas versus Inspeções: A Malha de Controle",
      "Por que ficar em forma pela manhã? Como a corporação não perde patrimônio.",
      [
        "Revista: Ação rápida temporal para certificar e verificar uma peça de engajamento diário. (Tem efetivo? Falta alguém doente? Estão com o capacete X e a Arma Y da cautela diária?).",
        "Inspeção: Rito lento, analítico e de aprofundamento. Averiguar níveis de adestramento com a arma de choque, exames formais e estado de depreciação do patrimônio no mês.",
        "Se na Revista da Manhã 'Faltam dez praças não escalados', o S1 lavra Falta. Se na Inspeção Geral as armas mostram sinais de ferrugem e travam no recuo fátuo, despacha-se relatório formal pelo mal zelo na instrução contínua e apurações rígidas.",
      ],
      "RISG, arts. 267 e 283",
      "Revista vê número/presença (bater ponto); Inspeção verifica doutrina, limpeza e viabilidade com auditoria macro."
    ),
    section(
      "risg-servicos-escala",
      "O Serviço Interno e os Oficiais de Dia",
      "Noite adentro, o Quartel tem sua hierarquia autônoma rotativa blindando-se sem o Comandante presente.",
      [
        "A segurança nos quartéis segue a escala das 24 horas ininterruptas de prontidão para manterem instalações íntegras e comunicação ilibada (Rádios Centro).",
        "Oficial de Dia (geralmente Tentes ou aspirantes): Durante seu serviço ele engloba a representação do Comandante do Batalhão, resolve as pendências de ronda de madrugada e zela pelos alojamentos e Corpo da Guarda externa.",
        "Sargento Adjunto ou Permanência atua como principal controlador braçal do recolhimento, armaria de serviço e distribuição tática na cabine principal e acessos.",
      ],
      "RISG, Disposições de Ronda e Oficial de Dia",
      "Entendi o peso tremendo de virar um Oficial de Dia: não é ser um vigia, é assinar pelo Comandante à noite."
    ),
  ],
  questions: [
    question("risg-q1", "single", "Qual a função precípua do conjunto sistemático normativo denominado RISG (Regulamento Interno e Serviços Gerais) dentro da vivência da Polícia Estadual?", "RISG, art. 1 / Base Normativa", "Vida Interna, funcionamento, escala e administração regimental das frações.", {
      options: [
        { id: "a", label: "Aumentar os salários base em épocas festivas operacionais." },
        { id: "b", label: "Elencar exclusões sumárias via Conselhos de Praças e fixar trâmites de inatividade de Coronéis com a Previdência em Tribunais estritos de aposentadoria." },
        { id: "c", label: "Prescrever o funcionamento perene relativo à vida diária nos aquartelamentos, as revistas, e toda organização de serviços gerais e manutenção mecânica e orgânica da união dos militares." },
        { id: "d", label: "Ser o diário legal usado somente nas rondas externas em vias públicas de asfalto pelo patrulhamento rodoviário com bafômetros civis abertos." },
      ],
      correctOptionIds: ["c"],
    }),
    question("risg-q2", "boolean", "O Comando de frações, sob a vigília do RISG (Art. 18 e afins), é fundamentado unicamente com base puramente no carisma popular perante eleição entre as praças modernas subordinadas num comitê civil da corporação, prescindindo irrevogavelmente do tempo de hierarquia formal do governador da PM.", "RISG, Origem e Delegação de Comando", "Falso. O RISG fundamenta o Comando como função inquestionável legal oriunda do Grau Hierárquico imposto pela lei, da Qualificação e Habilitação em comarcas oficiais. Não guarda nenhum espectro com carisma político/eleitoral.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("risg-q3", "multiple", "A responsabilidade basilar e as competências essenciais estipuladas ao Comandante de OPM/Batalhão nos textos regimentais ditam que ele deve cumprir integralmente certas atribuições e deveres diretivos focados nas chefias listadas:", "RISG, Atribuições do Comandante (Art 21)", "Supervisão e Fiscalização plena do planejamento recai no executivo mor de Comando do regimento.", {
      options: [
        { id: "a", label: "Orientar, planejar, coordenar e fiscalizar pessoalmente a execução de todos os programas na vida do estabelecimento do Corpo de Tropas." },
        { id: "b", label: "Apenas comparecer em dia de Pagamentos Contábeis assinando Termos em Branco." },
        { id: "c", label: "Zelar pelo espírito de corpo formador e o respeito à individualidade militar sem descuidar da hierarquia estrita daquela localidade sob sua ordem final." },
        { id: "d", label: "Eximir-se unida e definitivamente de opinar nos julgamentos ou avaliações operacionais (FATD) e transferir seu papel ético à seções sem vistoria." },
      ],
      correctOptionIds: ["a", "c"],
    }),
    question("risg-q4", "text", "Na esfericidade do Estado Maior, existe a seção encarregada pelas punições disciplinares, anotações de justiça restrita, preenchimento das férias anuais e aposentadorias de folha do Pessoal. Estamos falando taxativamente da Seção denominada S-... (Complete com o Número da seção).", "RISG, Organização S-1", "O S1 é o clássico 'RH' engajador legal, lidando com pessoal (P1). S-1.", {
      acceptedAnswers: ["1", "s1", "s-1"],
    }),
    question("risg-q5", "single", "A viatura da ROMU retornou inteiramente rasgada da ronda perimetral devido ao rompimento das sapatas e os fuzis falharam e precisam de lubrificação, ademais, acabou a gasolina no Batalhão na área contígua e as quentinhas (rancho local) faltaram para a guarnição nova. A seção que por competência logística irá responder e solucionar diretamente esses fluxos administrativos físicos (Recursos Mat/Fin) citados é primariamente a:", "RISG, Organização do EM e 4ª Seção", "O S-4 (Seção Quatro / P-4 em comandos generais) lida com Materiais bélicos logísticos, comida, viaturas, munições, banheiros e financeiro correlato material da caserna/quartel.", {
      options: [
        { id: "a", label: "Seção 4 (S-4)" },
        { id: "b", label: "Seção 2 (S-2)" },
        { id: "c", label: "Seção 3 (S-3)" },
        { id: "d", label: "Seção S-5 de Relações de Consumo Públicas (Procon)." },
      ],
      correctOptionIds: ["a"],
    }),
    question("risg-q6", "single", "Por regra geral das unidades e do arranjo natural militar para chefias do Estado-Maior de Corpo (Comandantes Executivos e P/s num Batalhão), qual autoridade detém na esfera macro o encargo sumário de gerir formalmente, centralizar ordens e ser o principal Chefe Executor da burocracia auxiliando imediatamente como substituto do Cmt (Comandante de fato)?", "RISG, Subcomando Estrutural (S20~S22)", "O Sub-Comandante é o grande mantenedor, ordenador executivo prático da disciplina das portas e caneta base do Comando.", {
      options: [
        { id: "a", label: "O Sargento Ajudante Geral e Secretário Operacional de Ronda." },
        { id: "b", label: "O Subcomandante (SCmt), sendo eleito pelas patentes imediatamente modernas aos chefes e principal engrenagem disciplinadora coesa da chefia imediata." },
        { id: "c", label: "O Oficial Recruta Aluno Substituto do P1, pois a gestão do efetivo se iguala a Chefia da unidade na forma liminar da constituição de pelotão da Ativa no batalhão civil de comarcas operacionais integradas." },
        { id: "d", label: "Diretoria Acadêmica e Reitoria Estudantil da Universidade Local Amazonense de convênio em vigência aberta." },
      ],
      correctOptionIds: ["b"],
    }),
    question("risg-q7", "boolean", "O Setor S-3 (Comando/Seção 3) atua e detém encargo principalizado sobre matérias de Ensino, Treinamento Tático Físico e os cronogramas/ordens de Instrução Operativa. Sendo responsabilidade sumária do S3 desenhar a doutrina e as operações diárias/anuais (escala de patrulhamento da tropa armada daquele quadrante).", "RISG, A Natureza da Seção S-3", "Verdadeiro. O S3 engasga o quartel de conhecimento estrito do fogo/polícia e prepara a máquina para ir nas ruas formalmente treinada antes da liberação final do cmt que autoriza a rua.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["true"],
    }),
    question("risg-q8", "multiple", "O Comandante-Geral planeja realizar uma 'Revista' em todas as fileiras que tomarão o serviço na base militar ao redor das 06:15 da manhã. O que exatamente constitui a definição formal estrita e limitável do RISG a respeito do conceito da Revista e os seus alvos imediatos de aferição?", "RISG, Diferença entre Revistas X Inspeção", "Revista checa rápido: existências numéricas (faltas/presenças numéricas) material na guarita, saúde no posto. Não checa qualidade interna e treinamento longo.", {
      options: [
        { id: "a", label: "Testar por escrito durante cinco horas as regras aplicativas em avaliações de todos em sala." },
        { id: "b", label: "Tirar e listar a verificação expressa do efetivo numérico de presenças (Se X de fato subiu no palanque e chegou ou faltou e a saude deles na hora)." },
        { id: "c", label: "Checar formalmente do armamento/material cautelado nas guaritas operacionais em vistoria rápida visual conferida in loco na assunção das viaturas por contigentes de homens nas escalas matinais do pátio para não fugir material ao olhar inábil." },
        { id: "d", label: "Verificar contabilidade histórica bancária sigilosa no diário da tesouraria pregressa acumulada trimestral pericial da fazenda para processos ocultos em comissões penais cíveis fechadas." },
      ],
      correctOptionIds: ["b", "c"],
    }),
    question("risg-q9", "boolean", "Diferente da Revista, o termo formal Inspeção aciona a varredura prolongada, investigativa e técnica da tropa pelo alto encargo disciplinar e logístico instrucional minucioso. Nele se aprofunda testes da manutenção do cano na máquina da arma, e atinge-se provas completas da gestão administrativa num momento rigoroso avaliativo longo que gera relatórios complexos se comparado a revista casual diária.", "RISG, Conceito da Inspeção (Art 283)", "Verdadeiro. A Inspeção no RISG é vasta. Audita, treina, testa, olha e levanta problemas profundos do agrupamento.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["true"],
    }),
    question("risg-q10", "single", "Qual posto militar escalonado por 24 horas consecutivas tem nos preceitos do Serviço de Guarnição a figura que responde pelas urgências e manutenções noturnas ou finais de plantão civis do aquartelamento caso o comando direto dos OPM's não possa intervir in loco?", "RISG, Escalas de Policiamento e Serviços Ininterruptos", "A famigerada peça das Forças Armadas inserida nas Auxiliares/Polícia: O Oficial de Dia detentor da espada do quartel in loco que interage na ponta no expediente sem parar no ciclo com todas as atribuições sumárias preservadas em sua posse na hora de aperto regimental perante a chefia sumária das guarnições da caserna e trânsitos civis afins nas madrugadas.", {
      options: [
        { id: "a", label: "Sargento do Setor de Imprensa Local Civil" },
        { id: "b", label: "Capelão Religioso Administrativo" },
        { id: "c", label: "Oficial de Dia" },
        { id: "d", label: "Sentinela de Torre Aberta ao relento de praça adjacente em postos inativos." },
      ],
      correctOptionIds: ["c"],
    }),
    question("risg-q11", "text", "Complete com a seção equivalente (Basta a siga Ex: S2, S9..). 'No desdobramento inteligente e informacional sigiloso da PMAM, a Seção dedicada à Inteligência, rastreio de alvos não publicizados operacionais complexamente infiltrados operando em monitoramento para pautar furos é a Seção de Planejamento de Inteligência _____'.", "RISG, Engrenagens Secretas", "S2 detém a base da Inteligência/P2", {
      acceptedAnswers: ["s2", "s-2", "2"],
    }),
    question("risg-q12", "single", "Se um Soldado e um Cabo encontram-se em atritos formais graves na alojamento militar, precisando lavrar partes acusatórias perante quebra do silêncio disciplinar punitiva que desagua no comando. Qual Seção (das 'S') fará primariamente o acolhimento desse ato escrito na sindicância e elaborará a sanção no BI (Boletim) regimental final após o comandante ditar a pena no processo?", "RISG, Funcionalidades do Setor", "As notas de punição (BI), FATD's e Justiça/Disciplina vão direto pro RH que digita/armazena tudo em ficha (S1).", {
      options: [
        { id: "a", label: "Seção 4 (S4)" },
        { id: "b", label: "Seção 1 (S1)" },
        { id: "c", label: "Seção 3 (S3)" },
        { id: "d", label: "Inteligência P2 Civil" },
      ],
      correctOptionIds: ["b"],
    }),
    question("risg-q13", "multiple", "Dos Serviços Gerais Ordinários das unidades de aquartelamentos constantes na literatura do regulamento sob encabeçamento da permanência na OPM: Quem mais comumente auxilia DIRETAMENTE as averiguações rondadas e distribui postos e substituições diretas no portão/Corpo de Guarda num controle incisivo e fixo na Base prestando contas de perto ao Oficial de Dia?", "RISG, Sub-Estruturas de Plantões", "O braço direito e executor pesado da base em rondas para o Oficial de Dia costuma orbitar o Adjunto, CMT da Guarda Permanente e os plantões auxiliares de praças adjacentes ininterruptamente escalados nas ordens no quadro presencial do pátio.", {
      options: [
        { id: "a", label: "Guarda-Vidas do Corpo de Bombeiros escalado estritamente por convênio do Comandante de forma provisória no lago que repassa relatórios gerais de patrulha aquática no quartel inteiro isolado do resto da unidade por força de Lei estadual florestal ambiental com recursos da FUNAI unificada por rito em águas transfronteiriças liminares exclusivas independentemente das hierarquias terrestres normais do efetivo padrão sem contato com praças de forma." },
        { id: "b", label: "O Sargento Adjunto ou Oficial Adjunto de Plantões (Dependendo da nomenclatura da tropa e OPM) das esferas diretas em serviço de prontidão perene (Auxiliar forte e constante)." },
        { id: "c", label: "O Cmt da Guarda Permanente fixa e encarregados/Cabo encarregado dos Rádios ligados internamente subordinados atestando entradas no sistema local confinado das chaves do portão no contato direto com visitantes diários controlados a fundo pela segurança da fração das rondas prementes." },
        { id: "d", label: "Vigia Civil (CLT) da Empresa de Asseio da Cozinha terceirizada." },
      ],
      correctOptionIds: ["b", "c"],
    }),
    question("risg-q14", "boolean", "O símbolo mor da unidade é a Bandeira guardada perante si. O RISG postula (art. 322 e afins) que os batalhões (Unidades Policiais detentoras de Tropa), detêm consigo, e guardam cerimoniosamente com altíssima vigilância e continência a figura inviolável da Bandeira Nacional do país servindo como bastião da Pátria.", "RISG, Simbolismo Pátrio na Unidade", "Verdadeiro. O Batalhão hospeda um pavilhão Nacional a todo custo de segurança e dignidade e seu tratamento cerimonial impera sobre a tropa estática em sala fechada no Gabinete/corredores mor sob juramento permanente do efetivo diuturno da nação livre unificada representada numa relíquia viva estática mas forte.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["true"],
    }),
    question("risg-q15", "text", "É preceituado ao SCmt fiscalizar ativamente os gastos de bens, precebimentos e distribuições de recursos dos OPMs para que fuzis e víveres (Alimentos) não desviem ritos. Ele está fiscalizando por tabela as engrenagens de almoxarifados operadas na essência braçal interna por qual Seção de 'Estado'? Seção S... (Complete com Número da área de suprimentos)", "RISG, Fiscalizações de Almoxarifados", "A Seção Materiais/Tesouraria S4/P4", {
      acceptedAnswers: ["4", "s4", "s-4", "p4"],
    }),
  ],
};
