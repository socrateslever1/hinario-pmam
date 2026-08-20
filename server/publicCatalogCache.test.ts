import { describe, expect, it } from "vitest";
import {
  PUBLIC_CATALOG_CACHE_CONTROL,
  isPublicCatalogRequest,
} from "../functions/_shared/publicCatalogCache";

describe("cache dos catalogos publicos", () => {
  it("aceita consultas publicas individuais e em lote", () => {
    expect(isPublicCatalogRequest(new Request("https://site.test/api/trpc/buglePanel.list?batch=1"))).toBe(true);
    expect(
      isPublicCatalogRequest(
        new Request("https://site.test/api/trpc/buglePanel.list,ordemUnidaAudio.list,hymns.list?batch=1"),
      ),
    ).toBe(true);
  });

  it("nao permite cache de rotas autenticadas ou mutacoes", () => {
    expect(isPublicCatalogRequest(new Request("https://site.test/api/trpc/auth.me?batch=1"))).toBe(false);
    expect(
      isPublicCatalogRequest(
        new Request("https://site.test/api/trpc/buglePanel.list?batch=1", { method: "POST" }),
      ),
    ).toBe(false);
  });

  it("mantem uma janela curta no navegador e revalidacao na borda", () => {
    expect(PUBLIC_CATALOG_CACHE_CONTROL).toContain("max-age=60");
    expect(PUBLIC_CATALOG_CACHE_CONTROL).toContain("s-maxage=300");
    expect(PUBLIC_CATALOG_CACHE_CONTROL).toContain("stale-while-revalidate=86400");
  });
});
