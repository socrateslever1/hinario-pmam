import { describe, it, expect, beforeEach, vi } from "vitest";
import * as foDb from "./foDb";

// Mock do módulo mysql
vi.mock("./mysql", () => ({
  query: vi.fn(),
}));

import { query } from "./mysql";

describe("FO Proofs Database", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createFatoObservadoProva", () => {
    it("deve criar uma prova com todos os campos", async () => {
      const mockInsertId = 123;
      (query as any).mockResolvedValueOnce({ insertId: mockInsertId });

      const result = await foDb.createFatoObservadoProva({
        fatoObservadoId: 1,
        arquivoUrl: "https://s3.example.com/prova.jpg",
        tipo: "foto",
        nomeArquivo: "prova.jpg",
        tamanho: 2048,
        mimeType: "image/jpeg",
        criadoPor: 42,
      });

      expect(result).toBe(mockInsertId);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO pmam_fato_observado_provas"),
        expect.arrayContaining([
          1,
          "https://s3.example.com/prova.jpg",
          "foto",
          "prova.jpg",
          2048,
          "image/jpeg",
          42,
        ])
      );
    });

    it("deve criar uma prova com campos opcionais nulos", async () => {
      const mockInsertId = 456;
      (query as any).mockResolvedValueOnce({ insertId: mockInsertId });

      const result = await foDb.createFatoObservadoProva({
        fatoObservadoId: 2,
        arquivoUrl: "https://s3.example.com/video.mp4",
        tipo: "video",
      });

      expect(result).toBe(mockInsertId);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO pmam_fato_observado_provas"),
        expect.arrayContaining([
          2,
          "https://s3.example.com/video.mp4",
          "video",
          null,
          null,
          null,
          null,
        ])
      );
    });
  });

  describe("listFatoObservadoProvas", () => {
    it("deve listar todas as provas de um FO", async () => {
      const mockProvas = [
        {
          id: 1,
          fato_observado_id: 10,
          arquivo_url: "https://s3.example.com/prova1.jpg",
          tipo: "foto",
          nome_arquivo: "prova1.jpg",
          tamanho: 1024,
          mime_type: "image/jpeg",
          data_upload: "2026-06-24T10:00:00Z",
          criado_por: 42,
          created_at: "2026-06-24T10:00:00Z",
          updated_at: "2026-06-24T10:00:00Z",
        },
        {
          id: 2,
          fato_observado_id: 10,
          arquivo_url: "https://s3.example.com/prova2.mp4",
          tipo: "video",
          nome_arquivo: "prova2.mp4",
          tamanho: 5120,
          mime_type: "video/mp4",
          data_upload: "2026-06-24T10:05:00Z",
          criado_por: 42,
          created_at: "2026-06-24T10:05:00Z",
          updated_at: "2026-06-24T10:05:00Z",
        },
      ];

      (query as any).mockResolvedValueOnce(mockProvas);

      const result = await foDb.listFatoObservadoProvas(10);

      expect(result).toHaveLength(2);
      expect(result[0].fatoObservadoId).toBe(10);
      expect(result[0].tipo).toBe("foto");
      expect(result[1].tipo).toBe("video");
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        expect.arrayContaining([10])
      );
    });

    it("deve retornar lista vazia quando não há provas", async () => {
      (query as any).mockResolvedValueOnce([]);

      const result = await foDb.listFatoObservadoProvas(999);

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getFatoObservadoProva", () => {
    it("deve obter uma prova específica", async () => {
      const mockProva = {
        id: 1,
        fato_observado_id: 10,
        arquivo_url: "https://s3.example.com/prova.jpg",
        tipo: "foto",
        nome_arquivo: "prova.jpg",
        tamanho: 2048,
        mime_type: "image/jpeg",
        data_upload: "2026-06-24T10:00:00Z",
        criado_por: 42,
        created_at: "2026-06-24T10:00:00Z",
        updated_at: "2026-06-24T10:00:00Z",
      };

      (query as any).mockResolvedValueOnce([mockProva]);

      const result = await foDb.getFatoObservadoProva(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.tipo).toBe("foto");
    });

    it("deve retornar null quando prova não existe", async () => {
      (query as any).mockResolvedValueOnce([]);

      const result = await foDb.getFatoObservadoProva(999);

      expect(result).toBeNull();
    });
  });

  describe("deleteFatoObservadoProva", () => {
    it("deve deletar uma prova específica", async () => {
      (query as any).mockResolvedValueOnce({ affectedRows: 1 });

      await foDb.deleteFatoObservadoProva(1);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM pmam_fato_observado_provas WHERE id = ?"),
        expect.arrayContaining([1])
      );
    });
  });

  describe("deleteFatoObservadoProvas", () => {
    it("deve deletar todas as provas de um FO", async () => {
      (query as any).mockResolvedValueOnce({ affectedRows: 3 });

      await foDb.deleteFatoObservadoProvas(10);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM pmam_fato_observado_provas WHERE fato_observado_id = ?"),
        expect.arrayContaining([10])
      );
    });
  });
});
