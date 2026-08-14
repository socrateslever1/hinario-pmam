import { describe, expect, it } from "vitest";
import { TOQUES_DE_CORNETA, VOZES_DE_COMANDO } from "./ordemUnidaPanel";
import { getOrdemUnidaPlaybackPlan } from "./ordemUnidaPlayback";

describe("getOrdemUnidaPlaybackPlan", () => {
  it("prioriza o áudio vinculado para um item do painel", () => {
    expect(getOrdemUnidaPlaybackPlan(TOQUES_DE_CORNETA[0]!, "  https://audio.example/sentido.mp3  ")).toEqual({
      mode: "audio",
      audioUrl: "https://audio.example/sentido.mp3",
    });
  });

  it("usa a fala do dispositivo como alternativa para voz de comando sem áudio", () => {
    expect(getOrdemUnidaPlaybackPlan(VOZES_DE_COMANDO[0]!)).toEqual({
      mode: "speech",
      text: VOZES_DE_COMANDO[0]!.title,
    });
  });

  it("não tenta reproduzir corneta sem arquivo associado", () => {
    expect(getOrdemUnidaPlaybackPlan(TOQUES_DE_CORNETA[0]!)).toEqual({ mode: "none" });
  });
});
