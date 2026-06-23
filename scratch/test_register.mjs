import dotenv from "dotenv";
dotenv.config();

async function test() {
  try {
    // Importa o módulo dinamicamente após carregar as variáveis de ambiente
    const studentDb = await import("../server/studentDb.ts");
    
    console.log("Buscando aluno 4122...");
    const student = await studentDb.getStudentByNumerica("4122");
    console.log("Aluno encontrado:", student);

    if (student) {
      console.log("Tentando atualizar perfil (simulando cadastro)...");
      await studentDb.updateStudentProfile(student.id, {
        nomeGuerra: "Sócrates Teste",
        senha: "novasenhateste123",
      });
      console.log("Atualização concluída com sucesso!");
    } else {
      console.log("Aluno não encontrado na base.");
    }
  } catch (error) {
    console.error("Erro capturado durante o fluxo:", error);
  } finally {
    process.exit(0);
  }
}

test();
