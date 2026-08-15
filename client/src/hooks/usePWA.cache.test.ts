import { afterEach, describe, expect, it, vi } from "vitest";
import { cacheUrlsForOffline, getOfflineCachedUrls } from "./usePWA";

describe("cache offline de URLs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("armazena cada URL válida apenas uma vez e informa as falhas", async () => {
    const cache = { put: vi.fn(), match: vi.fn() };
    vi.stubGlobal("caches", { open: vi.fn().mockResolvedValue(cache) });
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("falha")) throw new Error("rede indisponível");
      return new Response("audio", { status: 200 });
    }));

    const result = await cacheUrlsForOffline([
      "https://audio.example/pronto.mp3",
      "https://audio.example/pronto.mp3",
      "https://audio.example/falha.mp3",
    ]);

    expect(result.cachedUrls).toEqual(["https://audio.example/pronto.mp3"]);
    expect(result.failedUrls).toEqual(["https://audio.example/falha.mp3"]);
    expect(cache.put).toHaveBeenCalledTimes(1);
  });

  it("identifica quais URLs estão disponíveis no cache do aparelho", async () => {
    const cache = {
      put: vi.fn(),
      match: vi.fn(async (url: string) => url.includes("pronto") ? new Response("audio") : undefined),
    };
    vi.stubGlobal("caches", { open: vi.fn().mockResolvedValue(cache) });

    const result = await getOfflineCachedUrls([
      "https://audio.example/pronto.mp3",
      "https://audio.example/ausente.mp3",
    ]);

    expect(result).toEqual(["https://audio.example/pronto.mp3"]);
  });
});
