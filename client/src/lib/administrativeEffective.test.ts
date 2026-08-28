import { describe, expect, it } from "vitest";
import { filterEffectiveStudents } from "./administrativeEffective";

const students = [
  { id: 1, numerica: "4122", nomeGuerra: "ALFA", nomeCompleto: "Aluno Alfa", registrationStatus: "active" as const },
  { id: 2, numerica: "4152", nomeGuerra: "BRAVO", nomeCompleto: "Aluno Bravo", registrationStatus: "active" as const },
  { id: 3, numerica: "4199", nomeGuerra: "Vaga disponÃ­vel", nomeCompleto: null, registrationStatus: "available" as const },
];

describe("filterEffectiveStudents", () => {
  it("retorna todo o efetivo quando não há filtro", () => {
    expect(filterEffectiveStudents(students, "  ")).toEqual(students.slice(0, 2));
  });

  it("localiza por numérica, nome de guerra e nome completo", () => {
    expect(filterEffectiveStudents(students, "4122")).toEqual([students[0]]);
    expect(filterEffectiveStudents(students, "bravo")).toEqual([students[1]]);
    expect(filterEffectiveStudents(students, "Aluno Alfa")).toEqual([students[0]]);
  });

  it("não diferencia maiúsculas de minúsculas", () => {
    expect(filterEffectiveStudents(students, "aLfA")).toEqual([students[0]]);
  });

  it("exclui vagas disponiveis dos resultados", () => {
    expect(filterEffectiveStudents(students, "4199")).toEqual([]);
    expect(filterEffectiveStudents(students, "vaga")).toEqual([]);
  });
});
