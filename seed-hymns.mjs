import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

const hymns = [
  {
    number: 1, title: "Hino Nacional Brasileiro", subtitle: null,
    author: "Joaquim Osório Duque Estrada", composer: "Francisco Manuel da Silva",
    category: "nacional",
    description: "Ao aprender e entoar o Hino Nacional Brasileiro, os Alunos Soldados e Alunos Oficiais da Polícia Militar do Amazonas conectam-se profundamente à identidade nacional. Este hino representa a soberania do Brasil, resgatando a história, os valores e o patriotismo que são fundamentais para a formação de agentes públicos comprometidos com a defesa da pátria e a manutenção da ordem.",
    lyrics: "1ª Parte\n\nOuviram do Ipiranga as margens plácidas\nDe um povo heroico o brado retumbante\nE o Sol da liberdade, em raios fúlgidos\nBrilhou no céu da pátria nesse instante\n\nSe o penhor dessa igualdade\nConseguimos conquistar com braço forte\nEm teu seio, ó liberdade\nDesafia o nosso peito a própria morte!\n\nÓ Pátria amada\nIdolatrada\nSalve! Salve!\n\nBrasil, um sonho intenso, um raio vívido\nDe amor e de esperança à terra desce\nSe em teu formoso céu, risonho e límpido\nA imagem do Cruzeiro resplandece\n\nGigante pela própria natureza\nÉs belo, és forte, impávido colosso\nE o teu futuro espelha essa grandeza\n\nTerra adorada\nEntre outras mil\nÉs tu, Brasil\nÓ Pátria amada!\nDos filhos deste solo és mãe gentil\nPátria amada Brasil!\n\n2ª Parte\n\nDeitado eternamente em berço esplêndido\nAo som do mar e à luz do céu profundo\nFulguras, ó Brasil, florão da América\nIluminado ao Sol do Novo Mundo!\n\nDo que a terra mais garrida\nTeus risonhos, lindos campos têm mais flores\nNossos bosques têm mais vida\nNossa vida, no teu seio, mais amores\n\nÓ Pátria amada\nIdolatrada\nSalve! Salve!\n\nBrasil, de amor eterno seja símbolo\nO lábaro que ostentas estrelado\nE diga o verde-louro dessa flâmula\nPaz no futuro e glória no passado\n\nMas, se ergues da justiça a clava forte\nVerás que um filho teu não foge à luta\nNem teme, quem te adora, a própria morte\n\nTerra adorada\nEntre outras mil\nÉs tu, Brasil\nÓ Pátria amada!\nDos filhos deste solo és mãe gentil\nPátria amada Brasil!"
  },
  {
    number: 2, title: "Hino à Bandeira Nacional", subtitle: null,
    author: "Olavo Bilac", composer: "Francisco Braga", category: "nacional",
    description: "A compreensão e entoação do Hino à Bandeira Nacional são atos de respeito à simbologia que representa a unidade e a grandeza da nação. Deve obrigatoriamente ser cantado na semana do dia da bandeira.",
    lyrics: "I\nSalve, lindo pendão da esperança!\nSalve, símbolo augusto da paz!\nTua nobre presença à lembrança\nA grandeza da Pátria nos traz\n\nRecebe o afeto que se encerra\nEm nosso peito juvenil\nQuerido símbolo da terra\nDa amada terra do Brasil!\n\nII\nEm teu seio formoso retratas\nEste céu de puríssimo azul\nA verdura sem par destas matas\nE o esplendor do Cruzeiro do Sul...\n\nRecebe o afeto que se encerra\nEm nosso peito juvenil\nQuerido símbolo da terra\nDa amada terra do Brasil!\n\nIII\nContemplando o teu vulto sagrado\nCompreendemos o nosso dever\nE o Brasil por seus filhos amado\nPoderoso e feliz há de ser!\n\nRecebe o afeto que se encerra\nEm nosso peito juvenil\nQuerido símbolo da terra\nDa amada terra do Brasil!\n\nIV\nSobre a imensa Nação Brasileira\nNos momentos de festa ou de dor\nPaira sempre sagrada bandeira\nPavilhão da justiça e do amor!\n\nRecebe o afeto que se encerra\nEm nosso peito juvenil\nQuerido símbolo da terra\nDa amada terra do Brasil!"
  },
  {
    number: 3, title: "Hino da Independência", subtitle: null,
    author: "Evaristo da Veiga", composer: "D. Pedro I", category: "nacional",
    description: "O Hino da Independência evoca os ideais de autonomia e liberdade que marcaram um momento crucial na história do Brasil. Deve ser cantado obrigatoriamente na semana da independência.",
    lyrics: "I\nJá podeis, da Pátria filhos\nVer contente a mãe gentil\nJá raiou a liberdade\nNo horizonte do Brasil\n\nBrava gente brasileira!\nLonge vá, temor servil\nOu ficar a pátria livre\nOu morrer pelo Brasil\n\nII\nOs grilhões que nos forjava\nDa perfídia astuto ardil\nHouve mão mais poderosa\nZombou deles o Brasil\n\nBrava gente brasileira!\nLonge vá, temor servil\nOu ficar a pátria livre\nOu morrer pelo Brasil\n\nVII\nNão temais ímpias falanges\nQue apresentam face hostil\nVossos peitos, vossos braços\nSão muralhas do Brasil\n\nBrava gente brasileira!\nLonge vá, temor servil\nOu ficar a pátria livre\nOu morrer pelo Brasil\n\nIX\nParabéns, ó brasileiros!\nJá, com garbo varonil,\nDo universo entre as nações\nResplandece a do Brasil\n\nBrava gente brasileira!\nLonge vá, temor servil\nOu ficar a pátria livre\nOu morrer pelo Brasil"
  },
  {
    number: 4, title: "Hino da Proclamação da República", subtitle: null,
    author: "Joaquim de Medeiros e Albuquerque", composer: "Leopoldo Augusto Miguez", category: "nacional",
    description: "O Hino da Proclamação da República celebra a transição para um sistema republicano e democrático. Deve ser cantado obrigatoriamente na semana da proclamação da república.",
    lyrics: "I\nSeja um pálio de luz desdobrado\nSob a larga amplidão destes céus\nEste canto rebel, que o passado\nVem remir dos mais torpes labéus!\n\nSeja um hino de glória que fale\nDe esperanças de um novo porvir!\nCom visões de triunfos, embale\nQuem, por ele, lutando surgir!\n\nLiberdade! Liberdade!\nAbre as asas sobre nós\nDas lutas na tempestade\nDá que ouçamos tua voz\n\nII\nNós nem cremos que escravos outrora\nTenha havido em tão nobre País\nHoje o rubro lampejo da aurora\nAcha irmãos, não tiranos hostis\n\nSomos todos iguais! Ao futuro\nSaberemos, unidos, levar\nNosso augusto estandarte que, puro\nBrilha, ovante, da Pátria no altar!\n\nLiberdade! Liberdade!\nAbre as asas sobre nós\nDas lutas na tempestade\nDá que ouçamos tua voz\n\nIII\nSe é mister que de peitos valentes\nHaja sangue em nosso pendão\nSangue vivo do herói Tiradentes\nBatizou neste audaz pavilhão!\n\nMensageiro de paz, paz queremos\nÉ de amor nossa força e poder\nMas, da guerra, nos transes supremos\nHeis de ver-nos lutar e vencer!\n\nLiberdade! Liberdade!\nAbre as asas sobre nós\nDas lutas na tempestade\nDá que ouçamos tua voz\n\nIV\nDo Ipiranga, é preciso que o brado\nSeja um grito soberbo de fé!\nO Brasil já surgiu libertado\nSobre as púrpuras régias de pé\n\nEia, pois, brasileiros, avante!\nVerdes louros colhamos louçãos!\nSeja o nosso País triunfante\nLivre terra de livres irmãos!\n\nLiberdade! Liberdade!\nAbre as asas sobre nós!\nDas lutas na tempestade\nDá que ouçamos tua voz!"
  },
  {
    number: 5, title: "Hino do Amazonas", subtitle: null,
    author: "Jorge Tufic Alaúzo", composer: "Cláudio Santoro", category: "nacional",
    description: "Ao entoar o Hino do Amazonas, os Alunos Soldados e Alunos Oficiais da Polícia Militar do Amazonas celebram as belezas e riquezas da região, reforçando o orgulho de servir e proteger essa terra.",
    lyrics: "I\nNas paragens da história o passado\nÉ de guerras, pesar e alegria\nÉ vitória pousando suas asas\nSobre o verde da paz que nos guia\n\nAssim foi que nos tempos escuros\nDa conquista apoiada ao canhão\nNossos povos plantaram seu berço\nHomens livres na planta do chão\n\nAmazonas de bravos que doam\nSem orgulho, nem falsa nobreza\nAos que sonham, teu canto de lenda\nAos que lutam, mais vida e riqueza!\n\nII\nHoje o tempo se faz claridade\nSó triunfa a esperança que luta\nNão há mais o mistério e das matas\nUm rumor de alvorada se escuta\n\nA palavra em ação se transforma\nE a bandeira que nasce do povo\nLiberdade, há de ter no seu pano\nOs grilhões destruindo de novo\n\nAmazonas de bravos que doam\nSem orgulho, nem falsa nobreza\nAos que sonham, teu canto de lenda\nAos que lutam, mais vida e riqueza!\n\nIII\nTão radioso, amanhece o futuro\nNestes rios de pranto selvagem\nQue os tambores da glória despertam\nAo clarão de uma eterna paisagem\n\nMas viver é destino dos fortes\nNos ensina, lutando a floresta\nPela vida que vibra em seus ramos\nPelas aves, suas cores, sua festa\n\nAmazonas de bravos que doam\nSem orgulho, nem falsa nobreza\nAos que sonham, teu canto de lenda\nAos que lutam, mais vida e riqueza!"
  },
  {
    number: 6, title: "Canção do Expedicionário", subtitle: null,
    author: "Guilherme de Almeida", composer: "Spartaco Rossi", category: "militar",
    description: "A Canção do Expedicionário rememora a bravura dos Soldados brasileiros que lutaram na Segunda Guerra Mundial.",
    lyrics: "Você sabe de onde eu venho?\nVenho do morro, do Engenho,\nDas selvas, dos cafezais,\nDa boa terra do coco,\nDa choupana onde um é pouco,\nDois é bom, três é demais,\n\nVenho das praias sedosas,\nDas montanhas alterosas,\nDos pampas, do seringal,\nDas margens crespas dos rios,\nDos verdes mares bravios\nDa minha terra natal.\n\nPor mais terras que eu percorra,\nNão permita Deus que eu morra\nSem que volte para lá;\nSem que leve por divisa\nEsse \"V\" que simboliza\nA vitória que virá:\n\nNossa vitória final,\nQue é a mira do meu fuzil,\nA ração do meu bornal,\nA água do meu cantil,\nAs asas do meu ideal,\nA glória do meu Brasil."
  },
  {
    number: 7, title: "Canção do Exército Brasileiro", subtitle: "Canção do Soldado",
    author: "TC Alberto Augusto Martins", composer: "T. de Magalhães", category: "militar",
    description: "A Canção do Exército Brasileiro, também conhecida como Canção do Soldado, representa o espírito de camaradagem e o comprometimento dos militares.",
    lyrics: "Nós somos da Pátria a guarda,\nFiéis soldados,\nPor ela amados.\nNas cores de nossa farda\nRebrilha a glória,\nFulge a vitória.\n\nEm nosso valor se encerra\nToda a esperança\nQue um povo alcança.\nQuando altiva for a Terra\nRebrilha a glória,\nFulge a vitória.\n\nA paz queremos com fervor,\nA guerra só nos causa dor.\nPorém, se a Pátria amada\nFor um dia ultrajada\nLutaremos sem temor.\n\nComo é sublime\nSaber amar,\nCom a alma adorar\nA terra onde se nasce!\nAmor febril\nPelo Brasil\nNo coração\nNosso que passe!\n\nE quando a nação querida,\nFrente ao inimigo,\nCorrer perigo,\nSe dermos por ela a vida\nRebrilha a glória,\nFulge a vitória.\n\nAssim ao Brasil faremos\nOferta igual\nDe amor filial.\nE a ti, Pátria, salvaremos!\nRebrilha a glória,\nFulge a vitória."
  },
  {
    number: 8, title: "Canção da PMAM", subtitle: null,
    author: "Newton Aguiar", composer: "TEN Ernani Puga", category: "pmam",
    description: "A Canção da PMAM é um elo sonoro que une os membros da Polícia Militar do Amazonas, inspirando um sentimento de pertencimento e orgulho pela instituição.",
    lyrics: "1ª Parte\n\nMilícias do Amazonas, teus soldados\nSão leais, destemidos, são estoicos\nEm Canudos com sangue batizados\nNa luta com jagunços foram heroicos\n\nNo Acre com batalhas e vitórias\nDeram ao Brasil maiores extensões\nVoltara com os troféus cheios de glórias\nEm marcha triunfal aos seus rincões\n\nPela paz, pela ordem sempre atentos\nSoldados da Polícia Militar\nFestejando da Pátria seus eventos\nNa cadência dos tambores a rufar\n\n2ª Parte\n\nDesfilam com a bandeira que ostenta\nOs sinais dos combates que travaram\nA imagem da Pátria representa\nPela qual muitos bravos já tombaram\n\nCoragem, disciplina e heroísmo\nCom muito brio e muita galhardia\nVibrando de orgulho e civismo\nCumprindo seu dever de cada dia\n\nPela paz, pela ordem sempre atentos\nSoldados da Polícia Militar\nFestejando da Pátria seus eventos\nNa cadência dos tambores a rufar"
  },
  {
    number: 9, title: "Canção do Policial Militar", subtitle: null,
    author: "Hildo Rangel", composer: "Thiers Cardoso", category: "pmam",
    description: "A Canção do Policial Militar é uma melodia que ecoa o comprometimento e a dedicação inabalável dos membros da corporação.",
    lyrics: "I\nEm cada momento vivido\nUma verdade vamos encontrar\nEm cada fato esquecido\nUma certeza nos fará lembrar\nEm cada minuto passado\nMais um caminho descobriu\nEm cada soldado tombado\nMais um sol que nasce no céu do Brasil\n\nAqui nós todos aprendemos a viver\nDemonstrando o valor, pois o nosso ideal\nÉ algo que nem todos podem entender\nNa luta contra o mal, ser policial\nÉ sobretudo uma razão de ser\nÉ enfrentar a morte,\nMostra-se um forte no que acontecer\n\nII\nEm cada pessoa encontrada\nMais um amigo para defender\nEm cada ação realizada\nUm coração pronto a agradecer\nEm cada ideal alcançado\nUma esperança para outras missões\nEm cada exemplo deixado\nMais um gesto inscrito em nossas tradições\n\nIII\nEm cada instante da vida\nNossa Polícia Militar\nSerá sempre enaltecida\nEm sua glória secular\nEm cada recanto sagrado\nDeste amado solo brasileiro\nFaremos ouvir nosso brado\nO grito eterno de um bravo guerreiro."
  },
  {
    number: 10, title: "Canção da APM Neper Alencar", subtitle: null,
    author: "AL OF Célio Roberto Bertino dos Santos", composer: "CB José Mitônio Leite dos Santos", category: "pmam",
    description: "A Canção da APM Neper Alencar é um tributo à Academia de Polícia Militar do Amazonas. Somente cantada pelos Alunos Oficiais.",
    lyrics: "Brilha uma estrela nortista\nCom mocidade em seu resplendor\nErguida pela brava conquista\nDe jovens de brio e fervor\n\nLar da bravura e razão\nQue semeia a liderança.\nTens a árdua e sagrada missão\nDe lapidar uma nova esperança\n\nBerço de disciplina e honra,\nÉs nossa estrela, és nosso lar.\nSalve, guardiã do Amazonas,\nAPM Neper Alencar\n\nCriada para forjar a nobreza\nProtetora da população\nGigante a lutar na defesa\nDa justiça e do cidadão\n\nTens a alma juvenil,\nQue no tempo irá perdurar\nEntoarei neste imenso Brasil\nÉs o orgulho da Polícia Militar\n\nBerço de disciplina e honra,\nÉs nossa estrela, és nosso lar,\nSalve, guardiã do Amazonas,\nAPM Neper Alencar"
  },
  {
    number: 11, title: "Canção Brasão do Cadete", subtitle: null,
    author: "Diderot D. Barreto Góes", composer: "Célio Monteiro Fernandes", category: "pmam",
    description: "A Canção Brasão do Cadete é um hino que representa a aspiração e o comprometimento dos cadetes com a formação militar. Somente cantada pelos Alunos Oficiais.",
    lyrics: "Jamais outro brado\nMais forte e entoado\nSerá pelo Brasil!\n\nClarins da vitória,\nCobertos de glória,\nPor todo o céu ecoarão,\n\nA fama levando\nA Pátria lembrando\nQue seus jovens Cadetes\nNão vacilarão,\nEm defender o seu Brasão!\nNão vacilarão,\nEm defender o seu Brasão!\n\nBandeira altaneira,\nAudaz e guerreira,\nNo mundo és a primeira,\n\nPor nós exaltada,\nJamais ultrajada,\nJuramos sempre defendê-la!\n\nClamemos com ardor,\nCom força e vigor\nQue seus jovens Cadetes\nNão vacilarão,\nEm defender o seu Brasão!\nNão vacilarão,\nEm defender o seu Brasão!"
  },
  {
    number: 12, title: "Canção Cadetes do Brasil", subtitle: null,
    author: "Desconhecido", composer: "Desconhecido", category: "pmam",
    description: "A Canção Cadetes do Brasil é um canto que celebra a juventude militar e o espírito de servir à pátria. Somente cantada pelos Alunos Oficiais.",
    lyrics: "Nós somos Cadetes do Brasil\nDe peito forte varonil\nNo qual se encerra uma esperança,\nPunjança,\nVigor\nE acendrado amor\n\nDe alma e fibra militar\nDevoto heróis do grande altar\nDa pátria brasileira!\n\nEm todo momento em que lutamos\nÉ nessa escola em que pensamos\nBerço e alma do Cadete,\nLembrete\nBem vivo\nDe aureolar altivo\n\nE se na guerra a sorte falta\nTe erguemos sempre ó escola\nDe Cadetes"
  },
  {
    number: 13, title: "Canção do CFAP", subtitle: "Canção do Aluno Soldado",
    author: "CEL Antonio Guedes Brandão", composer: "CEL Antonio Guedes Brandão", category: "pmam",
    description: "A Canção do CFAP (Centro de Formação e Aperfeiçoamento de Praças) é um hino que ressoa o processo de formação e treinamento. Somente cantada pelos Alunos Soldados.",
    lyrics: "O CFAP é o alicerce desta milícia,\nDaqui sai nosso produto acabado,\nPara servir a sociedade com presteza e perícia,\nSeja no norte, sul, leste ou oeste do nosso Estado.\n\nVamos lá, vamos lá mocidade vibrante!\nVamos nos preparar, para poder cada vez mais doar\nA nossa pátria, ao nosso Estado e ao nosso semelhante\nPaz e segurança para o bem comum gerar.\n\nAqui nos preparamos para a nobre missão de servir\nCom dedicação, honestidade de propósito e muito amor,\nSem a preocupação da recompensa vir ou não vir,\nPorque a consciência é o nosso mais alto valor.\n\nVamos lá, vamos lá mocidade vibrante!\nVamos nos preparar, para poder cada vez mais doar\nA nossa pátria, ao nosso Estado e ao nosso semelhante\nPaz e segurança para o bem comum gerar."
  },
  {
    number: 14, title: "Canção do Soldado da PMAM", subtitle: "Avante Soldado",
    author: "CB R. Araujo", composer: "Desconhecido", category: "pmam",
    description: "A Canção do Soldado da PMAM, também conhecida como 'Avante Soldado', é um chamado à coragem e ao dever. Deve ser cantada obrigatoriamente na semana do dia do Soldado e Formatura dos Alunos Soldados.",
    lyrics: "1ª Parte\n\nNa Polícia do Amazonas ingressamos\nCom o sonho de um dia defender\nEste solo e essa gente que amamos\nCom coragem se preciso até morrer\n\nNesta escola em que tantos já passaram\nOstentando essa farda com amor\nHoje somos preparados e forjados\nCom bravura, audácia e destemor\n\nAvante! Soldado avante!\nEm defesa deste povo varonil\nAvante! Soldado avante!\nFuturo combatente do Brasil\nAvante! Soldado avante!\nRefazendo o passado que nos honra\nAvante! Soldado avante!\nGuerreiro da Polícia do Amazonas\n\n2ª Parte\n\nDe dia ou de noite patrulhando\nO que aprendi pra sempre irei levar\nServindo ao povo do Amazonas\nE honrando a Polícia Militar\n\nEsta farda que tantos almejaram\nCom orgulho eu posso ostentar\nPara a glória de todos que a portaram\nPelo povo agora irei lutar\n\nAvante! Soldado avante!\nEm defesa deste povo varonil\nAvante! Soldado avante!\nFuturo combatente do Brasil\nAvante! Soldado avante!\nRefazendo o passado que nos honra\nAvante! Soldado avante!\nGuerreiro da Polícia do Amazonas"
  },
  {
    number: 15, title: "Canção Fibra de Herói", subtitle: null,
    author: "Teófilo de Barros Filho", composer: "César Guerra Peixe", category: "pmam",
    description: "A Canção Fibra de Herói é um tributo à fibra e coragem dos homens e mulheres que servem nas forças de segurança.",
    lyrics: "Se a Pátria querida\nFor envolvida pelo inimigo\nNa paz ou na guerra\nDefende a terra contra o perigo\n\nCom ânimo forte, se for preciso\nEnfrenta a morte\nAfronta se lava com fibra de herói\nDe gente brava\n\nBandeira do Brasil\nNinguém te manchará\nTeu povo varonil\nIsso não consentirá\n\nBandeira idolatrada\nAltiva a tremular\nOnde a liberdade é mais uma estrela a brilhar"
  },
  {
    number: 16, title: "Canção Avante Camaradas", subtitle: null,
    author: "Antônio Manoel do Espírito Santo", composer: "Antônio Manoel do Espírito Santo", category: "pmam",
    description: "A Canção Avante Camaradas é um convite à união e solidariedade entre os membros da corporação.",
    lyrics: "Avante, camaradas\nAo tremular do nosso pendão\nVençamos as invernadas\nCom fé suprema no coração\n\nAvante, sem receio\nQue em todos nós a Pátria confia\nMarchemos com alegria, avante!\nMarchemos sem receio\n\nAqui não há quem nos detenha\nE nem quem turbe a nossa galhardia\nQuem nobre missão desempenha\nTemer não pode a tirania\n\nE nunca seremos vencidos\nPois, marchamos sob a luz da crença!\nMarchemos sempre convencidos\nNão há denodo que nos vença!\n\nHavemos, sempre audazes\nAfrontar o perigo\nE seremos perspicazes\nAnte o mais férreo inimigo\n\nPor isso, não tememos\nSempre fortes, sobranceiros\nE com bravura lutaremos!\nBrasileiros nós somos, nós somos brasileiros!"
  },
  {
    number: 17, title: "Canção Adeus Minha Escola Querida", subtitle: null,
    author: "ASP MB Luiz Felipe Menezes de Magalhães", composer: "1º SGT EB Antonino Manuel do Espírito Santo", category: "pmam",
    description: "A Canção Adeus Minha Escola Querida é um momento de reflexão e despedida da fase acadêmica. Deverá ser cantada obrigatoriamente na formatura dos Alunos Soldados e Alunos Oficiais.",
    lyrics: "Adeus, minha escola querida!\nAdeus, vou à pátria servir;\nAdeus, camaradas gentis,\nAdeus, adeus, adeus!\nEu vou partir, eu vou partir\n\nLinda bandeira\nA tremular, a tremular...\nHei de amar até morrer\nÓ meu Brasil, ó meu Brasil!\n\nLinda bandeira\nA tremular, a tremular...\nHei de te amar meu Brasil, meu Brasil\nTerra amada mais que outras mil!"
  },
  {
    number: 18, title: "Canção da Infantaria", subtitle: null,
    author: "Hildo Rangel", composer: "Thiers Cardoso", category: "arma",
    description: "A Canção da Infantaria é um canto que exalta a bravura e a determinação dos Soldados de infantaria.",
    lyrics: "1ª Parte\n\nNós somos estes infantes\nCujos peitos amantes\nNunca temem lutar;\nVivemos,\nMorremos,\nPara o Brasil nos consagrar!\n\nNós, peitos nunca vencidos,\nDe valor, desmedidos,\nNo fragor da disputa,\nMostremos, que em nossa Pátria temos,\nValor imenso,\nNo intenso da luta\n\nÉs a nobre Infantaria,\nDas armas a rainha,\nPor ti daria\nA vida minha,\nE a glória prometida,\nNos campos de batalha,\nEstá contigo,\nAnte o inimigo,\nPelo fogo da metralha!\n\nÉs a eterna majestade,\nNas linhas combatentes,\nÉs a entidade,\nDos mais valentes.\nQuando o toque da vitória\nMarca nossa alegria,\nEu cantarei,\nEu gritarei:\nÉs a nobre Infantaria!\n\n2ª Parte\n\nBrasil, te darei com amor,\nToda a seiva e vigor,\nQue em meu peito se encerra,\nFuzil!\nServil!\nMeu nobre amigo para guerra!"
  },
  {
    number: 19, title: "Canção da Cavalaria", subtitle: "Arma de Heróis",
    author: "José Tavares da Silva", composer: "José Tavares da Silva", category: "arma",
    description: "A Canção da Cavalaria Arma de Heróis homenageia a nobreza e a destemida atuação dos cavalarianos.",
    lyrics: "Arma de heróis\nNa vanguarda a lutar sem temor\nÉs como a estrela\nQue brilha com vivo fulgor!\n\nQuando altaneira\nTu surges a frente das legiões,\nTreme o céu, as montanhas e os tufões\nSilenciam ante teu poder!\n\nEntre o fumo das batalhas\nSurges como um vendaval\nEia valente! Vai para frente a lutar\nE é a hora da carga final!\n\nE se algum dia\nO inimigo audacioso tentar\nPátria adorada\nTua honra virgem macular!\n\nAntes o sol\nSem eflúvio de luz, e sem calor\nNos encontre o deixando, a morrer\nDo que vivos sem te defender!"
  },
  {
    number: 20, title: "Canção Dragões do Ar", subtitle: null,
    author: "GEN PQD EB Germano Arnoldo Pedrozo", composer: "GEN PQD EB Germano Arnoldo Pedrozo", category: "arma",
    description: "A Canção Dragões do Ar é um tributo à ousadia e à coragem dos militares que integram a tropa paraquedista. É considerada uma canção especial dentro do Exército brasileiro.",
    lyrics: "1ª Parte\n\nAvante irmãos!\nAvante heróis!\nEm busca da vitória\nSubindo aos céus,\nLançando-se no ar\nHonrando a nossa história\n\nMais fortes, mais rijos lutando\nSoldados da velha Brigada\nA hora na porta saltando\nA luta pra nós não é nada\n\nBrindamos à morte, ao perigo\nSaudamos também o inimigo, lá, lá, lá, lá, lá!\nE a velha Brigada se bate se mostra mais forte na hora da dor\n\n2ª Parte\n\nAvante irmãos!\nAvante heróis!\nLutar não desejamos\nLutando sempre,\nFugindo nunca\nViver não imploramos\n\nUnidos, coesos, marchando\nSoldados da velha Brigada!\nO gosto da morte lembrando\nAos novos que chegam do nada\n\nBrindamos à morte, ao perigo\nSaudamos também o inimigo, lá, lá, lá, lá, lá!\nE a velha Brigada se bate se mostra mais forte na hora da dor"
  },
  {
    number: 21, title: "Canção do Paraquedista", subtitle: "Eterno Herói",
    author: "GEN PQD EB Newton Lisboa Lemos", composer: "GEN PQD EB Newton Lisboa Lemos", category: "arma",
    description: "A Canção do Paraquedista, também conhecida como 'Eterno Herói', homenageia os soldados que ousam saltar para além dos limites convencionais.",
    lyrics: "Cumprindo no espaço a missão dos condores\nValente e audaz não vacila um instante\nNas asas de prata ao roncar dos motores\nVai a sentinela da pátria distante\n\nChegado o momento descendo dos céus\nNum salto gigante surgindo do anil\nVai ele planando no templo de Deus\nLutar em defesa do nosso Brasil\n\nParaquedista!\nGuerreiro alado vai cumprir sua missão\nNum salto audaz\nVai conquistar do inimigo a posição\n\nParaquedista!\nNo entrechoque das nações sempre serás\nO eterno herói\nQue no avanço da luta ninguém deterá\n\nURRA! URRA!"
  },
  {
    number: 22, title: "Canção do Combatente de Montanha", subtitle: null,
    author: "CEL Marcelo Alvares de Souza", composer: "CEL Marcelo Alvares de Souza", category: "arma",
    description: "A Canção do Combatente de Montanha é um tributo aos desafios enfrentados pelos guerreiros em terrenos elevados e adversos.",
    lyrics: "1ª Parte\n\nSe a guerra escolher como palco\nAs montanhas do nosso Brasil\nLevarei minha fé minha força\nJunto a mim estará meu fuzil\n\nA altitude e o ar rarefeito\nAdaptado tornei-me assim\nEu sinto que sou parte delas\nE que elas são parte de mim\n\nO meu grito de guerra é montanha\nMontanha responde o rochedo\nVencerei o inimigo com garra\nSou guerreiro que luta sem medo\n\n2ª Parte\n\nEscalando as paredes de pedras\nHei de ver a vitória chegar\nE do alto contemplo o horizonte\nA planície o planalto e o mar\n\nE lutar bem mais perto do céu\nEsta é minha nobre missão\nMinha alma se eleva ao topo\nA seguir os meus pés lá estarão\n\nO meu grito de guerra é montanha\nMontanha responde o rochedo\nVencerei o inimigo com garra\nSou guerreiro que luta sem medo"
  },
  {
    number: 23, title: "Oração do Aluno Soldado da PMAM", subtitle: "Oração do CFAP",
    author: null, composer: null, category: "oracao",
    description: "A Oração do Aluno Soldado da PMAM, também conhecida como Oração do CFAP, é um momento de reflexão e busca de força espiritual.",
    lyrics: "Supremo Deus!\nAquele que nos deste a honra de ingressar na família miliciana\nFazei com que possamos ser dignos de trajar o manto dos guerreiros\nE que nossas ações sejam sempre pautadas pela conduta ilibada\nE nos princípios éticos da Polícia Militar do Amazonas\n\nObservando com rigor a hierarquia e a disciplina\nGuia-nos para aprender com louvor as técnicas policiais militares\nPara que estejamos preparados para transpor toda e qualquer barreira ao enfrentarmos o inimigo\n\nNão nos deixe tombar no combate\nMais se assim for nosso destino\nQue seja no cumprimento da missão de defender a sociedade que juramos proteger\n\nCFAP!"
  },
  {
    number: 24, title: "Oração do Guerreiro da ROCAM", subtitle: null,
    author: null, composer: null, category: "oracao",
    description: "A Oração do Guerreiro da ROCAM (Rondas Ostensivas Cândido Mariano) é uma prece que reflete a coragem e a determinação dos Policiais Militares que integram essa unidade especializada.",
    lyrics: "Oh poderoso Deus!\nAbençoa a todos nós policiais da ROCAM\nCom saúde,\nFé,\nSabedoria\nE a coragem do guerreiro imortal\n\nHonrando sempre\nA boina e o braçal\nA qualquer hora do combate\nNo sol e na chuva\nNo campo e no asfalto\n\nNas viaturas patrulhando\nPara o nosso objetivo alcançar\nMesmo com o risco da própria vida\nServir e proteger!"
  },
  {
    number: 25, title: "Oração do Guerreiro de Selva", subtitle: null,
    author: null, composer: null, category: "oracao",
    description: "A Oração do Guerreiro de Selva é um momento de conexão espiritual para aqueles que enfrentam os desafios da selva. Todo Policial Militar que opera na Amazônia é um guerreiro de selva.",
    lyrics: "Senhor,\nTu que ordenaste ao guerreiro da selva\nSobrepujai todos os nossos oponentes\n\nDaí-nos hoje da floresta\nA sobriedade para persistir\nA paciência para emboscar\nA perseverança para sobreviver\nA astúcia para dissimular\nA Fé, para resistir e vencer\n\nE daí-nos também senhor\nA esperança e a certeza do retorno\n\nMas se defendendo essa brasileira Amazônia\nTivermos que perecer, Oh! Deus,\nQue o façamos com dignidade\nE mereçamos a vitória;\n\nSelva!"
  },
  {
    number: 26, title: "Oração do Guerreiro de Caatinga", subtitle: null,
    author: null, composer: null, category: "oracao",
    description: "A Oração do Guerreiro de Caatinga é uma prece que reflete a resistência e a resiliência necessárias para atuar em uma das regiões mais áridas do Brasil.",
    lyrics: "Senhor!\nVós que fostes sábio ao criar os rios e os mares\nPareceis ter esquecido do nosso sertão\nVós que destes aos homens a terra para dela tudo tirar\nNão nos destes a mesma sorte\n\nPorém hoje, ó Deus\nVejo quão generoso fostes\nA nós guerreiros de Caatinga\n\nDeste-nos a resistência ao Sol\nA sapiência para da natureza tudo aproveitar\nA força de vontade para continuar a lutar\nE ante o inimigo jamais recuar\n\nObrigado, Senhor Deus\nPorque criastes um ambiente\nOnde um ser humano comum não possa sobreviver\nPois só os perseverantes\nE os fortes de espírito\nAqui conseguem lutar\n\nCaatinga\nSertão!"
  }
];

async function seed() {
  console.log("Seeding 26 hymns into database...");
  for (const h of hymns) {
    await db.execute(
      sql`INSERT INTO hymns (number, title, subtitle, author, composer, category, lyrics, description, youtubeUrl, audioUrl, isActive)
          VALUES (${h.number}, ${h.title}, ${h.subtitle}, ${h.author}, ${h.composer}, ${h.category}, ${h.lyrics}, ${h.description}, ${null}, ${null}, ${true})`
    );
    console.log("  Inserted: " + h.number + ". " + h.title);
  }
  console.log("\nAll 26 hymns seeded successfully!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
