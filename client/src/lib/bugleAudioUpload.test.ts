import { describe, expect, it } from "vitest";
import { BUGLE_AUDIO_MAX_SIZE, validateBugleAudioFile } from "./bugleAudioUpload";

describe("upload de áudio do painel de corneta", () => {
  it("aceita os formatos disponibilizados no seletor", () => {
    for (const name of ["toque.mp3", "toque.wav", "toque.ogg", "toque.m4a", "toque.aac", "toque.webm"]) {
      expect(validateBugleAudioFile({ name, size: 1024 })).toBeNull();
    }
  });

  it("rejeita formato inválido, arquivo vazio e arquivo acima de 50 MB", () => {
    expect(validateBugleAudioFile({ name: "toque.exe", size: 1024 })).toContain("MP3");
    expect(validateBugleAudioFile({ name: "toque.mp3", size: 0 })).toContain("vazio");
    expect(validateBugleAudioFile({ name: "toque.mp3", size: BUGLE_AUDIO_MAX_SIZE + 1 })).toContain("50 MB");
  });
});
