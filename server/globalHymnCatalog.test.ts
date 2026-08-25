import { describe, expect, it } from "vitest";
import {
  bundledActiveHymns,
  bundledHymnByNumber,
  bundledHymnsByCollection,
  globalHymnCatalog,
} from "./globalHymnCatalog";

describe("catálogo global interno", () => {
  it("mantém hinos e Charlie Mike disponíveis sem o banco remoto", () => {
    expect(globalHymnCatalog).toHaveLength(97);
    expect(bundledActiveHymns()).toHaveLength(26);
    expect(bundledHymnsByCollection("tfm")).toHaveLength(71);
    expect(bundledHymnByNumber(1)?.title).toBe("Hino Nacional Brasileiro");
  });

  it("preserva os vínculos de mídia conhecidos", () => {
    expect(globalHymnCatalog.filter((hymn) => hymn.youtubeUrl)).toHaveLength(24);
  });
});
