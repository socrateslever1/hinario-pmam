import { StudyModule, section, question } from "../types";

export const rdpmamDisciplinaModule: StudyModule = {
  slug: "rdpmam-disciplina",
  title: "RDPMAM - Regulamento Disciplinar da PMAM",
  shortTitle: "RDPMAM",
  description: "Tratado central do rigor militar do estado. Mapeia com exatidão o que constitui falha ética, como classificá-las e como se aplicam as punições, justificações e atenuantes na corporação Amazonense.",
  sourceTitle: "Regulamento Disciplinar da Polícia Militar do Amazonas",
  sourceFileName: "RDPMAM.pdf",
  textPath: "/study/texts/rdpmam.txt",
  pages: 18,
  estimatedMinutes: 65,
  difficulty: "intensivo",
  studyMode: "regulation",
  studyUnitTarget: 114,
  questionTarget: 100,
  theme: "Disciplina, julgamento e defesas no âmbito da corporação",
  objectives: [
    "Compreender a extensão das transgressões: definir a linha tênue do que a lei penal não cobre mas o RDPMAM penaliza.",
    "Categorizar faltas (Leves, Médias, Graves) e fixar a gradação exata do rol de punições aplicáveis.",
    "Dominar as excludentes: o que justifica um ato falho e o que apenas atenua.",
    "Entender o modelo classificatório de Comportamento Militar (Excepcional, Ótimo, Bom, Insuficiente, Mau).",
    "Estudar os prazos e providências cabíveis na área dos Recursos Administrativos de punição.",
  ],
  quickFacts: [
    "Uma transgressão disciplinar é qualquer afronta à ética, aos deveres ou à disciplina que NÃO venha a constituir crime militar ou contravenção tipificada.",
    "A punição basilar de 'Advertência' é feita verbalmente sem enceradeiramento de ficha suja agressiva, mas a 'Repreensão' já é dada com averbação formal na folha do policial.",
    "Toda Praça nova engajada no estado do Amazonas ingressará oficialmente classificada no Comportamento 'BOM'.",
  ],
  sections: [
    section(
      "rdpmam-base",
      "Fundamentos: Esfera Disciplinar Extra-Penal",
      "O manual existe para penalizar o que o Código Penal omite em se tratando de estética, prumo, horário e desídia corporativa.",
      [
        "O regulamento disciplina o comportamento extra-criminal. Se o PM atrasar 15 minutos, ele não cometeu um crime penal passível de prisão pública civil, mas violou o Regulamento Disciplinar do estado.",
        "Sua base assenta-se na hierarquia (escala) e disciplina (obediência irrestrita), abrangendo militares na ativa, e também as obrigações residuais para a Reserva e Reforma.",
        "As ordens, dentro da Corporação, DEVEM ser pronta e incondicionalmente obedecidas, cabendo a quem as deu inteira e total responsabilidade executiva penal.",
      ],
      "RDPMAM, arts. 1, 5, 6 e 7",
      "Entendi o espaço de atuação do RDPMAM: a vida interna, não o código penal de rua."
    ),
    section(
      "rdpmam-transgressao",
      "Tipificação Quântica da Transgressão",
      "Qualificando a severidade da falha administrativa: do deslize formal à subversão hierárquica.",
      [
        "Transgressão é taxativamente a violação da ética, dever e obrigação militar não prevista em Códgio Penal (art 12).",
        "A lei do estado a classifica em Leve, Média ou Grave. (Nunca há classe 'Tolerável' ou 'Gravíssima' purista em termo).",
        "O comandante da Fração tem o poder e o dever inalienável de apurar os pormenores, sem invocar corporativismo sob pena de ser ele mesmo arrolado em transgressão passiva.",
      ],
      "RDPMAM, arts. 12, 13 e 15",
      "Captei que o juízo é hierarquizado, e toda falha cai nas caixinhas Leve, Média ou Grave."
    ),
    section(
      "rdpmam-justificacao",
      "Excludentes e Moduladores (Justificação vs Atenuante)",
      "Você atrasou, mas salvou uma vida na porta do quartel a caminho do expediente. Ou então, atrasou apenas 5 minutos pela primeira vez no ano.",
      [
        "A 'Instância de Justificação' EXTIRPA o crime (Ato lícito). Ocorrem sob ordens superiores expressas, em legítima defesa de si/outrem, por motivo de força maior absoluto ou ignorância plena não criminosa (Art 16).",
        "As 'Atenuantes' não anulam o fato punitivo, só abaixam a pesagem: Exemplos: ser um excelente militar no passado (Bom comportamento), ter cometido para salvar outrém sem excludente absoluta, falta de prática.",
        "Em via oposta, as 'Agravantes' pesam a punição final: Acumulação temporal de falhas (reincidência), cometimento em presença de recrutas ou civis (péssimo exemplo ou vexame público), e má-fé com as instituições.",
      ],
      "RDPMAM, arts. 16, 17 e 18",
      "Sei a diferença máxima: Justificação inocenta a ficha. Atenuante só traz pena piedosa/branda."
    ),
    section(
      "rdpmam-punicoes",
      "Gradação Normativa: As Escalas da Punição",
      "Os graus medicinais que o Estado aplica para reordenar o comportamento das tropas antes de dispensar o militar.",
      [
        "Advertência legal verbal ostensiva reservada (sem pesar averbações gravosas limitantes e duradouras);",
        "Repreensão formal constada em boletim; Detenção (o militar não sai do quartel, mas não tranca em grade restritamente).",
        "A Prisão rigorosa (que pode incidir em isolamento) e por fim, a exclusão/licenciamento sumário nos Conselhos (oficializando banimento 'A Bem da Disciplina' irrevogável no quartel).",
      ],
      "RDPMAM, arts. 21 e 22",
      "Advertir é brandura pedagógica; Repreender é nota manchada; Prisão é a fase limite contígua; Demissão o extremo final."
    ),
    section(
      "rdpmam-comportamento",
      "O Termômetro Funcional de Comportamento",
      "Todo soldado recebe notas por sua prestação de serviço, que moldam bônus e punições sistêmicas subjacentes.",
      [
        "O ingresso primário em folha estadual da PMAM sela automaticamente à praça o conceito 'BOM'.",
        "Sem averbar sanções durante o tempo X, ou com elogios rotundos de estado, ocorre progressão natural às fases Ótimo e Excepcional.",
        "Ao averbar repetidas suspensões, repreensões e prisões diárias na tabela do RDPAM, ocorre rebaixamento reincidente às réguas do 'Insuficiente' e ultimato do 'MAU' que avolumado atrai licença expulsiva.",
      ],
      "RDPMAM, arts. 49 e 50",
      "Gravar na testa: PM entra BOM, eleva-se Ótimo/Excepcional pelas ações, cai para Insuficiente/Mau pelos vícios averbados."
    ),
    section(
      "rdpmam-recursos",
      "Os Instrumentos de Ampla Defesa (Recursos Disciplinares)",
      "O militar tem fóruns processuais adequados à queixa contra punição reputada por ele injusta, ilegal ou ilegítima.",
      [
        "Invocam-se os Requerimentos, Pedidos de Revisões de Punção e Recursos diretos a autoridade que puniu ou a superior a ela nos prazos de trânsito.",
        "Existe garantia de tramitação na Esfera Colegiável (Comandante e Conselhos de revisão).",
        "As normativas estabelecem prazos decadenciais onde após esse marco, o trânsito da decisão é firmado sem possibilidade de reclamações tardias na administração ordinária.",
      ],
      "RDPMAM, arts. 54 a 60",
      "Não basta achar injusto o coronel punir na hora, devo dominar os recursos regimentais por escrito formalizado e respeitoso para anular."
    ),
  ],
  questions: [
    question("rdpmam-q1", "single", "Qual a destinação essencial das Punições Disciplinares capitulada no Art. 21 do Regulamento da PMAM Amazonense?", "RDPMAM, Fiel Finalidade de Punir", "O Art. 21 frisa a importância puramente pedagógica e estabilizadora da punição militar estipulada em prol do batalhão.", {
      options: [
        { id: "a", label: "A arrecadação contábil do Batalhão de Fundos e Indenizações para consertos através das prisões de salário multado." },
        { id: "b", label: "Garantir a exoneração inalienável sistemática a cada ato culposo contínuo dos praças recentes do curso visando depuração anual estadual." },
        { id: "c", label: "O fortalecimento, de maneira fundamentalmente pedagógica, do alicerce da disciplina e a preservação do espírito de corpo e da retidão inerente do policial para não ocorrer reincidências contumazes." },
        { id: "d", label: "Reter prestação servil extenuante compulsória dos insubordinados civis locais." },
      ],
      correctOptionIds: ["c"],
    }),
    question("rdpmam-q2", "boolean", "Havendo conflito sobre a legalidade de um comando: A responsabilidade cabal pelas consequências de uma determinação ditada diretamente ao soldado recai em cima do executor, cabendo a ele a obrigação legal inegociável de desobedecê-la antes de tentar o exaurimento dos questionamentos se achar a ordem estranha.", "RDPMAM, Subordinação a Ordens (Art 7)", "Falso. A responsabilidade por ditar falhas é EXCLUSIVA da autoridade que comandou. O PM só deve recusar ordens sumamente ILEGAIS na esfera inconteste penal. Ordens disciplinares estranhas mas legais devem ser cumpridas prontamente para posterior impetração de Pedido de Recurso pelo executor que discorde com os devidos termos.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rdpmam-q3", "single", "Qual das atitudes corporativas de julgamento extingue o caráter transgressor e zera inteiramente os ritos da sanção, equiparando as condutas punitivas aos atos de plena estrita retidão de obediência sem manchar a fileira processual da transgressao cometida?", "RDPMAM, Atribuindo Isenção", "Exatamente o Rito das Justificativas purga o crime em nome da ação superior lícita.", {
      options: [
        { id: "a", label: "Interposição com Atenuação Leve de Prazo." },
        { id: "b", label: "Conjugação Agravante por Motivo Moral Fútil e Comedido." },
        { id: "c", label: "O Enquadramento por Ação Contínua e Perícia na Ação." },
        { id: "d", label: "Motivos de Causa de Justificação (Legítima Defesa própria do bem social e ordens estritas absolutas não manifestamente criminais)." },
      ],
      correctOptionIds: ["d"],
    }),
    question("rdpmam-q4", "multiple", "No cômputo processado das averiguações processuais do Capitão Comandante de Batalhão para assinar uma sanção à sua tropa, certas variáveis agravam tacitamente com maior peso a Transgressão (Agravantes do Art 18). Correspondem a fatos que afundam a defesa (Agravantes reais do RDPMAM):", "RDPMAM, Agravar Penalidades (Art 18)", "As reincidências e demonstrações humilhantes em frente à subalternos agravam profundamente.", {
      options: [
        { id: "a", label: "Prática simultânea do ato falho em conluio expresso premeditado em associação de três ou mais militares perante o pelotão inferior de modo ostensivo." },
        { id: "b", label: "Cometimento em ambiente fechado a rigor no setor de chaves dos Oficiais unicamente assistido pelo escalão Maior privado, demonstrando arrependimento de lágrimas simultâneo." },
        { id: "c", label: "Cometer o fato motivado por preceitos pífios ou fúteis de discórdia e malquerença." },
        { id: "d", label: "Por absoluta necessidade da prestação de suporte de sobrevivência aos animais do grupamento com base no dever ético cível." },
      ],
      correctOptionIds: ["a", "c"],
    }),
    question("rdpmam-q5", "single", "O recém engajado soldado assumiu a fileira do CFO após o recrutamento exato finalizado. De plano contábil corporativo, por definição legal engatada da lei de trâmites que gere sua carreira, seu comportamento é classificado imediatamente e intrinsecamente como:", "RDPMAM, Inclusões (Art 49 e 50)", "Já dita a lei: Praça recem unida e fixada é taxada tacitamente com o BOM comportamento para inicio primário neutro e probatório.", {
      options: [
        { id: "a", label: "Zero Estrela - Status Pendente por dois exercícios." },
        { id: "b", label: "Excelente/Excepcional por força legal." },
        { id: "c", label: "Bom Comportamento." },
        { id: "d", label: "Insuficiente, subindo para Bom na primeira menção." },
      ],
      correctOptionIds: ["c"],
    }),
    question("rdpmam-q6", "boolean", "O regulamento prescreve na lista de Punições as chamadas 'Admoestação Escrita Sigilosa', as 'Férias Condicionais Prorrogadas', as 'Prisões no Quarto Civil Domiciliar' e a 'Remoção compulsória desonesta sem fardamento'. Esses são graus legais amazonenses estritos de punição previstos nativamente no caput militar.", "RDPMAM, Tipologia Punitiva Estatutária Legal", "Falso. Os referidos termos são invenções ou misturas fantasiosas. As punições legais do RDPMAM assentam-se numa lista expressa inegociável de 5 níveis: Advertência, Repreensão, Detenção, Prisão e Exclusão a bem da disciplina.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rdpmam-q7", "multiple", "Quanto à transgressão formal de classe 'Grave' consumada e sem justificativas possíveis, quem está legalmente investido da competência discricionária sumária de aplicar as sanções inerentes aos integrantes vinculados à sua subordinação (ou a corporação inteira se o caso abranger geral nos limites da sua cadeia)?", "RDPMAM, Competência para Sanção", "Toda punição deve estar abarcada pelo grau de chefia. Governadores e Cmts da PMAM encabeçam a competência total global. Comandantes menores de unidade, local.", {
      options: [
        { id: "a", label: "Apenas Delegados de Polícia Civil escalados de plantão pelo judiciário para assinar Termos das transgressões operacionais ocorridas no limite forense da delegacia no final de semana." },
        { id: "b", label: "Governador do Estado e o Comandante-Geral da PMAM de forma irrestrita a todos sob seu manto amazonense, como ápice da competência disciplinar." },
        { id: "c", label: "Os Comandantes de Batalhão/Escola aos quais estejam submetidos os envolvidos no âmbito da subunidade onde respondem as fileiras." },
        { id: "d", label: "Pares do soldado por comitê de classe representativa em votação semanal aberta (Sindicato unificado na OPM)." },
      ],
      correctOptionIds: ["b", "c"],
    }),
    question("rdpmam-q8", "text", "A '________' disciplinar consiste numa punição aplicada de modo ostensivo na área verbal perante autoridade que testemunhou ou apurou falta primaríssima ou levíssima sem reincidente formal para não gerar registros constrangedores duradouros indevidos e de alto nível de degradação da avaliação nas fichas, preservando-o do rebaixamento gravoso, com efeito meramente pedagógico focado em repreendê-lo oralmente, formalizado mas não avolumado (Responda a punição em 1 palavra que tem o tom de AVISO restrito e sem publicidade vasta e que começa com A).", "RDPMAM, Primeira Punição Educativa", "Trata-se da Advertência formal.", {
      acceptedAnswers: ["advertencia", "advertência"],
    }),
    question("rdpmam-q9", "single", "Qual o teor fático do que o Regulamento define estritamente como a 'Punição de Detenção' nas fileiras?", "RDPMAM, Detenção X Prisão", "Detenção cerceia o recolhimento na Base, não confinando a grade cerrada igual se exige da prisão a rigor, mas inativando as idas sociais até transcorrer.", {
      options: [
        { id: "a", label: "Cerzimento penal cível a base probatória prisional comum da SUSIPE estipulada a regime semiaberto nas penitenciárias por anos." },
        { id: "b", label: "Consiste no confinamento em compartimento fechado em restrição rígida e desonroso, e cassação total temporal com apreensão formal sem autorização de vistas do preso ou de movimentação solta no pátio." },
        { id: "c", label: "Recolhimento contínuo do Policial à sua área de acantonamento respectiva ou quartel sem contudo gerar trancamentos de claustros em celas ou prisões singulares do alojamento designado." },
        { id: "d", label: "Desligar e confiscar sumário e irrevogavelmente as insígnias pelo tempo inativo com estrita interrupção nos devidos subsídios mensais integrais em favor direto a União Federal Nacional para abono da viatura quebrada." },
      ],
      correctOptionIds: ["c"],
    }),
    question("rdpmam-q10", "boolean", "O rol do Art. 12 ensina que um policial PM, cometendo tipicamente no expediente oficial o Crime Militar estrito capitulado no 'Código Penal Militar com suas penas fixadas lá por Deserção ou Furto Militar', está submetido a ser rigorosamente punido sob pretexto penal E enquadrado nas rubricas como penalmente condenado pelo Juizado Civil também sobre a mesma peça penal impetrada no MP, porém isento das esferas secundárias disciplinares e do poder de Transgredir disciplinarmente no Quartel e do Comandante por não ter sido listado nominalmente no livro de Falhas e Transgressões e por prevalecer apenas na comarca judicial.", "RDPMAM, Conjugação Penal e Transgessora", "Falso. Um crime militar também implica em enorme e imensurável transgressão pela incompatibilidade moral do ato. Ele será penalizado civil/penalmente via justiça E Administrativamente julgado e apenado via Transgressões (Licenciamento nos conselhos possivelmente) no batalhão pelo comadante da OPM com suas perdas de patamar disciplinar associadas, independentes ou anexas à apuração maior da vara judicial.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rdpmam-q11", "multiple", "O Recurso Disciplinar e suas particularidades (Revisão e Soltura ou reconsiderações de gravidade) compõe a chance final de anulação dos veredictos pesados. Quando deve e como precisa se portar o militar para obter provimento formal legal ao submeter tal instrumento?", "RDPMAM, Recursos de Transição - Arts 54 e ss.", "Nenhum militar tem o direito preterido na forma do seu recurso desde que escrito de punho formal as instâncias de ofício na escada de quem aplicou punições para as instâncias superiores subsequentes sem insubordinação de teor injurioso verbal e nos prazos dos Decretos Administrativos competentes.", {
      options: [
        { id: "a", label: "Sendo lavrado nominal aos subchefes informais do mesmo escalão ou pares, por e-mails diretos a comissão paralela em praço indeterminado vitalício." },
        { id: "b", label: "Fundamentando o apelo por provas técnicas documentadas impetradas no limite de tempo normatizado na corporação." },
        { id: "c", label: "A via só é validada e garantida caso formulada de forma lícita, de maneira estritamente respeitosa/condizente e por força de interposição à autoridade judicativa encarregada na cadeia de ascensão institucional correta dos OPMs." },
        { id: "d", label: "Reclamar na mídia por vídeos para pressionar o oficial a despachar rapidamente por danos irrevogáveis gerados pelo isolamento na enquadradura e detenção fardada punida localmente sem oitiva formal sumaria em portaria expedida nas instâncias cíveis abertas." },
      ],
      correctOptionIds: ["b", "c"],
    }),
    question("rdpmam-q12", "single", "A conduta enaltecedora na vida interna perante longínquos meses que corrobora para a atenuação final antes das penas das infrações pontuais recém advenientes de natureza culposa para serem submetidas, em contraponto exato à incidência ou presença negativa agasalhada pelas chamadas circunstâncias...", "RDPMAM, Opostos Jurídicos Militares Circunstanciais", "As forças se chocam: O tempo prévio elogiável do pm opera nas chamadas circunstâncias ATENUANTES enquanto atos ignóbeis se abrigam nas definições doutrinárias denominadas AGRAVANTES perante sua punição disciplinar final dosada justificada.", {
      options: [
        { id: "a", label: "Absolutórias contra as Absurdidades." },
        { id: "b", label: "Atenuantes contra as Circunstâncias Agravantes de peso punitivo." },
        { id: "c", label: "Apelantes contra Penas Civis em Trânsito julgado das Leis Especiais." },
        { id: "d", label: "Remissões Tributáveis diante de Compensações Extraordinárias Inflexíveis." },
      ],
      correctOptionIds: ["b"],
    }),
    question("rdpmam-q13", "text", "O PM sofreu sanção máxima sumária aplicada aos atos degradantes e flagrantemente infames ou crimes horrendos não compatíveis com a estância estadual militar moral na tropa constituída (Por exemplo furtou a corporação dolosamente). Ele sofrerá fatalmente e indissociavelmente o rito sumário ou procedimental da 'Exclusão ou Licenciamento a ___________.' (Utilize três palavras para as lacunas clássicas dessa punição, iniciadas pela letra B e D).", "RDPMAM, Modalidade Extrema - Art 22", "Bem da Disciplina.", {
      acceptedAnswers: ["bem da disciplina"],
    }),
    question("rdpmam-q14", "boolean", "O Praça ingressado foi avaliado logo no primeiro ciclo anual na fileira OPM. Como não teve infrações, ele sobe pra categoria Ótimo e Excepcional. Ele pode permanecer nesse patamar magnânimo com o simples transcurso orgânico e contínuo da passagem da vida burocrática por mais uma dúzia sem fim cronológico anual, mesmo cometendo uma série de punições da categoria Repreensão de modo reincidente leve, dado que a Repreensão (Sem prender celas) isolada formalmente não tem validade/força processual pra derrubá-lo para Insuficiente nos balancetes previstos estatutários.", "RDPMAM, Oscilações Preditivas de Tabela Funcional Comportamento", "Falso. As infrações averbadas (Até Repreensão, com a exceção expressa da Advertência verbal limpa apenas) abatem severamente tempo ou rebaixam diretamente e gradativamente os ranques se acumuladas, logo um PM que passa a receber punições formais reincidentemente volta forçado pra Bom, Insuficiente e até o perigo do Mau sob trâmite.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rdpmam-q15", "single", "A diferença temporal em regime estrito fechado no confinamento dos OPMs para Prisão e Detenção do infrator processado comete restrições que diferem em rigidez e cerceamentos físicos estipulados limitantes temporais do aquartelamento em serviço que durarão com restrição final máxima contínua no montante até estourar estipulada expressamente balizada na redação originária de...", "RDPMAM, Punições - Duração Max", "A normativa restritora e fechamento a pretexto sumário administrativo local não detém escopos do sistema prisional penal comum em décadas civil, limitando o recolhemento do aquartelamento contínuo sancionado nas esferas de Detenção ou prisão no escopo fechado regido disciplinar local para punir até...", {
      options: [
        { id: "a", label: "10 (dez) dias restritivos contínuos ininterruptos nas OPMs onde cumpre a ordem e responde." },
        { id: "b", label: "Trinta (30) dias engajados na folha, com privações operacionais e fechaduras com guardas ou limitação da guarnição do pátio para reflexões/punibilidade restritiva." },
        { id: "c", label: "Em até 6 meses com suspensão cível e descontos tributários de fardamentos aplicados e devoluções na Junta local dos praças detidos na capital sem contato civil familiar integralmente com seus fuzis guardados sob pena pecuniária isolada." },
        { id: "d", label: "Não ultrapassam nunca de prazo fechado de 48 horas como restrição impeditiva em alinhadas aos mandados constitucionais civis não militares e das sentenças penais em trânsito de comarcas de crimes do estado comum isolando-se os militares em audiências presuntivas liberatórias com fiança por falta administrativa rotineira e leves na corporação com recursos do Ministério Público anexadas." },
      ],
      correctOptionIds: ["b"],
    }),
  ],
};
