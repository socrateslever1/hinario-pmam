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
import { ENV } from "./_core/env";
import bcrypt from "bcryptjs";
import { getStudyStudentNumberErrorMessage, isValidStudyStudentNumber } from "../shared/study";

const INVALID_LOGIN_MESSAGE = "Email ou senha invalidos";
const INVALID_STUDY_STUDENT_NUMBER_MESSAGE = getStudyStudentNumberErrorMessage();

const studyStudentNumberSchema = z.string().trim().refine(isValidStudyStudentNumber, {
  message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE,
});

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
    seedMaster: masterProcedure.input(
      z.object({
        password: z.string().min(8),
        name: z.string().trim().min(2).max(120).default("Socrates"),
      })
    ).mutation(async ({ input }) => {
      if (!ENV.allowDangerousSystemMutations) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seed de master desabilitado. Ative ALLOW_DANGEROUS_SYSTEM_MUTATIONS para usar esta rota.",
        });
      }

      const emails = ['socrates.lever@gmail.com', 'socrates@icomp.ufam.edu.br'].map(e => e.trim().toLowerCase());
      const hashedPassword = await bcrypt.hash(input.password, 12);
      
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
    listUsers: masterProcedure.query(async () => {
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
      const masterEmails: string[] = [];
      let user = await db.getUserByEmail(normalizedEmail);
      
      // Auto-seed master user if it doesn't exist
      if (false) {
        console.info(`[Auth] Master user ${normalizedEmail} not found. Auto-seeding...`);
        const hashedPassword = await bcrypt.hash(input.password, 12);
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
        throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_LOGIN_MESSAGE });
      }

      if (false) {
        console.info(`[Auth] Promoting ${normalizedEmail} to master role during login.`);
        await db.upsertUser({
          openId: user.openId,
          email: normalizedEmail,
          role: 'master',
        });
        user = await db.getUserByEmail(normalizedEmail);
      }

      if (!user.password) {
        console.warn(`[Auth] Login failed: User ${normalizedEmail} has no password set`);
        throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_LOGIN_MESSAGE });
      }
      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        console.warn(`[Auth] Login failed: Invalid password for user ${normalizedEmail}`);
        throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_LOGIN_MESSAGE });
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

  study: router({
    ensureStudent: publicProcedure.input(z.object({
      studentNumber: studyStudentNumberSchema,
      displayName: z.string().trim().min(2).max(120).nullable().optional(),
      accessToken: z.string().trim().max(128).nullable().optional(),
    })).mutation(async ({ input }) => {
      try {
        return await db.ensureStudyStudentSession(
          input.studentNumber,
          input.displayName ?? null,
          input.accessToken ?? null
        );
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_STUDY_STUDENT_NUMBER") {
          throw new TRPCError({ code: "BAD_REQUEST", message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE });
        }
        throw error;
      }
    }),
    dashboard: publicProcedure.input(z.object({
      studentNumber: studyStudentNumberSchema,
      accessToken: z.string().trim().max(128).nullable().optional(),
    })).query(async ({ input }) => {
      try {
        return await db.getStudyDashboard(input.studentNumber, input.accessToken);
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_STUDY_STUDENT_NUMBER") {
          throw new TRPCError({ code: "BAD_REQUEST", message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE });
        }
        throw error;
      }
    }),
    getModuleProgress: publicProcedure.input(z.object({
      studentNumber: studyStudentNumberSchema,
      accessToken: z.string().trim().max(128).nullable().optional(),
      moduleSlug: z.string().trim().min(1).max(96),
    })).query(async ({ input }) => {
      try {
        return await db.getStudyModuleProgress(input.studentNumber, input.accessToken, input.moduleSlug);
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_STUDY_STUDENT_NUMBER") {
          throw new TRPCError({ code: "BAD_REQUEST", message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE });
        }
        throw error;
      }
    }),
    saveModuleProgress: publicProcedure.input(z.object({
      studentNumber: studyStudentNumberSchema,
      accessToken: z.string().trim().max(128).nullable().optional(),
      moduleSlug: z.string().trim().min(1).max(96),
      progress: z.object({
        completedSectionIds: z.array(z.string()),
        answers: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.null()])),
        lastScore: z.number().int().min(0).max(100).nullable(),
        bestScore: z.number().int().min(0).max(100).nullable(),
        lastSubmittedAt: z.string().nullable(),
      }),
    })).mutation(async ({ input }) => {
      try {
        return await db.saveStudyModuleProgress(
          input.studentNumber,
          input.accessToken,
          input.moduleSlug,
          input.progress
        );
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_STUDY_STUDENT_NUMBER") {
          throw new TRPCError({ code: "BAD_REQUEST", message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE });
        }
        throw error;
      }
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
    getByCollection: publicProcedure.input(z.object({ collection: z.string() })).query(async ({ input }) => {
      return db.getHymnsByCollection(input.collection);
    }),
    create: adminProcedure.input(z.object({
      number: z.number(),
      title: z.string(),
      subtitle: z.string().optional(),
      author: z.string().optional(),
      composer: z.string().optional(),
      category: z.enum(["nacional", "militar", "pmam", "arma", "oracao"]),
      collection: z.string().nullable().optional(),
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
      collection: z.string().nullable().optional(),
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
    list: publicProcedure.input(
      z.object({
        visitorId: z.string().trim().min(8).max(128).optional(),
      }).optional()
    ).query(async ({ input }) => {
      return db.getActiveMissions(input?.visitorId);
    }),
    listAll: adminProcedure.query(async () => {
      return db.getAllMissions();
    }),
    getById: publicProcedure.input(z.object({
      id: z.number(),
      visitorId: z.string().trim().min(8).max(128).optional(),
    })).query(async ({ input }) => {
      const mission = await db.getMissionById(input.id, input.visitorId);
      if (!mission) throw new TRPCError({ code: "NOT_FOUND", message: "Missão não encontrada" });
      return mission;
    }),
    comments: publicProcedure.input(z.object({
      missionId: z.number(),
    })).query(async ({ input }) => {
      return db.getMissionComments(input.missionId);
    }),
    addComment: publicProcedure.input(z.object({
      missionId: z.number(),
      authorName: z.string().trim().min(2).max(80),
      content: z.string().trim().min(2).max(1000),
    })).mutation(async ({ input }) => {
      const mission = await db.getMissionById(input.missionId);
      if (!mission || !mission.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comunicado nÃ£o encontrado" });
      }

      await db.createMissionComment(input.missionId, input.authorName, input.content);
      return { success: true };
    }),
    toggleReaction: publicProcedure.input(z.object({
      missionId: z.number(),
      visitorId: z.string().trim().min(8).max(128),
    })).mutation(async ({ input }) => {
      const mission = await db.getMissionById(input.missionId);
      if (!mission || !mission.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Comunicado nÃ£o encontrado" });
      }

      return db.toggleMissionReaction(input.missionId, input.visitorId);
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
