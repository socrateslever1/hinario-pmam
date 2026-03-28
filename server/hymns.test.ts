import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@pmam.gov.br",
    name: "Admin PMAM",
    password: null,
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createMasterContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 99,
    openId: "master-socrates",
    email: "socrates.lever@gmail.com",
    name: "Sócrates",
    password: "$2a$12$fakehash",
    loginMethod: "email",
    role: "master",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@pmam.gov.br",
    name: "Regular User",
    password: null,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {}, cookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ===== HYMNS =====
describe("hymns.list", () => {
  it("returns a list of active hymns for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.hymns.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
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

  it("master can access listAll", async () => {
    const ctx = createMasterContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.hymns.listAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ===== MISSIONS =====
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

// ===== ADMIN STATS =====
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

// ===== SETTINGS =====
describe("settings", () => {
  it("public user can read settings", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.getAll();
    expect(result).toHaveProperty("footer_phone");
    expect(result).toHaveProperty("footer_email");
    expect(result).toHaveProperty("footer_address");
  });

  it("admin can update settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.update({ key: "footer_phone", value: "(92) 3333-4444" });
    expect(result.success).toBe(true);
  });

  it("admin can batch update settings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.updateBatch({
      settings: [
        { key: "footer_phone", value: "(92) 1111-2222" },
        { key: "footer_email", value: "test@pmam.gov.br" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("regular user cannot update settings", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.settings.update({ key: "footer_phone", value: "123" })).rejects.toThrow();
  });
});

// ===== USERS (Master only) =====
describe("users management", () => {
  it("regular user cannot list users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("admin cannot list users (master only)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("master can list users", async () => {
    const ctx = createMasterContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ===== LOGIN EMAIL =====
describe("auth.loginEmail", () => {
  it("rejects login with non-existent email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.loginEmail({ email: "nonexistent@test.com", password: "123456" })
    ).rejects.toThrow();
  });

  it("rejects login with wrong password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.loginEmail({ email: "socrates.lever@gmail.com", password: "wrongpassword" })
    ).rejects.toThrow();
  });

  it("accepts login with correct credentials", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.loginEmail({ email: "socrates.lever@gmail.com", password: "123456" });
    expect(result.success).toBe(true);
    expect(result.user.email).toBe("socrates.lever@gmail.com");
    expect(result.user.role).toBe("master");
  });
});
