import { describe, expect, it } from "vitest";
import { normalizeStorageKey, publicStorageUrl, storageKeyFromRouteParam } from "./storagePath";

describe("caminhos do armazenamento de áudio", () => {
  it("gera uma URL pública segura e reversível", () => {
    expect(publicStorageUrl("bugle/marches/dobrado teste.mp3"))
      .toBe("/uploads/bugle/marches/dobrado%20teste.mp3");
    expect(storageKeyFromRouteParam(["bugle", "marches", "dobrado%20teste.mp3"]))
      .toBe("bugle/marches/dobrado teste.mp3");
  });

  it("rejeita caminhos vazios e travessia de diretório", () => {
    expect(() => normalizeStorageKey("../segredo.mp3")).toThrow("inválido");
    expect(() => storageKeyFromRouteParam(undefined)).toThrow("não informado");
  });
});
