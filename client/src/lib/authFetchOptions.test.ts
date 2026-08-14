import { describe, expect, it } from "vitest";
import { authenticatedFetchOptions } from "./authFetchOptions";

describe("authenticatedFetchOptions", () => {
  it("envia os cookies e impede que a sessão seja atendida pelo cache do navegador", () => {
    expect(authenticatedFetchOptions).toEqual({
      credentials: "include",
      cache: "no-store",
    });
  });
});
