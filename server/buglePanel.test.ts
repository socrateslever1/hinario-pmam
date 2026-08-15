import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../drizzle/0010_bugle_panel.sql", import.meta.url), "utf8");

describe("bugle panel migration", () => {
  it("creates independent tables for calls and marches", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS `pmam_bugle_calls`");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS `pmam_marches`");
  });

  it("seeds all 51 referenced bugle calls without embedding audio", () => {
    const referencedMp3Urls = migration.match(/https:\/\/cpmlondrina\.com\.br\/wp-content\/uploads\/2018\/06\/[^']+\.mp3/g) || [];
    expect(referencedMp3Urls).toHaveLength(51);
    expect(new Set(referencedMp3Urls).size).toBe(51);
    expect(migration).toContain("('Descansar'");
    expect(migration).toContain("('Sentido'");
  });

  it("keeps the seed repeatable", () => {
    expect(migration).toContain("INSERT IGNORE INTO `pmam_bugle_calls`");
    expect(migration).toContain("UNIQUE(`name`)");
  });
});
