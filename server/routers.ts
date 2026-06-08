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
import * as gradeDb from "./gradeDb";
import * as studentDb from "./studentDb";
import { validateNumerica, getCompanhiaLabel, getPelotonLabel } from "../shared/studentValidation";
import { studentRouter } from "./studentRouter";

const INVALID_LOGIN_MESSAGE = "Email ou senha invalidos";
const INVALID_STUDY_STUDENT_NUMBER_MESSAGE = getStudyStudentNumberErrorMessage();

const studyStudentNumberSchema = z.string().trim().refine(isValidStudyStudentNumber, {
  message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE,
});

async function requireStudentSession(studentId: number, sessionToken: string) {
  const isValid = await studentDb.verifyStudentSession(studentId, sessionToken);
  if (!isValid) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão do aluno inválida" });
  }
}

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
      instrumentalYoutubeUrl: z.string().optional(),
      audioUrl: z.string().optional(),
      instrumentalAudioUrl: z.string().optional(),
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
      instrumentalYoutubeUrl: z.string().nullable().optional(),
      audioUrl: z.string().nullable().optional(),
      instrumentalAudioUrl: z.string().nullable().optional(),
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
    uploadAudio: adminProcedure.input(z.object({
      id: z.number(),
      fileData: z.string(),
      fileName: z.string(),
      variant: z.enum(["voice", "instrumental"]).default("voice"),
    })).mutation(async ({ input }) => {
      const validFormats = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'webm'];
      const ext = input.fileName.split('.').pop()?.toLowerCase() || '';
      if (!validFormats.includes(ext)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Formato nao suportado. Use: ${validFormats.join(', ')}`
        });
      }
      const buffer = Buffer.from(input.fileData, 'base64');
      const maxSize = 100 * 1024 * 1024;
      if (buffer.length > maxSize) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Arquivo muito grande. Maximo: 100MB`
        });
      }
      const fileKey = `hymns/${input.id}-${nanoid()}.${ext}`;
      const mimeType = `audio/${ext === 'mp3' ? 'mpeg' : ext}`;
      const { url } = await storagePut(fileKey, buffer, mimeType);
      await db.updateHymn(
        input.id,
        input.variant === "instrumental" ? { instrumentalAudioUrl: url } : { audioUrl: url },
      );
      return { success: true, url };
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
      await db.setSetting(input.key, input.value);
      return { success: true };
    }),
    updateBatch: adminProcedure.input(z.object({
      settings: z.array(z.object({ key: z.string(), value: z.string() })),
    })).mutation(async ({ input }) => {
      for (const s of input.settings) {
        await db.setSetting(s.key, s.value);
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
      await db.resetUserPassword(input.id, hashedPassword);
      return { success: true };
    }),
    delete: masterProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteUser(input.id);
      return { success: true };
    }),
  }),

  drill: router({
    list: publicProcedure.query(async () => {
      return db.getActiveDrill();
    }),
    listAll: adminProcedure.query(async () => {
      return db.getAllDrill();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const drill = await db.getDrillById(input.id);
      if (!drill) throw new TRPCError({ code: "NOT_FOUND", message: "Ordem Unida não encontrada" });
      return drill;
    }),
    getByCategory: publicProcedure.input(z.object({ category: z.string() })).query(async ({ input }) => {
      return db.getDrillByCategory(input.category);
    }),
    create: adminProcedure.input(z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      difficulty: z.enum(["basico", "intermediario", "avancado"]).default("intermediario"),
      duration: z.number().optional(),
      videoUrl: z.string().optional(),
      pdfUrl: z.string().optional(),
      imageUrl: z.string().optional(),
      content: z.string().optional(),
      instructor: z.string().optional(),
      prerequisites: z.string().optional(),
      learningOutcomes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      await db.createDrill({ ...input, authorId: ctx.user.id });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      difficulty: z.enum(["basico", "intermediario", "avancado"]).optional(),
      duration: z.number().optional(),
      videoUrl: z.string().nullable().optional(),
      pdfUrl: z.string().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      content: z.string().optional(),
      instructor: z.string().optional(),
      prerequisites: z.string().optional(),
      learningOutcomes: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateDrill(id, data);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteDrill(input.id);
      return { success: true };
    }),
    uploadFile: adminProcedure.input(z.object({
      drillId: z.number(),
      fileName: z.string(),
      fileBase64: z.string(),
      contentType: z.string(),
      fileType: z.enum(["video", "pdf", "image"]),
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `drill/${input.fileType}/${input.drillId}-${nanoid(8)}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.contentType);
      
      const updateData: any = {};
      if (input.fileType === "video") updateData.videoUrl = url;
      if (input.fileType === "pdf") updateData.pdfUrl = url;
      if (input.fileType === "image") updateData.imageUrl = url;
      
      await db.updateDrill(input.drillId, updateData);
      return { success: true, url };
    }),
  }),

  blog: router({
    list: publicProcedure.query(async () => {
      return await db.listBlogPosts(true);
    }),
    getById: publicProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return await db.getBlogPostById(input.id);
    }),
    create: adminProcedure.input(z.object({
      title: z.string().min(1).max(255),
      content: z.string().min(1),
      imageUrl: z.string().nullable().optional(),
      youtubeUrl: z.string().nullable().optional(),
      published: z.boolean().default(false),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createBlogPost({
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl ?? undefined,
        youtubeUrl: input.youtubeUrl ?? undefined,
        authorId: ctx.user.id,
        published: input.published,
      });
      return await db.getBlogPostById(id!);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      content: z.string().min(1).optional(),
      imageUrl: z.string().nullable().optional(),
      youtubeUrl: z.string().nullable().optional(),
      published: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      await db.updateBlogPost(input.id, {
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl ?? undefined,
        youtubeUrl: input.youtubeUrl,
        published: input.published,
      });
      return await db.getBlogPostById(input.id);
    }),
    delete: adminProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input }) => {
      await db.deleteBlogPost(input.id);
      return { success: true };
    }),
    // ---- Curtidas ----
    toggleLike: publicProcedure.input(z.object({
      postId: z.number(),
      visitorId: z.string().trim().min(8).max(128),
    })).mutation(async ({ input }) => {
      return db.toggleBlogLike(input.postId, input.visitorId);
    }),
    getLikes: publicProcedure.input(z.object({
      postId: z.number(),
      visitorId: z.string().trim().min(8).max(128).optional(),
    })).query(async ({ input }) => {
      const count = await db.getBlogLikesCount(input.postId);
      const liked = input.visitorId ? await db.getBlogLikedByVisitor(input.postId, input.visitorId) : false;
      return { count, liked };
    }),
    // ---- Comentários ----
    getComments: publicProcedure.input(z.object({
      postId: z.number(),
    })).query(async ({ input }) => {
      return db.getBlogComments(input.postId);
    }),
    addComment: publicProcedure.input(z.object({
      postId: z.number(),
      authorName: z.string().trim().min(2).max(80),
      content: z.string().trim().min(2).max(2000),
    })).mutation(async ({ input }) => {
      const post = await db.getBlogPostById(input.postId);
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post não encontrado" });
      await db.createBlogComment(input.postId, input.authorName, input.content);
      return { success: true };
    }),
    deleteComment: adminProcedure.input(z.object({
      commentId: z.number(),
    })).mutation(async ({ input }) => {
      await db.deleteBlogComment(input.commentId);
      return { success: true };
    }),
    uploadImage: adminProcedure.input(z.object({
      fileName: z.string(),
      mimeType: z.string(),
      base64Data: z.string(),
      postId: z.number().optional(),
      altText: z.string().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      alignment: z.string().optional(),
      sizePercent: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const suffix = nanoid(10);
      const ext = input.fileName.split('.').pop() || 'jpg';
      const fileKey = `blog-images/post-img-${suffix}.${ext}`;
      const buffer = Buffer.from(input.base64Data, 'base64');
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      // Salvar metadados na tabela pmam_post_images
      await db.savePostImage({
        postId: input.postId,
        url,
        fileKey,
        altText: input.altText,
        width: input.width,
        height: input.height,
        alignment: input.alignment || 'center',
        sizePercent: input.sizePercent || 100,
        mimeType: input.mimeType,
        fileSize: buffer.length,
        uploadedBy: ctx.user.id,
      });
      return { url, fileKey };
    }),
  }),
  grades: router({
    availableDisciplines: publicProcedure.query(async () => {
      return gradeDb.getActiveDisciplineCatalog();
    }),

    ranking: publicProcedure.input(
      z.object({
        studentId: z.number(),
        sessionToken: z.string().min(16),
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      })
    ).query(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      return gradeDb.getGradeRanking({
        companhia: input.companhia,
        peloton: input.peloton,
      });
    }),

    getMyGrades: publicProcedure.input(
      z.object({
        studentId: z.number(),
        sessionToken: z.string().min(16),
      })
    ).query(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      const grades = await gradeDb.getStudentGradeEntries(input.studentId);
      const average = await gradeDb.calculateStudentAverage(input.studentId);
      return { grades, average };
    }),

    createStudentGrade: publicProcedure.input(
      z.object({
        studentId: z.number(),
        sessionToken: z.string().min(16),
        disciplineId: z.number(),
        professorName: z.string().trim().max(255).optional(),
        grade: z.number().min(0).max(10).optional(),
        evaluationDate: z.string().trim().optional(),
        observation: z.string().trim().max(2000).optional(),
      })
    ).mutation(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      return gradeDb.createStudentGradeEntry(
        input.studentId,
        input.disciplineId,
        input.professorName,
        input.grade,
        input.evaluationDate,
        input.observation
      );
    }),

    updateStudentGrade: publicProcedure.input(
      z.object({
        id: z.number(),
        studentId: z.number(),
        sessionToken: z.string().min(16),
        disciplineId: z.number().optional(),
        professorName: z.string().trim().max(255).optional(),
        grade: z.number().min(0).max(10).nullable().optional(),
        evaluationDate: z.string().trim().nullable().optional(),
        observation: z.string().trim().max(2000).nullable().optional(),
      })
    ).mutation(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      await gradeDb.updateStudentGradeEntry(
        input.id,
        input.studentId,
        input.disciplineId,
        input.professorName,
        input.grade,
        input.evaluationDate,
        input.observation
      );
      return { success: true };
    }),

    deleteStudentGrade: publicProcedure.input(
      z.object({
        id: z.number(),
        studentId: z.number(),
        sessionToken: z.string().min(16),
      })
    ).mutation(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      await gradeDb.deleteStudentGradeEntry(input.id, input.studentId);
      return { success: true };
    }),

    login: publicProcedure.input(
      z.object({
        studentNumber: z.string().regex(/^\d{4}$/, "Número deve ter 4 dígitos").refine(
          (val) => {
            const num = parseInt(val);
            return num >= 1111 && num <= 5252;
          },
          "Número deve estar entre 1111 e 5252"
        ),
        cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX"),
      })
    ).mutation(async ({ input }) => {
      const student = await gradeDb.getGradeStudentByNumberAndCpf(
        input.studentNumber,
        input.cpf
      );

      if (!student) {
        const newStudent = await gradeDb.createGradeStudent(
          input.studentNumber,
          input.cpf
        );
        return { student: newStudent, isNewStudent: true };
      }

      return { student, isNewStudent: false };
    }),

    getDisciplines: publicProcedure.input(
      z.object({
        studentId: z.number(),
      })
    ).query(async ({ input }) => {
      const disciplines = await gradeDb.getDisciplinesByStudentId(input.studentId);
      const total = await gradeDb.calculateTotalGrade(input.studentId);
      return { disciplines, total };
    }),

    createDiscipline: publicProcedure.input(
      z.object({
        studentId: z.number(),
        disciplineName: z.string().min(1).max(255),
        professorName: z.string().max(255).optional(),
        grade: z.number().min(0).max(100).optional(),
      })
    ).mutation(async ({ input }) => {
      const discipline = await gradeDb.createDiscipline(
        input.studentId,
        input.disciplineName,
        input.professorName,
        input.grade
      );
      return discipline;
    }),

    updateDiscipline: publicProcedure.input(
      z.object({
        id: z.number(),
        disciplineName: z.string().min(1).max(255).optional(),
        professorName: z.string().max(255).optional(),
        grade: z.number().min(0).max(100).optional(),
      })
    ).mutation(async ({ input }) => {
      await gradeDb.updateDiscipline(
        input.id,
        input.disciplineName,
        input.professorName,
        input.grade
      );
      return { success: true };
    }),

    deleteDiscipline: publicProcedure.input(
      z.object({
        id: z.number(),
      })
    ).mutation(async ({ input }) => {
      await gradeDb.deleteDiscipline(input.id);
      return { success: true };
    }),
  }),

  gradeAdmin: router({
    createDiscipline: adminProcedure.input(
      z.object({
        name: z.string().trim().min(2).max(255),
        description: z.string().trim().max(2000).optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      return gradeDb.createCatalogDiscipline(input.name, input.description, ctx.user.id);
    }),

    createStudent: adminProcedure.input(
      z.object({
        numerica: z.string().trim().length(4),
        nomeGuerra: z.string().trim().min(2).max(255),
        senha: z.string().min(6),
      })
    ).mutation(async ({ input }) => {
      const validation = validateNumerica(input.numerica);
      if (!validation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error || "Numérica inválida",
        });
      }

      const exists = await studentDb.studentExists(input.numerica);
      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Aluno com esta numérica já existe",
        });
      }

      const student = await studentDb.createStudent(
        input.numerica,
        input.nomeGuerra,
        input.senha,
        validation.companhia,
        validation.peloton
      );

      if (!student) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar aluno" });
      }

      return student;
    }),

    resetStudentPassword: adminProcedure.input(
      z.object({
        studentId: z.number(),
        senha: z.string().min(6),
      })
    ).mutation(async ({ input }) => {
      await studentDb.updateStudentPassword(input.studentId, input.senha);
      return { success: true };
    }),

    deleteStudent: adminProcedure.input(
      z.object({
        studentId: z.number(),
      })
    ).mutation(async ({ input }) => {
      await studentDb.deleteStudent(input.studentId);
      return { success: true };
    }),

    students: adminProcedure.query(async () => {
      return studentDb.getAllStudents();
    }),

    allGrades: adminProcedure.query(async () => {
      return gradeDb.getAllStudentGradeEntries();
    }),

    ranking: adminProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      }).optional()
    ).query(async ({ input }) => {
      return gradeDb.getGradeRanking(input);
    }),
  }),

  student: studentRouter,
});

export type AppRouter = typeof appRouter;
