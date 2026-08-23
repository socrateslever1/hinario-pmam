export type CfapCommander = {
  slug: string;
  rank: string;
  name: string;
  periods: string[];
  portraitIndex?: number;
  inMemoriam?: boolean;
  highlights?: string[];
};

export type CfapTimelineItem = {
  year: string;
  title: string;
  description: string;
};

export const CFAP_TIMELINE: CfapTimelineItem[] = [
  {
    year: "1917",
    title: "Escola Regimental",
    description:
      "As raízes históricas da formação sistematizada das praças remontam à Escola Regimental, criada para oferecer instrução básica e militar aos soldados.",
  },
  {
    year: "1965",
    title: "Centro de Instrução Militar — CIM",
    description:
      "O Centro de Instrução Militar foi criado em 7 de abril de 1965, consolidando uma estrutura própria para instrução e formação militar.",
  },
  {
    year: "1972–1979",
    title: "Formação no 1º BPM",
    description:
      "Com a extinção do CIM, a formação de soldados, cabos e sargentos passou ao 1º Batalhão de Polícia Militar, sob coordenação da estrutura do Estado-Maior.",
  },
  {
    year: "1975",
    title: "Previsão legal do CFAP",
    description:
      "A Lei nº 1.143, de 1º de setembro de 1975, já previa o Centro de Formação e Aperfeiçoamento de Praças, embora a unidade ainda não estivesse instalada e operacionalizada.",
  },
  {
    year: "1979–1980",
    title: "Instalação e criação formal",
    description:
      "O Major PM Antônio Guedes Brandão recebeu a missão de instalar o Centro. Foi nomeado comandante em janeiro de 1980; a instalação provisória ocorreu no 1º BPM e o Decreto nº 4.815, de 6 de fevereiro de 1980, criou formalmente o CFAP.",
  },
  {
    year: "21 ABR 1980",
    title: "Sede em Petrópolis",
    description:
      "O CFAP foi transferido para o prédio onde posteriormente passou a funcionar a Creche Tiradentes, na Rua Aristides Rocha, bairro Petrópolis.",
  },
  {
    year: "1982",
    title: "Sede da AM-010 / BR-174",
    description:
      "A unidade passou a ocupar as instalações no entroncamento da AM-010 com a BR-174, no ponto zero, onde militares e alunos ajudaram a estruturar um verdadeiro quartel de ensino.",
  },
  {
    year: "1983",
    title: "Canção do CFAP",
    description:
      "A Canção do CFAP, composta pelo primeiro comandante Major PM Antônio Guedes Brandão, foi homologada em Boletim Geral e consolidou o lema simbólico de que o CFAP é o alicerce desta milícia.",
  },
  {
    year: "1990",
    title: "Doutrina operacional e estande de tiro",
    description:
      "O CFAP incorporou novas técnicas operacionais à formação, incluindo a doutrina do BP-60. No mesmo ano foi inaugurado o estande de tiro Soldado João Rodrigues da Silva.",
  },
  {
    year: "2007–2008",
    title: "Integração ao IESP e Campus III",
    description:
      "Com a reorganização do ensino de segurança pública, a formação passou à estrutura do IESP. O Campus de Ensino III recebeu o nome Coronel Antônio Guedes Brandão em homenagem ao primeiro comandante do CFAP.",
  },
  {
    year: "2010",
    title: "Reativação do CFAP",
    description:
      "A Portaria nº 168/Ajudância Geral/2010 reativou o CFAP na estrutura da PMAM. O Tenente-Coronel PM Antônio César de Oliveira Escóssio foi o primeiro comandante após a reativação.",
  },
  {
    year: "2011+",
    title: "Nova expansão da formação",
    description:
      "Após a reativação, o CFAP e o Campus III atuaram conjuntamente na formação de mais de 2.500 policiais militares oriundos do concurso de 2011.",
  },
  {
    year: "2024",
    title: "Retorno ao marco histórico",
    description:
      "Em abril, o Tenente-Coronel PM Idevandro Ricardo Colares assumiu o comando. Em setembro, o CFAP retornou ao bairro Petrópolis no contexto da implantação do Complexo de Ensino.",
  },
];

