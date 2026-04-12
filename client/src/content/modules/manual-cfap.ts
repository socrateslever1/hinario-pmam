import { StudyModule, section, question } from "../types";

export const manualCfapModule: StudyModule = {
  slug: "manual-cfap",
  title: "Manual do Aluno do CFAP",
  shortTitle: "Manual do CFAP",
  description: "Guia completo de ambientação, direitos, deveres, disciplina e rotina escolar do aluno no Centro de Formação e Aperfeiçoamento de Praças.",
  sourceTitle: "Manual do Aluno do Centro de Formação e Aperfeiçoamento de Praças",
  sourceFileName: "manualdoaluno_2023_03_14_10_23_18 (2).pdf",
  textPath: "/study/texts/manual-do-aluno.txt",
  pages: 53,
  estimatedMinutes: 90,
  difficulty: "base",
  studyMode: "manual",
  studyUnitTarget: 34,
  questionTarget: 100,
  theme: "Fundamentos da vida escolar militar",
  objectives: [
    "Compreender a missão, visão e valores institucionais do CFAP.",
    "Reconhecer a estrutura administrativa e as seções responsáveis pelo suporte ao aluno.",
    "Dominar os regulamentos basilares: RISG, R-2, RCONT e RDPMAM.",
    "Internalizar direitos, deveres, proibições e a sistemática de comportamento escolar.",
    "Entender o regime de frequência, dispensas e a defesa disciplinar do discente.",
  ],
  quickFacts: [
    "O manual é o instrumento oficial que regula direitos, deveres e as fronteiras disciplinares do aluno.",
    "A estrutura base do CFAP inclui Comando, P/1 (Pessoal), P/3 (Instrução) e P/4 (Logística).",
    "Frequência, disciplina e hierarquia são inegociáveis para a conclusão do curso.",
  ],
  sections: [
    section(
      "manual-finalidade",
      "Finalidade e identidade institucional",
      "O manual padroniza a conduta do aluno e apresenta a missão, a visão e os princípios fundamentais do CFAP.",
      [
        "A introdução apresenta o CFAP como uma unidade de ensino voltada a formar e aperfeiçoar profissionais de segurança pública.",
        "A finalidade principal do manual é padronizar a conduta e orientar o aluno na sua rotina diária no curso.",
        "O texto destaca missão, visão e princípios (Hierarquia, Disciplina, Ética) como a fundação da postura esperada do aluno.",
      ],
      "Manual do Aluno, p. 5-6",
      "Compreendi perfeitamente o propósito do manual e os pilares éticos da instituição."
    ),
    section(
      "manual-estrutura",
      "Estrutura Administrativa e Regulamentos da Base",
      "A vida escolar depende do domínio da estrutura organizacional do CFAP e dos regulamentos militares aplicáveis.",
      [
        "A estrutura funcional envolve a Cadeia de Comando (Comandante e Subcomandante), a Seção de Justiça e Disciplina e a Diretoria de Ensino e Instrução.",
        "Na divisão administrativa, destacam-se a P/1 (Pessoal e Justiça), P/3 (Instrução e Operações), P/4 (Logística e Infraestrutura) e PCSV (Policiamento e Segurança).",
        "A rotina militar baseia-se nos regulamentos pilares: RISG (Serviços Gerais), R-2 (Trânsito e Rotina), RCONT (Continências, Sinais de Respeito e Cerimonial), RDPMAM (Disciplina), NGA (Normas Gerais de Ação) e Manuais de Ordem Unida e TFM.",
      ],
      "Manual do Aluno, p. 10-12",
      "Sei a quem recorrer (P/1, P/3, P/4) e quais regulamentos comandam o meu dia a dia."
    ),
    section(
      "manual-direitos",
      "Direitos do Aluno e Assistência Contínua",
      "O aluno possui prerrogativas garantidas para assegurar um bom rendimento no curso, como revisões de notas e acompanhamento médico.",
      [
        "É direito do aluno ser tratado com respeito por seus superiores, pares e subordinados.",
        "O aluno tem o direito de solicitar esclarecimentos, pedir revisão de avaliações escritas e recorrer a instâncias superiores, desde que observe a cadeia de comando (trâmite hierárquico).",
        "Há previsão expressa de assistência de saúde física, mental e odontológica, além de alimentação e fardamento.",
      ],
      "Manual do Aluno, Seção: Direitos do Aluno",
      "Entendi meus direitos no âmbito escolar, especialmente os referentes a revisões de notas e trâmites hierárquicos."
    ),
    section(
      "manual-deveres",
      "Deveres Policiais-Militares e Atitude Estudantil",
      "As obrigações do aluno estendem-se do empenho acadêmico ao rigoroso culto da continência e dos horários militares.",
      [
        "O aluno deve se empenhar ativamente no processo ensino-aprendizagem, zelando tanto pelo rendimento acadêmico quanto pela aptidão física.",
        "É dever inalienável cultuar a verdade, a lealdade e a responsabilidade, apresentando-se sempre em perfeitas condições de higiene e fardamento.",
        "A pontualidade é exigida com exatidão em todas as formaturas, instruções e escalas de serviço, assim como a prestação obrigatória da continência regulamentar.",
      ],
      "Manual do Aluno, Seção: Deveres do Aluno",
      "Assimilei que minhas obrigações vão desde notas satisfatórias até um fardamento e comportamento irretocáveis."
    ),
    section(
      "manual-proibicoes",
      "Proibições Graves e Rotina Disciplinar",
      "Existem limites estritos no uso de equipamentos eletrônicos e no trânsito pelas instalações, cuja violação atrai sanções.",
      [
        "É terminantemente proibido o uso de celulares, fones de ouvido ou aparelhos similares durante as instruções e formaturas, exceto com autorização expressa.",
        "O aluno não pode ingressar em setores administrativos restritos, salas de instrutores ou reservas de armamento sem a devida permissão.",
        "Trânsito em trajes civis de passeio (quando não previsto), namoro, brincadeiras de mau gosto ou qualquer atitude incompatível com o decoro militar dentro do CFAP são expressamente vedados.",
      ],
      "Manual do Aluno, Seção: Proibições",
      "Gravei as principais restrições, especialmente sobre uso de celulares e circulação em áreas proibidas."
    ),
    section(
      "manual-frequencia",
      "Regime de Frequência, Faltas e Trancamento",
      "O controle de assiduidade é o marcador primário para a aprovação; excesso de faltas, mesmo justificadas, pode levar ao desligamento.",
      [
        "A frequência às aulas e instruções é condição sine qua non (obrigatória) para a aprovação.",
        "Faltas podem ser classificadas como Justificadas (motivos médicos ou força maior comprovada) e Injustificadas.",
        "Um número excessivo de faltas (ultrapassando o limite percentual do regulamento de ensino) resulta no trancamento de matrícula ou desligamento, independentemente do rendimento nas provas.",
      ],
      "Manual do Aluno, Seção: Frequência e Dispensas",
      "Compreendi que a assiduidade é critério de exclusão se o limite de faltas for ultrapassado."
    ),
  ],
  questions: [
    question("manual-q1", "single", "Qual é a finalidade central do Manual do Aluno do CFAP?", "Manual do Aluno, p. 6", "O texto afirma que o manual tem finalidade dupla: padronizar a conduta dos alunos e orientar as atividades desenvolvidas ao longo do curso.", {
      options: [
        { id: "a", label: "Padronizar a conduta dos alunos e orientar a ambientação e atividades no curso" },
        { id: "b", label: "Revogar as normas do Regulamento Disciplinar para o período acadêmico" },
        { id: "c", label: "Servir apenas como um guia de escala de serviço para formatura" },
        { id: "d", label: "Substituir o RCONT e o RISG na vida interna do aluno" },
      ],
      correctOptionIds: ["a"],
    }),
    question("manual-q2", "multiple", "Quais os princípios institucionais elencados na introdução do manual que regem a postura do aluno?", "Manual do Aluno, p. 5", "A introdução destaca como princípios basilares a Hierarquia, a Disciplina, a Eficácia e a Ética.", {
      options: [
        { id: "a", label: "Hierarquia" },
        { id: "b", label: "Disciplina" },
        { id: "c", label: "Inovação tecnológica" },
        { id: "d", label: "Eficácia e Ética" },
      ],
      correctOptionIds: ["a", "b", "d"],
    }),
    question("manual-q3", "single", "Qual regulamento deve ser estritamente observado para tratar do comportamento de rotina da vida interna e serviços gerais na unidade?", "Manual do Aluno, p. 10", "A norma máxima que rege a vida interna de uma unidade e a escala de serviços gerais é o RISG.", {
      options: [
        { id: "a", label: "R-2" },
        { id: "b", label: "RISG" },
        { id: "c", label: "Constituição Estadual" },
        { id: "d", label: "Decreto de Continências" },
      ],
      correctOptionIds: ["b"],
    }),
    question("manual-q4", "single", "A quem compete a Seção P/3 dentro da estrutura administrativa padrão citada aos discentes?", "Manual do Aluno, p. 11", "A Seção P/3 é classicamente conhecida como a Seção de Instrução e Operações, responsável pelos mapas de aulas e exercícios.", {
      options: [
        { id: "a", label: "Logística, transporte e rancho" },
        { id: "b", label: "Instrução, Ensino e Operações" },
        { id: "c", label: "Saúde e assistência social" },
        { id: "d", label: "Inteligência e proteção da unidade" },
      ],
      correctOptionIds: ["b"],
    }),
    question("manual-q5", "boolean", "O aluno possui o direito regulamentar de pedir revisão de provas escritas, desde que observe o correto trâmite pela cadeia de comando.", "Manual do Aluno, Direitos", "Sim, o pedido de revisão é um direito, mas jamais pode ignorar o canal hierárquico.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["true"],
    }),
    question("manual-q6", "single", "Relativo ao uso de aparelhos eletrônicos, qual é a regra geral disposta no Manual do Aluno?", "Manual do Aluno, Proibições", "O uso de celulares, fones e similares é terminantemente proibido durante a instrução, salvo quando houver prévia e expressa autorização do instrutor para fins pedagógicos.", {
      options: [
        { id: "a", label: "É liberado exclusivamente para leitura de PDFs, sem precisão de autorização." },
        { id: "b", label: "É proibido o uso durante formaturas e instruções, salvo autorização prévia e expressa." },
        { id: "c", label: "Apenas oficiais-alunos possuem a prerrogativa de utilizá-los sem restrição." },
        { id: "d", label: "Pode ser utilizado se estiver no modo silencioso, sem atrapalhar a instrução." },
      ],
      correctOptionIds: ["b"],
    }),
    question("manual-q7", "multiple", "Dos itens abaixo, quais são expressamente considerados DEVERES (e não direitos) do discente em rotina escolar?", "Manual do Aluno, Deveres", "Prestar continência (respeito), zelar pelo material do estado e ser pontual são clássicos deveres; alimentação e recurso de notas são direitos.", {
      options: [
        { id: "a", label: "Apresentar-se pontualmente nos horários de instrução e formatura." },
        { id: "b", label: "Ser assistido medicalmente pelo corpo especializado da corporação." },
        { id: "c", label: "Zelar com esmero pela correta apresentação individual (Fardamento)." },
        { id: "d", label: "Prestar a continência regulamentar a todos os superiores e aos símbolos." },
      ],
      correctOptionIds: ["a", "c", "d"],
    }),
    question("manual-q8", "single", "O que ocorre invariavelmente com o aluno que, mesmo com faltas justificadas (por doença médica comprovada), ultrapassar o limite percentual máximo estipulado no regulamento escolar?", "Manual do Aluno, Frequência", "O limite legal de faltas é barreira técnica de ensino. O aluno é submetido ao trancamento de matrícula ou desligamento, dependendo da norma vigente, pois se entende que perdeu a carga curricular mínima.", {
      options: [
        { id: "a", label: "Deve fazer uma prova complementar no final da semana para repor." },
        { id: "b", label: "Por serem justificadas com atestado, o limite de faltas é sumariamente ignorado e estendido." },
        { id: "c", label: "Sofrerá o desligamento ou o trancamento de sua matrícula no curso." },
        { id: "d", label: "Terá as faltas revertidas em prestação de horas em serviço de guarda." },
      ],
      correctOptionIds: ["c"],
    }),
    question("manual-q9", "text", "Complete a frase clássica militar: 'A _______ e a _______ são a base institucional da Polícia Militar e do comportamento do discente.' (Digite a segunda palavra)", "Estatuto / Manual, Princípios", "Hierarquia e Disciplina são as colunas institucionais e aparecem repetidas no texto do Manual.", {
      acceptedAnswers: ["disciplina"],
    }),
    question("manual-q10", "boolean", "O aluno está autorizado, pelo caráter fraterno de camaradagem, a acessar as áreas administrativas e sala do corpo de alunos a qualquer momento, para estreitar comunicação.", "Manual do Aluno, Proibições", "Circulação em áreas restritas (salas de instrutores, administração, reserva de arma) requer autorização; é expressamente proibido o transito não justificado.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("manual-q11", "multiple", "O aluno do CFAP será avaliado, além da grade técnica (notas das matérias), pelo seu conceito ético continuado. Que atitudes abaixo demonstram esse conceito ético desejado?", "Manual do Aluno, Atributos", "O culto à verdade, o rigoroso respeito à hierarquia e a lealdade institucional são métricas essenciais do comportamento no período formador.", {
      options: [
        { id: "a", label: "Omitir fatos em processos disciplinares para salvaguardar pares (espírito de corpo reverso)." },
        { id: "b", label: "Cultuar a verdade de forma absoluta mesmo quando incorrer em sanção em seu prejuízo." },
        { id: "c", label: "Abster-se do contato e camaradagem para priorizar a leitura noturna." },
        { id: "d", label: "Zelar pelo princípio da lealdade aos propósitos institucionais da PMAM." },
      ],
      correctOptionIds: ["b", "d"],
    }),
    question("manual-q12", "single", "Durante a realização das atividades escolares, qual conduta o manual prescreve em relação à observação dos horários (pontualidade)?", "Manual do Aluno, Deveres", "A pontualidade é exigida não só na sala, mas em todas as escalas e formaturas. O atraso configura transgressão disciplinar sem ressalvas frouxas.", {
      options: [
        { id: "a", label: "Há tolerância padronizada de 15 minutos (tempo de locomoção de alojamentos)." },
        { id: "b", label: "Deve ser rigorosamente observada em todas as atividades; atraso constitui falha disciplinar." },
        { id: "c", label: "Alunos com mais de 8.0 na média não respondem por pequenos atrasos." },
        { id: "d", label: "Apenas atrasos maiores que uma hora de aula ensejam o preenchimento de FATD." },
      ],
      correctOptionIds: ["b"],
    }),
    question("manual-q13", "boolean", "O Manual do Aluno autoriza o uso do uniforme transitando nas ruas de maneira despadronizada apenas no trajeto pernoite/CFAP, considerando as limitações do percurso.", "Manual do Aluno, Uso de Fardamento", "Jamais há permissão para uso despadronizado. Se vestido com o uniforme, o militar está de serviço moral perante a sociedade, sujeito a zelo minucioso.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("manual-q14", "text", "Qual é a sigla oficial (conforme estudado) do Centro de Formação e Aperfeiçoamento de Praças?", "Manual do Aluno, Capa", "CFAP", {
      acceptedAnswers: ["cfap"],
    }),
    question("manual-q15", "multiple", "Dentro do fluxo básico da defesa disciplinar (o ato de pedir punição, recurso, resposta), o que deve ser assegurado sistematicamente ao aluno?", "Manual do Aluno / RDPMAM", "O Direito da ampla defesa e contraditório, pautando-se sempre pelas regras de tratamento e respeito mútuo da Corporação.", {
      options: [
        { id: "a", label: "Apresentar justificativas por meio dos prazos regulamentares (contraditório)." },
        { id: "b", label: "Ampla Defesa, desde que redigido através do canal técnico de representação oficial." },
        { id: "c", label: "O poder imediato de acionar a justiça civil ignorando as vias administrativas (Sindicâncias)." },
        { id: "d", label: "Que, se ele confessar, haverá exclusão sumária no dia seguinte." },
      ],
      correctOptionIds: ["a", "b"],
    }),
  ],
};
