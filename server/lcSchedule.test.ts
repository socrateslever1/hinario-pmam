import { describe, expect, it } from "vitest";
import { calculateLcReleaseSchedule, normalizeLcTime } from "./serviceScaleDb";

describe("LC release schedule", () => {
  it("calculates 12h from 18:00 as 06:00 on the next day", () => {
    expect(calculateLcReleaseSchedule("2026-07-22", "18:00", 12)).toEqual({
      releaseDate: "2026-07-23",
      releaseTime: "06:00",
    });
  });

  it("calculates 24h from 06:00 as 06:00 on the next day", () => {
    expect(calculateLcReleaseSchedule("2026-07-22", "06:00", 24)).toEqual({
      releaseDate: "2026-07-23",
      releaseTime: "06:00",
    });
  });

  it("normalizes time values returned with seconds", () => {
    expect(normalizeLcTime("6:00")).toBe("06:00");
    expect(normalizeLcTime("06:00:00")).toBe("06:00");
  });
});
