import { describe, expect, it } from "vitest";
import {
  DOBRADOS,
  getSessionItems,
  sanitizeSessionItemIds,
  TODOS_OS_ITENS_DE_ORDEM_UNIDA,
  TOQUES_DE_CORNETA,
  VOZES_DE_COMANDO,
} from "./ordemUnidaPanel";

describe("ordemUnidaPanel", () => {
  it("mantém os 51 toques confirmados na referência", () => {
    expect(TOQUES_DE_CORNETA).toHaveLength(51);
    expect(TOQUES_DE_CORNETA.map((item) => item.title)).toEqual(expect.arrayContaining([
      "Sentido",
      "Cavalaria",
      "Ordinário Marche",
      "Última Forma",
    ]));
  });

  it("separa dobrados e vozes de comando em grupos próprios", () => {
    expect(DOBRADOS.map((item) => item.title)).toEqual([
      "Cavalaria",
      "Granadeira",
      "Início Expediente",
      "Ordinário Marche",
    ]);
    expect(VOZES_DE_COMANDO.some((item) => item.title === "Sentido")).toBe(true);
    expect(VOZES_DE_COMANDO.every((item) => item.type === "voz")).toBe(true);
  });

  it("mantém IDs únicos para todos os botões do painel", () => {
    const ids = TODOS_OS_ITENS_DE_ORDEM_UNIDA.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("remove favoritos inválidos e duplicados vindos do armazenamento local", () => {
    const firstId = TOQUES_DE_CORNETA[0]!.id;
    const secondId = DOBRADOS[0]!.id;

    expect(sanitizeSessionItemIds([firstId, "invalido", firstId, secondId, 10, null])).toEqual([firstId, secondId]);
    expect(sanitizeSessionItemIds("nao-e-lista")).toEqual([]);
  });

  it("recupera os favoritos na mesma ordem escolhida para a sessão", () => {
    const expectedIds = [DOBRADOS[2]!.id, VOZES_DE_COMANDO[0]!.id, TOQUES_DE_CORNETA[3]!.id];

    expect(getSessionItems(expectedIds).map((item) => item.id)).toEqual(expectedIds);
  });
});
