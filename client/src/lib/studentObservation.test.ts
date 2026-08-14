import { describe, expect, it } from "vitest";
import { buildStudentObservationRequest } from "./studentObservation";

describe("buildStudentObservationRequest", () => {
  it("monta uma anotação FO+ com o código oficial e relato limpo", () => {
    const result = buildStudentObservationRequest({
      studentId: 42,
      type: "positive",
      foCode: "A1",
      details: "  Aluno auxiliou a equipe durante a instrução.  ",
    });

    expect(result).toMatchObject({
      studentId: 42,
      type: "positive",
      foCode: "A1",
    });
    expect(result.note).toContain("Aluno auxiliou a equipe durante a instrução.");
  });

  it("recusa anotação sem aluno, código oficial ou relato suficiente", () => {
    expect(() => buildStudentObservationRequest({
      studentId: 0,
      type: "negative",
      foCode: "A1",
      details: "Relato válido",
    })).toThrow("Selecione o aluno");

    expect(() => buildStudentObservationRequest({
      studentId: 42,
      type: "negative",
      foCode: "",
      details: "Relato válido",
    })).toThrow("código oficial");

    expect(() => buildStudentObservationRequest({
      studentId: 42,
      type: "negative",
      foCode: "A1",
      details: "abc",
    })).toThrow("pelo menos cinco caracteres");
  });
});
