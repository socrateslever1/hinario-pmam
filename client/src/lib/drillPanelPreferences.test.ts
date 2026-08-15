import { describe, expect, it } from "vitest";
import { buildMarchCombinationPlan, movePreparedItem, sanitizeMarchCombinations } from "./drillPanelPreferences";

describe("preferências do painel de Ordem Unida", () => {
  it("move um botão para antes ou depois na sequência", () => {
    expect(movePreparedItem([10, 20, 30], 20, -1)).toEqual([20, 10, 30]);
    expect(movePreparedItem([10, 20, 30], 20, 1)).toEqual([10, 30, 20]);
    expect(movePreparedItem([10, 20], 10, -1)).toEqual([10, 20]);
  });

  it("descarta combinações locais inválidas", () => {
    expect(sanitizeMarchCombinations([{ id: "a", callId: 1, marchId: 2 }, { id: "a", callId: 9, marchId: 9 }, null])).toEqual([
      { id: "a", callId: 1, marchId: 2 },
    ]);
  });

  it("encadeia toque de marcha e dobrado sem loop", () => {
    const plan = buildMarchCombinationPlan(
      { name: "Ordinário Marche", audioUrl: "/ordinario.mp3" },
      { title: "Batista de Melo", audioUrl: "/dobrado.mp3" },
      "sentido",
    );
    expect(plan).toMatchObject({ ok: true, nextState: "marcha", first: { audioUrl: "/ordinario.mp3" }, second: { audioUrl: "/dobrado.mp3" } });
  });

  it("bloqueia a combinação se o estado ou um áudio não permitir", () => {
    expect(buildMarchCombinationPlan({ name: "Ordinário Marche", audioUrl: "/a.mp3" }, { title: "Dobrado", audioUrl: "/b.mp3" }, "descansar")).toMatchObject({ ok: false });
    expect(buildMarchCombinationPlan({ name: "Ordinário Marche", audioUrl: null }, { title: "Dobrado", audioUrl: "/b.mp3" }, "sentido")).toEqual({ ok: false, reason: "Toque de marcha sem áudio." });
  });
});
