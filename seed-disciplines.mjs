import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const disciplines = [
  { name: "Instrução Tática Individual (ITI)", description: "Instrução Tática Individual. Ex: CB Parazinho." },
  { name: "Inteligência de Segurança Pública (ISP)", description: "Inteligência de Segurança Pública." },
  { name: "Criminologia Aplicada à Segurança Pública (CASP)", description: "Criminologia Aplicada à Segurança Pública." },
  { name: "Legislação Institucional - PMAM (LINS)", description: "Legislação Institucional da Polícia Militar do Amazonas." },
  { name: "Direitos Humanos (DH)", description: "Fundamentos de Direitos Humanos aplicados à atividade policial." },
  { name: "Noções de Direito Penal, Direito Processual Penal (DPLE)", description: "Noções fundamentais de Direito Penal e Processual Penal." },
  { name: "Legislação Especial Aplicada a Grupos Vulneráveis (LEAG)", description: "Legislação voltada para proteção de grupos vulneráveis." },
  { name: "Fundamentos Jurídicos da Atividade Policial (FJUR)", description: "Bases constitucionais e jurídicas da atuação da PM." },
  { name: "Noções de Direito Penal Militar e Processual Penal Militar (DPPM)", description: "Noções de Direito Penal Militar e Processual Penal Militar." },
  { name: "Direito Administrativo Disciplinar (DAD)", description: "Regulamento disciplinar e procedimentos da corporação." },
  { name: "Prevenção, Mediação e Resolução de Conflitos (PMRC)", description: "Mediação e resolução pacífica de conflitos. Ex: Cap. PM Mateus." },
  { name: "Gerenciamento Integrado de Crises e Desastres (GICD)", description: "Doutrina e técnicas para crises e catástrofes." },
  { name: "Qualidade de Vida na Segurança Pública (QVSP)", description: "Saúde mental, física e bem-estar do policial militar." },
  { name: "Treinamento Físico Militar (TFM)", description: "Preparação e higienização física militar." },
  { name: "Relações Interpessoais (RIP)", description: "Comunicação e convivência social e profissional." },
  { name: "Saúde e Segurança Aplicada ao Trabalho (SSA)", description: "Segurança e saúde laboral na atividade policial." },
  { name: "Telecomunicações (TCOM)", description: "Comunicação via rádio e sistemas de transmissão corporativos." },
  { name: "Procedimento Documental Administrativo e Operacional (PDA)", description: "Redação oficial militar, partes, boletins e sindicâncias." },
  { name: "Noções de Libras (LIBRAS)", description: "Noções básicas de Língua Brasileira de Sinais." },
  { name: "Ética e Cidadania (ECID)", description: "Princípios morais, éticos e o papel social do policial militar." },
  { name: "Identidade, História e Cultura Organizacional da PMAM (ICOP)", description: "Tradições, história e cultura da Polícia Militar do Amazonas." },
  { name: "Ordem Unida (ORDU)", description: "Treinamento e execução de formaturas, marchas e desfiles militares." },
  { name: "Qualidade no Atendimento ao Público (QAP)", description: "Cortesia, excelência e presteza no atendimento à população." },
  { name: "Atendimento Pré-Hospitalar Tático (APHT)", description: "Atendimento médico em combate e cenários hostis." },
  { name: "Doutrina de Policiamento Ostensivo (DPO)", description: "Táticas e fundamentos de patrulhamento e policiamento ostensivo. Ex: Major." },
  { name: "Preservação e Valorização da Prova (PVP)", description: "Isolamento de local de crime e cadeia de custódia." },
  { name: "Uso Diferenciado da Força (UDF)", description: "Níveis de força, legalidade, necessidade e proporcionalidade. Ex: Ten. Cel. Nilzomar." },
  { name: "Defesa Pessoal e Uso de Algemas (DPUF)", description: "Técnicas de imobilização, autodefesa e contenção com algemas." },
  { name: "Policiamento de Trânsito (PTRA)", description: "Fiscalização, legislação e táticas de policiamento de trânsito." },
  { name: "Brigada de Emergência (BREM)", description: "Combate a princípios de incêndio e evacuação." },
  { name: "Controle de Distúrbios Civis e Praças Desportivas (CDCP)", description: "Táticas de choque e controle de multidões." },
  { name: "Maneabilidade Policial (MPOL)", description: "Táticas de movimentação sob ameaça e progressão em áreas de risco." },
  { name: "Emprego e Manejo de Arma de Fogo (EMAF)", description: "Armamento, munição e tiro policial. Ex: Sgt. Oderley." },
  { name: "POP – Abordagem (POP)", description: "Procedimento Operacional Padrão de Abordagem. Ex: Cap. PM Johnes." },
  { name: "POP – Instrumento de Menor Potencial Ofensivo (POP IMPO)", description: "Dispositivos químicos, elétricos e tecnologias menos letais. Ex: Cap. PM Johnes." },
  { name: "POP – 1º Interventor – Técnicas de negociação (POP 1° INT)", description: "Técnicas de negociação inicial em crises de reféns ou suicidas. Ex: Cap. Newton Neto." },
  { name: "POP – Identificação veicular e Policiamento com VTR 2 rodas (POP IVL)", description: "Policiamento em motocicletas e identificação de adulteração veicular. Ex: Sgt. Andreza." },
  { name: "Policiamento Ambiental (PAMB)", description: "Bases legais e operacionais de policiamento ambiental." },
  { name: "Policiamento Comunitário (PCOM)", description: "Conceito e práticas de polícia comunitária." },
  { name: "Sistema de Segurança Pública (SSP)", description: "Estrutura e cooperação dos órgãos de segurança pública." },
  { name: "Técnicas Avançadas de Maneabilidade em Área Rural (TAM)", description: "Operações rurais, rastreamento, sobrevivência e patrulha em mata." },
  { name: "Tecnologia da Informação e Comunicação (Sistema TCO) (TIC)", description: "Lavratura de Termo Circunstanciado de Ocorrência (TCO) digital." }
];

async function seed() {
  console.log("Iniciando inserção das disciplinas...");
  const connection = await mysql.createConnection({
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    ssl: {}
  });

  try {
    for (const discipline of disciplines) {
      // Verificar se já existe
      const [rows] = await connection.execute(
        "SELECT id FROM pmam_disciplines WHERE name = ? LIMIT 1",
        [discipline.name]
      );
      
      if (rows.length > 0) {
        console.log(`Disciplina já cadastrada: ${discipline.name}`);
        continue;
      }

      await connection.execute(
        "INSERT INTO pmam_disciplines (name, description, created_by, is_active) VALUES (?, ?, ?, 1)",
        [discipline.name, discipline.description, 1]
      );
      console.log(`Inserido com sucesso: ${discipline.name}`);
    }
    console.log("Todas as disciplinas foram semeadas com sucesso!");
  } catch (error) {
    console.error("Erro ao semear disciplinas:", error);
  } finally {
    await connection.end();
  }
}

seed();
