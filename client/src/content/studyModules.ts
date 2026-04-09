export type StudySection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
  reference: string;
  checkpoint: string;
};

export type StudyQuestion = {
  id: string;
  type: "single" | "multiple" | "boolean" | "text";
  prompt: string;
  reference: string;
  explanation: string;
  options?: Array<{ id: string; label: string }>;
  correctOptionIds?: string[];
  acceptedAnswers?: string[];
};

export type StudyModule = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  sourceTitle: string;
  sourceFileName: string;
  textPath: string;
  pages: number;
  estimatedMinutes: number;
  difficulty: "base" | "intermediario" | "intensivo";
  theme: string;
  objectives: string[];
  quickFacts: string[];
  sections: StudySection[];
  questions: StudyQuestion[];
  studyMode: "manual" | "regulation";
  studyUnitTarget?: number;
  questionTarget?: number;
};

const section = (
  id: string,
  title: string,
  summary: string,
  bullets: string[],
  reference: string,
  checkpoint: string
): StudySection => ({ id, title, summary, bullets, reference, checkpoint });

const question = (
  id: string,
  type: StudyQuestion["type"],
  prompt: string,
  reference: string,
  explanation: string,
  extras: Partial<StudyQuestion> = {}
): StudyQuestion => ({ id, type, prompt, reference, explanation, ...extras });

