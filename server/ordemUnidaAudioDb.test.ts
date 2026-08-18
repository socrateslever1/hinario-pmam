import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./mysql", () => ({ query: vi.fn() }));

import { query } from "./mysql";
import * as ordemUnidaAudioDb from "./ordemUnidaAudioDb";

const audioRow = {
  id: 7,
  item_id: "corneta-sentido",
  item_title: "Sentido",
  item_type: "corneta",
  audio_url: "/manus-storage/ordem-unida/sentido.mp3",
  file_key: "ordem-unida/corneta/sentido.mp3",
  file_name: "sentido.mp3",
  file_size: 12345,
  mime_type: "audio/mpeg",
  duration: 8,
  is_active: 1,
  uploaded_by: 1,
  created_at: "2026-08-14T00:00:00Z",
  updated_at: "2026-08-14T00:00:00Z",
};

describe("ordemUnidaAudioDb", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista e converte os áudios ativos para o painel de execução", async () => {
    (query as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ index_name: "uq_pmam_ordem_unida_audios_item_voice" }])
      .mockResolvedValueOnce([audioRow]);

    const audios = await ordemUnidaAudioDb.listActiveOrdemUnidaAudios();

    expect(audios).toEqual([expect.objectContaining({
      itemId: "corneta-sentido",
      itemTitle: "Sentido",
      itemType: "corneta",
      audioUrl: "/manus-storage/ordem-unida/sentido.mp3",
      isActive: true,
    })]);
  });

  it("vincula um novo arquivo ao item e preserva apenas uma versão ativa por toque", async () => {
    (query as any)
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([audioRow]);

    const audio = await ordemUnidaAudioDb.upsertOrdemUnidaAudio({
      itemId: "corneta-sentido",
      itemTitle: "Sentido",
      itemType: "corneta",
      audioUrl: "/manus-storage/ordem-unida/sentido.mp3",
      fileKey: "ordem-unida/corneta/sentido.mp3",
      fileName: "sentido.mp3",
      fileSize: 12345,
      mimeType: "audio/mpeg",
      duration: 8,
      uploadedBy: 1,
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("ON DUPLICATE KEY UPDATE"),
      expect.arrayContaining(["corneta-sentido", "Sentido", "audio/mpeg"]),
    );
    expect(audio).toEqual(expect.objectContaining({ itemId: "corneta-sentido", isActive: true }));
  });

  it("desativa o vínculo sem apagar o registro de auditoria", async () => {
    (query as any).mockResolvedValueOnce({ affectedRows: 1 });

    await ordemUnidaAudioDb.deactivateOrdemUnidaAudio(7);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("SET is_active = 0"),
      [7],
    );
  });
});
