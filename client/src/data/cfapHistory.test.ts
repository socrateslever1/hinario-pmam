import { describe, expect, it } from "vitest";
import { CFAP_COMMANDERS, CFAP_TIMELINE, getCfapCommander } from "./cfapHistory";

describe("CFAP digital history", () => {
  it("keeps commander slugs unique", () => {
    const slugs = CFAP_COMMANDERS.map((commander) => commander.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps portrait indexes unique and inside the sprite", () => {
    const indexes = CFAP_COMMANDERS
      .map((commander) => commander.portraitIndex)
      .filter((value): value is number => value !== undefined);

    expect(indexes).toHaveLength(37);
    expect(new Set(indexes).size).toBe(indexes.length);
    expect(Math.min(...indexes)).toBe(0);
    expect(Math.max(...indexes)).toBe(36);
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
});
