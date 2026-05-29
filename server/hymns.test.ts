import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const state = vi.hoisted(() => {
  const users = [
    {
      id: 99,
      openId: "master-socrates",
      email: "socrates.lever@gmail.com",
      name: "Socrates",
      password: "hash:123456",
      loginMethod: "email",
      role: "master" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    {
      id: 1,
      openId: "admin-user",
      email: "admin@pmam.gov.br",
      name: "Admin PMAM",
      password: null,
      loginMethod: "google",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  ];

  const hymns = [
    {
      id: 1,
      number: 1,
      title: "Hino Nacional Brasileiro",
      subtitle: null,
      author: "Joaquim Osorio Duque Estrada",
      composer: "Francisco Manuel da Silva",
      category: "nacional",
      collection: null,
      lyrics: "Ouviram do Ipiranga...",
      description: "Hino nacional",
      youtubeUrl: "https://www.youtube.com/watch?v=abc123",
      audioUrl: null,
      lyricsSync: null,
      isActive: true,
      likesCount: 0,
      viewsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      number: 2,
      title: "Cancao da PMAM",
      subtitle: null,
      author: "Autor",
      composer: "Compositor",
      category: "pmam",
      collection: null,
      lyrics: "Letra da cancao",
      description: "Cancao institucional",
      youtubeUrl: null,
      audioUrl: null,
      lyricsSync: null,
      isActive: true,
      likesCount: 0,
      viewsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const missions = [
    {
      id: 1,
      title: "Missao ativa",
      content: "Conteudo",
      priority: "normal" as const,
      status: "ativa" as const,
      dueDate: null,
      isActive: true,
      authorId: 1,
      likesCount: 0,
      viewsCount: 0,
      commentsCount: 0,
      visitorReacted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const settings = new Map<string, string | null>([
    ["footer_phone", "(92) 99999-0000"],
    ["footer_email", "contato@pmam.gov.br"],
    ["footer_address", "Manaus - AM"],
    ["footer_text", "PMAM"],
    ["footer_instagram", "@pmam"],
    ["footer_facebook", "pmam"],
  ]);

  return { users, hymns, missions, settings };
});

const dbMock = vi.hoisted(() => ({
  getActiveHymns: vi.fn(),
  getAllHymns: vi.fn(),
  getHymnById: vi.fn(),
  getHymnsByCategory: vi.fn(),
  getActiveMissions: vi.fn(),
  getAllMissions: vi.fn(),
  getStats: vi.fn(),
  getSetting: vi.fn(),
  setSetting: vi.fn(),
  upsertSetting: vi.fn(),
  getAllUsers: vi.fn(),
  getUserByEmail: vi.fn(),
  upsertUser: vi.fn(),
}));

vi.mock("./db", () => dbMock);

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async (value: string) => `hash:${value}`),
    compare: vi.fn(async (plain: string, hashed: string | null) => hashed === `hash:${plain}`),
  },
}));

const createSessionTokenMock = vi.hoisted(() => vi.fn(async () => "session-token"));

vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: createSessionTokenMock,
  },
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(async () => ({ url: "https://storage.example/audio.mp3" })),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => undefined),
}));

const { appRouter } = await import("./routers");

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
    loginMethod: "google",
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
    ...state.users[0],
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
    loginMethod: "google",
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

beforeEach(() => {
  createSessionTokenMock.mockClear();
  dbMock.upsertSetting.mockClear();
  dbMock.upsertUser.mockClear();

  dbMock.getActiveHymns.mockResolvedValue(state.hymns.filter((item) => item.isActive));
  dbMock.getAllHymns.mockResolvedValue(state.hymns);
  dbMock.getHymnById.mockImplementation(async (id: number) => state.hymns.find((item) => item.id === id) ?? null);
  dbMock.getHymnsByCategory.mockImplementation(async (category: string) =>
    state.hymns.filter((item) => item.category === category)
  );
  dbMock.getActiveMissions.mockResolvedValue(state.missions.filter((item) => item.isActive));
  dbMock.getAllMissions.mockResolvedValue(state.missions);
  dbMock.getStats.mockResolvedValue({
    totalHymns: state.hymns.length,
    totalCharlieMike: 0,
    totalMissions: state.missions.length,
    totalUsers: state.users.length,
  });
  dbMock.getSetting.mockImplementation(async (key: string) => state.settings.get(key) ?? null);
  dbMock.upsertSetting.mockImplementation(async (key: string, value: string) => {
    state.settings.set(key, value);
  });
  dbMock.getAllUsers.mockResolvedValue(state.users);
  dbMock.getUserByEmail.mockImplementation(async (email: string) =>
    state.users.find((user) => user.email === email.trim().toLowerCase()) ?? null
  );
  dbMock.upsertUser.mockResolvedValue(undefined);
});

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
    dbMock.setSetting.mockClear();
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.update({ key: "footer_phone", value: "(92) 3333-4444" });
    expect(result.success).toBe(true);
    expect(dbMock.setSetting).toHaveBeenCalledWith("footer_phone", "(92) 3333-4444");
  });

  it("admin can batch update settings", async () => {
    dbMock.setSetting.mockClear();
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.updateBatch({
      settings: [
        { key: "footer_phone", value: "(92) 1111-2222" },
        { key: "footer_email", value: "test@pmam.gov.br" },
      ],
    });
    expect(result.success).toBe(true);
    expect(dbMock.setSetting).toHaveBeenCalledTimes(2);
  });

  it("regular user cannot update settings", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.settings.update({ key: "footer_phone", value: "123" })).rejects.toThrow();
  });
});

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
    const cookies: Array<{ name: string; value: string }> = [];
    const ctx = {
      ...createPublicContext(),
      res: {
        clearCookie: () => {},
        cookie: (name: string, value: string) => {
          cookies.push({ name, value });
        },
      },
    } as unknown as TrpcContext;

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.loginEmail({ email: "socrates.lever@gmail.com", password: "123456" });
    expect(result.success).toBe(true);
    expect(result.user.email).toBe("socrates.lever@gmail.com");
    expect(result.user.role).toBe("master");
    expect(createSessionTokenMock).toHaveBeenCalledTimes(1);
    expect(dbMock.upsertUser).toHaveBeenCalled();
    expect(cookies).toHaveLength(1);
  });
});
