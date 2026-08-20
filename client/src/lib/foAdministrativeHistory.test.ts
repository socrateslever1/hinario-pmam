import { describe, expect, it } from "vitest";
import { buildAdministrativeFoSummary, getLcHistoryLabel } from "./foAdministrativeHistory";

describe("histórico administrativo de FO", () => {
  it("mantém uma frase explícita para o FO homologado", () => {
    expect(buildAdministrativeFoSummary({
      type: "negative",
      foCode: "B3",
      numerica: "127",
      nomeGuerra: "Fulano",
      validationStatus: "approved",
    })).toBe("127 Fulano recebeu FO- B3.");
  });

  it("identifica a LC ligada ao FO mesmo depois do arquivamento", () => {
    expect(getLcHistoryLabel("homologated")).toBe("Originou LC homologada");
    expect(getLcHistoryLabel("rejected")).toBe("LC concluída/arquivada");
    expect(getLcHistoryLabel(null)).toBeNull();
  });
});
