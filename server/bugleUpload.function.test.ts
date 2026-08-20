import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  setAudioUrl: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { authenticateRequest: vi.fn(async () => ({ id: 7, role: "master" })) },
}));

vi.mock("./bugleUpload", async () => {
  const actual = await vi.importActual<typeof import("./bugleUpload")>("./bugleUpload");
  return {
    ...actual,
    canManageBugleUploads: vi.fn(async () => true),
    getCurrentBugleAudioUrl: vi.fn(async () => null),
    setBugleAudioUrl: mocks.setAudioUrl,
  };
});

import { onRequestPost } from "../functions/api/bugle-upload";

describe("upload binário de corneta no Cloudflare", () => {
  beforeEach(() => {
    mocks.put.mockReset().mockResolvedValue({});
    mocks.setAudioUrl.mockReset().mockResolvedValue(undefined);
  });

  it("envia um áudio de 5 MB ao R2 sem Base64 e grava somente a URL", async () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024)], "dobrado.mp3", { type: "audio/mpeg" });
    const form = new FormData();
    form.append("kind", "march");
    form.append("id", "60001");
    form.append("file", file);

    const response = await onRequestPost({
      request: new Request("https://example.test/api/bugle-upload", { method: "POST", body: form }),
      env: { UPLOADS_BUCKET: { put: mocks.put, delete: vi.fn() } },
      waitUntil: vi.fn(),
    } as any);

    expect(response.status).toBe(200);
    expect(mocks.put).toHaveBeenCalledOnce();
    expect(mocks.put.mock.calls[0][1]).toBeInstanceOf(ReadableStream);
    expect(mocks.setAudioUrl).toHaveBeenCalledWith(
      "march",
      60001,
      expect.stringMatching(/^\/uploads\/bugle\/marches\/60001-.+\.mp3$/),
    );
  });
});
