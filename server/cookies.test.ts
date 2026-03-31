import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions } from "./_core/cookies";

function createRequest(overrides: Partial<Request> = {}) {
  return {
    protocol: "http",
    headers: {},
    ...overrides,
  } as Request;
}

describe("getSessionCookieOptions", () => {
  it("uses lax cookies for local insecure requests", () => {
    const options = getSessionCookieOptions(createRequest());

    expect(options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });

  it("uses none+secure cookies for https requests", () => {
    const options = getSessionCookieOptions(
      createRequest({ protocol: "https" })
    );

    expect(options).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
    });
  });
});
