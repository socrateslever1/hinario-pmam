import { describe, expect, it } from "vitest";
import {
  calculateFoNetCount,
  classifyFoText,
  getFoCodeDefinition,
  getFoCodesByType,
  isLcEligible,
} from "../shared/foCatalog";

describe("FO catalog and LC balance", () => {
  it("subtracts positive FOs from negative FOs with the same code", () => {
    expect(calculateFoNetCount(2, 0)).toBe(2);
    expect(calculateFoNetCount(2, 1)).toBe(1);
    expect(calculateFoNetCount(1, 2)).toBe(0);
  });

  it("marks LC eligibility only when the net count reaches two", () => {
    expect(isLcEligible(2, 0)).toBe(true);
    expect(isLcEligible(3, 1)).toBe(true);
    expect(isLcEligible(2, 1)).toBe(false);
  });

  it("normalizes codes when looking up FO definitions", () => {
    expect(getFoCodeDefinition("negative", " f11 ")?.code).toBe("F11");
    expect(getFoCodeDefinition("positive", "f11")?.code).toBe("F11");
  });

  it("has a positive counterpart for every negative code", () => {
    const negativeCodes = new Set(getFoCodesByType("negative").map((item) => item.code));
    const positiveCodes = new Set(getFoCodesByType("positive").map((item) => item.code));

    expect([...negativeCodes].filter((code) => !positiveCodes.has(code))).toEqual([]);
  });

  it("classifies free text into the expected negative FO code", () => {
    expect(classifyFoText("negative", "Aluno chegou atrasado para a formatura")?.definition.code).toBe("B1");
    expect(classifyFoText("negative", "Portou-se de forma desrespeitosa perante o instrutor")?.definition.code).toBe("F11");
  });

  it("classifies free text into the expected positive FO code", () => {
    expect(classifyFoText("positive", "Aluno apresentou fardamento impecavel e uniforme alinhado")?.definition.code).toBe("C1");
    expect(classifyFoText("positive", "Demonstrou proatividade destacada nas atividades do curso")?.definition.code).toBe("D3");
  });
});
