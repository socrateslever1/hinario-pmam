import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";
import bcrypt from "bcryptjs";

// Admin or Master can access
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

// Only Master can access
const masterProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "master") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao Xerife Master" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: router({
    health: publicProcedure.query(() => ({ status: "ok" })),
    seedMaster: publicProcedure.mutation(async () => {
      const emails = ['socrates.lever@gmail.com', 'socrates@icomp.ufam.edu.br'].map(e => e.trim().toLowerCase());
      const hashedPassword = await bcrypt.hash("123456", 12);
      
      for (const email of emails) {
        const existing = await db.getUserByEmail(email);
        if (existing) {
          await db.upsertUser({
            openId: existing.openId,
            name: 'Sócrates',
            email: email,
            password: hashedPassword,
            loginMethod: 'email',
            role: 'master'
          });
        } else {
          await db.createUserWithPassword({
            name: 'Sócrates',
            email: email,
            password: hashedPassword,
            role: 'master'
          });
        }
      }
      return { success: true, message: "Master users updated/created" };
    }),
    listUsers: publicProcedure.query(async () => {
      return db.getAllUsers();
    }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    loginEmail: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const masterEmails = ['socrates.lever@gmail.com', 'socrates@icomp.ufam.edu.br'].map(e => e.trim().toLowerCase());
      
      let user = await db.getUserByEmail(normalizedEmail);
      
      // Auto-seed master user if it doesn't exist
      if (!user && masterEmails.includes(normalizedEmail)) {
        console.info(`[Auth] Master user ${normalizedEmail} not found. Auto-seeding...`);
        const hashedPassword = await bcrypt.hash("123456", 12);
        await db.createUserWithPassword({
          name: 'Sócrates',
          email: normalizedEmail,
          password: hashedPassword,
          role: 'master'
        });
        user = await db.getUserByEmail(normalizedEmail);
      }

      if (!user) {
        console.warn(`[Auth] Login failed: User not found for email ${normalizedEmail}`);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha inválidos" });
      }
      if (!user.password) {
        console.warn(`[Auth] Login failed: User ${normalizedEmail} has no password set`);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha inválidos" });
      }
      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        console.warn(`[Auth] Login failed: Invalid password for user ${normalizedEmail}`);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou senha inválidos" });
      }
      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      // Update last signed in
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
  }),

  hymns: router({
    list: publicProcedure.query(async () => {
      return db.getActiveHymns();
    }),
    listAll: adminProcedure.query(async () => {
      return db.getAllHymns();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const hymn = await db.getHymnById(input.id);
      if (!hymn) throw new TRPCError({ code: "NOT_FOUND", message: "Hino não encontrado" });
      return hymn;
    }),
    getByNumber: publicProcedure.input(z.object({ number: z.number() })).query(async ({ input }) => {
      const hymn = await db.getHymnByNumber(input.number);
      if (!hymn) throw new TRPCError({ code: "NOT_FOUND", message: "Hino não encontrado" });
      return hymn;
    }),
    getByCategory: publicProcedure.input(z.object({ category: z.string() })).query(async ({ input }) => {
      return db.getHymnsByCategory(input.category);
    }),
    create: adminProcedure.input(z.object({
      number: z.number(),
      title: z.string(),
      subtitle: z.string().optional(),
      author: z.string().optional(),
      composer: z.string().optional(),
      category: z.enum(["nacional", "militar", "pmam", "arma", "oracao"]),
      lyrics: z.string(),
      description: z.string().optional(),
      youtubeUrl: z.string().optional(),
      audioUrl: z.string().optional(),
      lyricsSync: z.any().optional(),
    })).mutation(async ({ input }) => {
      await db.createHymn(input);
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      number: z.number().optional(),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      author: z.string().optional(),
      composer: z.string().optional(),
      category: z.enum(["nacional", "militar", "pmam", "arma", "oracao"]).optional(),
      lyrics: z.string().optional(),
      description: z.string().optional(),
      youtubeUrl: z.string().nullable().optional(),
      audioUrl: z.string().nullable().optional(),
      lyricsSync: z.any().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateHymn(id, data);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteHymn(input.id);
      return { success: true };
    }),
  }),

  missions: router({
    list: publicProcedure.query(async () => {
      return db.getActiveMissions();
    }),
    listAll: adminProcedure.query(async () => {
      return db.getAllMissions();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const mission = await db.getMissionById(input.id);
      if (!mission) throw new TRPCError({ code: "NOT_FOUND", message: "Missão não encontrada" });
      return mission;
    }),
    create: adminProcedure.input(z.object({
      title: z.string(),
      content: z.string(),
      priority: z.enum(["normal", "urgente", "critica"]).default("normal"),
    })).mutation(async ({ input, ctx }) => {
      await db.createMission({ ...input, authorId: ctx.user.id });
      await notifyOwner({
        title: `Nova Missão CFAP: ${input.title}`,
        content: `Uma nova missão foi publicada na página CFAP 2026: ${input.title}`,
      });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      priority: z.enum(["normal", "urgente", "critica"]).optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateMission(id, data);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteMission(input.id);
      return { success: true };
    }),
  }),

  admin: router({
    stats: adminProcedure.query(async () => {
      return db.getStats();
    }),
    uploadAudio: adminProcedure.input(z.object({
      hymnId: z.number(),
      fileName: z.string(),
      fileBase64: z.string(),
      contentType: z.string(),
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `hymns/audio/${input.hymnId}-${nanoid(8)}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.contentType);
      await db.updateHymn(input.hymnId, { audioUrl: url });
      return { success: true, url };
    }),
  }),

  // Settings do site (rodapé, etc.)
  settings: router({
    get: publicProcedure.input(z.object({ key: z.string() })).query(async ({ input }) => {
      const value = await db.getSetting(input.key);
      return { key: input.key, value: value ?? null };
    }),
    getAll: publicProcedure.query(async () => {
      const keys = ["footer_phone", "footer_email", "footer_address", "footer_text", "footer_instagram", "footer_facebook"];
      const results: Record<string, string | null> = {};
      for (const key of keys) {
        results[key] = (await db.getSetting(key)) ?? null;
      }
      return results;
    }),
    update: adminProcedure.input(z.object({
      key: z.string(),
      value: z.string(),
    })).mutation(async ({ input }) => {
      await db.upsertSetting(input.key, input.value);
      return { success: true };
    }),
    updateBatch: adminProcedure.input(z.object({
      settings: z.array(z.object({ key: z.string(), value: z.string() })),
    })).mutation(async ({ input }) => {
      for (const s of input.settings) {
        await db.upsertSetting(s.key, s.value);
      }
      return { success: true };
    }),
  }),

  // Gerenciamento de usuários (apenas master)
  users: router({
    list: masterProcedure.query(async () => {
      return db.getAllUsers();
    }),
    create: masterProcedure.input(z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(4),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
      const hashedPassword = await bcrypt.hash(input.password, 12);
      await db.createUserWithPassword({ ...input, password: hashedPassword });
      return { success: true };
    }),
    updateRole: masterProcedure.input(z.object({
      id: z.number(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => {
      await db.updateUserRole(input.id, input.role);
      return { success: true };
    }),
    resetPassword: masterProcedure.input(z.object({
      id: z.number(),
      password: z.string().min(4),
    })).mutation(async ({ input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 12);
      await db.updateUserPassword(input.id, hashedPassword);
      return { success: true };
    }),
    delete: masterProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteUser(input.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
