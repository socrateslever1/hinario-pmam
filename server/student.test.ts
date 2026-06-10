import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as studentDb from "./studentDb";
import { validateNumerica, getCompanhiaLabel, getPelotonLabel } from "../shared/studentValidation";

function generateRandomNumerica() {
  return Math.floor(Math.random() * 9000) + 1000;
}

describe("Student Authentication System", () => {
  const testNumerica = generateRandomNumerica().toString();
  const testNomeGuerra = "Soldado Teste " + Math.random().toString(36).substring(7);
  const testSenha = "senha123";

  beforeAll(async () => {
    // Limpar dados de teste antes de começar
    try {
      const exists = await studentDb.studentExists(testNumerica);
      if (exists) {
        // Se existir, vamos usar outro número
      }
    } catch (error) {
      // Ignorar erros de limpeza
    }
  });

  describe("Validação de Numérica", () => {
    it("deve validar numérica 1111 (1ª Companhia, 1º Pelotão)", () => {
      const result = validateNumerica("1111");
      expect(result.isValid).toBe(true);
      expect(result.companhia).toBe(1);
      expect(result.peloton).toBe(1);
      expect(result.alunoNumber).toBe(11);
    });

    it("deve validar numérica 5252 (5ª Companhia, 2º Pelotão)", () => {
      const result = validateNumerica("5252");
      expect(result.isValid).toBe(true);
      expect(result.companhia).toBe(5);
      expect(result.peloton).toBe(2);
      expect(result.alunoNumber).toBe(52);
    });

    it("deve validar numérica 2150 (2ª Companhia, 1º Pelotão)", () => {
      const result = validateNumerica("2150");
      expect(result.isValid).toBe(true);
      expect(result.companhia).toBe(2);
      expect(result.peloton).toBe(1);
      expect(result.alunoNumber).toBe(50);
    });

    it("deve rejeitar numérica com menos de 4 dígitos", () => {
      const result = validateNumerica("111");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("4 dígitos");
    });

    it("deve rejeitar numérica com companhia inválida (0)", () => {
      const result = validateNumerica("0111");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Companhia");
    });

    it("deve rejeitar numérica com companhia inválida (6)", () => {
      const result = validateNumerica("6111");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Companhia");
    });

    it("deve rejeitar numérica com pelotão inválido (0)", () => {
      const result = validateNumerica("1011");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Pelotão");
    });

    it("deve rejeitar numérica com pelotão inválido (3)", () => {
      const result = validateNumerica("1311");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Pelotão");
    });

    it("deve rejeitar numérica fora do range (5253)", () => {
      const result = validateNumerica("5253");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("1111 e 5252");
    });
  });

  describe("Labels de Companhia e Pelotão", () => {
    it("deve retornar label correto para companhias", () => {
      expect(getCompanhiaLabel(1)).toBe("1ª Companhia");
      expect(getCompanhiaLabel(2)).toBe("2ª Companhia");
      expect(getCompanhiaLabel(3)).toBe("3ª Companhia");
      expect(getCompanhiaLabel(4)).toBe("4ª Companhia");
      expect(getCompanhiaLabel(5)).toBe("5ª Companhia");
    });

    it("deve retornar label correto para pelotões", () => {
      expect(getPelotonLabel(1)).toBe("1º Pelotão");
      expect(getPelotonLabel(2)).toBe("2º Pelotão");
    });
  });

  describe("Operações de Banco de Dados", () => {
    it("deve criar um aluno com sucesso", async () => {
      const student = await studentDb.createStudent(
        testNumerica,
        testNomeGuerra,
        testSenha,
        1,
        2
      );

      expect(student).toBeDefined();
      expect(student?.numerica).toBe(testNumerica);
      expect(student?.nomeGuerra).toBe(testNomeGuerra);
      expect(student?.companhia).toBe(1);
      expect(student?.peloton).toBe(2);
    });

    it("deve buscar aluno por numérica", async () => {
      const student = await studentDb.getStudentByNumerica(testNumerica);

      expect(student).toBeDefined();
      expect(student?.numerica).toBe(testNumerica);
      expect(student?.nomeGuerra).toBe(testNomeGuerra);
    });

    it("deve verificar senha correta", async () => {
      const isValid = await studentDb.verifyStudentPassword(
        testNumerica,
        testSenha
      );

      expect(isValid).toBe(true);
    });

    it("deve rejeitar senha incorreta", async () => {
      const isValid = await studentDb.verifyStudentPassword(
        testNumerica,
        "senhaErrada"
      );

      expect(isValid).toBe(false);
    });

    it("deve verificar se aluno existe", async () => {
      const exists = await studentDb.studentExists(testNumerica);

      expect(exists).toBe(true);
    });

    it("deve verificar que aluno inexistente não existe", async () => {
      const exists = await studentDb.studentExists("9999");

      expect(exists).toBe(false);
    });
  });
});
