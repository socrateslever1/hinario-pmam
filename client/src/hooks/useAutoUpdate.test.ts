import { describe, expect, it } from "vitest";
import { hashDeploymentDocument } from "./useAutoUpdate";

describe("hashDeploymentDocument", () => {
  it("mantem a mesma versao para o mesmo documento", () => {
    expect(hashDeploymentDocument("<html>versao-a</html>")).toBe(
      hashDeploymentDocument("<html>versao-a</html>"),
    );
  });

  it("detecta quando o documento de publicacao muda", () => {
    expect(hashDeploymentDocument("<html>versao-a</html>")).not.toBe(
      hashDeploymentDocument("<html>versao-b</html>"),
    );
  });
});
