import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasAttemptedDeploymentRecovery,
  recoverFromStaleDeployment,
  resetDeploymentRecovery,
} from "./deploymentRecovery";

describe("deployment recovery", () => {
  const storage = new Map<string, string>();
  const reload = vi.fn();

  beforeEach(() => {
    storage.clear();
    reload.mockClear();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      location: { reload },
    });
    vi.stubGlobal("navigator", {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("limpa o cache da aplicacao e preserva o cache de audio", async () => {
    const deleteCache = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", {
      keys: vi.fn().mockResolvedValue([
        "hinario-pmam-cache-v8",
        "hinario-pmam-cache-v9",
        "hinario-pmam-audio-v2",
      ]),
      delete: deleteCache,
    });
    await expect(recoverFromStaleDeployment()).resolves.toBe(true);

    expect(deleteCache).toHaveBeenCalledWith("hinario-pmam-cache-v8");
    expect(deleteCache).toHaveBeenCalledWith("hinario-pmam-cache-v9");
    expect(deleteCache).not.toHaveBeenCalledWith("hinario-pmam-audio-v2");
    expect(reload).toHaveBeenCalledOnce();
    expect(hasAttemptedDeploymentRecovery()).toBe(true);
  });

  it("permite apenas uma recuperacao automatica por carregamento", async () => {
    window.sessionStorage.setItem("chunk_retry_refreshed", "true");
    await expect(recoverFromStaleDeployment()).resolves.toBe(false);
  });

  it("remove a trava depois que um modulo carrega", () => {
    window.sessionStorage.setItem("chunk_retry_refreshed", "true");
    resetDeploymentRecovery();
    expect(hasAttemptedDeploymentRecovery()).toBe(false);
  });
});
