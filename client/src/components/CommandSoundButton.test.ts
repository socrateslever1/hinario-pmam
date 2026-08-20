import { describe, expect, it } from "vitest";
import { ArrowRight, BedDouble, Eye, Footprints, PersonStanding, Star, Swords, VolumeX } from "lucide-react";
import { getCommandVisual } from "./CommandSoundButton";

describe("ícones dos comandos de Ordem Unida", () => {
  it.each([
    ["Descansar", BedDouble],
    ["Sentido", PersonStanding],
    ["Firme", PersonStanding],
    ["Ombro Arma", Swords],
    ["Olhar à Direita", Eye],
    ["Em Direção à Direita", ArrowRight],
    ["Ordinário Marche", Footprints],
    ["Silêncio", VolumeX],
    ["Comandante Geral", Star],
  ])("associa %s a um ícone coerente", (command, expectedIcon) => {
    expect(getCommandVisual(command).Icon).toBe(expectedIcon);
  });

  it("mantém uma opção visual para comandos novos", () => {
    const visual = getCommandVisual("Novo comando operacional", "bell");
    expect(visual.Icon).toBeDefined();
    expect(["red", "yellow", "blue", "green", "orange", "purple"]).toContain(visual.tone);
  });
});
