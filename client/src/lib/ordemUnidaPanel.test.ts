import { describe, expect, it } from "vitest";
import {
  createDefaultSessionConfig,
  DOBRADOS,
  getConfiguredItems,
  getConfiguredSessionItems,
  getSessionItems,
  sanitizeSessionConfig,
  sanitizeSessionItemIds,
  TODOS_OS_ITENS_DE_ORDEM_UNIDA,
  TOQUES_DE_CORNETA,
  VOZES_DE_COMANDO,
} from "./ordemUnidaPanel";

describe("ordemUnidaPanel", () => {
  it("mantém os toques confirmados na referência", () => {
    expect(TOQUES_DE_CORNETA).toHaveLength(52);
    expect(TOQUES_DE_CORNETA.map((item) => item.title)).toEqual(expect.arrayContaining([
      "Sentido",
      "Cavalaria",
      "Ordinário Marche",
      "Última Forma",
    ]));
  });

  it("separa dobrados e vozes de comando em grupos próprios", () => {
    expect(DOBRADOS.map((item) => item.title)).toEqual([
      "Baptista de Melo",
      "Cavalaria",
      "Granadeira",
      "Início Expediente",
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
    const expectedIds = [DOBRADOS[0]!.id, VOZES_DE_COMANDO[0]!.id, TOQUES_DE_CORNETA[3]!.id];

    expect(getSessionItems(expectedIds).map((item) => item.id)).toEqual(expectedIds);
  });

  it("mantém compatibilidade com a lista antiga de favoritos salva no aparelho", () => {
    const ids = [DOBRADOS[0]!.id, VOZES_DE_COMANDO[0]!.id];
    const config = sanitizeSessionConfig(ids);

    expect(config.itemIds).toEqual(ids);
    expect(config.name).toBe("Sessão atual");
    expect(config.currentItemId).toBeNull();
  });

  it("preserva itens pessoais, alterações de rótulo e estado atual válidos", () => {
    const baseId = TOQUES_DE_CORNETA[0]!.id;
    const customId = "custom-sinal-de-teste";
    const config = sanitizeSessionConfig({
      name: "Instrução especial",
      itemIds: [baseId, customId, "invalido", customId],
      customItems: [
        { id: customId, title: "Sinal de teste", type: "corneta", subtitle: "Pessoal" },
        { id: customId, title: "Duplicado", type: "corneta" },
      ],
      overrides: {
        [baseId]: { title: "A Vontade — turma A", subtitle: "Personalizado" },
        invalido: { title: "Não deve entrar" },
      },
      currentItemId: customId,
    });

    expect(config.name).toBe("Instrução especial");
    expect(config.itemIds).toEqual([baseId, customId]);
    expect(config.currentItemId).toBe(customId);
    expect(getConfiguredSessionItems(config).map((item) => item.title)).toEqual(["A Vontade — turma A", "Sinal de teste"]);
    expect(getConfiguredItems(config).some((item) => item.id === customId)).toBe(true);
  });

  it("retorna a configuração vazia quando o armazenamento não possui uma estrutura válida", () => {
    expect(sanitizeSessionConfig(null)).toEqual(createDefaultSessionConfig());
    expect(sanitizeSessionConfig({ name: "   ", itemIds: ["desconhecido"] })).toMatchObject({
      name: "Sessão atual",
      itemIds: [],
      currentItemId: null,
    });
  });
});
