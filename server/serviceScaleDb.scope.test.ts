import { describe, expect, it } from "vitest";
import { canAccessScope, getDefaultScope } from "./serviceScaleDb";

describe("escopo hierárquico de comando", () => {
  it("limita o comandante de Companhia à sua própria companhia", () => {
    const user = { role: "comandante_cia", companhiaId: 2, pelotaoId: null };
    expect(canAccessScope(user, null, 2, 1)).toBe(true);
    expect(canAccessScope(user, null, 3, 1)).toBe(false);
    expect(getDefaultScope(user, null)).toEqual({ companhia: 2, unrestricted: false });
  });

  it("limita o comandante de Pelotão ao próprio pelotão", () => {
    const user = { role: "comandante_pel", companhiaId: 4, pelotaoId: 2 };
    expect(canAccessScope(user, null, 4, 2)).toBe(true);
    expect(canAccessScope(user, null, 4, 1)).toBe(false);
    expect(canAccessScope(user, null, 3, 2)).toBe(false);
    expect(getDefaultScope(user, null)).toEqual({ companhia: 4, peloton: 2, unrestricted: false });
  });

  it("mantém os comandos globais sem restrição de pelotão", () => {
    const user = { role: "comandante_cfap", companhiaId: null, pelotaoId: null };
    expect(canAccessScope(user, null, 5, 2)).toBe(true);
    expect(getDefaultScope(user, null)).toEqual({ unrestricted: true });
  });
});
