import { StudyModule, section, question } from "../types";

export const rupmamUniformesModule: StudyModule = {
  slug: "rupmam-uniformes",
  title: "RUPMAM - Regulamento de Uniformes da PMAM",
  shortTitle: "RUPMAM",
  description: "Estudo detalhado sobre o simbolismo do uniforme da PMAM, sua rigorosa composição, regras de uso, vedações e a hierarquia lida através de insígnias e distintivos.",
  sourceTitle: "Regulamento de Uniformes da Polícia Militar do Amazonas",
  sourceFileName: "RUPMAM.pdf",
  textPath: "/study/texts/rupmam.txt",
  pages: 45,
  estimatedMinutes: 65,
  difficulty: "base",
  studyMode: "regulation",
  studyUnitTarget: 48,
  questionTarget: 100,
  theme: "Apresentação e padrão visual da corporação",
  objectives: [
    "Compreender o peso institucional do uniforme como emanação de autoridade e segurança.",
    "Categorizar os uniformes pelas classes: Gala, Formais, Passeio e Operacionais.",
    "Fixar de modo incontestável as proibições sobre descaracterização, mistura de peças e uso civil.",
    "Dominar a leitura hierárquica rápida decorrente das insígnias, divisas e distintivos básicos.",
    "Entender a competência reguladora da CPU (Comissão Permanente de Uniformes).",
  ],
  quickFacts: [
    "O uso do uniforme é prerrogativa do militar para o exercício de sua função; não é traje social para atividades alheias ao serviço.",
    "Proíbe-se peremptoriamente o uso de peças do uniforme em protestos, eventos político-partidários ou por seguranças privados.",
    "A modificação estética 'autoral' de uma peça fardamento constitui transgressão pela perda da identidade institucional.",
  ],
  sections: [
    section(
      "rupmam-base",
      "Fundamentos: Finalidade e Simbolismo",
      "O RUPMAM não trata apenas de roupas, mas da imagem do Estado materializada no policial militar.",
      [
        "O regulamento estabelece a posse, a composição e as regras inegociáveis de uso dos uniformes e acessórios.",
        "O art. 2 assenta o fundamento filosófico: o uniforme é o símbolo da autoridade local e a identidade visual imediata da corporação perante o cidadão.",
        "O porte do uniforme confere ostensividade, exigindo do militar padrão elevadíssimo de correção e disciplina para honrar a instituição.",
      ],
      "RUPMAM, arts. 1 e 2",
      "Entendi o nível de simbolismo: o militar não 'veste' uma farda, ele se reveste da autoridade pública."
    ),
    section(
      "rupmam-conduta",
      "Obrigação de Zelo e Regras de Apresentação",
      "A impecabilidade pessoal não é vaidade, mas sim exigência normativa de demonstração de asseio militar.",
      [
        "O militar necessita portar a farda abotoada, assepticamente limpa e alinhada às normativas completas do regulamento.",
        "A aparência (corte de cabelo, barba, adornos como brincos ou adereços corporais visíveis) é adstrita às réguas do regulamento, que restringe individualidades que subvertam o padrão coletivo.",
        "A desatenção ao zelo diário constitui falta e expõe a Corporação ao descrédito público.",
      ],
      "RUPMAM, art. 3",
      "Compreendi que a minha aparência física complementa e é parte inseparável da correta ostensividade visual."
    ),
    section(
      "rupmam-proibicoes",
      "Proibições Graves (Descaracterização e Uso Indevido)",
      "Proteção da patente do fardamento contra o uso mercenário, político ou despadronizado.",
      [
        "É absolutamente defeso o uso da farda em atividades civis privadas, como seguranças particulares (bicos) ou de eventos comemorativos alheios à corporação.",
        "A adição de broches, laços ou itens não previstos institucionalmente na tábua do RUPMAM constitui descaracterização grave (mistura de peça civil).",
        "É terminantemente proibido comparecer fardado a reuniões ou passeatas de natureza político-partidária.",
      ],
      "RUPMAM, arts. 5 a 8",
      "Gravei a proibição sobre o uso do fardamento em campanhas eleitorais e na segurança paralela."
    ),
    section(
      "rupmam-classificacao",
      "Categorias e Classificação dos Uniformes",
      "Domínio sobre o guarda-roupa normativo. A PM tem trajes que vão do máximo rigor cerimonial ao máximo conforto tático.",
      [
        "Uniformes de Gala: Restritos a bailes, posses governamentais extremas e formaturas de altíssimo garbo.",
        "Uniformes Formais e de Passeio: Para o trânsito do oficial em cerimônias diárias ou representações administrativas.",
        "Uniformes Operacionais (Instrução e Serviço): Construídos especificamente com tecido resistente, voltados à proteção e operacionalidade, como patrulhamentos de rotina e atividades de choque.",
      ],
      "RUPMAM, art. 15",
      "Domino a pirâmide dos uniformes, desde o operacional rústico até a Gala."
    ),
    section(
      "rupmam-insignias",
      "Insígnias, Divisas e Distintivos",
      "Formas visuais de identificar postos, condecorações ou especializações na altura dos braços e do peito.",
      [
        "As insígnias (Oficiais) e as divisas (Praças) sinalizam instantaneamente a escala hierárquica e exigem continência.",
        "Distintivos incluem o reconhecimento de patrulhas específicas, Brasão da PMAM (normalmente lado esquerdo ou direito fixado), e identificação nominal do portador.",
        "Colocação de bordados de cursos clandestinos ou patentes forjadas é considerada ofensa direta à verdade e ao mérito.",
      ],
      "RUPMAM, arts. 19 e 22",
      "Sei que qualquer escudo pregado no peito responde a um ato normativo e deve representar a patente ou curso oficial."
    ),
    section(
      "rupmam-administrativo",
      "A Comissão Permanente de Uniformes (CPU)",
      "O guardião do RUPMAM. A regra de alteração dos uniformes não é livre nem obedece a 'vontades de momento'.",
      [
        "A CPU (Comissão Permanente de Uniformes) é o colegiado técnico designado para avaliar criações, extinções ou melhorias tecnológicas nos tecidos e peças.",
        "Qualquer alteração sugerida deve tramitar administrativamente pela CPU, passar pro Comandante-Geral e virar legislação estendida.",
        "Evita-se que OPMs locais (Batalhões) inventem cores, boinas ou camuflagens sem aval técnico ou coesão institucional.",
      ],
      "RUPMAM, art. 33",
      "Entendi o papel da CPU para blindar a PM contra invenções despadronizadas na roupa."
    ),
  ],
  questions: [
    question("rupmam-q1", "single", "A fundamentação primordial para a formulação do RUPMAM (Art. 2) reside no fato normativo de que o fardamento representa e simboliza para a sociedade e seus integrantes a noção imediata de:", "RUPMAM, art. 2", "O uniforme representa a força e o império da Lei detidos nas mãos do Oficial representando o Estado.", {
      options: [
        { id: "a", label: "Afinidade de grupo e estética cultural" },
        { id: "b", label: "Equiparação paramilitar regional" },
        { id: "c", label: "Simbolismo da Autoridade Pública e Identidade corporativa" },
        { id: "d", label: "Proteção balística e de camuflagem puramente tática" },
      ],
      correctOptionIds: ["c"],
    }),
    question("rupmam-q2", "boolean", "O uso de qualquer equipamento civil por cima do fardamento, para proteção contra mau tempo (como agasalhos ou jaquetas civis na cor preta/azul), é permitido, face à primazia da saúde do Militar e o desgaste da guarnição.", "RUPMAM, Uso/Descaracterização", "Falso. O RUPMAM determina uso exclusivo de abrigos, ponchos ou mantas regulamentares já previstas na lista de vestes do regulamento, havendo proibição da inserção de vestes civis sobre a farda.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rupmam-q3", "single", "Existem ambientes explícitos e situações proibitivas no RUPMAM onde o militar ativo está VEDADO e arrolado à transgressão se comparecer uniformizado (exceto se escalado em serviço). Qual situação é um claro exemplo disso?", "RUPMAM, art. 5 a 8", "Partidos e manifestações engatadas por vieses de cunho meramente de agenda não-pública desautorizam qualquer uso político da farda Estadual.", {
      options: [
        { id: "a", label: "Missas, cultos ecumênicos e casamentos da ala de assistência militar." },
        { id: "b", label: "Reuniões e manifestações público-partidárias em praças centrais." },
        { id: "c", label: "Velórios e Exéquias Militares de honras póstumas." },
        { id: "d", label: "Escolas públicas durante rondas do PROERD." },
      ],
      correctOptionIds: ["b"],
    }),
    question("rupmam-q4", "multiple", "Quanto ao zelo estrutural (art. 3) da apresentação, um policial em inspeção deve estar perfeitamente adequado. De quem é a obrigação legal e expressa em observar a estrita manutenção, o asseio, o vinco (se pertinente) da peça e dos botões?", "RUPMAM, Deveres de manutenção", "Cada indivíduo recebe a responsabilidade civil do adorno com exaltação dos laços éticos formados. Ele é e deve responder sozinho.", {
      options: [
        { id: "a", label: "Obrigação irrestrita do Almoxarifado em recolher anualmente e vincar peças." },
        { id: "b", label: "Compete ao próprio militar o zelo de todas as peças conferidas a ele ou de sua posse." },
        { id: "c", label: "Toda responsabilidade em paradas será transferida para o Comandante da Fração respectiva." },
        { id: "d", label: "Do usuário, que não poderá subverter as peças alterando lhes as características fabris primárias." },
      ],
      correctOptionIds: ["b", "d"],
    }),
    question("rupmam-q5", "single", "Ao se referenciar às peças comemorativas e de rigor máximo usadas para representar envergadura, em posses oficiais e jantares, o RUPMAM elenca as de formato 'smoking' ou túnicas elaboradas. Esse patamar é classicamente batizado de:", "RUPMAM, Classificação", "A classificação 'Gala' compreende os uniformes do mais seleto rigorismo social e representativo.", {
      options: [
        { id: "a", label: "Uniformes de Campanha Especiais" },
        { id: "b", label: "Uniformes de Trânsito Administrativos" },
        { id: "c", label: "Uniformes de Gala" },
        { id: "d", label: "Uniformes Policiais Formais Diários" },
      ],
      correctOptionIds: ["c"],
    }),
    question("rupmam-q6", "boolean", "O coturno, o cinto de guarnição (talabarte) ou calças táticas RipStop embutidas no coturno são componentes inerentes à classificação dos uniformes tipo Passeio, destinados para visitações aos fóruns locais.", "RUPMAM, Natureza Operacional e Passeio", "Falso. Coturno (Bota) e calças rip-stop compõem as vestes Operacionais/Instrução. Em Passeio, majoritariamente vemos calçados de verniz/civil/militares finos ou sapatos apropriados, para despachos sociais ou funções burocráticas.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rupmam-q7", "multiple", "A identificação das praças (como sargentos e cabos) nos uniformes operacionais da PMAM normalmente assenta-se no reconhecimento de quais tipos de identificadores visuais?", "RUPMAM, Insígnias e Letras", "Para as praças utilizam-se classicamente Divisas montadas no ombro/manga e as insígnias do quadro a que o militar obedece.", {
      options: [
        { id: "a", label: "Identificadores puramente com estrelas e barretas forjadas a ouro no peito exclusivas." },
        { id: "b", label: "Divisas nos ombros, punhos ou golas, marcadas com a espessura/quantidade condizente à patente." },
        { id: "c", label: "Brasões ou platinas (em alguns trajes) apontados com o design das barras." },
        { id: "d", label: "Crachás eletrônicos com QrCode sendo a única fonte oficial visível reconhecida hoje." },
      ],
      correctOptionIds: ["b", "c"],
    }),
    question("rupmam-q8", "text", "Caso surja uma nova demanda, como um tecido tecnológico anti-chama ou alteração de escudo orgânico do COTAM na PMAM, a tramitação das alterações das regras vestimentares dependerá do estudo técnico colegiado de qual órgão permanente criado pelo RUPMAM (Digite a Sigla)?", "RUPMAM, art. 33", "Comissão Permanente de Uniformes - CPU", {
      acceptedAnswers: ["cpu"],
    }),
    question("rupmam-q9", "single", "A regra que versa sobre 'conceder permissão' a civis não pertencentes as fileiras para usarem peças da PMAM em campanhas de marketing publicitário e encenações diz o quê?", "RUPMAM, Proibições ao Civil", "O uso civil por atores em novelas, peças teatrais ou propagandas exige expressa e direta autorização do Comando ou instituição para resguardar as marcas da PM.", {
      options: [
        { id: "a", label: "É completamente vedado (sob pena criminal) mesmo em encenações de televisão (crime imediato em 100% dos cenários corporativos)." },
        { id: "b", label: "Pode ser feito mediante contrato com a prefeitura, sem análise da corporação." },
        { id: "c", label: "Depende de autorização expressa do escalão competente para assegurar zelos e prevenir a difamação." },
        { id: "d", label: "Basta comprar nas lojas abertas (sem chancela) pois a farda não possui direitos legais protegidos." },
      ],
      correctOptionIds: ["c"],
    }),
    question("rupmam-q10", "boolean", "O RUPMAM afirma categoricamente que, com relação aos inativos e a oficiais já na reserva remunerada/reforma, estes perdem de forma vitalícia e extintiva a habilidade e as condições cerimoniais do vestimento fardado, independente do evento estadual.", "RUPMAM, Uso por Inativos", "Falso. O Militar na Inatividade pode ser expressamente autorizado a usar para as cerimônias de valor Pátrio, e para se casar, com a restrição de que se abstenha de agir operacionalmente na rotina civil de rua.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rupmam-q11", "single", "A identificação institucional é completada pelos Distintivos presentes na vestimenta. O distanciamento geográfico do estado traz obrigação primária regulamentar pelo uso de que símbolo identitário basilar (geralmente fixado na manga ou peito operacional do Policial) que demarca para qual federação o soldado jura?", "RUPMAM, Cursos e Orgânicos", "A Bandeira e o respectivo Brasão da Policia Estadual ou o Brasão do Braço da federação Amazonense (A Bandeira do Estado do Amazonas).", {
      options: [
        { id: "a", label: "Bandeira do Estado do Amazonas." },
        { id: "b", label: "Bandeira das Forças Armadas da Marinha do Brasil." },
        { id: "c", label: "Selo holográfico emitido pelo Ministério da Educação." },
        { id: "d", label: "A tarja rubro-negra e um pin de arma cruzada impessoal e secreto." },
      ],
      correctOptionIds: ["a"],
    }),
    question("rupmam-q12", "multiple", "O policial que atua com o seu Crachá ou Tarja Nominal ocultos, ou ausentes em fardamentos de fiscalização e guarnição (que o obriguem a portar nominal), incorre numa lacuna que desabona:", "RUPMAM, Transparência", "A plaqueta de identificação cumpre o ditame da publicidade dos atos administrativos e prestabilidade funcional do serviço do policial.", {
      options: [
        { id: "a", label: "A proteção do RUPMAM pela preservação do anonimato frente ao estado." },
        { id: "b", label: "A impessoalidade e legalidade institucional que impõe o agente ostensivo a se mostrar reconhecível." },
        { id: "c", label: "A responsabilidade disciplinar, cometendo desvio técnico de vestimenta normatizado." },
        { id: "d", label: "Apenas um preciosismo estético, sem repercussões caso exista o uso da Balaclava autorizada." },
      ],
      correctOptionIds: ["b", "c"],
    }),
    question("rupmam-q13", "boolean", "O policial militar pode sobrepor adereços pessoais de extrema vivência religiosa (como cruzes avantajadas que sobrepõem os abotoamentos) nos locais e uniformes previstos pelo RUPMAM invocando proteção à imunidade religiosa.", "RUPMAM, Adereços Individuais", "Falso. O fardamento militar prega neutralidade universal pelo princípio do Estado. Itens como cordões só podem ser usados se ocultados pela gola de maneira asseada/invisível para não se tornarem elementos externos e de subversão institucional.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rupmam-q14", "text", "Complete com a palavra faltante, sabendo do simbolismo máximo militar: O _______ é o símbolo da autoridade e representa de forma cabal a corporação amazonense.", "RUPMAM, Art. 2", "A vestimenta completa.", {
      acceptedAnswers: ["uniforme", "uniformes", "fardamento", "farda"],
    }),
    question("rupmam-q15", "single", "Nos raros casos de trânsito em território internacional do Militar da PMAM acompanhando comitiva Estadual (Viagens ao Estrangeiro com anuência Governamental), o uso dos uniformes da Força segue que vertente, geralmente referenciada nos regulamentos?", "RUPMAM, Uso no Exterior", "Somente nos trâmites atestados, solenes ou de ensino devidamente diplomados por autorização de Gabinete/Governo do país emissor e receptor, via liberação do escalão correspondente.", {
      options: [
        { id: "a", label: "Proibição irremediável, não há trâmites estrangeiros para PM's fora do domínio geográfico brasileiro nunca." },
        { id: "b", label: "Poderá ser autorizado conforme exigência de protocolos em missões de natureza solene ou representativa das forças pátrias." },
        { id: "c", label: "Uso obrigatório ininterrupto, mesmo em passeios em ruas alheias ao exterior, para gerar atrativo." },
        { id: "d", label: "Condicionado sempre e tão somente a um crachá passaporte e a troca pura e simples de camisa civil polo e boné neutro no período formal." },
      ],
      correctOptionIds: ["b"],
    }),
  ],
};
