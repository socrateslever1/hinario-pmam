import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

function parseDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 4000),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace("/", ""),
    };
  } catch {
    return null;
  }
}

function dbConfig() {
  const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL || "");
  return {
    host: process.env.TIDB_HOST || fromUrl?.host,
    port: Number(process.env.TIDB_PORT || fromUrl?.port || 4000),
    user: process.env.TIDB_USER || fromUrl?.user,
    password: process.env.TIDB_PASSWORD || fromUrl?.password,
    database: process.env.TIDB_DATABASE || fromUrl?.database,
  };
}

async function main() {
  const cfg = dbConfig();
  console.log(`Conectando ao banco de dados: ${cfg.database} em ${cfg.host}...`);
  const connection = await mysql.createConnection({
    ...cfg,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await connection.beginTransaction();

    // 1. Buscar todos os alunos
    const [students] = await connection.execute(
      "SELECT id, numerica, nome_guerra, nome_completo FROM pmam_students"
    );

    console.log(`\nAnalisando ${students.length} alunos...`);
    let fixedCount = 0;

    for (const student of students) {
      const nomeCompleto = student.nome_completo || "";
      const nomeGuerraAtual = student.nome_guerra || "";

      // Se o nome de guerra atual for igual ao nome completo (ou contiver mais de um nome/espaço), precisa de correção
      const hasSpaces = nomeGuerraAtual.trim().includes(" ");
      const isEqualToFull = nomeGuerraAtual.trim().toLowerCase() === nomeCompleto.trim().toLowerCase();

      if (isEqualToFull || (hasSpaces && nomeCompleto)) {
        const parts = nomeCompleto.trim().split(/\s+/);
        const novoNomeGuerra = parts.length > 1 ? parts[parts.length - 1] : nomeCompleto;

        if (novoNomeGuerra && novoNomeGuerra !== nomeGuerraAtual) {
          // Atualizar na tabela de alunos
          await connection.execute(
            "UPDATE pmam_students SET nome_guerra = ? WHERE id = ?",
            [novoNomeGuerra, student.id]
          );

          // Sincronizar na tabela de usuários pmam_users
          // O login (username) do aluno na tabela pmam_users costuma estar baseado na numerica, e o campo name costuma ser o nome de guerra.
          // Vamos atualizar o name na tabela pmam_users para corresponder ao novo nome de guerra
          await connection.execute(
            "UPDATE pmam_users SET name = ? WHERE email = ? OR name = ?",
            [novoNomeGuerra, `${student.numerica}@pmam.com`, nomeGuerraAtual]
          );

          console.log(`ID ${student.id} (Num ${student.numerica}): "${nomeGuerraAtual}" -> "${novoNomeGuerra}"`);
          fixedCount++;
        }
      }
    }

    await connection.commit();
    console.log(`\nCorreção concluída. Total de alunos corrigidos: ${fixedCount}`);

  } catch (error) {
    await connection.rollback();
    console.error("Erro na transação:", error);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
