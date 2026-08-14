import { describe, expect, it } from "vitest";
import { isValidEmailSession } from "./emailSession";

describe("fallback de sessão por cabeçalho", () => {
  it("aceita apenas token presente e ainda não expirado", () => {
    const now = 1_786_736_400_000;
    expect(isValidEmailSession({ token: "jwt-assinado", expiresAt: now + 1 }, now)).toBe(true);
    expect(isValidEmailSession({ token: "jwt-assinado", expiresAt: now }, now)).toBe(false);
    expect(isValidEmailSession({ token: "", expiresAt: now + 1 }, now)).toBe(false);
    expect(isValidEmailSession(null, now)).toBe(false);
  });
});