export const studyModules: StudyModule[] = [
  {
    slug: "manual-cfap",
    title: "Manual do Aluno do CFAP",
    shortTitle: "Manual do CFAP",
    description: "Guia de ambientacao, estrutura, disciplina e rotina escolar do aluno do CFAP.",
    sourceTitle: "Manual do Aluno do Centro de Formacao e Aperfeicoamento de Pracas",
    sourceFileName: "manualdoaluno_2023_03_14_10_23_18 (2).pdf",
    textPath: "/study/texts/manual-do-aluno.txt",
    pages: 53,
    estimatedMinutes: 45,
    difficulty: "base",
    studyMode: "manual",
    studyUnitTarget: 34,
    questionTarget: 100,
    theme: "Fundamentos da vida escolar militar",
    objectives: [
      "Entender a finalidade do manual e a missao do CFAP.",
      "Reconhecer a estrutura administrativa e os regulamentos mais cobrados.",
      "Revisar disciplina, frequencia e comportamento do discente.",
    ],
    quickFacts: [
      "O manual organiza direitos, deveres e proibicoes do aluno.",
      "Cita RISG, R-2, RCONT, RDPMAM e outros regulamentos do cotidiano.",
      "Conecta rotina escolar, frequencia e defesa disciplinar.",
    ],
    sections: [
      section(
        "manual-finalidade",
        "Finalidade e identidade institucional",
        "O manual padroniza a conduta do aluno e apresenta missao, visao, principios e valores do CFAP.",
        [
          "A introducao apresenta o CFAP como unidade de ensino voltada a formar e aperfeicoar profissionais de seguranca publica.",
          "A finalidade inclui padronizar a conduta e orientar as atividades do curso.",
          "O texto destaca missao, visao e principios como base da postura esperada do aluno.",
        ],
        "Manual do Aluno, p. 5-6",
        "Entendi por que o manual existe e qual clima institucional ele quer fixar."
      ),
      section(
        "manual-estrutura",
        "Estrutura do CFAP e regulamentos",
        "A vida escolar depende de saber onde cada funcao se encaixa e quais regulamentos dirigem a rotina.",
        [
          "A estrutura funcional menciona comando, subcomando, secao de justica e disciplina e diretoria de ensino e instrucao.",
          "Na divisao administrativa aparecem P/1, P/3, P/4, P/5 e PCSV.",
          "Entre os regulamentos listados estao RISG, R-2, RCONT, RDPMAM, NGA e manuais de ordem unida e TFM.",
        ],
        "Manual do Aluno, p. 10",
        "Consigo localizar o CFAP e listar os regulamentos que guiam o dia a dia."
      ),
      section(
        "manual-conduta",
        "Direitos, deveres e disciplina",
        "O documento separa a conduta do discente em direitos, deveres, proibicoes, frequencia e comportamento.",
        [
          "O indice organiza direitos, deveres e proibicoes como eixos proprios da orientacao ao aluno.",
          "A rotina escolar se ancora em hierarquia, disciplina, apresentacao e continencia.",
          "As secoes de frequencia, comportamento e defesa mostram que rendimento e disciplina caminham juntos.",
        ],
        "Manual do Aluno, p. 11-26",
        "Revisei o eixo central da vida escolar: rotina, disciplina e consequencias."
      ),
    ],
    questions: [
      question("manual-q1", "single", "Qual e a finalidade central do Manual do Aluno do CFAP?", "Manual do Aluno, p. 6", "O texto afirma que o manual padroniza a conduta dos alunos e orienta as atividades do curso.", {
        options: [
          { id: "a", label: "Padronizar a conduta dos alunos e orientar a ambientacao no curso" },
          { id: "b", label: "Substituir todos os regulamentos da PMAM" },
          { id: "c", label: "Regular apenas a escala de servico" },
          { id: "d", label: "Tratar somente da historia da corporacao" },
        ],
        correctOptionIds: ["a"],
      }),
      question("manual-q2", "multiple", "Quais principios aparecem na introducao do manual?", "Manual do Aluno, p. 5", "A introducao destaca Hierarquia, Disciplina e Eficacia como principios.", {
        options: [
          { id: "a", label: "Hierarquia" },
          { id: "b", label: "Disciplina" },
          { id: "c", label: "Eficacia" },
          { id: "d", label: "Improviso" },
        ],
        correctOptionIds: ["a", "b", "c"],
      }),
      question("manual-q3", "single", "Qual regulamento aparece listado para a vida interna e os servicos gerais?", "Manual do Aluno, p. 10", "O manual cita o RISG como Regulamento Interno e dos Servicos Gerais.", {
        options: [
          { id: "a", label: "RISG" },
          { id: "b", label: "Codigo Civil" },
          { id: "c", label: "Lei de Licitacoes" },
          { id: "d", label: "CLT" },
        ],
        correctOptionIds: ["a"],
      }),
      question("manual-q4", "text", "Digite a sigla correta de Centro de Formacao e Aperfeicoamento de Pracas.", "Manual do Aluno, capa e p. 1", "A sigla usada em todo o documento e CFAP.", {
        acceptedAnswers: ["cfap"],
      }),
    ],
  },
  {
    slug: "estatuto-pmam",
    title: "Estatuto dos Policiais Militares do Amazonas",
    shortTitle: "Estatuto PMAM",
    description: "Base legal sobre situacao funcional, hierarquia, disciplina, cargo e funcao policial militar.",
    sourceTitle: "Estatuto dos Policiais Militares do Estado do Amazonas",
    sourceFileName: "Estatuto-dos-Policiais-Militares_260408_204357.pdf",
    textPath: "/study/texts/estatuto-policiais-militares.txt",
    pages: 51,
    estimatedMinutes: 55,
    difficulty: "intensivo",
    studyMode: "regulation",
    studyUnitTarget: 497,
    questionTarget: 100,
    theme: "Base legal da carreira policial militar",
    objectives: [
      "Entender o alcance juridico do Estatuto.",
      "Fixar subordinacao institucional, ingresso e estrutura hierarquica.",
      "Revisar cargo, funcao, deveres e consequencias da violacao disciplinar.",
    ],
    quickFacts: [
      "O Estatuto regula situacao, obrigacoes, deveres, direitos e prerrogativas.",
      "A PMAM se subordina ao Governador e operacionalmente a SSP.",
      "Hierarquia e disciplina sao a base institucional da corporacao.",
    ],
    sections: [
      section(
        "estatuto-base",
        "Base institucional da PMAM",
        "Os primeiros artigos delimitam o alcance do Estatuto e a posicao institucional da PMAM.",
        [
          "O art. 1 regula situacao, obrigacoes, deveres, direitos e prerrogativas dos policiais militares.",
          "O art. 2 coloca a PMAM sob subordinacao ao Governador e operacionalmente a SSP.",
          "O mesmo artigo reforca a PMAM como forca auxiliar, reserva do Exercito.",
        ],
        "Estatuto, arts. 1 e 2",
        "Entendi o papel institucional da PMAM e a funcao do Estatuto."
      ),
      section(
        "estatuto-ingresso",
        "Ingresso, hierarquia e precedencia",
        "Ingresso e carreira se organizam sobre hierarquia, disciplina e antiguidade.",
        [
          "O art. 10 trata do ingresso por inclusao, matricula ou nomeacao, observadas as condicoes legais.",
          "O art. 12 afirma expressamente que hierarquia e disciplina sao a base institucional.",
          "Os artigos seguintes tratam de circulos hierarquicos e precedencia funcional.",
        ],
        "Estatuto, arts. 10 a 16",
        "Revi a ligacao entre ingresso, hierarquia e precedencia."
      ),
      section(
        "estatuto-cargo",
        "Cargo, funcao e deveres",
        "O Estatuto diferencia cargo e funcao policial militar e conecta deveres a responsabilidade disciplinar.",
        [
          "O art. 19 define cargo policial militar como aquele exercivel por policial militar em servico ativo.",
          "O art. 22 define funcao policial militar como exercicio das atribuicoes inerentes ao cargo.",
          "O art. 40 diz que a violacao das obrigacoes ou deveres pode constituir crime ou transgressao disciplinar.",
        ],
        "Estatuto, arts. 19, 22 e 40",
        "Fixei a diferenca entre cargo, funcao e dever disciplinar."
      ),
    ],
    questions: [
      question("estatuto-q1", "single", "O art. 1 do Estatuto regula principalmente:", "Estatuto, art. 1", "O art. 1 apresenta o Estatuto como norma que regula situacao, obrigacoes, deveres, direitos e prerrogativas.", {
        options: [
          { id: "a", label: "Somente os uniformes da corporacao" },
          { id: "b", label: "Situacao, obrigacoes, deveres, direitos e prerrogativas dos policiais militares" },
          { id: "c", label: "Somente os procedimentos de formatura" },
          { id: "d", label: "Apenas o uso da Bandeira Nacional" },
        ],
        correctOptionIds: ["b"],
      }),
      question("estatuto-q2", "single", "Segundo o art. 2, a PMAM se subordina diretamente a quem?", "Estatuto, art. 2", "O artigo informa subordinacao ao Governador do Estado e subordinacao operacional a SSP.", {
        options: [
          { id: "a", label: "Ao Governador do Estado" },
          { id: "b", label: "Ao Presidente da Republica" },
          { id: "c", label: "Ao Congresso Nacional" },
          { id: "d", label: "Ao Tribunal de Justica" },
        ],
        correctOptionIds: ["a"],
      }),
      question("estatuto-q3", "boolean", "Hierarquia e disciplina sao a base institucional da Policia Militar.", "Estatuto, art. 12", "Essa afirmacao aparece expressamente no art. 12 do Estatuto.", {
        options: [
          { id: "true", label: "Verdadeiro" },
          { id: "false", label: "Falso" },
        ],
        correctOptionIds: ["true"],
      }),
      question("estatuto-q4", "single", "O art. 22 define funcao policial militar como:", "Estatuto, art. 22", "O artigo define funcao policial militar como exercicio das atribuicoes inerentes ao cargo policial militar.", {
        options: [
          { id: "a", label: "Atividade eventual sem relacao com cargo" },
          { id: "b", label: "Exercicio das atribuicoes inerentes ao cargo policial militar" },
          { id: "c", label: "Qualquer atividade civil exercida por policial militar" },
          { id: "d", label: "Exercicio exclusivo da atividade de ensino" },
        ],
        correctOptionIds: ["b"],
      }),
    ],
  },
  {
    slug: "rupmam-uniformes",
    title: "RUPMAM - Regulamento de Uniformes da PMAM",
    shortTitle: "RUPMAM",
    description: "Estudo sobre simbolismo do uniforme, composicao, uso, proibicoes, insignias e distintivos.",
    sourceTitle: "Regulamento de Uniformes da Policia Militar do Amazonas",
    sourceFileName: "RUPMAM.pdf",
    textPath: "/study/texts/rupmam.txt",
    pages: 45,
    estimatedMinutes: 35,
    difficulty: "base",
    studyMode: "regulation",
    studyUnitTarget: 48,
    questionTarget: 100,
    theme: "Apresentacao e padrao visual da corporacao",
    objectives: [
      "Compreender o valor institucional do uniforme.",
      "Revisar regras de uso, posse e classificacao.",
      "Fixar proibicoes, insignias e distintivos essenciais.",
    ],
    quickFacts: [
      "O uniforme simboliza autoridade e representa a corporacao.",
      "Alterar caracteristicas do uniforme e vedado.",
      "O regulamento trata de classificacao, insignias, divisas e distintivos.",
    ],
    sections: [
      section(
        "rupmam-base",
        "Finalidade e simbolismo do uniforme",
        "O RUPMAM organiza autoridade, imagem institucional e espirito de corpo.",
        [
          "O art. 1 regula composicao, uso, posse e confeccao dos uniformes da PMAM.",
          "O art. 2 afirma que o uniforme simboliza a autoridade e representa a corporacao.",
          "O uso correto e tratado como elemento de disciplina e boa apresentacao coletiva.",
        ],
        "RUPMAM, arts. 1 e 2",
        "Entendi por que o uniforme e tratado como expressao de autoridade."
      ),
      section(
        "rupmam-conduta",
        "Zelo, apresentacao e proibicoes",
        "O militar deve cuidar do uniforme e evitar qualquer descaracterizacao do padrao institucional.",
        [
          "O art. 3 determina zelo com uniformes, insignias, distintivos e apresentacao em qualquer ocasiao.",
          "O art. 5 proibe alterar caracteristicas do uniforme ou usar pecas nao previstas.",
          "Essas regras reforcam padronizacao visual e disciplina coletiva.",
        ],
        "RUPMAM, arts. 3 e 5",
        "Revisei o dever de zelo e a proibicao de descaracterizacao do uniforme."
      ),
      section(
        "rupmam-classificacao",
        "Classificacao e sinais visuais",
        "A classificacao correta evita improvisos e ajuda a ler hierarquia e pertencimento na tropa.",
        [
          "O art. 15 inicia a classificacao com uniformes de gala, formais e de passeio.",
          "O art. 19 vincula postos e graduacoes a suas correspondentes insignias e divisas.",
          "O art. 22 lista distintivos como Bandeira do Estado do Amazonas e Brasao da PMAM.",
        ],
        "RUPMAM, arts. 15, 19 e 22",
        "Consigo ligar classificacao, hierarquia visual e distintivos basicos."
      ),
    ],
    questions: [
      question("rupmam-q1", "single", "Segundo o art. 2 do RUPMAM, o uniforme:", "RUPMAM, art. 2", "O regulamento afirma que o uniforme simboliza a autoridade e representa a corporacao.", {
        options: [
          { id: "a", label: "E apenas um item estetico opcional" },
          { id: "b", label: "Simboliza a autoridade e representa a corporacao" },
          { id: "c", label: "Serve apenas para atos sociais" },
          { id: "d", label: "Pode ser adaptado livremente" },
        ],
        correctOptionIds: ["b"],
      }),
      question("rupmam-q2", "boolean", "Constitui obrigacao do militar zelar por seus uniformes, insignias e distintivos.", "RUPMAM, art. 3", "O art. 3 traz esse dever de zelo de forma expressa.", {
        options: [
          { id: "true", label: "Verdadeiro" },
          { id: "false", label: "Falso" },
        ],
        correctOptionIds: ["true"],
      }),
      question("rupmam-q3", "multiple", "Quais categorias aparecem no inicio da classificacao dos uniformes?", "RUPMAM, art. 15", "O art. 15 inicia a classificacao com gala, formais e passeio.", {
        options: [
          { id: "a", label: "Gala" },
          { id: "b", label: "Formais" },
          { id: "c", label: "Passeio" },
          { id: "d", label: "Camuflagem naval" },
        ],
        correctOptionIds: ["a", "b", "c"],
      }),
      question("rupmam-q4", "text", "Digite a sigla da Comissao Permanente de Uniformes mencionada no regulamento.", "RUPMAM, art. 33", "A comissao e identificada pela sigla CPU.", {
        acceptedAnswers: ["cpu"],
      }),
    ],
  },
  {
    slug: "rcont-continencias",
    title: "RCONT - Continencias, Honras e Cerimonial",
    shortTitle: "RCONT",
    description: "Modulo sobre sinais de respeito, continencia individual, Hino Nacional e cerimonial da Bandeira.",
    sourceTitle: "Regulamento de Continencias, Honras, Sinais de Respeito e Cerimonial Militar",
    sourceFileName: "RCONT.pdf",
    textPath: "/study/texts/rcont.txt",
    pages: 41,
    estimatedMinutes: 40,
    difficulty: "intermediario",
    studyMode: "regulation",
    studyUnitTarget: 37,
    questionTarget: 100,
    theme: "Respeito, precedencia e cerimonial militar",
    objectives: [
      "Entender a finalidade do RCONT e a logica da precedencia.",
      "Fixar a execucao basica da continencia individual.",
      "Revisar regras especiais para Hino Nacional, Bandeira e recrutas.",
    ],
    quickFacts: [
      "A continencia e impessoal e visa a autoridade, nao a pessoa.",
      "Todo militar deve retribuir a continencia recebida.",
      "O regulamento descreve Bandeira, Hino, desfile e cerimonial.",
    ],
    sections: [
      section(
        "rcont-base",
        "Finalidade e sinais de respeito",
        "O RCONT organiza honras, continencias e normas de apresentacao entre simbolos nacionais e autoridades.",
        [
          "O regulamento estabelece honras, continencias e sinais de respeito prestados por militares.",
          "Tambem regula apresentacao, procedimento e precedencia entre militares.",
          "Ele liga o gesto exterior da continencia a disciplina, respeito e hierarquia.",
        ],
        "RCONT, finalidade e arts. iniciais",
        "Entendi o alcance do RCONT dentro da vida militar."
      ),
      section(
        "rcont-continencia",
        "Continencia individual",
        "A continencia individual e uma saudacao regulada por atitude, gesto e duracao.",
        [
          "O art. 14 define a continencia como saudacao prestada pelo militar, individual ou da tropa.",
          "A continencia e impessoal e parte do militar de menor precedencia hierarquica.",
          "Os arts. 18 a 23 detalham procedimento normal, inclusive em deslocamento e com armas.",
        ],
        "RCONT, arts. 14 e 18 a 23",
        "Revisei quem inicia, quem responde e como o gesto muda conforme a situacao."
      ),
      section(
        "rcont-hino-bandeira",
        "Hino Nacional, Bandeira e cerimonial",
        "O regulamento da tratamento especial aos simbolos nacionais e ao processo de apresentacao aos recrutas.",
        [
          "O art. 24 manda fazer alto para a continencia a Bandeira Nacional, ao Hino Nacional e ao Presidente da Republica.",
          "Quando o Hino e cantado, o militar nao faz continencia, permanecendo em Sentido ate o fim da execucao.",
          "Os arts. 165 a 169 tratam da incorporacao da Bandeira e da apresentacao aos recrutas.",
        ],
        "RCONT, arts. 24 a 26 e 165 a 169",
        "Fixei o tratamento especial do Hino Nacional e da Bandeira."
      ),
    ],
    questions: [
      question("rcont-q1", "boolean", "A continencia e impessoal e visa a autoridade, nao a pessoa.", "RCONT, art. 14", "O art. 14 traz essa formula de forma literal.", {
        options: [
          { id: "true", label: "Verdadeiro" },
          { id: "false", label: "Falso" },
        ],
        correctOptionIds: ["true"],
      }),
      question("rcont-q2", "single", "De quem parte a continencia, segundo a regra geral?", "RCONT, art. 14", "A continencia parte sempre do militar de menor precedencia hierarquica.", {
        options: [
          { id: "a", label: "Do militar mais antigo" },
          { id: "b", label: "Do militar de menor precedencia hierarquica" },
          { id: "c", label: "Somente do oficial" },
          { id: "d", label: "Somente da tropa formada" },
        ],
        correctOptionIds: ["b"],
      }),
      question("rcont-q3", "boolean", "Quando o Hino Nacional for cantado, o militar permanece em Sentido e nao faz continencia individual.", "RCONT, art. 24", "O regulamento distingue o Hino cantado do Hino tocado e manda permanecer em Sentido.", {
        options: [
          { id: "true", label: "Verdadeiro" },
          { id: "false", label: "Falso" },
        ],
        correctOptionIds: ["true"],
      }),
      question("rcont-q4", "single", "Qual artigo trata da apresentacao da Bandeira Nacional aos recrutas?", "RCONT, art. 169", "O art. 169 detalha as prescricoes dessa solenidade especifica.", {
        options: [
          { id: "a", label: "Art. 99" },
          { id: "b", label: "Art. 150" },
          { id: "c", label: "Art. 169" },
          { id: "d", label: "Art. 198" },
        ],
        correctOptionIds: ["c"],
      }),
    ],
  },
  {
    slug: "rdpmam-disciplina",
    title: "RDPMAM - Regulamento Disciplinar da PMAM",
    shortTitle: "RDPMAM",
    description: "Estudo das transgressoes disciplinares, justificacao, agravantes, punicoes e comportamento policial-militar.",
    sourceTitle: "Regulamento Disciplinar da Policia Militar do Amazonas",
    sourceFileName: "RDPMAM.pdf",
    textPath: "/study/texts/rdpmam.txt",
    pages: 18,
    estimatedMinutes: 45,
    difficulty: "intensivo",
    studyMode: "regulation",
    studyUnitTarget: 114,
    questionTarget: 100,
    theme: "Disciplina, julgamento e recursos",
    objectives: [
      "Compreender a finalidade do RDPMAM e os principios de hierarquia e disciplina.",
      "Fixar o conceito de transgressao e seus criterios de julgamento.",
      "Revisar punicoes, comportamento e recursos disciplinares.",
    ],
    quickFacts: [
      "O regulamento especifica e classifica transgressoes disciplinares.",
      "Ordens devem ser prontamente obedecidas.",
      "O comportamento inicial da praca e Bom.",
    ],
    sections: [
      section(
        "rdpmam-base",
        "Finalidade e principios basicos",
        "O RDPMAM especifica transgressoes, regula punicoes e se ancora na hierarquia e disciplina policial-militar.",
        [
          "O art. 1 trata de transgressoes, punicoes, comportamento e recursos.",
          "O art. 5 aborda hierarquia e o art. 6 define disciplina policial-militar.",
          "O art. 7 reforca que ordens devem ser prontamente obedecidas.",
        ],
        "RDPMAM, arts. 1, 5, 6 e 7",
        "Fixei a base conceitual do regulamento disciplinar."
      ),
      section(
        "rdpmam-julgamento",
        "Transgressao, justificacao e julgamento",
        "A apuracao disciplinar depende da correta qualificacao do fato e das circunstancias.",
        [
          "O art. 12 define transgressao disciplinar como violacao dos principios da etica, dos deveres e obrigacoes policiais-militares.",
          "Os arts. 14 a 18 tratam de exame da falta, justificacao, atenuantes e agravantes.",
          "Entre as justificacoes estao legitima defesa, interesse do servico e obediencia a ordem superior.",
        ],
        "RDPMAM, arts. 12 a 18",
        "Entendi como o fato e qualificado antes da punicao."
      ),
      section(
        "rdpmam-punicoes",
        "Punicoes, comportamento e recursos",
        "O regulamento combina graduacao de punicoes, classificacao de comportamento e direito a recurso.",
        [
          "O art. 21 diz que a punicao objetiva o fortalecimento da disciplina.",
          "O art. 22 apresenta advertencia, repreensao, detencao, prisao e licenciamento ou exclusao a bem da disciplina.",
          "Os arts. 49, 50 e 54 a 60 tratam de comportamento e recursos disciplinares.",
        ],
        "RDPMAM, arts. 21, 22, 49, 50 e 54 a 60",
        "Revisei punicoes, classificacao do comportamento e mecanismos de revisao disciplinar."
      ),
    ],
    questions: [
      question("rdpmam-q1", "single", "O art. 1 do RDPMAM tem como finalidade principal:", "RDPMAM, art. 1", "O regulamento especifica transgressoes, punicoes, comportamento e recursos.", {
        options: [
          { id: "a", label: "Regular apenas os uniformes" },
          { id: "b", label: "Especificar transgressoes, punicoes, comportamento e recursos" },
          { id: "c", label: "Criar hinos militares" },
          { id: "d", label: "Definir somente ferias" },
        ],
        correctOptionIds: ["b"],
      }),
      question("rdpmam-q2", "boolean", "As ordens devem ser prontamente obedecidas.", "RDPMAM, art. 7", "O art. 7 apresenta exatamente essa exigencia.", {
        options: [
          { id: "true", label: "Verdadeiro" },
          { id: "false", label: "Falso" },
        ],
        correctOptionIds: ["true"],
      }),
      question("rdpmam-q3", "multiple", "Quais itens podem aparecer como causas de justificacao da transgressao?", "RDPMAM, art. 16", "O art. 16 cita interesse do servico, legitima defesa e obediencia a ordem superior.", {
        options: [
          { id: "a", label: "Interesse do servico ou da ordem publica" },
          { id: "b", label: "Legitima defesa" },
          { id: "c", label: "Obediencia a ordem superior" },
          { id: "d", label: "Vaidade pessoal" },
        ],
        correctOptionIds: ["a", "b", "c"],
      }),
      question("rdpmam-q4", "single", "Ao ser incluida na Policia Militar, a praca e classificada inicialmente em qual comportamento?", "RDPMAM, arts. 49 e 50", "O regulamento informa que a praca ingressa classificada no comportamento Bom.", {
        options: [
          { id: "a", label: "Excepcional" },
          { id: "b", label: "Bom" },
          { id: "c", label: "Mau" },
          { id: "d", label: "Insuficiente" },
        ],
        correctOptionIds: ["b"],
      }),
    ],
  },
  {
    slug: "risg-servicos-gerais",
    title: "RISG - Regulamento Interno e dos Servicos Gerais",
    shortTitle: "RISG",
    description: "Modulo sobre vida interna da unidade, comando, secoes S1-S4, revistas, inspecoes e servicos gerais.",
    sourceTitle: "Regulamento Interno e dos Servicos Gerais",
    sourceFileName: "RISG.pdf",
    textPath: "/study/texts/risg.txt",
    pages: 124,
    estimatedMinutes: 65,
    difficulty: "intensivo",
    studyMode: "regulation",
    studyUnitTarget: 513,
    questionTarget: 100,
    theme: "Vida interna, servicos e organizacao da unidade",
    objectives: [
      "Entender a finalidade do RISG e a estrutura basica de comando.",
      "Fixar atribuicoes do comandante, subcomandante e secoes do estado-maior.",
      "Revisar revistas, inspecoes, controle de material e Bandeira Nacional.",
    ],
    quickFacts: [
      "O RISG regula a vida interna e os servicos gerais das unidades.",
      "S1, S2, S3 e S4 possuem atribuicoes bem definidas.",
      "O documento detalha formaturas, revistas, inspecoes e controle de material belico.",
    ],
    sections: [
      section(
        "risg-base",
        "Finalidade do RISG e funcao de comando",
        "O RISG organiza o funcionamento da unidade desde a vida interna ate a distribuicao de responsabilidades.",
        [
          "O art. 1 prescreve tudo quanto se relaciona com a vida interna e com os servicos gerais das unidades.",
          "O art. 18 define o comando como funcao do grau hierarquico, da qualificacao e das habilitacoes.",
          "Os arts. 20 e 21 reforcam o papel de planejar, orientar, coordenar e fiscalizar a unidade.",
        ],
        "RISG, arts. 1, 18, 20 e 21",
        "Entendi o alcance do RISG e o papel do comando dentro da unidade."
      ),
      section(
        "risg-estado-maior",
        "SCmt, S1, S2, S3 e S4",
        "O regulamento distribui o funcionamento do estado-maior por secoes especializadas.",
        [
          "O SCmt e o principal auxiliar e substituto imediato do comandante da unidade.",
          "O S1 responde por pessoal, BI, justica e disciplina, protocolo e arquivo interno.",
          "S2 trata de inteligencia, S3 de instrucao e operacoes e S4 de administracao e apoio material.",
        ],
        "RISG, arts. 22 a 32",
        "Consigo diferenciar as responsabilidades do SCmt e das secoes S1, S2, S3 e S4."
      ),
      section(
        "risg-servicos",
        "Revistas, inspecoes e Bandeira",
        "O RISG regula a verificacao do efetivo, do material e do tratamento dos simbolos nacionais.",
        [
          "O art. 267 define revista como o ato de verificar presenca, estado de saude, material e animais.",
          "O art. 283 define inspecao como exame da tropa, material, viaturas, administracao, instalacoes e instrucao.",
          "O art. 322 afirma que cada unidade possui sob sua guarda uma Bandeira Nacional, simbolo da Patria.",
        ],
        "RISG, arts. 267, 283 e 322",
        "Revi como o RISG conecta rotina, controle e simbolos nacionais."
      ),
    ],
    questions: [
      question("risg-q1", "single", "O art. 1 do RISG prescreve principalmente:", "RISG, art. 1", "O artigo trata da vida interna e dos servicos gerais das unidades consideradas corpos de tropa.", {
        options: [
          { id: "a", label: "Apenas o uso da Bandeira Nacional" },
          { id: "b", label: "Tudo quanto se relaciona com a vida interna e os servicos gerais da unidade" },
          { id: "c", label: "Somente o calendario de ferias" },
          { id: "d", label: "Apenas os hinos militares" },
        ],
        correctOptionIds: ["b"],
      }),
      question("risg-q2", "boolean", "O comando e funcao do grau hierarquico, da qualificacao e das habilitacoes.", "RISG, art. 18", "Esse conceito aparece expressamente no art. 18 do RISG.", {
        options: [
          { id: "true", label: "Verdadeiro" },
          { id: "false", label: "Falso" },
        ],
        correctOptionIds: ["true"],
      }),
      question("risg-q3", "single", "Qual secao responde por pessoal, BI, justica e disciplina, protocolo e arquivo interno?", "RISG, art. 26", "O art. 26 atribui essas responsabilidades ao S1.", {
        options: [
          { id: "a", label: "S1" },
          { id: "b", label: "S2" },
          { id: "c", label: "S3" },
          { id: "d", label: "S4" },
        ],
        correctOptionIds: ["a"],
      }),
      question("risg-q4", "single", "O que e revista, segundo o art. 267?", "RISG, art. 267", "Revista e o ato de verificar presenca ou estado de saude do pessoal, existencia e estado do material distribuido e dos animais.", {
        options: [
          { id: "a", label: "Uma solenidade exclusiva da Bandeira" },
          { id: "b", label: "Um exame de efetivo, saude, material e animais" },
          { id: "c", label: "Apenas uma conferencia de armamento" },
          { id: "d", label: "Um recurso disciplinar" },
        ],
        correctOptionIds: ["b"],
      }),
    ],
  },
];

export function getStudyModule(slug: string) {
  return studyModules.find((module) => module.slug === slug) ?? null;
}
