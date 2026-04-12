import { StudyModule, section, question } from "../types";

export const rcontContinenciasModule: StudyModule = {
  slug: "rcont-continencias",
  title: "RCONT - Continências, Honras e Cerimonial",
  shortTitle: "RCONT",
  description: "Tratado fundamental de cortesia armada, respeito hierárquico, manejo cerimonial dos símbolos da pátria, saudação militar individual e formaturas da corporação.",
  sourceTitle: "Regulamento de Continências, Honras, Sinais de Respeito e Cerimonial Militar",
  sourceFileName: "RCONT.pdf",
  textPath: "/study/texts/rcont.txt",
  pages: 41,
  estimatedMinutes: 60,
  difficulty: "intermediario",
  studyMode: "regulation",
  studyUnitTarget: 37,
  questionTarget: 100,
  theme: "Respeito, precedência e cerimonial militar",
  objectives: [
    "Dominar o princípio de que a continência não cumprimenta o indivíduo, mas sim a autoridade nele investida (Impessoalidade).",
    "Automatizar a regra mecânica de quem deve iniciar e quem deve retribuir o ato de respeito (Precedência).",
    "Compreender a imobilidade rigorosa e o procedimento perante a execução cívica do Hino Nacional tocado e cantado.",
    "Fixar o procedimento de continência individual a pé-firme, em deslocamento e guarnecido de armamento.",
    "Compreender o ritual pátrio de engajamento do recruta perante o Pavilhão Nacional (A Bandeira).",
  ],
  quickFacts: [
    "O cumprimento militar (continência) nasce impessoal: presta-se continência de forma subordinada, e a resposta é compulsória.",
    "Se o Hino Nacional for tocado por banda ou gravador oficial (sem canto), o militar toma a posição de sentido e EXCEPCIONALMENTE faz a continência (salvo em deslocamentos coletivos). Mas se o hino for cantado (com voz), permanece tão somente perfilado em atitude de Sentido e NÃO se faz continência à mão.",
    "A continência com guarda-chuva, carregando volumes com a mão direita, deve observar a transferência do peso para a mão esquerda sob penas claras.",
  ],
  sections: [
    section(
      "rcont-base",
      "Fundamentação: Sinais de Respeito e Impessoalidade",
      "Um rito pautado na disciplina inata que difere as forças armadas/auxiliares da burocracia civil.",
      [
        "O RCONT dita os sinais de respeito prestados obrigatoriamente tanto entre militares quanto deles para com os símbolos do Estado ou Nação.",
        "O art. 14 é o coração da norma: a continência é uma atitude impessoal. Não se saúda o amigo 'Fulano', saúda-se a Autoridade Policial/Militar que ali orbita, e a disciplina nela investida.",
        "A continência é de iniciativa de quem detém MAIOR modernidade (menor procedência/patente), devendo o superior hierárquico sempre retribuí-la.",
      ],
      "RCONT, arts. iniciais e art. 14",
      "A continência é impessoal. O mais recruta/moderno atira primeiro, e o antigo responde."
    ),
    section(
      "rcont- individual",
      "A Continência Individual e seus Modais Exatos",
      "As mecânicas musculares variam se o policial caminha, para, carrega pacotes ou está de capacete de moto.",
      [
        "A continência individual deve ser prestada virando-se vivamente o rosto e elevando a mão direita destramente (se descoberto ou coberto, dependendo da escola, mas sempre energicamente voltado para a figura).",
        "Quando em deslocamento cruzando pelo superior, o moderno olha, inicia a saudação regulamentar poucos passos antes do encontro e desfaz tão logo a autoridade seja transpassada.",
        "Em caso de mão direita ocupada de forma inadiável (volumes pesados), o policial deve tomar posição de Sentido vivamente e voltar o rosto perante a autoridade.",
      ],
      "RCONT, arts. 18 a 23",
      "Entendi o detalhe braçal de deslocamento e da imobilização de respeito em caso de braços atados."
    ),
    section(
      "rcont-hino",
      "Ritualística Fina: O Hino Nacional e a Bandeira",
      "Errar isso em formatura ou na rua pode configurar falha grave. Símbolos Pátrios detém as mais altas esferas de respeito.",
      [
        "O hasteamento ostensivo e o Hino Nacional exigem interrupção das atividades. O militar que ouve os acordes oficiais deve fazer alto, tomar sentido e apresentar sua continência individual direcionada para o pavilhão.",
        "Há distinção fulcral: Se o Hino Nacional for Cantado de viva voz pela tropa, os militares permanecem APENAS em Sentido rígido, sem elevar a flanco a continência, cantando ou perfilando em silêncio.",
        "A passagem da Bandeira Nacional por si só em desfiles civis com tropa exige parada e continência por parte de todos os militares espalhados como público.",
      ],
      "RCONT, arts. 24 a 26 e Cap. dos Símbolos",
      "Consolidadei a regra máxima e cobrada de concursos: Hino Tocado = Continência. Hino Cantado = Só sentir/Sentido (Sem continência mão à fronte)."
    ),
    section(
      "rcont-internas",
      "Revistas, Refeições, Embarque e Corpos Tropa",
      "E o que acontece na convivência dos alojamentos quando Oficial de Dia cruza os corredores fechados?",
      [
        "Havendo o adentramento de superior no refeitório civil ou militar (Rancho), o mais antigo da mesa comanda atenção generalizada, não cabendo interromper brutalmente a refeição (salvo Comando Geral), onde apenas o mais antigo recepciona formalmente.",
        "Dentro de trânsito civil em conduções (Ônibus e Vans regulares), o militar fardado, na impossibilidade física de aplicar continência em pé, saudará verbal e formalmente o recém ingressado.",
        "Nos postos de guarda fechada no portão, o Sentinela ostenta a Posição de Ombro Arma e Apresentar Armas consoante o gabarito das autoridades que ali transpõem.",
      ],
      "RCONT, Capítulo Interno / Trânsito e Alojamentos",
      "Evitarei absurdos teóricos como ficar em Sentido se eu estiver num banco balançando dentro do ônibus escolar militar."
    ),
    section(
      "rcont-recrutas",
      "O Pacto Ssangrado: Apresentação da Trova de Recrutas",
      "O juramento à Bandeira Nacional que os Alunos prestam logo no fim de sua maturação orgânica.",
      [
        "A cerimônia do recrutismo prevê que os cidadãos percam sua individualidade e façam juramento público ou em Tropa Cerrada.",
        "Na PMAM e Exército, o ponto alto da solenidade exige prestação de continência, brado à pátria de honrá-la com a própria vida e o desfile dos contingentes perante o estandarte e Pavilhão Nacional.",
        "Trata-se do selo legal militar cerimonial previsto a partir do Art. 165, dotando-os para os encargos ostensivos operacionais no RCONT e formatando moralmente.",
      ],
      "RCONT, arts. 165 a 169",
      "Identifiquei a importância das formalidades onde recruta e a bandeira se conhecem em escala macro."
    ),
  ],
  questions: [
    question("rcont-q1", "single", "A Continência Individual, sob a óptica irrestrita do Regulamento de Sinais de Respeito (Art. 14), se baseia primordialmente na premissa da:", "RCONT, art. 14 / Princípios Básicos", "A continência é estritamente impessoal e tem finalidade de culto à autoridade/instituição.", {
      options: [
        { id: "a", label: "Pessoalidade (Afirma ser um aperto de mão figurado a amigos que alcançaram oficialato)." },
        { id: "b", label: "Impessoalidade (Visa sempre a autoridade, não a pessoa consanguínea ou camarada)." },
        { id: "c", label: "Relatividade (Somente quem quer prestar deve prestar após os 10 anos de serviço)." },
        { id: "d", label: "Espontaneidade Facultativa (Aplicada fora de forma à revelia da doutrina, sendo opção do praça)." },
      ],
      correctOptionIds: ["b"],
    }),
    question("rcont-q2", "boolean", "Havendo o cruzamento em passeios públicos entre um Major ativo e um Tenente-Coronel da Reserva (Inatividade, trajado sem farda/civilmente porém identificável e o Major não o detém visual primário até proximidade), o RCONT obriga tacitamente e de forma iminente o Major a bater a continência enérgica assim que divisar a fisionomia do oficial inativo, retendo a impessoalidade da reverência, pois o Inativo possui mais antiguidade histórica (A despeito de sua vestimenta de passeio à paisana).", "RCONT, Contato com Inativos", "Falso. O militar à paisana (civil/inativo) detém e preserva honrarias e pode receber e ser retribuído da continência cívica e cortesia caso o faça ou se identifique, MAS não compõe sanção a obrigação compulsória mecânica imediata ao cruzamento sem a devida roupagem ostensiva reconhecível mútua prévia regulamentada, e sua subordinação por vestimenta os iguala na esfera civil durante a casualidade.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rcont-q3", "single", "Estando uma guarnição inteira ouvindo de viatura fechada ou na rua a execução da Marcha ou introdução do Hino Nacional tocado por instrumentos na praça cívica, qual atitude corpórea mecânica o PMAM apeado deve imperativamente assumir de imediato?", "RCONT, arts. 24", "Regra mestra descrita taxativamente: se o hino é apenas TOCADO e audível, o militar apeado deve fazer o auto, tomar atitude de 'Sentido' com olhar voltado pra pira/bandeira, e executar a Continência Indivual de Mão de pronto.", {
      options: [
        { id: "a", label: "Fazer alto, tomar a posição de 'Sentido' perfilar-se e executar a Continência de forma contínua para o foco/bandeira até seu fim." },
        { id: "b", label: "Tirar e despir a cobertura da cabeça (Boné/Boina), voltá-lo ao peito do lado do coração e baixar a vista com reverência." },
        { id: "c", label: "Tomar apenas a postura de 'Sentido' (Emudecido), pois a continência com a mão só é devida ao Presidente do Estado e Governador." },
        { id: "d", label: "Aguardar comando do sargento mais próximo para só então engajar na Continência unificada de flanco ou meio." },
      ],
      correctOptionIds: ["a"],
    }),
    question("rcont-q4", "single", "Na exceção mais famosa do cenário anterior, o que muda se o Hino Nacional estiver sendo 'CANTADO' por alunos de um colégio cívico durante a marcha na qual os mesmos PMs guarnecem?", "RCONT, arts. 24 a 26", "A letra da lei orienta que 'Quando Cantado' toda tropa e oficiais devem parar em atitude firme (sentido), porém a saudação a mão (a Continência Individual à destra) fica vetada, de modo a se cantarem ou permanecerem calados perfilados.", {
      options: [
        { id: "a", label: "A continência individual eleva-se à altura da face apenas no final/refrão da canção em deferência." },
        { id: "b", label: "Ignora-se o ato formal, não precisa de parada, continua-se o patrulhamento preventivo sob as vistas locais." },
        { id: "c", label: "O PM toma posição de Descanso cruzando os braços atrás das costas num ato de vigília periférica." },
        { id: "d", label: "Permanece tão somente na postura de cívica de 'Sentido', não devendo prestar formalmente (fazer a) continência individual ou em marcha." },
      ],
      correctOptionIds: ["d"],
    }),
    question("rcont-q5", "multiple", "Na dinâmica rotineira descrita sobre o cruzamento físico em ambientes e ruas: Sobre de quem 'parte a iniciativa inicial do gesto de levar a mão á pala/fronte' e de quem é a 'responsabilidade pelo retorno cívico'?", "RCONT, Iniciativa do Gesto", "A iniciativa primária obriga o moderno a atirar e o antigo se reveste na autoridade com sua obrigação moral inegociável de retribuir com presteza.", {
      options: [
        { id: "a", label: "A Continência Individual deve partir SEMPRE do militar de menor precedência hierárquica (do Moderno pro Antigo)." },
        { id: "b", label: "Todo militar possui também, sob qualquer pretexto de desculpas e rotinas, a OBRIGAÇÃO intrínseca e penalizada de retribuir com presteza e alinhadura à saudação a ele conferida pelo subalterno." },
        { id: "c", label: "Uma vez acionada pelo recruta, a devolução só se torna obrigatória por vias legais se for um Oficial de patente estrita que fora alvo." },
        { id: "d", label: "Inicia primariamente por conta do Comandante Local apontando para os submetidos abaixo dele por ser pai do pelotão." },
      ],
      correctOptionIds: ["a", "b"],
    }),
    question("rcont-q6", "boolean", "É correto dizer que no bojo corporativo onde houveram empates, com militares absolutamente dotados de mesmo grau hierárquico, patente e tempo de folha (Militar e outro de exato grau reunindo-se frente a frente sem comandos expressivos transitórios ou superioridades de área em escala), O RCONT prevê a isenção irrestrita mútua da saudações ou Continências, dispensando assim a saudação visual entre Pares da Força por camaradagem.", "RCONT, arts 14 - O Cruzamento de Pares Absolutos", "Falso. O RCONT ensina na doutrina que militares em idêntica situação ou até sendo pares (mesma Antiguidade precisa), deverão prestar concomitantemente ou em solidariedade prestando primeiro quem enxergar num gesto de cortesia que precede à igualdade estritamente penal de quem atira primariamente, sendo portanto devida entre os iguais de farda.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rcont-q7", "single", "A praça da guarda sentinela fardada em sua cabine num grande evento carrega volumes diversos em ambas as mãos em transferência de caixotes para guarnição em serviço e esbarra de chofre com as comitivas do Coronel do Regimento na chuva de passarela. Diante da impossibilidade premente do braço:", "RCONT, Impossibilidade de Membro Direito / Carga", "O manual e didático prevendo restrições físicas como chuva ou cargas em ambas mãos: manda tomar o Sentido, bater os calcanhares, aprumar frente a comitiva em estátua e fazer movimento cabal de queixo honroso (Viração de rosto).", {
      options: [
        { id: "a", label: "Deve tomar a posição de Sentido de pronto segurando os volumes inertes e voltando a envergadura de rosto e a enérgica menção respeitosa para superior em saudação à viva voz." },
        { id: "b", label: "Lançar a carga no chão imediata sem exceções, danificando os bens se preciso, para livrar a destra da Continência de mão e da glória do oficial." },
        { id: "c", label: "Ignorar a sua volta prestando sua submissão visual velada ao chão em descanso pelo acanhamento dos apetrechos das mãos cheias." },
        { id: "d", label: "Utilizar eximissamente a continência feita de forma Invertida, alçando a Mão Esquerda sobre a testa em casos anulos regulamentares expressamente em Lei." },
      ],
      correctOptionIds: ["a"],
    }),
    question("rcont-q8", "text", "Segundo o regimento estudado, como é denominada a importante Cerimônia Pátria descrita no RCONT (Arts. 165 a 169) voltada ao juramento em brado coletivo que liga e incorpora psicologicamente o cadete/homem ao civismo da farda frente ao estandarte verde-amarelo e tropa formada? Apresentação de ______.", "RCONT, Simbolismos (Recrutas)", "Apresentação dos Recrutas à Bandeira (ou Cerimônia de entrega de Recrutas). A palavra alvo é RECRUTAS.", {
      acceptedAnswers: ["recrutas"],
    }),
    question("rcont-q9", "single", "Símbolos e Hinos do Estado (por Exemplo, Hino do Estado do Amazonas e o respectivo Pavilhão da PMAM da terra):", "RCONT, Honras Estaduais Regionais vs Nacionais Federais", "O respeito aos estandartes operacionais regionais recebe grande valor, mas em escalas federais perdem hierarquia pro Símbolo Mor.", {
      options: [
        { id: "a", label: "Possuem supremacia continental, não fazendo o PM do estado mais continência à Nação Federal se a canção Amazonense tocar nas redondezas ao lado do Nacional simultaneamente." },
        { id: "b", label: "Recebem continência igualmente prescrita segundo o mesmo rito, e devem ser prestadas nos limites restritos do território jurisdicional do estado com atitude cerimonial similar na formagem ostensiva diária no Pátio de Comando, mantendo o protocolo cívico." },
        { id: "c", label: "Foram abolidos em 1988 sendo tratados com atitudes de descanso por figurarem na categoria paramilitar de subordinação inferior sem status formal de rito armado contínuo nos cadernos de Instrução." },
        { id: "d", label: "Obrigam também apenas o cumprimento por partes dos conscriptos em folga de fardamento com suas guarnições desmuniciadas viradas pra capital na data dos aniversários." },
      ],
      correctOptionIds: ["b"],
    }),
    question("rcont-q10", "boolean", "O PMAM, conduzindo com pressa motocicleta ou outro Automóvel com volantes vitais sob a regência viária no meio de estradas de alto fluxo ou cruzamentos difíceis, cruza lateralmente de raspão uma viatura e divisa fisionomicamente nela de relance um Oficial Coronel P/3 na janela; A letra fria do regulamento de trânsito alicerçada com as notas dos artigos do cerimonial determinam expressamente que as regras de cortesia armada (A Continência ou soltura brusca de volantes) se eximem e anulam tacitamente sob a primazia do risco físico direto à vida ou do colapso de responsabilidade mecânica na direção contínua da patrulha veiculada, vetando acrobacias e perigos pelo culto individual da Continência na ocasião da boleia operada.", "RCONT, Deslocamentos Especiais em Condução Cívil/Acidentada", "Verdadeiro. A Segurança e Condução com responsabilidade vital do condutor nas guarnições precede a Continência mecânica imediata na janela/braço de trânsito em alta responsabilidade, devendo apenas sinalizar de bico/buzinas/gestos ou passageiro atirá-la caso seja seguro administrativamente, vetando solturas bruscas.", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["true"],
    }),
    question("rcont-q11", "multiple", "Em recintos fechados e confinados de transições, o manual e regulamento estabelece atitudes para que a corporação não trave num emaranhado mecânico absurdo. Quais normas são aplicáveis caso um membro entre em um recinto em que oficiais conversam em gabinetes de corredor?", "RCONT, Atitudes Interno - OPM Salas", "O PM tem por norma tomar posição eréta e pedir licença verbal cerimoniosa. Não bate bota em reuniões em andamento tracionadas, não tira boné sem anunciar (nas normais).", {
      options: [
        { id: "a", label: "Em refeitórios com mesas lotadas nas refeições, todos simultaneamente em todos os instantes abdicam da continência para tomar um Sentido levantando a bandeja aos céus caso alguém do comando desça, derrubando bandejas." },
        { id: "b", label: "Ao cruzar e iniciar diálogo em sala burocrática, o policial ingressante toma o assento de Sentido formal do lado de fora, ou pede vênia, para a continência ao interlocutor mais velho da mesa, solicitando sua aprovação oral prévia de transito de corredor se for estreito." },
        { id: "c", label: "Não deve prestar Continências no interior apertado e informal de banheiros fechados ou refeitórios em atividades correntes diretas (devendo as atitudes ser substituídas pelo formalismo polido/palavra no caso dos sanitários ou sentinela no alojamento/refeitório)." },
        { id: "d", label: "Sempre retirar o chapéu em ambientes teto baixo e fechamentos como sala do Oficial Superior antes mesmo de proferir uma palavra após a continência desarmada." },
      ],
      correctOptionIds: ["b", "c"],
    }),
    question("rcont-q12", "single", "Nos cortejos fúnebres de policiais tombados em rito oficial e sob Guarda Nacional ou PM Estadual presente no RCONT (Honras Funerárias e Exéquias): O Policial em grupo fardado deve assumir com rigor exato, em relação às passagens próximas da urna e procissão com bandeira estendida...", "RCONT, Exéquias de Ritos", "As exéquias exigem Sentido/Continência na passagem perante ao ataúde ou em forma alinhada pela fração do exército/Guarnições representativas, em homenagem silente imerecida da Pátria e aos pertences.", {
      options: [
        { id: "a", label: "Canto obrigatório em barítono dos ritos castelos acompanhado pela procissão, em descomprometimento militar ao choro cível livre do ombro." },
        { id: "b", label: "Tomada de posição contrita de 'Descanso de Armamento' voltada às costas do cortejo para espantar alhures, demonstrando distanciamento civil." },
        { id: "c", label: "Dever de estrita perfilhagem, assunção de 'Sentido' com olhar voltado para acompanhamento visual seguido da execução vigorada em atitude póstuma da Continência Individual perante a passagem da Urna Coberta e desfile de alas das Comissões." },
        { id: "d", label: "Somente aos oficiais vivos designados nas comitivas a permissão expressiva legal do aceno da boina desdobrando nas viaturas por 1 hora completa." },
      ],
      correctOptionIds: ["c"],
    }),
    question("rcont-q13", "text", "Trata-se de sinal máximo no pátio físico do desfile: Quando o PM cruza seu trajeto rotineiro em via marginal aos quarteis e esbarra presencialmente e de chofre direto com o ___________ do Chefe do Poder Executivo da Federação inteira (Carga da Nação e sua Comitiva) onde ali estenda o estandarte/símbolos. Que autoridade Mor obriga também parar o pedestre armado no cruzamento?", "RCONT, Art. 24 a 26 Símbolos", "Qualquer transito obriga perante O Presidente da República do Brasil (Seja a bandeira, hino, ou sua materialidade de chefe da força bélica em desfiles magnos).", {
      acceptedAnswers: ["presidente", "presidente da republica", "presidente da república"],
    }),
    question("rcont-q14", "boolean", "Nos postos de segurança operacionais na guarita da OPM, o serviço do sentinela e da guarda que vigiam armas o obriga a prestar 'Honras de Ombro Arma ou a Continência Cerimoniosa Formada de Apresentaram Armas em Pátio de Portão' ininterruptamente perfeitamente no momento exato correspondente a toda e qualquer praça moderna, civil sem carteira vistante ou Cabo que esteja passando pela lateral de muro conversando fútil, visando o esgotamento físico do respeito pela quantidade de vezes que o plantão fará as pesadas transições na guarda daquele acesso burocrático.", "RCONT, As regras da Guarda", "Falso. A Guarda Armada detém hierarquia de defesa e restringe honras de Apresentar Armas a oficiais generais/coronéis em funções altas, ou pelotões, as autoridades graduadas não exigem a movimentação exaurida fútil do armamento de forma impensada do plantão (apenas Sentido basico ou as honras prescritas na escala específica do posto fechado daquele rancho).", {
      options: [
        { id: "true", label: "Verdadeiro" },
        { id: "false", label: "Falso" },
      ],
      correctOptionIds: ["false"],
    }),
    question("rcont-q15", "single", "O termo utilizado para descrever de maneira irrefutável para os avaliadores quando um agrupamento numeroso de homens já fixou a formatura formal mas se aguarda uma resposta (Tropa inteira, no aguardo da presença em cerimonial formal e em fileiras, no qual a voz do comandante ressoa em praça pública no aguarde do Exmo Governador) para que este pelotão cumpra os rituais é o comando executivo de 'Tropa...', e sob a ação subsequente aos apitos:", "RCONT, Movimentação da Tropa", "Ação de Continência da Tropa, premente, perfilhada, a uma voz orientada por um Comandante sobre a fração para quem detém representação/patente e o recebe em Cerimonial de Desfile.", {
      options: [
        { id: "a", label: "Tropa Em Esparço livre à direita perante apresentação." },
        { id: "b", label: "Ações de reverência autônoma da Tropa e Continência em formação militar coletiva à Carga e Autoridade investida com o desfile ou apito em Pátio e Hino correspondidos." },
        { id: "c", label: "Atitudes dispersivas operacionais veladas sem foco de saudação até revogar." },
        { id: "d", label: "Revista com recolhimento e fuzil à caixa." },
      ],
      correctOptionIds: ["b"],
    }),
  ],
};
