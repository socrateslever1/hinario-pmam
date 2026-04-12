import { StudyModule, section, question } from "../types";

export const estatutoPmamModule: StudyModule = {
  slug: "estatuto-pmam",
  title: "Estatuto dos Policiais Militares do Amazonas",
  shortTitle: "Estatuto PMAM",
  description: "A base legal mestra (Lei Estadual) que dita a vida funcional, hierárquica, estrutural e disciplinar da carreira policial militar no estado do Amazonas.",
  sourceTitle: "Estatuto dos Policiais Militares do Estado do Amazonas",
  sourceFileName: "Estatuto-dos-Policiais-Militares_260408_204357.pdf",
  textPath: "/study/texts/estatuto-policiais-militares.txt",
  pages: 51,
  estimatedMinutes: 90,
  difficulty: "intensivo",
  studyMode: "regulation",
  studyUnitTarget: 497,
  questionTarget: 100,
  theme: "Base legal da carreira policial militar",
  objectives: [
    "Diferenciar a situação de Atividade (da ativa) e Inatividade (reserva e reforma).",
    "Dominar a conceituação de Hierarquia, Disciplina, Precedência e Antiguidade.",
    "Compreender a diferença exata entre Cargo e Função Policial-Militar.",
    "Internalizar o rol de Direitos, Prerrogativas e Obrigações Éticas do policial.",
    "Reconhecer as instâncias de julgamento disciplinar e Conselhos de Justificação/Disciplina.",
  ],
  quickFacts: [
    "A PMAM é força auxiliar e reserva do Exército Brasileiro, subordinada ao Governador do Estado.",
    "Hierarquia e Disciplina são as 'Bases Institucionais' da Polícia Militar.",
    "A precedência é ditada pela antiguidade no posto ou graduação, salvo casos de precedência funcional.",
  ],
  sections: [
    section(
      "estatuto-disposicoes",
      "Disposições Gerais e Situação do Militar",
      "O documento inicia delimitando a quem a lei se aplica, o status da Corporação e a diferença entre militares da Ativa, Reserva Remunerada e Reformados.",
      [
        "O Estatuto regula a situação, as obrigações, os deveres, os direitos e as prerrogativas.",
        "A PMAM vincula-se operacionalmente à Secretaria de Segurança Pública e subordina-se diretamente ao Governador.",
        "O militar subdivide-se em 'Da Ativa' (de carreira, alunos e temporários) e 'Na Inatividade' (Reserva remunerada - pode ser convocado - e Reformado - dispensa definitiva).",
      ],
      "Estatuto, Cap. I, arts. 1 a 6",
      "Entendi o que o Estatuto regula, a subordinação ao Governador e a diferença entre Ativa, Reserva e Reforma."
    ),
    section(
      "estatuto-ingresso",
      "Ingresso Institucional",
      "Aborda as condições primárias para que o cidadão seja incorporado e incluído na PMAM.",
      [
        "O ingresso é feito mediante inclusão, matrícula ou nomeação, após aprovação em concurso ou exame.",
        "Exige-se idoneidade moral, aptidão física e mental e outras exigências que variam conforme o edital da carreira.",
        "A igualdade é respeitada na inclusão, observadas as especificidades de vagas de praças e oficiais.",
      ],
      "Estatuto, Cap. II, arts. 10 e 11",
      "Compreendi a exigência por ingresso mediante concurso e as condições essenciais de matrícula."
    ),
    section(
      "estatuto-hierarquia",
      "Hierarquia, Disciplina e Precedência",
      "O âmago da vida militar. Define a escada de postos/graduações, a subordinação irrestrita e os círculos hierárquicos.",
      [
        "Hierarquia é a ordenação da autoridade em níveis diferentes; Posto é grau do Oficial (dado por ato do Governador) e Graduação é grau da Praça (Comandante Geral).",
        "A Disciplina fundamenta-se no pronto e rigoroso cumprimento dos deveres.",
        "A antiguidade define a precedência entre militares de mesmo grau. O círculo hierárquico fomenta o convívio e a camaradagem sem quebrar o respeito.",
      ],
      "Estatuto, Cap. III, arts. 12 a 18",
      "Sei diferenciar Posto (Oficial) de Graduação (Praça) e sei que hierarquia e disciplina são a base incontestável."
    ),
    section(
      "estatuto-cargo",
      "Cargo e Função Policial-Militar",
      "Distinção técnica importante em provas sobre 'onde o militar se senta' (Cargo) e 'o que ele faz' (Função).",
      [
        "Cargo policial-militar é um lugar criado por lei, com denominação própria, atribuições e vencimentos específicos.",
        "O cargo é provido por ato de nomeação, designação ou determinação da autoridade competente. Pode estar 'Vago' se o titular falecer, desertar ou for exonerado.",
        "Função policial-militar é o exercício ou a execução em si das atribuições que pertencem formalmente ao cargo.",
      ],
      "Estatuto, Cap. IV, arts. 19 a 22",
      "Não vou mais confundir Cargo (o encaixe fixado em lei) com a Função (o ato de exercer o cargo)."
    ),
    section(
      "estatuto-deveres",
      "Valor, Ética e Deveres",
      "Trata da moral e do culto permanente aos símbolos estaduais e nacionais, bem como a conduta moral do policial.",
      [
        "Os deveres emanam de preceitos que ligam o PM à Pátria, tais como culto aos símbolos nacionais, dedicação ao serviço e lealdade.",
        "O sentimento do dever e o pundonor (honra) exigem moralidade impecável tanto na vida pública quanto na privada.",
        "O sigilo de assuntos corporativos táticos ou não liberados faz parte basilar do compromisso de posse.",
      ],
      "Estatuto, Título II, Cap. I, arts. 26 a 30",
      "Fixei a importância da moral, lealdade e culto aos símbolos pátrios como dever irrevogável."
    ),
    section(
      "estatuto-violacao",
      "Violação das Obrigações (Responsabilidade)",
      "Especifica o que acontece com quem fere o compromisso: os transcursos do crime, transgressão e os conselhos de julgamento.",
      [
        "A inobservância dos deveres pode configurar crime, contravenção ou transgressão disciplinar militar.",
        "O Oficial que cometer falta gravíssima ou criminosa será julgado em Conselho de Justificação.",
        "As praças estáveis cometerão atos apurados em Conselho de Disciplina. Aspirantes a Oficial também.",
      ],
      "Estatuto, Título II, Cap. IV, arts. 40 a 48",
      "A diferença crucial foi aprendida: Oficial vai para Conselho de Justificação; Praça estável vai para Conselho de Disciplina."
    ),
  ],
  questions: [
    question("estatuto-q1", "single", "Segundo o Art. 1º do Estatuto, a lei tem como objeto central a regulação de um quinteto de garantias aplicadas ao policial militar. Qual a formulação correta desse quinteto?", "Estatuto, art. 1º", "O art. 1 apresenta a base geral: situações, obrigações, deveres, direitos e prerrogativas.", {
      options: [
        { id: "a", label: "Hierarquia, posto, graduação, patente e serviço ativo" },
        { id: "b", label: "Situação, obrigações, deveres, direitos e prerrogativas" },
        { id: "c", label: "Armamento, uniforme, viaturas, salário e instrução" },
        { id: "d", label: "Processo penal militar, civil, tributário e previdência" },
      ],
      correctOptionIds: ["b"],
    }),
    question("estatuto-q2", "single", "A subordinação macro da PMAM dá-se de forma direta a quem?", "Estatuto, art. 2º", "Sendo corporação de Estado, a subordinação matriz da PMAM, como Força Auxiliar, é atrelada diretamente ao Excelentíssimo Governador do Estado.", {
      options: [
        { id: "a", label: "À Secretaria Cidadã" },
        { id: "b", label: "Ao Ministro da Defesa" },
        { id: "c", label: "Ao Governador do Estado" },
        { id: "d", label: "Exclusivamente ao Ministério Público" },
      ],
      correctOptionIds: ["c"],
    }),
    question("estatuto-q3", "boolean", "O termo 'Policial da Ativa' contempla apenas aqueles que já concluíram o curso de formação. Os alunos de órgãos de formação são considerados 'em período probatório cívil'.", "Estatuto, Ativa vs Inatividade", "Falso. O aluno de estabelecimento de ensino policial-militar já está perfeitamente investido na condição de militar Estadual 'Da Ativa'.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("estatuto-q4", "multiple", "Dos conceitos de Hierarquia militar do Estatuto, quais afirmativas abaixo descrevem corretamente as particularidades de Posto e Graduação?", "Estatuto, Graus Hierárquicos", "Oficial tem Posto conferido pelo Governador. Praça tem Graduação conferida pelo Comandante Geral (geralmente).", {
      options: [
        { id: "a", label: "Posto é o grau hierárquico do Oficial, conferido por ato do Governador do Estado." },
        { id: "b", label: "Graduação é o grau hierárquico do Oficial, conferida por ato do Ministério da Defesa." },
        { id: "c", label: "Graduação é o grau hierárquico da Praça, conferido, via de regra, pelo Comandante Geral da PM." },
        { id: "d", label: "Posto e Graduação denotam a mesma coisa sob diferente ótica temporal, ambos dependendo de Decreto Legislativo." },
      ],
      correctOptionIds: ["a", "c"],
    }),
    question("estatuto-q5", "single", "Um Primeiro Tenente passa instruções a um policial recém estabilizado. A definição legal que ampara esse rigor e ordenamento de acatamento é:", "Estatuto, Base Institucional", "A base da instituição assenta-se unicamente nestes dois vetores combinados na redação clássica do Art. 12 do Estatuto.", {
      options: [
        { id: "a", label: "Poder de Ofício e Disciplina Administrativa" },
        { id: "b", label: "Hierarquia e Disciplina" },
        { id: "c", label: "Eficiência e Ordem Pública" },
        { id: "d", label: "Cadeia de Fornecimento e Continência" },
      ],
      correctOptionIds: ["b"],
    }),
    question("estatuto-q6", "single", "Qual a diferença central que a Teoria Militar amazonense adota para definir Cargo versus Função?", "Estatuto, Cargo e Função", "Cargo é uma posição abstrata e codificada com responsabilidades. Função é quando a mão de obra humana está executando a tarefa que a posição exige.", {
      options: [
        { id: "a", label: "Cargo não prevê pagamento. Função é gratificada em holerite." },
        { id: "b", label: "Cargo é civil; Função é militar." },
        { id: "c", label: "Cargo é um lugar ou posição criada por Lei. Função é o exercício das atribuições do próprio cargo." },
        { id: "d", label: "Função é a ocupação da vida toda. Cargo é passageiro (ex: Oficial temporário)." },
      ],
      correctOptionIds: ["c"],
    }),
    question("estatuto-q7", "boolean", "A antiguidade, que orienta a precedência dentro de um mesmo grau hierárquico, nunca sofre alterações mediante a superveniência de funções de gabinete, mantendo subordinação estritamente pelos anos efetivos de corporação como único medidor.", "Estatuto, Precedência", "Falso. O Estatuto prevê situações anômalas (como a Precedência Funcional), onde alguém mais moderno pode ganhar precedência transitória ao exercer um cargo superior de comando estipulado em lei.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("estatuto-q8", "multiple", "O recolhimento definitivo por incapacidade de idade ou física gera inatividade total e impossibilidade total de retorno. Como se dividem as figuras de policial na inatividade expressas no Estatuto?", "Estatuto, Situação do Pessoal", "O quadro de Inativos se difere pela possibilidade contratual de ser rechamado à força de segurança.", {
      options: [
        { id: "a", label: "Na Reserva Remunerada (aquele que se afastou mas ainda pertence tacitamente, pondendo ser reconvocado ou engajado)." },
        { id: "b", label: "Aposentado Compulsório (regime geral INSS aplicado a combatentes sem restrição)." },
        { id: "c", label: "Reformados (quando estipulada a dispensa definitiva da prestação de serviços por idade ou incapacidade)." },
        { id: "d", label: "Licenciado pelo Conselho Permanente Sem Remuneração (aposentadoria civil)." },
      ],
      correctOptionIds: ["a", "c"],
    }),
    question("estatuto-q9", "text", "Como é chamada e organizada em lei a 'área delimitada na escala e voltada à camaradagem/afinidade onde se formam os laços grupais conforme certas patentes (Ex: SubTenentes e Sargentos)'?", "Estatuto, art. 14", "Os Círculos Hierárquicos visam promover a camaradagem sem contudo desrespeitar ou diluir o respeito da escada.", {
      acceptedAnswers: ["circulo hierarquico", "círculo hierárquico", "circulos hierarquicos", "círculos hierárquicos"],
    }),
    question("estatuto-q10", "single", "Ao constatar que um Soldado (Praça), com estabilidade por anos de serviço, teve conduta escandalosa incompatível com a decência do estado militar de modo reiterado, a qual processo oficial de julgamento em comissão técnica ele deve ser preferencialmente submetido segundo as normas estatutárias?", "Estatuto, Julgamento/Foro Específico", "Para praças estabilizadas que cometem ilícitos dessa natureza incompatíveis ou graves, a constituição dos Conselhos ocorre na modalidade Disciplina. Oficiais é modalidade Justificação.", {
      options: [
        { id: "a", label: "Conselho de Promoção Permanente" },
        { id: "b", label: "Conselho de Justificação Administrativa (CJA)" },
        { id: "c", label: "Conselho de Ensino Moral" },
        { id: "d", label: "Conselho de Disciplina" },
      ],
      correctOptionIds: ["d"],
    }),
    question("estatuto-q11", "multiple", "Em matéria de Transgressões Disciplinares ou Penais, o Oficial supracitado (do Conselho de Justificação) que for declarado civil e moralmente indigno e incompatível com o oficialato incorrerá em qual destino final regulamentado em sua carreira?", "Estatuto, Penas Extremos", "O veredicto mais temido por indignidade para o PM de alto escalão é perder posto e patente.", {
      options: [
        { id: "a", label: "Será reconduzido a Soldado de 1ª Classe em desonra ostensiva." },
        { id: "b", label: "Perderá seu posto e sua patente, sendo excluído tacitamente." },
        { id: "c", label: "Perderá seus direitos da Reserva (Pensão) integralmente a revelia e em trânsito civil ordinário." },
        { id: "d", label: "Deverá entregar suas divisas mas preservará função de Estado na SSP em setor administrativo fechado." },
      ],
      correctOptionIds: ["b"],
    }),
    question("estatuto-q12", "single", "Conforme regido pelo texto Estatutário, o preenchimento de um Cargo Militar e a consequente investidura legal em seus contadores de tempo decorrem primariamente da...", "Estatuto, Provimento", "A nomeação dita a lei; nela jaz a semente inicial para exercer o Cargo com todos os preceitos de investidura.", {
      options: [
        { id: "a", label: "Formatura no Dia do Soldado." },
        { id: "b", label: "Aprovação em Conselhos." },
        { id: "c", label: "Nomeação (ou designação formal/determinação)." },
        { id: "d", label: "Compra voluntária pela Associação Profissional." },
      ],
      correctOptionIds: ["c"],
    }),
    question("estatuto-q13", "boolean", "A condição (status) do Policial Militar, seja de Carreira ou Temporário, retira do cidadão-militar as prerrogativas inalienáveis oriundas do seu foro civil comum, tornando nulas todas as demais leis não-militares sobre seu CPF.", "Estatuto, Conjugação de Direitos", "Completamente falso. O militar segue tendo os direitos e obrigações expressas no Código Civil e Constituição da República; as leis militares apenas somam-se em restrições e jurisdições específicas no tocante ao serviço.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("estatuto-q14", "text", "Qual o nome atribuído ao documento régio do Oficial e de garantia de sua honra, correspondente à praça mas dotado de peso de investidura emitido formalmente sob chancela para legitimar o Seu Posto?", "Estatuto, Letras Específicas / Prerrogativas", "Dizemos: 'Oficial da PM investido na sua ___ (Patente)'.", {
      acceptedAnswers: ["patente"],
    }),
    question("estatuto-q15", "single", "Ao oficial-militar da Ativa é expressamente PERMITIDO e respaldado durante a carreira e no exercício das Funções (não-restrito):", "Estatuto, Liberdades Formais vs Proibições", "O militar não pode integrar empresas e usar do fardamento se vendendo politicamente livremente corporativamente; sua função exclusiva foca na missão. Porém há prerrogativas atestadas.", {
      options: [
        { id: "a", label: "Atuar como gerente e sócio ostensivo e de controle de firmas comerciais e de representações diretas na segurança privada (bico formatado)." },
        { id: "b", label: "Gozar dos seus vencimentos regulamentares atrelados ao Cargo, bem como das regalias de atendimento de Saúde previstos." },
        { id: "c", label: "Assumir cargos políticos em coligações e manter função operacional fardada no patrulhamento nas folgas, promovendo o viés eleitoral no Estado Maior." },
        { id: "d", label: "Comerciar peças e armamentos estaduais no Quartel em prol de melhoria de fardamento com aval da SSP." },
      ],
      correctOptionIds: ["b"],
    }),
  ],
};
