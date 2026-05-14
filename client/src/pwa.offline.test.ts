import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const swPath = path.resolve(import.meta.dirname, "../public/sw.js");

describe("PWA offline service worker", () => {
  const sw = fs.readFileSync(swPath, "utf-8");

  it("precaches the app shell used as HTML fallback", () => {
    expect(sw).toContain("'/index.html'");
    expect(sw).toContain("caches.match('/index.html')");
  });

  it("caches public content APIs for offline reads", () => {
    expect(sw).toContain("hymns|drill|missions|content");
    expect(sw).toContain("networkFirstStrategy(request, API_CACHE)");
  });

  it("has an install/update message flow", () => {
    expect(sw).toContain("SKIP_WAITING");
    expect(sw).toContain("CACHE_URLS");
    expect(sw).toContain("PRECACHE_ASSETS");
  });
});
