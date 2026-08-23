import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("CFAP historical archive", () => {
  const root = path.resolve(import.meta.dirname, "..");

  it("creates editable history and audit tables", () => {
    const migration = fs.readFileSync(path.join(root, "drizzle/0014_cfap_history.sql"), "utf8");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS `pmam_cfap_history`");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS `pmam_cfap_history_audit`");
    expect(migration).toContain("`videos_json` longtext NOT NULL");
    expect(migration).toContain("`sources_json` longtext NOT NULL");
  });

  it("keeps public reading separate from command editing", () => {
    const router = fs.readFileSync(path.join(root, "server/routers.ts"), "utf8");
    expect(router).toContain("cfapHistory: router({");
    expect(router).toContain("list: publicProcedure.query");
    expect(router).toContain("listAdmin: masterProcedure.query");
    expect(router).toContain("upsert: masterProcedure.input(cfapHistoryInputSchema)");
  });

  it("ships one high resolution file for each identified portrait", () => {
    const directory = path.join(root, "client/public/history/commanders");
    const files = fs.readdirSync(directory).filter((file) => file.endsWith(".webp"));
    expect(files).toHaveLength(37);
    expect(files.every((file) => fs.statSync(path.join(directory, file)).size > 60_000)).toBe(true);
  });
});
