import { describe, expect, it } from "vitest";
import { fitImageWithinMaxDimension } from "./imageResize";

describe("fitImageWithinMaxDimension", () => {
  it("preserves a portrait aspect ratio while limiting height", () => {
    expect(fitImageWithinMaxDimension(1200, 2000, 350)).toEqual({
      width: 210,
      height: 350,
    });
  });

  it("preserves a landscape aspect ratio while limiting width", () => {
    expect(fitImageWithinMaxDimension(2000, 1200, 350)).toEqual({
      width: 350,
      height: 210,
    });
  });

  it("does not enlarge an image already within the limit", () => {
    expect(fitImageWithinMaxDimension(240, 320, 350)).toEqual({
      width: 240,
      height: 320,
    });
  });

  it("keeps a square image square", () => {
    expect(fitImageWithinMaxDimension(1000, 1000, 350)).toEqual({
      width: 350,
      height: 350,
    });
  });

  it("rejects invalid dimensions", () => {
    expect(() => fitImageWithinMaxDimension(0, 100, 350)).toThrow();
    expect(() => fitImageWithinMaxDimension(100, 100, 0)).toThrow();
  });
});
