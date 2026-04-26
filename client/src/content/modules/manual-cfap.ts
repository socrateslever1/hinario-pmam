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
      "Finalidade, Identidade e Valores Institucionais",
      "O Manual do Aluno atua como a 'Constituição' dentro dos portões do CFAP. Ele estabelece não apenas regras, mas a base filosófica da formação de um agente de segurança.",
      [
        "A introdução define o CFAP primordialmente como uma unidade de ensino policial, responsável por forjar a mentalidade, o físico e o preparo técnico do aluno.",
        "A finalidade central do manual é dupla: padronizar a conduta e servir de bússola orientadora para o aluno diante de todas as atividades desenvolvidas na sua rotina diária.",
        "Os pilares morais institucionais citados textualmente englobam: o culto irrevogável à Hierarquia e à Disciplina, a busca pela Eficácia na execução técnica e a observância rigorosa da Ética.",
        "A transição civil-militar impõe um choque de realidade: espera-se que o aluno abandone vícios de conduta civis e adote instantaneamente o 'Ethos' (modo de ser) do combatente.",
        "Toda atividade no CFAP, do refeitório à linha de tiro, é supervisionada para garantir que o discente não se desvie dos preceitos formadores.",
      ],
      "Manual do Aluno, p. 5-7",
      "Entendi plenamente a missão do CFAP e que a transição civil-militar exige uma quebra brusca de comportamento para abraçar a hierarquia e disciplina."
    ),
    section(
      "manual-estrutura",
      "Arquitetura Administrativa e Regulamentação",
      "Para sobreviver e progredir no curso, o aluno precisa saber exatamente quem comanda, a quem recorrer e quais os limites normativos da instituição.",
      [
        "O Comando e o Subcomando detêm o controle estratégico de todas as diretrizes formativas, sendo a última palavra na hierarquia local.",
        "Na engrenagem administrativa, a P/1 cuida do pessoal (justiça, férias, folgas), a P/3 é o 'coração tático' que monta instruções e provas, e a P/4 garante a logística (alimentação, munição e material).",
        "A vida escolar é governada por uma malha de regulamentos que o aluno não pode alegar desconhecer: o RISG dita o dia a dia e os serviços internos (guarda, plantão).",
        "O RCONT dita a postura cerimonial, a forma de bater continência, sinais de respeito e a apresentação individual frente aos superiores.",
        "O RDPMAM é o 'código penal' administrativo: ele pune desvios éticos ou descumprimentos de regras. Em conjunto, essas normas fecham o cerco comportamental do aluno.",
      ],
      "Manual do Aluno, p. 10-15",
      "Memorizei a função das seções (P/1 a P/4) e o propósito exato dos regulamentos acessórios como RISG, RCONT e RDPMAM."
    ),
    section(
      "manual-direitos",
      "Direitos, Prerrogativas e Sistema de Assistência",
      "O choque de disciplina não retira do aluno as garantias institucionais. O sistema protege quem age corretamente e segue a cadeia de comando.",
      [
        "A instituição assegura que nenhum aluno será tratado de forma aviltante. O respeito mútuo, independente da patente do instrutor, é direito e norma basilar.",
        "A esfera acadêmica confere o direito líquido e certo à revisão de avaliações, desde que os recursos sejam tempestivos e usem o linguajar técnico exigido nos relatórios e partes.",
        "Para realizar qualquer requerimento, o aluno é obrigado a observar a Cadeia de Comando: ele não pode falar com o Comandante do CFAP antes de despachar com o Xerife, Comandante de Pelotão e Comandante de Companhia.",
        "Existe a previsão para suporte biopsicossocial, compreendendo atendimento médico-hospitalar, psicológico contínuo e odontológico nas unidades de saúde da corporação.",
        "Direitos materiais básicos englobam fornecimento de uniformes para a rotina diária (conforme disponibilidade do almoxarifado) e etapas de alimentação nos dias de serviço e aula.",
      ],
      "Manual do Aluno, Seção 3 - Direitos",
      "Compreendi perfeitamente que possuo direitos (saúde, recursos, respeito), mas que eles só podem ser cobrados seguindo a cadeia de comando estrita."
    ),
    section(
      "manual-deveres",
      "Deveres Pessoais, Éticos e de Apresentação",
      "O aluno não é avaliado apenas em provas de múltipla escolha. O comportamento diário, o coturno polido e a pontualidade são atributos de aprovação constantes.",
      [
        "O empenho do discente não se restringe à sala de aula. Ele deve zelar ativamente pelo seu condicionamento físico (TFM) contínuo e pela retenção prática do conhecimento (treinos pós-aula).",
        "A lealdade institucional, a verdade absoluta e o pundonor militar (honra pessoal) impedem o aluno de omitir transgressões, cometer plágio intelectual ou mentir para cobrir faltas de terceiros.",
        "A apresentação pessoal é medida pelo rigor: cabelos cortados no padrão semanalmente, barba feita diariamente antes da primeira formatura, fardamento isento de amassos, vincos em dia e botas espelhadas.",
        "A pontualidade é avaliada em segundos. Chegar na hora não é suficiente; a prontidão exige a apresentação com antecedência mínima padrão de 15 minutos (ou conforme escalado pelo xerife).",
        "A continência, sinal regulamentar de respeito e apreço, não é eletiva: deve ser prestada obrigatoriamente e prontamente a todas as bandeiras, hinos, símbolos nacionais e superiores hierárquicos.",
      ],
      "Manual do Aluno, Seção 4 - Deveres",
      "Entendi que a apresentação individual primorosa e a obrigação irrestrita da verdade não são opções, mas crivos cruciais para a aprovação."
    ),
    section(
      "manual-proibicoes",
      "Condutas Estritamente Vedadas e Transgressões",
      "Existem limites que configuram transgressão disciplinar sumária (Parte e FATD), passíveis de repreensão, prisão ou até desligamento em casos graves.",
      [
        "Para evitar a dispersão tecnológica, o uso de aparelhos celulares, fones ou smartwatches durante formaturas, instruções teóricas ou práticas é totalmente proibido, a não ser que o instrutor autorize textualmente.",
        "O CFAP tem áreas classificadas. É transgressão grave entrar sem autorização em seções do Corpo de Alunos, alojamentos de pelotões distintos, reservas de armamento, salas de comando ou de instrução.",
        "Atitudes pueris como namorar nas dependências da caserna, praticar jogos de azar, promover algazarras, apelidos pejorativos ou brincadeiras de mau gosto ferem mortalmente o decoro exigido.",
        "É proibido, sob qualquer pretexto, o uso de peças do uniforme em horários não designados ou combinadas de forma despadronizada com roupas civis no deslocamento casa-unidade.",
        "Manifestações políticas partidárias, seja através de comentários fardados, adesivos em viaturas particulares ou redes sociais identificando a farda, são graves violações do estatuto e do manual.",
      ],
      "Manual do Aluno, Seção 5 - Proibições",
      "Gravei que aparelhos eletrônicos, circulação não autorizada, despadronização de fardamento e partidarismo geram transcursos disciplinares severos."
    ),
    section(
      "manual-frequencia",
      "Controle Curricular, Frequência e Desligamento",
      "O modelo educacional militar repudia a evasão e a negligência. Faltar no CFAP pode levar à expulsão antes da formatura.",
      [
        "A presença do discente não é mero requisito acadêmico; é obrigação militar contínua. Sem atingir a carga horária em dias e horas letivas, é impossível prosseguir nas fases do curso.",
        "A classificação de faltas divide-se rigidamente em 'Justificadas' (Atestados médicos da Junta, lutos previstos em lei, acidentes de trajeto atestados) e 'Injustificadas' (desídia ou atrasos).",
        "Existe um percentual limite fixado para o teto de faltas, geralmente de 20% a 25% da carga ou dias totais (verificar norma do edital vigente). Esse teto aplica-se mesmo para faltas justificadas por doença.",
        "Quando o aluno atinge o limite percentual máximo de faltas, independentemente do quão brilhante seja o seu coeficiente de notas teóricas, a sua matrícula sofre desligamento ou trancamento automático.",
        "O desligamento ou trancamento por motivo de saúde confere o direito a reingresso no certame seguinte após homologação da junta. A reprovação por indisciplina ou fraude gera processo expulsório definitivo.",
      ],
      "Manual do Aluno, Seção 7 - Regime Disciplinar",
      "Ficou consolidado na minha mente que a frequência é critério de exclusão e que estourar o limite, mesmo com atestado médico válido, me tira do curso atual."
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
