import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeClientLogout } from "./logout";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn(() => null),
    get length() { return values.size; },
  } as Storage;
}

describe("logout do cliente", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: createStorage({
        "auth-user-info": "{}",
        "pmam-email-session": "sessão-legada",
        "pmam-email-session-persistent": "{}",
        gradeStudentId: "1",
        gradeStudentToken: "token",
      }),
      sessionStorage: createStorage({
        "pmam-email-session": "{}",
        "pmam-email-session-persistent": "sessão-legada",
      }),
      dispatchEvent: vi.fn(),
    });
  });

  it("apaga todas as sessões antes de confirmar o logout no servidor", async () => {
    const setAuthUser = vi.fn();
    const requestServerLogout = vi.fn(async () => {
      expect(window.localStorage.getItem("auth-user-info")).toBeNull();
      expect(window.localStorage.getItem("pmam-email-session")).toBeNull();
      expect(window.localStorage.getItem("pmam-email-session-persistent")).toBeNull();
      expect(window.sessionStorage.getItem("pmam-email-session")).toBeNull();
      expect(window.sessionStorage.getItem("pmam-email-session-persistent")).toBeNull();
      expect(window.localStorage.getItem("gradeStudentToken")).toBeNull();
    });

    await executeClientLogout({
      cancelAuthQuery: vi.fn(async () => undefined),
      setAuthUser,
      requestServerLogout,
    });

    expect(requestServerLogout).toHaveBeenCalledOnce();
    expect(setAuthUser).toHaveBeenCalledWith(null);
  });

  it("transforma cliques simultâneos em uma única solicitação", async () => {
    let finish!: () => void;
    const requestServerLogout = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const dependencies = {
      cancelAuthQuery: vi.fn(async () => undefined),
      setAuthUser: vi.fn(),
      requestServerLogout,
    };

    const first = executeClientLogout(dependencies);
    const second = executeClientLogout(dependencies);
    await vi.waitFor(() => expect(requestServerLogout).toHaveBeenCalledOnce());
    finish();
    await Promise.all([first, second]);

    expect(first).toBe(second);
  });
});
