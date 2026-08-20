import { describe, expect, it } from "vitest";
import {
  applyDrillCommand,
  getRequiredCommandSequence,
  isDrillCommandAllowed,
  normalizeDrillCommand,
} from "./drillStateMachine";

describe("drill state machine", () => {
  it("always starts the operational flow at Descansar", () => {
    expect(isDrillCommandAllowed("Sentido", "descansar")).toBe(true);
    expect(applyDrillCommand("Sentido", "descansar")).toBe("sentido");
    expect(isDrillCommandAllowed("Ombro arma", "descansar")).toBe(false);
  });

  it("uses Cessar o À Vontade to return to Descansar", () => {
    expect(applyDrillCommand("À Vontade", "descansar")).toBe("a_vontade");
    expect(isDrillCommandAllowed("Cessar o À Vontade", "a_vontade")).toBe(true);
    expect(applyDrillCommand("Cessar o À Vontade", "a_vontade")).toBe("descansar");
    expect(isDrillCommandAllowed("Cessar o À Vontade", "sentido")).toBe(false);
  });

  it("requires Descansar-Arma before leaving Ombro-Arma for Descansar", () => {
    expect(isDrillCommandAllowed("Sentido", "ombro_arma")).toBe(false);
    expect(getRequiredCommandSequence("Sentido", "ombro_arma")).toEqual([
      "descansar arma",
      "descansar",
      "sentido",
    ]);
    expect(applyDrillCommand("Descansar arma", "ombro_arma")).toBe("sentido");
  });

  it("supports the documented armed-position transitions", () => {
    expect(applyDrillCommand("Apresentar arma", "ombro_arma")).toBe("apresentar_arma");
    expect(applyDrillCommand("Ombro arma", "apresentar_arma")).toBe("ombro_arma");
    expect(applyDrillCommand("Descansar arma", "apresentar_arma")).toBe("sentido");
    expect(applyDrillCommand("Descansar arma", "cruzar_arma")).toBe("sentido");
  });

  it("requires Firme to leave Cobrir", () => {
    expect(applyDrillCommand("Cobrir", "sentido")).toBe("cobrir");
    expect(isDrillCommandAllowed("Descansar", "cobrir")).toBe(false);
    expect(applyDrillCommand("Firme", "cobrir")).toBe("sentido");
  });

  it("starts and stops marches without allowing an illegal direct command", () => {
    expect(applyDrillCommand("Ordinário marche", "sentido")).toBe("marcha");
    expect(applyDrillCommand("Marcar passo", "marcha")).toBe("marcar_passo");
    expect(applyDrillCommand("Alto", "marcar_passo")).toBe("sentido");
    expect(isDrillCommandAllowed("Descansar", "marcha")).toBe(false);
  });

  it("handles compound command names like Ordinário marche com dobrado, Ordinário marche B and Alto", () => {
    expect(applyDrillCommand("Ordinário marche com dobrado", "sentido")).toBe("marcha");
    expect(applyDrillCommand("Ordinário marche B", "sentido")).toBe("marcha");
    expect(isDrillCommandAllowed("Alto", "marcha")).toBe(true);
    expect(getRequiredCommandSequence("Alto", "marcha")).toEqual([]);
    expect(applyDrillCommand("Alto", "marcha")).toBe("sentido");
  });

  it("normalizes accents and punctuation", () => {
    expect(normalizeDrillCommand("  ORDINÁRIO, MARCHE! ")).toBe("ordinario marche");
  });
});
