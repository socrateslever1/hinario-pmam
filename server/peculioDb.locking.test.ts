import { describe, expect, it } from "vitest";
import {
  getPeculioEntryAt,
  getPeculioLockedAt,
  getPeculioOpenedAt,
  normalizeEntryTime,
} from "./peculioDb";

describe("janela automática do Pécúlio", () => {
  it("normaliza horários inválidos para o padrão operacional", () => {
    expect(normalizeEntryTime()).toBe("05:00");
    expect(normalizeEntryTime("invalido")).toBe("05:00");
    expect(normalizeEntryTime("06:15")).toBe("06:15");
  });

  it("abre uma hora antes do bloqueio e bloqueia cinco minutos antes da entrada", () => {
    const date = "2026-08-15";
    const entryAt = getPeculioEntryAt(date, "05:00");
    const lockedAt = getPeculioLockedAt(date, "05:00");
    const openedAt = getPeculioOpenedAt(date, "05:00");

    expect(entryAt.getTime() - lockedAt.getTime()).toBe(5 * 60 * 1000);
    expect(lockedAt.getTime() - openedAt.getTime()).toBe(60 * 60 * 1000);
  });
});
