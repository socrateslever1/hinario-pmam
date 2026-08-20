import { describe, expect, it } from "vitest";
import { MAX_BUGLE_AUDIO_SIZE, validateBugleUpload } from "./bugleUpload";

describe("validação do upload binário de corneta", () => {
  it("aceita áudio de até 50 MB sem conversão Base64", () => {
    expect(validateBugleUpload("dobrado.mp3", MAX_BUGLE_AUDIO_SIZE))
      .toEqual({ extension: "mp3", mimeType: "audio/mpeg" });
  });

  it("rejeita formato, arquivo vazio e tamanho acima do limite", () => {
    expect(validateBugleUpload("arquivo.exe", 100)).toHaveProperty("error");
    expect(validateBugleUpload("toque.wav", 0)).toHaveProperty("error");
    expect(validateBugleUpload("toque.wav", MAX_BUGLE_AUDIO_SIZE + 1)).toHaveProperty("error");
  });
});
