import { describe, expect, it } from "vitest";
import { CFAP_COMMANDERS, CFAP_TIMELINE, getCfapCommander, mergeCfapCommanders } from "./cfapHistory";

describe("CFAP digital history", () => {
  it("keeps commander slugs unique", () => {
    const slugs = CFAP_COMMANDERS.map((commander) => commander.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps portrait indexes unique and mapped to individual high resolution files", () => {
    const indexes = CFAP_COMMANDERS
      .map((commander) => commander.portraitIndex)
      .filter((value): value is number => value !== undefined);

    expect(indexes).toHaveLength(37);
    expect(new Set(indexes).size).toBe(indexes.length);
    expect(Math.min(...indexes)).toBe(0);
    expect(Math.max(...indexes)).toBe(36);
    const portraits = mergeCfapCommanders().filter((commander) => commander.portraitUrl);
    expect(portraits).toHaveLength(37);
    expect(portraits.every((commander) => commander.portraitUrl?.endsWith(`${commander.slug}.webp`))).toBe(true);
  });

  it("preserves photo placeholders for documentary records without an identified portrait", () => {
    expect(getCfapCommander("adalberto-oliveira-de-souza")?.portraitIndex).toBeUndefined();
    expect(getCfapCommander("idevandro-ricardo-colares")?.portraitIndex).toBeUndefined();
  });

  it("contains the institutional timeline from the historical roots through 2024", () => {
    expect(CFAP_TIMELINE[0]?.year).toBe("1917");
    expect(CFAP_TIMELINE.at(-1)?.year).toBe("2024");
    expect(CFAP_TIMELINE.length).toBeGreaterThanOrEqual(10);
  });

  it("catalogues the unique commander records used by the gallery", () => {
    expect(CFAP_COMMANDERS).toHaveLength(39);
    expect(getCfapCommander("antonio-guedes-brandao")?.name).toBe("Antônio Guedes Brandão");
  });

  it("merges editable records without losing the documentary catalogue", () => {
    const commanders = mergeCfapCommanders([{
      slug: "antonio-guedes-brandao",
      rank: "Coronel PM",
      name: "Antônio Guedes Brandão",
      periods: ["1979 - 1983"],
      portraitUrl: "/history/commanders/antonio-guedes-brandao.webp",
      biography: "Biografia revisada pelo Posto de Comando.",
      highlights: ["Primeiro comandante."],
      videos: [{ title: "Depoimento", url: "https://example.com/video" }],
      sources: [{ title: "Fonte", url: "https://example.com/fonte" }],
      inMemoriam: false,
      isVisible: true,
      sortOrder: 0,
    }]);

    expect(commanders).toHaveLength(39);
    expect(getCfapCommander("antonio-guedes-brandao", commanders)?.biography).toContain("revisada");
  });
});
