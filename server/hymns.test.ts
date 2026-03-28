import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@pmam.gov.br",
    name: "Admin PMAM",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@pmam.gov.br",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("hymns.list", () => {
  it("returns a list of active hymns for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.hymns.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    // All returned hymns should be active
    for (const hymn of result) {
      expect(hymn.isActive).toBe(true);
    }
  });

  it("returns hymns with expected fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.hymns.list();
    expect(result.length).toBeGreaterThan(0);
    const hymn = result[0];
    expect(hymn).toHaveProperty("id");
    expect(hymn).toHaveProperty("number");
    expect(hymn).toHaveProperty("title");
    expect(hymn).toHaveProperty("category");
    expect(hymn).toHaveProperty("lyrics");
  });
});

describe("hymns.getById", () => {
  it("returns a specific hymn by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.hymns.list();
    expect(list.length).toBeGreaterThan(0);
    const firstHymn = list[0];
    const hymn = await caller.hymns.getById({ id: firstHymn.id });
    expect(hymn.id).toBe(firstHymn.id);
    expect(hymn.title).toBe(firstHymn.title);
  });

  it("throws NOT_FOUND for invalid id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.hymns.getById({ id: 99999 })).rejects.toThrow();
  });
});

describe("hymns.getByCategory", () => {
  it("returns hymns filtered by category", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.hymns.getByCategory({ category: "nacional" });
    expect(Array.isArray(result)).toBe(true);
    for (const hymn of result) {
      expect(hymn.category).toBe("nacional");
    }
  });
});

describe("hymns admin operations", () => {
  it("regular user cannot access listAll", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.hymns.listAll()).rejects.toThrow();
  });

  it("admin can access listAll", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.hymns.listAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("missions.list", () => {
  it("returns a list of active missions for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.missions.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("missions admin operations", () => {
  it("regular user cannot access listAll", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.missions.listAll()).rejects.toThrow();
  });

  it("admin can access listAll", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.missions.listAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin.stats", () => {
  it("regular user cannot access stats", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("admin can access stats", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.admin.stats();
    expect(stats).toHaveProperty("totalHymns");
    expect(stats).toHaveProperty("totalMissions");
    expect(stats).toHaveProperty("totalUsers");
    expect(typeof stats.totalHymns).toBe("number");
  });
});