export const CFAP_COMMANDERS: CfapCommander[] = [
  {
    slug: "antonio-guedes-brandao",
    rank: "Major PM",
    name: "Antônio Guedes Brandão",
    periods: ["Dez 1979 – Jan 1983"],
    portraitIndex: 0,
    highlights: [
      "Primeiro comandante ligado à instalação e operacionalização do CFAP.",
      "Nomeado comandante em janeiro de 1980, no processo que culminou na criação formal pelo Decreto nº 4.815/1980.",
      "Conduziu a implantação das primeiras sedes e permaneceu à frente da unidade por pouco mais de três anos.",
      "Compôs a Canção do CFAP, homologada em 1983. O Campus de Ensino III posteriormente recebeu seu nome.",
    ],
  },
  {
    slug: "raimundo-carlos-daniel-mar",
    rank: "Major PM",
    name: "Raimundo Carlos Daniel Mar",
    periods: ["Jan 1983 – Fev 1985"],
    portraitIndex: 1,
    highlights: [
      "Antes de assumir o comando, foi designado ainda Capitão para secundar o Major Brandão na instalação do Centro.",
      "A relação histórica publicada registra sua gestão entre janeiro de 1983 e fevereiro de 1985.",
    ],
  },
  { slug: "eber-bessa-rebello", rank: "Major PM", name: "Eber Bessa Rebello", periods: ["Fev 1985 – Out 1985"], portraitIndex: 2 },
  { slug: "raimundo-gutemberg-soares", rank: "Major PM", name: "Raimundo Gutemberg Soares", periods: ["Out 1985 – Abr 1988"], portraitIndex: 3 },
  { slug: "claumendes-cardoso-de-souza", rank: "Major PM", name: "Claumendes Cardoso de Souza", periods: ["Abr 1988 – Jan 1989"], portraitIndex: 4 },
  { slug: "francisco-elias-lustosa-filho", rank: "Tenente-Coronel PM", name: "Francisco Elias Lustosa Filho", periods: ["Jan 1989 – Abr 1989"], portraitIndex: 5 },
  { slug: "ronaldo-francisco-albuquerque-toledano", rank: "Tenente-Coronel PM", name: "Ronaldo Francisco Albuquerque Toledano", periods: ["Abr 1989 – Mar 1991"], portraitIndex: 6 },
  { slug: "fernando-valente-pereira", rank: "Tenente-Coronel PM", name: "Fernando Valente Pereira", periods: ["Mar 1991 – Nov 1991"], portraitIndex: 7, inMemoriam: true },
  { slug: "jose-cabral-jafra", rank: "Tenente-Coronel PM", name: "José Cabral Jafra", periods: ["Nov 1991 – Abr 1992"], portraitIndex: 8 },
  { slug: "celio-nogueira-da-silva", rank: "Tenente-Coronel PM", name: "Célio Nogueira da Silva", periods: ["Abr 1992 – Out 1992"], portraitIndex: 9 },
  { slug: "fernando-antonio-andrade-de-oliveira", rank: "Tenente-Coronel PM", name: "Fernando Antônio Andrade de Oliveira", periods: ["Out 1992 – Jan 1995"], portraitIndex: 10 },
  { slug: "silvestre-torres-de-araujo", rank: "Tenente-Coronel PM", name: "Silvestre Torres de Araújo", periods: ["Jan 1995 – Mar 1996"], portraitIndex: 11 },
  { slug: "jose-alves-de-lima", rank: "Major PM", name: "José Alves de Lima", periods: ["Mar 1996 – Ago 1996"], portraitIndex: 12 },
  { slug: "cristovao-sampaio", rank: "Major PM", name: "Cristóvão Sampaio", periods: ["Ago 1996 – Mai 1997"], portraitIndex: 13 },
  { slug: "fernando-chaves-henriques", rank: "Major PM", name: "Fernando Chaves Henriques", periods: ["Mai 1997 – Jun 1997"], portraitIndex: 14 },
  { slug: "jose-francisco-bonates-correa", rank: "Tenente-Coronel PM", name: "José Francisco Bonates Corrêa", periods: ["Jun 1997 – Set 1997"], portraitIndex: 15 },
  { slug: "mario-cauper-monteiro", rank: "Tenente-Coronel PM", name: "Mário Cauper Monteiro", periods: ["Set 1997 – Mar 1998"], portraitIndex: 16 },
  { slug: "joao-de-souza-pessoa", rank: "Major PM", name: "João de Souza Pessoa", periods: ["Mar 1998 – Mar 1999"], portraitIndex: 17 },
  {
    slug: "adalberto-oliveira-de-souza",
    rank: "Major PM",
    name: "Adalberto Oliveira de Souza",
    periods: ["Mar 1999 – Jun 1999"],
    highlights: ["O nome consta na relação publicada de comandantes do CFAP. A galeria fotográfica fornecida não apresenta retrato identificado para este registro."],
  },
  { slug: "mario-jorge-reis-victor", rank: "Major PM", name: "Mário Jorge Reis Victor", periods: ["Jun 1999 – Set 1999"], portraitIndex: 18 },
  { slug: "jose-militao-rodrigues-da-silva", rank: "Major PM", name: "José Militão Rodrigues da Silva", periods: ["Set 1999 – Fev 2000", "Abr 2001 – Mai 2001"], portraitIndex: 19 },
  { slug: "evandro-araujo-de-brito", rank: "Major PM", name: "Evandro Araújo de Brito", periods: ["Fev 1999 – Mai 2000"], portraitIndex: 20 },
  { slug: "luis-claudio-marques-leao", rank: "Major PM", name: "Luís Cláudio Marques Leão", periods: ["Mai 2000 – Ago 2000", "Fev 2006 – Jan 2008"], portraitIndex: 21 },
  { slug: "jose-nilson-ribeiro-dos-santos", rank: "Tenente-Coronel PM", name: "José Nilson Ribeiro dos Santos", periods: ["Ago 2000 – Abr 2001"], portraitIndex: 22 },
  { slug: "gilberto-amado-bezerra-serudo", rank: "Coronel PM", name: "Gilberto Amado Bezerra Serudo", periods: ["Mai 2001 – Jun 2002", "Jul 2002 – Abr 2005"], portraitIndex: 23 },
  { slug: "mario-jose-anjos-da-silva", rank: "Coronel PM", name: "Mário José Anjos da Silva", periods: ["Abr 2005 – Fev 2006"], portraitIndex: 24 },
  {
    slug: "adalberto-lucio-barbosa-da-silva",
    rank: "Coronel PM",
    name: "Adalberto Lúcio Barbosa da Silva",
    periods: ["Mar 2008 – Ago 2010 — Campus III"],
    portraitIndex: 25,
    highlights: [
      "A relação histórica registra sua direção no período do Campus III.",
      "O artigo registra que, em 2008 e 2009, a turma de 1.000 soldados foi formada em pavilhões da ULBRA Manaus sob a gerência do Diretor do Campus III Coronel PM Adalberto Lúcio Barbosa da Silva.",
    ],
  },
  {
    slug: "antonio-cesar-de-oliveira-escossio",
    rank: "Tenente-Coronel PM",
    name: "Antônio César de Oliveira Escóssio",
    periods: ["Ago 2010 – Abr 2011"],
    portraitIndex: 26,
    highlights: [
      "Primeiro comandante do CFAP após a reativação de 2010.",
      "A reativação decorreu da Portaria nº 168/Ajudância Geral/2010, publicada no Boletim Geral nº 218 de 1º de dezembro de 2010.",
    ],
  },
  { slug: "alcio-vargas-costa-sampaio", rank: "Tenente-Coronel PM", name: "Alcio Vargas Costa Sampaio", periods: ["Abr 2011 – Abr 2011", "Jun 2016 – Dez 2016"], portraitIndex: 27 },
  { slug: "marlon-nazareno-soares-benfica", rank: "Tenente-Coronel PM", name: "Marlon Nazareno Soares Benfica", periods: ["Abr 2011 – Out 2011"], portraitIndex: 28 },
  { slug: "wirley-jose-dos-santos-abdala", rank: "Tenente-Coronel PM", name: "Wirley José dos Santos Abdala", periods: ["Out 2011 – Ago 2014"], portraitIndex: 29 },
  { slug: "ronilton-de-jesus-jacinto-cavalcante", rank: "Tenente-Coronel PM", name: "Ronilton de Jesus Jacinto Cavalcante", periods: ["Fev 2015 – Dez 2015", "Out 2020 – Fev 2021"], portraitIndex: 30 },
  { slug: "regilson-jose-auzier-peixoto", rank: "Tenente-Coronel PM", name: "Regilson José Auzier Peixoto", periods: ["Fev 2017 – Jul 2017"], portraitIndex: 31 },
  { slug: "allen-antonio-ono-de-souza", rank: "Tenente-Coronel PM", name: "Allen Antônio Onó de Souza", periods: ["Jul 2017 – Mar 2018"], portraitIndex: 32 },
  { slug: "carliomar-barros-brandao", rank: "Tenente-Coronel PM", name: "Carliomar Barros Brandão", periods: ["Mar 2018 – Jan 2019"], portraitIndex: 33 },
  { slug: "allayn-neves-da-matta", rank: "Tenente-Coronel PM", name: "Allayn Neves da Matta", periods: ["Jan 2019 – Ago 2020"], portraitIndex: 34 },
  { slug: "nilo-da-silva-correa", rank: "Coronel PM", name: "Nilo da Silva Correa", periods: ["Fev 2021 – Dez 2021"], portraitIndex: 35 },
  { slug: "leandro-benevides-de-souza-ferreira", rank: "Tenente-Coronel PM", name: "Leandro Benevides de Souza Ferreira", periods: ["Out 2023 – Abr 2024"], portraitIndex: 36 },
  {
    slug: "idevandro-ricardo-colares",
    rank: "Tenente-Coronel PM",
    name: "Idevandro Ricardo Colares",
    periods: ["Abr 2024 – atual no artigo-base"],
    highlights: [
      "Assumiu o comando em abril de 2024, conforme o artigo-base.",
      "O artigo destaca que foi o primeiro comandante do CFAP que também havia sido Soldado da PMAM formado nos bancos do próprio CFAP, em 1999.",
      "Durante sua gestão, o CFAP realizou em setembro de 2024 o retorno ao marco histórico no bairro Petrópolis, no contexto do Complexo de Ensino.",
      "A galeria fotográfica fornecida não contém retrato identificado deste registro; por isso, a página utiliza marcador institucional até que uma foto oficial seja adicionada.",
    ],
  },
];

export const CFAP_HISTORY_SOURCE = {
  title: "Histórico do Centro de Formação e Aperfeiçoamento de Praças da Polícia Militar do Amazonas (1979–2024)",
  publication: "Revista PPC – Políticas Públicas e Cidades, v. 14, n. 8, 2025",
  authors: [
    "Leandro Santos Gomes",
    "Samyr Mustafá Lopes Sales",
    "Luany Cristine Souza Egas Soares",
    "Mayara Miranda de Sena Sales",
    "Eurico Dias Teixeira Neto",
    "Idevandro Ricardo Colares",
  ],
};

export function getCfapCommander(slug: string) {
  return CFAP_COMMANDERS.find((commander) => commander.slug === slug);
}
