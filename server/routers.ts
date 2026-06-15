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
import * as serviceScaleDb from "./serviceScaleDb";
import * as peculioDb from "./peculioDb";
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

// Xerife Geral: master/admin or a user explicitly assigned as principal.
const masterProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role === "master" || ctx.user.role === "admin") {
    return next({ ctx });
  }

  const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
  if (assignment?.level === "principal") {
    return next({ ctx });
  }

  throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao Xerife Geral" });
});

// Allow master, admin, or any user with a xerife assignment
const scaleManagerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role === "master" || ctx.user.role === "admin") {
    return next({ ctx });
  }
  const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
  if (assignment) {
    return next({ ctx });
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores ou xerifes" });
});

async function requireServiceScaleAccess(
  user: any,
  companhia: number,
  peloton?: number | null,
) {
  const assignment = await serviceScaleDb.getXerifeAssignment(user.id);
  if (!serviceScaleDb.canAccessScope(user, assignment, companhia, peloton)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este Pelotão" });
  }
  return assignment;
}

async function isXerifeGeral(user: any) {
  if (user.role === "master" || user.role === "admin") return true;
  const assignment = await serviceScaleDb.getXerifeAssignment(user.id);
  return assignment?.level === "principal";
}

async function getPeculioLockState(
  user: any,
  companhia: number,
  peloton: number,
  date: string,
  report?: any | null,
) {
  const now = new Date();
  const entryTime = report?.entryTime || "05:00";
  const lockedAt = peculioDb.getPeculioLockedAt(date, entryTime);
  const lateArrivalUntil = peculioDb.getPeculioLateArrivalUntil(date, entryTime);
  const unlock = await peculioDb.getPeculioUnlock(companhia, peloton, date);
  const unlockedUntil = unlock?.unlockedUntil ? new Date(unlock.unlockedUntil) : null;
  const isReleased = Boolean(unlockedUntil && unlockedUntil.getTime() > now.getTime());
  const lockedByTime = now.getTime() >= lockedAt.getTime();
  const closedAt = report?.closedAt ? new Date(report.closedAt) : null;
  const manuallyClosed = Boolean(closedAt);
  const general = await isXerifeGeral(user);

  return {
    entryTime,
    lockedAt: lockedAt.toISOString(),
    lateArrivalUntil: lateArrivalUntil.toISOString(),
    closedAt: closedAt?.toISOString() ?? null,
    closedBy: report?.closedBy ?? null,
    closedByName: report?.closedByName ?? null,
    isManuallyClosed: manuallyClosed,
    isLocked: (lockedByTime || manuallyClosed) && !isReleased && !general,
    isReleased,
    unlockedUntil: unlockedUntil?.toISOString() ?? null,
    releaseReason: unlock?.reason ?? null,
    canRelease: general,
    canEdit: (!lockedByTime && !manuallyClosed) || isReleased || general,
    canRegisterArrival: (lockedByTime || manuallyClosed) && !isReleased && !general,
  };
}

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
      email: z.string(),
      password: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      let emailOrNumeric = input.email.trim();
      let normalizedEmail = emailOrNumeric.toLowerCase();
      if (/^\d{4}$/.test(emailOrNumeric)) {
        normalizedEmail = `${emailOrNumeric}@pmam.com`;
      }
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
    listAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "master" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
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
    create: masterProcedure.input(z.object({
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
    update: masterProcedure.input(z.object({
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
    delete: masterProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteHymn(input.id);
      return { success: true };
    }),
    uploadAudio: masterProcedure.input(z.object({
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
        companhia: z.number().int().optional(),
        peloton: z.number().int().optional(),
      }).optional()
    ).query(async ({ input }) => {
      return db.getActiveMissions(input?.visitorId, input?.companhia, input?.peloton);
    }),
    listAll: scaleManagerProcedure.query(async ({ ctx }) => {
      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (assignment) {
          const missions = await db.getAllMissions(null, assignment.companhia, assignment.peloton);
          return missions.filter((mission: any) =>
            mission.companhia === assignment.companhia &&
            mission.peloton === assignment.peloton
          );
        }
      }
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Comunicado não encontrado" });
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Comunicado não encontrado" });
      }

      return db.toggleMissionReaction(input.missionId, input.visitorId);
    }),
    create: scaleManagerProcedure.input(z.object({
      title: z.string(),
      content: z.string(),
      priority: z.enum(["normal", "urgente", "critica"]).default("normal"),
    })).mutation(async ({ input, ctx }) => {
      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      let companhia = null;
      let peloton = null;
      
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment) throw new TRPCError({ code: "FORBIDDEN", message: "Xerife sem atribuição de pelotão" });
        companhia = assignment.companhia;
        peloton = assignment.peloton;
      }

      await db.createMission({ ...input, authorId: ctx.user.id, companhia, peloton });
      await notifyOwner({
        title: `Nova Missão CFAP: ${input.title}`,
        content: `Uma nova missão foi publicada na página CFAP 2026: ${input.title}`,
      });
      return { success: true };
    }),
    update: scaleManagerProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      priority: z.enum(["normal", "urgente", "critica"]).optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const mission = await db.getMissionById(input.id);
      if (!mission) throw new TRPCError({ code: "NOT_FOUND", message: "Missão não encontrada" });

      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment || mission.companhia !== assignment.companhia || mission.peloton !== assignment.peloton) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para editar esta missão" });
        }
      }

      const { id, ...data } = input;
      await db.updateMission(id, data);
      return { success: true };
    }),
    delete: scaleManagerProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const mission = await db.getMissionById(input.id);
      if (!mission) throw new TRPCError({ code: "NOT_FOUND", message: "Missão não encontrada" });

      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment || mission.companhia !== assignment.companhia || mission.peloton !== assignment.peloton) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para excluir esta missão" });
        }
      }

      await db.deleteMission(input.id);
      return { success: true };
    }),
    uploadMedia: scaleManagerProcedure.input(z.object({
      missionId: z.number(),
      type: z.enum(["image", "video", "audio", "pdf", "document"]),
      fileName: z.string(),
      mimeType: z.string(),
      base64Data: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      duration: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const mission = await db.getMissionById(input.missionId);
      if (!mission) throw new TRPCError({ code: "NOT_FOUND", message: "Missão não encontrada" });
      
      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment || mission.companhia !== assignment.companhia || mission.peloton !== assignment.peloton) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para gerenciar mídias desta missão" });
        }
      }

      const suffix = nanoid(10);
      const ext = input.fileName.split('.').pop() || 'bin';
      const fileKey = `mission-media/${input.missionId}-${input.type}-${suffix}.${ext}`;
      const buffer = Buffer.from(input.base64Data, 'base64');
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      
      const mediaId = await db.createMissionMedia(input.missionId, {
        type: input.type,
        title: input.title,
        description: input.description,
        url,
        fileSize: buffer.length,
        mimeType: input.mimeType,
        duration: input.duration,
        uploadedBy: ctx.user.id,
      });
      
      return { mediaId, url, fileKey };
    }),
    getMedia: publicProcedure.input(z.object({
      missionId: z.number(),
    })).query(async ({ input }) => {
      return db.getMissionMedia(input.missionId);
    }),
    updateMedia: scaleManagerProcedure.input(z.object({
      mediaId: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const media = await db.getMediaById(input.mediaId);
      if (!media) throw new TRPCError({ code: "NOT_FOUND", message: "Mídia não encontrada" });
      
      const mission = await db.getMissionById(media.missionId);
      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment || !mission || mission.companhia !== assignment.companhia || mission.peloton !== assignment.peloton) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para alterar mídias desta missão" });
        }
      }

      const { mediaId, ...data } = input;
      await db.updateMissionMedia(mediaId, data);
      return { success: true };
    }),
    deleteMedia: scaleManagerProcedure.input(z.object({
      mediaId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const media = await db.getMediaById(input.mediaId);
      if (!media) throw new TRPCError({ code: "NOT_FOUND", message: "Mídia não encontrada" });
      
      const mission = await db.getMissionById(media.missionId);
      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment || !mission || mission.companhia !== assignment.companhia || mission.peloton !== assignment.peloton) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para remover mídias desta missão" });
        }
      }

      await db.deleteMissionMedia(input.mediaId);
      return { success: true };
    }),
    reorderMedia: scaleManagerProcedure.input(z.object({
      missionId: z.number(),
      mediaIds: z.array(z.number()),
    })).mutation(async ({ input, ctx }) => {
      const mission = await db.getMissionById(input.missionId);
      if (!mission) throw new TRPCError({ code: "NOT_FOUND", message: "Missão não encontrada" });

      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment || mission.companhia !== assignment.companhia || mission.peloton !== assignment.peloton) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para reordenar mídias desta missão" });
        }
      }

      await db.reorderMissionMedia(input.missionId, input.mediaIds);
      return { success: true };
    }),
  }),

  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "master" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
      return db.getStats();
    }),
    uploadAudio: masterProcedure.input(z.object({
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
    update: protectedProcedure.input(z.object({
      key: z.string(),
      value: z.string(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "master" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
      await db.setSetting(input.key, input.value);
      return { success: true };
    }),
    updateBatch: protectedProcedure.input(z.object({
      settings: z.array(z.object({ key: z.string(), value: z.string() })),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "master" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
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
    listAll: masterProcedure.query(async () => {
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
    create: masterProcedure.input(z.object({
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
    update: masterProcedure.input(z.object({
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
    delete: masterProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteDrill(input.id);
      return { success: true };
    }),
    uploadFile: masterProcedure.input(z.object({
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
    list: publicProcedure.input(
      z.object({
        companhia: z.number().int().optional(),
        peloton: z.number().int().optional(),
      }).optional()
    ).query(async ({ input, ctx }) => {
      let companhia: number | null | undefined = input?.companhia;
      let peloton: number | null | undefined = input?.peloton;

      // If called within an admin context (ctx.user exists) and they are a Xerife, auto-scope
      if (ctx.user) {
        const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
        if (!isMasterOrAdmin) {
          const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
          if (assignment) {
            companhia = assignment.companhia;
            peloton = assignment.peloton;
          }
        }
      }

      return await db.listBlogPosts(true, companhia, peloton);
    }),
    listAll: scaleManagerProcedure.query(async ({ ctx }) => {
      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment) throw new TRPCError({ code: "FORBIDDEN", message: "Xerife sem atribuição de pelotão" });
        const posts = await db.listBlogPosts(undefined, assignment.companhia, assignment.peloton);
        return posts.filter((post: any) =>
          post.companhia === assignment.companhia &&
          post.peloton === assignment.peloton
        );
      }

      return await db.listBlogPosts();
    }),
    getById: publicProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return await db.getBlogPostById(input.id);
    }),
    create: scaleManagerProcedure.input(z.object({
      title: z.string().min(1).max(255),
      content: z.string().min(1),
      imageUrl: z.string().nullable().optional(),
      youtubeUrl: z.string().nullable().optional(),
      published: z.boolean().default(false),
    })).mutation(async ({ input, ctx }) => {
      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      let companhia: number | null = null;
      let peloton: number | null = null;
      
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment) throw new TRPCError({ code: "FORBIDDEN", message: "Xerife sem atribuição de pelotão" });
        companhia = assignment.companhia;
        peloton = assignment.peloton;
      }

      const id = await db.createBlogPost({
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl ?? undefined,
        youtubeUrl: input.youtubeUrl ?? undefined,
        authorId: ctx.user.id,
        published: input.published,
        companhia,
        peloton
      });
      return await db.getBlogPostById(id!);
    }),
    update: scaleManagerProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      content: z.string().min(1).optional(),
      imageUrl: z.string().nullable().optional(),
      youtubeUrl: z.string().nullable().optional(),
      published: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const post = await db.getBlogPostById(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Comunicado não encontrado" });

      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment || post.companhia !== assignment.companhia || post.peloton !== assignment.peloton) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para editar este comunicado" });
        }
      }

      await db.updateBlogPost(input.id, {
        title: input.title,
        content: input.content,
        imageUrl: input.imageUrl ?? undefined,
        youtubeUrl: input.youtubeUrl,
        published: input.published,
      });
      return await db.getBlogPostById(input.id);
    }),
    delete: scaleManagerProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const post = await db.getBlogPostById(input.id);
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Comunicado não encontrado" });

      const isMasterOrAdmin = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!isMasterOrAdmin) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment || post.companhia !== assignment.companhia || post.peloton !== assignment.peloton) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para excluir este comunicado" });
        }
      }

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
    deleteComment: masterProcedure.input(z.object({
      commentId: z.number(),
    })).mutation(async ({ input }) => {
      await db.deleteBlogComment(input.commentId);
      return { success: true };
    }),
    uploadImage: scaleManagerProcedure.input(z.object({
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
    availableDisciplines: publicProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      }).optional()
    ).query(async ({ input }) => {
      return gradeDb.getActiveDisciplineCatalog(input?.companhia, input?.peloton);
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
    createDiscipline: masterProcedure.input(
      z.object({
        name: z.string().trim().min(2).max(255),
        description: z.string().trim().max(2000).optional(),
        startDate: z.string().trim().nullable().optional(),
        examDate: z.string().trim().nullable().optional(),
        status: z.string().trim().optional(),
        studyMaterialUrl: z.string().trim().nullable().optional(),
        studyMaterialName: z.string().trim().nullable().optional(),
        gaivotasLinks: z.string().trim().nullable().optional(),
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      if (input.companhia !== undefined && input.peloton !== undefined) {
        await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      }

      const disc = await gradeDb.createCatalogDiscipline(
        input.name,
        input.description,
        ctx.user.id,
        input.startDate,
        input.examDate,
        input.status,
        input.studyMaterialUrl,
        input.studyMaterialName,
        input.gaivotasLinks
      );

      if (input.companhia !== undefined && input.peloton !== undefined) {
        await gradeDb.upsertPlatoonDiscipline(
          disc.id,
          input.companhia,
          input.peloton,
          input.startDate,
          input.examDate,
          input.status
        );
      }
      return disc;
    }),

    updateDiscipline: masterProcedure.input(
      z.object({
        id: z.number(),
        name: z.string().trim().min(2).max(255),
        description: z.string().trim().max(2000).optional(),
        startDate: z.string().trim().nullable().optional(),
        examDate: z.string().trim().nullable().optional(),
        status: z.string().trim().optional(),
        studyMaterialUrl: z.string().trim().nullable().optional(),
        studyMaterialName: z.string().trim().nullable().optional(),
        gaivotasLinks: z.string().trim().nullable().optional(),
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      })
    ).mutation(async ({ input, ctx }) => {
      if (input.companhia !== undefined && input.peloton !== undefined) {
        await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      }

      await gradeDb.updateCatalogDiscipline(
        input.id,
        input.name,
        input.description,
        input.startDate,
        input.examDate,
        input.status,
        input.studyMaterialUrl,
        input.studyMaterialName,
        input.gaivotasLinks
      );

      if (input.companhia !== undefined && input.peloton !== undefined) {
        await gradeDb.upsertPlatoonDiscipline(
          input.id,
          input.companhia,
          input.peloton,
          input.startDate,
          input.examDate,
          input.status
        );
      }
      return { success: true };
    }),

    deleteDiscipline: masterProcedure.input(
      z.object({
        id: z.number(),
      })
    ).mutation(async ({ input }) => {
      await gradeDb.deleteCatalogDiscipline(input.id);
      return { success: true };
    }),


    createStudent: masterProcedure.input(
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

    resetStudentPassword: masterProcedure.input(
      z.object({
        studentId: z.number(),
        senha: z.string().min(6),
      })
    ).mutation(async ({ input }) => {
      await studentDb.updateStudentPassword(input.studentId, input.senha);
      return { success: true };
    }),

    deleteStudent: masterProcedure.input(
      z.object({
        studentId: z.number(),
      })
    ).mutation(async ({ input }) => {
      await studentDb.deleteStudent(input.studentId);
      return { success: true };
    }),

    students: scaleManagerProcedure.query(async ({ ctx }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      const all = await studentDb.getAllStudents();
      if (ctx.user.role === "admin" || ctx.user.role === "master" || !scope.companhia) {
        return all;
      }
      return all.filter(s => s.companhia === scope.companhia && (!scope.peloton || s.peloton === scope.peloton));
    }),

    allGrades: scaleManagerProcedure.query(async ({ ctx }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      const all = await gradeDb.getAllStudentGradeEntries();
      if (ctx.user.role === "admin" || ctx.user.role === "master" || !scope.companhia) {
        return all;
      }
      return all.filter(g => g.companhia === scope.companhia && (!scope.peloton || g.peloton === scope.peloton));
    }),

    ranking: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      const companhia = input?.companhia ?? scope.companhia;
      const peloton = input?.peloton ?? scope.peloton;
      if (companhia) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      }
      return gradeDb.getGradeRanking({ companhia, peloton });
    }),
  }),

  serviceScale: router({
    published: publicProcedure.input(
      z.object({
        weekStart: z.string().trim().optional(),
      }).optional()
    ).query(async ({ input }) => {
      return serviceScaleDb.getPublishedServiceBoard(input?.weekStart);
    }),

    myAccess: protectedProcedure.query(async ({ ctx }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const isGeneral = ctx.user.role === "master" || ctx.user.role === "admin" || assignment?.level === "principal";
      return {
        assignment,
        scope: serviceScaleDb.getDefaultScope(ctx.user, assignment),
        isMaster: ctx.user.role === "master",
        isGeneral,
      };
    }),

    students: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      const companhia = input?.companhia ?? scope.companhia;
      const peloton = input?.peloton ?? scope.peloton;

      if (companhia) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      } else if (!scope.unrestricted) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Xerife sem escopo configurado" });
      }

      return serviceScaleDb.listStudents({ companhia, peloton });
    }),

    getPlatoon: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        weekStart: z.string().trim().min(10).max(10),
      })
    ).query(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const [students, roles, week] = await Promise.all([
        serviceScaleDb.listStudents({ companhia: input.companhia, peloton: input.peloton }),
        serviceScaleDb.getPlatoonRoles(input.companhia, input.peloton),
        serviceScaleDb.getWeeklyScale(input.companhia, input.peloton, input.weekStart),
      ]);
      return { students, roles, week };
    }),

    saveRoles: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        homemHoraId: z.number().int().nullable().optional(),
        alunoLigacaoId: z.number().int().nullable().optional(),
        p5FilmmakerId: z.number().int().nullable().optional(),
        aditamento: z.string().trim().max(255).nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      await serviceScaleDb.upsertPlatoonRoles({
        ...input,
        updatedBy: ctx.user.id,
      });
      return { success: true };
    }),

    getClassroom: publicProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).query(async ({ input }) => {
      const students = await serviceScaleDb.listStudents({
        companhia: input.companhia,
        peloton: input.peloton,
      });
      return { students };
    }),

    getPlatoonPublic: publicProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        weekStart: z.string().trim().min(10).max(10),
      })
    ).query(async ({ input }) => {
      const [students, roles, week] = await Promise.all([
        serviceScaleDb.listStudents({ companhia: input.companhia, peloton: input.peloton }),
        serviceScaleDb.getPlatoonRoles(input.companhia, input.peloton),
        serviceScaleDb.getWeeklyScale(input.companhia, input.peloton, input.weekStart),
      ]);
      return { students, roles, week };
    }),

    getPlatoonCapacity: publicProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).query(async ({ input }) => {
      const key = `platoon_capacity_${input.companhia}_${input.peloton}`;
      const val = await db.getSetting(key);
      return { capacity: val ? parseInt(val, 10) : 51 };
    }),

    updatePlatoonCapacity: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        capacity: z.number().int().min(10).max(120),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const key = `platoon_capacity_${input.companhia}_${input.peloton}`;
      await db.setSetting(key, String(input.capacity));
      return { success: true };
    }),

    updateStudentDeskNumber: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
        deskNumber: z.number().int().nullable(),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);
      if (input.deskNumber !== null) {
        await studentDb.clearStudentDesk(student.companhia, student.peloton, input.deskNumber);
      }
      await studentDb.updateStudentDeskNumber(input.studentId, input.deskNumber);
      return { success: true };
    }),

    requestSeatChange: publicProcedure.input(
      z.object({
        studentId: z.number().int(),
        sessionToken: z.string().trim().min(16),
        requestedDeskNumber: z.number().int(),
      })
    ).mutation(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      if (input.requestedDeskNumber === student.deskNumber) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você já está nessa carteira" });
      }
      await serviceScaleDb.createSeatChangeRequest({
        studentId: student.id,
        companhia: student.companhia,
        peloton: student.peloton,
        requestedDeskNumber: input.requestedDeskNumber,
        currentDeskNumber: student.deskNumber ?? null,
      });
      return { success: true };
    }),

    seatChangeRequests: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        status: z.enum(["pending", "approved", "rejected"]).default("pending"),
      })
    ).query(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      return serviceScaleDb.listSeatChangeRequests(input.companhia, input.peloton, input.status);
    }),

    decideSeatChangeRequest: scaleManagerProcedure.input(
      z.object({
        id: z.number().int(),
        status: z.enum(["approved", "rejected"]),
        reason: z.string().trim().max(255).nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const request = await serviceScaleDb.getSeatChangeRequest(input.id);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido de carteira não encontrado" });
      }
      await requireServiceScaleAccess(ctx.user, request.companhia, request.peloton);
      if (request.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este pedido já foi decidido" });
      }
      if (input.status === "approved") {
        await studentDb.clearStudentDesk(request.companhia, request.peloton, request.requestedDeskNumber);
        await studentDb.updateStudentDeskNumber(request.studentId, request.requestedDeskNumber);
      }
      await serviceScaleDb.decideSeatChangeRequest({
        id: input.id,
        status: input.status,
        reason: input.reason ?? null,
        decidedBy: ctx.user.id,
      });
      return { success: true };
    }),

    listAditamentos: publicProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).query(async ({ input }) => {
      return serviceScaleDb.listAditamentos(input.companhia, input.peloton);
    }),

    saveAditamento: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        titulo: z.string().trim().min(1).max(255),
        conteudo: z.string().trim().nullable().optional(),
        data: z.string().trim().min(10).max(10),
        pdfUrl: z.string().trim().nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      await serviceScaleDb.createAditamento({
        companhia: input.companhia,
        peloton: input.peloton,
        titulo: input.titulo,
        conteudo: input.conteudo ?? null,
        data: input.data,
        pdfUrl: input.pdfUrl ?? null,
      });
      return { success: true };
    }),

    uploadAditamentoFile: scaleManagerProcedure.input(z.object({
      companhia: z.number().int().min(1).max(5),
      peloton: z.number().int().min(1).max(2),
      fileName: z.string().trim().min(1).max(180),
      mimeType: z.string().trim().min(3).max(120),
      base64Data: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const ext = input.fileName.split(".").pop() || "pdf";
      const buffer = Buffer.from(input.base64Data, "base64");
      const fileKey = `aditamentos/${input.companhia}-${input.peloton}/${Date.now()}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      return { url };
    }),

    deleteAditamento: scaleManagerProcedure.input(
      z.object({
        id: z.number().int(),
      })
    ).mutation(async ({ ctx, input }) => {
      const adit = await serviceScaleDb.getAditamento(input.id);
      if (!adit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aditamento não encontrado" });
      }
      await requireServiceScaleAccess(ctx.user, adit.companhia, adit.peloton);
      await serviceScaleDb.deleteAditamento(input.id);
      return { success: true };
    }),

    saveWeeklyScale: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        weekStart: z.string().trim().min(10).max(10),
        dutyDate: z.string().trim().max(10).nullable().optional(),
        xerifeId: z.number().int().nullable().optional(),
        subXerifeId: z.number().int().nullable().optional(),
        aditamento: z.string().trim().max(255).nullable().optional(),
        isPublished: z.boolean().optional(),
        cleaning: z.array(z.object({
          weekday: z.number().int().min(1).max(5),
          serviceDate: z.string().trim().max(10).nullable().optional(),
          studentIds: z.array(z.number().int()),
        })).optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const week = await serviceScaleDb.upsertWeeklyScale({
        ...input,
        updatedBy: ctx.user.id,
      });
      return week;
    }),

    updateStudentCondition: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
        condition: z.enum(["pronto", "falta", "atraso", "diverso_destino", "destino_ignorado", "dispensa_medica", "dispensa_administrativa"]),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);
      await studentDb.updateStudentCondition(input.studentId, input.condition);
      return { success: true };
    }),

    generateRotation: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        startDate: z.string().trim().min(10).max(10),
      })
    ).mutation(async ({ ctx, input }) => {
      const rotationPlatoons = [
        { companhia: 1, peloton: 1 },
        { companhia: 1, peloton: 2 },
        { companhia: 2, peloton: 1 },
        { companhia: 2, peloton: 2 },
        { companhia: 3, peloton: 1 },
        { companhia: 3, peloton: 2 },
        { companhia: 4, peloton: 1 },
        { companhia: 4, peloton: 2 },
        { companhia: 5, peloton: 1 },
        { companhia: 5, peloton: 2 },
      ];

      const startIndex = rotationPlatoons.findIndex(
        (p) => p.companhia === input.companhia && p.peloton === input.peloton
      );
      if (startIndex === -1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pelotão inicial inválido" });
      }

      function addWeekdays(startDateStr: string, weekdaysToAdd: number): string {
        const date = new Date(`${startDateStr}T00:00:00`);
        let count = 0;
        const direction = weekdaysToAdd >= 0 ? 1 : -1;
        const absWeekdays = Math.abs(weekdaysToAdd);
        while (count < absWeekdays) {
          date.setDate(date.getDate() + direction);
          const day = date.getDay();
          if (day !== 0 && day !== 6) {
            count++;
          }
        }
        return date.toISOString().slice(0, 10);
      }

      function getMondayOfWeek(dateStr: string): string {
        const date = new Date(`${dateStr}T00:00:00`);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setDate(diff);
        return date.toISOString().slice(0, 10);
      }

      for (let i = 0; i < 10; i++) {
        const p = rotationPlatoons[i];
        const offset = (i - startIndex + 10) % 10;
        const dutyDate = addWeekdays(input.startDate, offset);
        const weekStart = getMondayOfWeek(dutyDate);

        await serviceScaleDb.upsertWeeklyScale({
          companhia: p.companhia,
          peloton: p.peloton,
          weekStart,
          dutyDate,
          updatedBy: ctx.user.id,
        });
      }

      return { success: true };
    }),

    assignments: masterProcedure.query(async () => {
      return serviceScaleDb.listXerifeAssignments();
    }),

    saveAssignment: masterProcedure.input(
      z.object({
        userId: z.number().int(),
        level: z.enum(["principal", "companhia", "pelotao"]),
        companhia: z.number().int().min(1).max(5).nullable().optional(),
        peloton: z.number().int().min(1).max(2).nullable().optional(),
      })
    ).mutation(async ({ input }) => {
      await serviceScaleDb.upsertXerifeAssignment(input);
      return { success: true };
    }),

    deleteAssignment: masterProcedure.input(
      z.object({
        id: z.number().int(),
      })
    ).mutation(async ({ input }) => {
      await serviceScaleDb.deleteXerifeAssignment(input.id);
      return { success: true };
    }),

    promoteStudent: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
        role: z.enum(['xerife', 'sub_xerife']),
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      await serviceScaleDb.promoteStudentToXerife(
        input.studentId,
        input.role,
        input.companhia,
        input.peloton,
        ctx.user.id
      );
      return { success: true };
    }),

    getXerifeHistory: publicProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).query(async ({ input }) => {
      return serviceScaleDb.listXerifeHistory(input.companhia, input.peloton);
    }),

    getAllActiveXerifes: publicProcedure.query(async () => {
      return serviceScaleDb.listAllActiveXerifes();
    }),

    myNotices: publicProcedure.input(
      z.object({
        studentId: z.number().int(),
        sessionToken: z.string().trim().min(16),
      })
    ).query(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      return serviceScaleDb.listStudentNotices(student.id, student.companhia, student.peloton);
    }),

    markNoticeRead: publicProcedure.input(
      z.object({
        studentId: z.number().int(),
        sessionToken: z.string().trim().min(16),
        noticeId: z.number().int(),
      })
    ).mutation(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      await serviceScaleDb.markNoticeRead(input.noticeId, input.studentId);
      return { success: true };
    }),

    createNotice: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).nullable().optional(),
        peloton: z.number().int().min(1).max(2).nullable().optional(),
        studentId: z.number().int().nullable().optional(),
        title: z.string().trim().min(1).max(160),
        message: z.string().trim().min(1).max(4000),
        priority: z.enum(["normal", "important", "urgent"]).default("normal"),
      })
    ).mutation(async ({ ctx, input }) => {
      let companhia = input.companhia ?? null;
      let peloton = input.peloton ?? null;
      const general = await isXerifeGeral(ctx.user);
      if (!general) {
        const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
        if (!assignment?.companhia || !assignment?.peloton) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Xerife sem escopo de Pelotão" });
        }
        companhia = assignment.companhia;
        peloton = assignment.peloton;
      } else if (companhia && peloton) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      }
      if (input.studentId) {
        const student = await studentDb.getStudentById(input.studentId);
        if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        companhia = student.companhia;
        peloton = student.peloton;
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      }
      const id = await serviceScaleDb.createNotice({
        companhia,
        peloton,
        studentId: input.studentId ?? null,
        title: input.title,
        message: input.message,
        priority: input.priority,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

    addStudentObservation: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
        type: z.enum(["positive", "negative", "neutral"]).default("neutral"),
        note: z.string().trim().min(1).max(4000),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);
      const id = await serviceScaleDb.createStudentObservation({
        studentId: student.id,
        companhia: student.companhia,
        peloton: student.peloton,
        type: input.type,
        note: input.note,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

    createStudentHighlight: masterProcedure.input(
      z.object({
        studentId: z.number().int(),
        title: z.string().trim().min(1).max(160),
        description: z.string().trim().max(4000).nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      const id = await serviceScaleDb.createStudentHighlight({
        studentId: student.id,
        companhia: student.companhia,
        peloton: student.peloton,
        title: input.title,
        description: input.description ?? null,
        promotedBy: ctx.user.id,
      });
      return { id };
    }),

    studentHighlights: publicProcedure.query(async () => {
      return serviceScaleDb.listStudentHighlights(6);
    }),
  }),

  peculio: router({
    list: masterProcedure.input(
      z.object({
        date: z.string().trim().min(10).max(10),
      })
    ).query(async ({ ctx, input }) => {
      const summaries = await peculioDb.listPeculioSummaries(input.date);
      const rows = [];
      for (const item of summaries) {
        const lock = await getPeculioLockState(ctx.user, item.companhia, item.peloton, item.date, item);
        rows.push({ ...item, lock });
      }
      return rows;
    }),

    get: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        date: z.string().trim().min(10).max(10),
      })
    ).query(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const data = await peculioDb.getPeculioReport(input.companhia, input.peloton, input.date);
      const lock = await getPeculioLockState(ctx.user, input.companhia, input.peloton, input.date, data.report);
      return { ...data, lock };
    }),

    save: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        date: z.string().trim().min(10).max(10),
        instrucaoLocal: z.string().trim().nullable().optional(),
        instrucaoDisciplina: z.string().trim().nullable().optional(),
        instrucaoExterna: z.boolean().optional(),
        entryTime: z.string().trim().regex(/^\d{2}:\d{2}$/).nullable().optional(),
        chefeTurma: z.string().trim().nullable().optional(),
        subchefeTurma: z.string().trim().nullable().optional(),
        cmtPel: z.string().trim().nullable().optional(),
        statuses: z.array(
          z.object({
            studentId: z.number().int(),
            status: z.enum(["pronto", "falta", "atraso", "diverso_destino", "destino_ignorado", "dispensa_medica", "dispensa_administrativa"]),
            observacao: z.string().trim().nullable().optional(),
            arrivalTime: z.string().datetime().nullable().optional(),
          })
        ),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const current = await peculioDb.getPeculioReport(input.companhia, input.peloton, input.date);
      const lock = await getPeculioLockState(ctx.user, input.companhia, input.peloton, input.date, current.report);
      if (!lock.canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Pecúlio fechado para edição. Solicite liberação ao Xerife Geral.",
        });
      }
      return peculioDb.savePeculioReport(input);
    }),

    close: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        date: z.string().trim().min(10).max(10),
        entryTime: z.string().trim().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const current = await peculioDb.getPeculioReport(input.companhia, input.peloton, input.date);
      const lock = await getPeculioLockState(ctx.user, input.companhia, input.peloton, input.date, current.report);
      if (!lock.canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Pecúlio fechado para edição. Solicite liberação ao Xerife Geral.",
        });
      }
      return peculioDb.closePeculioReport({
        companhia: input.companhia,
        peloton: input.peloton,
        date: input.date,
        entryTime: input.entryTime ?? current.report?.entryTime ?? "05:00",
        closedBy: ctx.user.id,
      });
    }),

    release: masterProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        date: z.string().trim().min(10).max(10),
        reason: z.string().trim().max(255).nullable().optional(),
        hours: z.number().int().min(1).max(72).default(12),
      })
    ).mutation(async ({ ctx, input }) => {
      const unlockedUntil = new Date(Date.now() + input.hours * 60 * 60 * 1000);
      await peculioDb.releasePeculio({
        companhia: input.companhia,
        peloton: input.peloton,
        date: input.date,
        reason: input.reason ?? null,
        unlockedUntil,
        unlockedBy: ctx.user.id,
      });
      return {
        success: true,
        unlockedUntil: unlockedUntil.toISOString(),
      };
    }),

    registerArrival: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        date: z.string().trim().min(10).max(10),
        studentId: z.number().int(),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const belongs = await peculioDb.studentBelongsToPeculioScope(input.studentId, input.companhia, input.peloton);
      if (!belongs) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Aluno não pertence a esta Companhia/Pelotão.",
        });
      }

      const current = await peculioDb.getPeculioReport(input.companhia, input.peloton, input.date);
      const lock = await getPeculioLockState(ctx.user, input.companhia, input.peloton, input.date, current.report);
      if (!lock.canRegisterArrival && !lock.canEdit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Registro de chegada indisponível para este pecúlio.",
        });
      }

      return peculioDb.registerPeculioArrival({
        companhia: input.companhia,
        peloton: input.peloton,
        date: input.date,
        studentId: input.studentId,
        entryTime: current.report?.entryTime ?? lock.entryTime,
        registeredBy: ctx.user.id,
      });
    }),

    requestJustification: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        date: z.string().trim().min(10).max(10),
        studentId: z.number().int(),
        note: z.string().trim().min(5).max(500),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const belongs = await peculioDb.studentBelongsToPeculioScope(input.studentId, input.companhia, input.peloton);
      if (!belongs) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Aluno não pertence a esta Companhia/Pelotão.",
        });
      }

      const current = await peculioDb.getPeculioReport(input.companhia, input.peloton, input.date);
      return peculioDb.requestPeculioJustification({
        companhia: input.companhia,
        peloton: input.peloton,
        date: input.date,
        studentId: input.studentId,
        note: input.note,
        entryTime: current.report?.entryTime ?? "05:00",
        requestedBy: ctx.user.id,
      });
    }),

    reviewJustification: masterProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        date: z.string().trim().min(10).max(10),
        studentId: z.number().int(),
        approved: z.boolean(),
        approvedStatus: z.enum(["pronto", "atraso", "dispensa_administrativa"]).default("pronto"),
      })
    ).mutation(async ({ ctx, input }) => {
      return peculioDb.reviewPeculioJustification({
        companhia: input.companhia,
        peloton: input.peloton,
        date: input.date,
        studentId: input.studentId,
        approved: input.approved,
        reviewedBy: ctx.user.id,
        approvedStatus: input.approvedStatus,
      });
    }),

  }),

  // ===== CLASSROOM: CARGOS E TESOURARIA =====
  classroom: router({
    listCargos: publicProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).query(async ({ input }) => {
      return serviceScaleDb.listCargos(input.companhia, input.peloton);
    }),

    createCargo: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        nome: z.string().trim().min(1).max(100),
        descricao: z.string().trim().max(255).optional(),
        icone: z.string().trim().max(50).optional(),
        temTesouraria: z.boolean().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const id = await serviceScaleDb.createCargo({ ...input, createdBy: ctx.user.id });
      return { id };
    }),

    updateCargo: scaleManagerProcedure.input(
      z.object({
        id: z.number().int(),
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        nome: z.string().trim().min(1).max(100).optional(),
        descricao: z.string().trim().max(255).optional(),
        icone: z.string().trim().max(50).optional(),
        temTesouraria: z.boolean().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const scope = await serviceScaleDb.getCargoScope(input.id);
      if (!scope) throw new TRPCError({ code: "NOT_FOUND", message: "Função não encontrada" });
      await requireServiceScaleAccess(ctx.user, scope.companhia, scope.peloton);
      await serviceScaleDb.updateCargo(input.id, input);
      return { success: true };
    }),

    deleteCargo: scaleManagerProcedure.input(
      z.object({
        id: z.number().int(),
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).mutation(async ({ ctx, input }) => {
      const scope = await serviceScaleDb.getCargoScope(input.id);
      if (!scope) throw new TRPCError({ code: "NOT_FOUND", message: "Função não encontrada" });
      await requireServiceScaleAccess(ctx.user, scope.companhia, scope.peloton);
      await serviceScaleDb.deleteCargo(input.id);
      return { success: true };
    }),

    addCargoMember: scaleManagerProcedure.input(
      z.object({
        cargoId: z.number().int(),
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        studentId: z.number().int(),
        tituloCargo: z.string().trim().max(100).optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const scope = await serviceScaleDb.getCargoScope(input.cargoId);
      if (!scope) throw new TRPCError({ code: "NOT_FOUND", message: "Função não encontrada" });
      await requireServiceScaleAccess(ctx.user, scope.companhia, scope.peloton);
      await serviceScaleDb.addCargoMember(input.cargoId, input.studentId, input.tituloCargo);
      return { success: true };
    }),

    removeCargoMember: scaleManagerProcedure.input(
      z.object({
        cargoId: z.number().int(),
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        studentId: z.number().int(),
      })
    ).mutation(async ({ ctx, input }) => {
      const scope = await serviceScaleDb.getCargoScope(input.cargoId);
      if (!scope) throw new TRPCError({ code: "NOT_FOUND", message: "Função não encontrada" });
      await requireServiceScaleAccess(ctx.user, scope.companhia, scope.peloton);
      await serviceScaleDb.removeCargoMember(input.cargoId, input.studentId);
      return { success: true };
    }),

    listTreasuryEntries: publicProcedure.input(
      z.object({ cargoId: z.number().int() })
    ).query(async ({ input }) => {
      return serviceScaleDb.listTreasuryEntries(input.cargoId);
    }),

    addTreasuryEntry: scaleManagerProcedure.input(
      z.object({
        cargoId: z.number().int(),
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        tipo: z.enum(['entrada', 'saida']),
        valor: z.number().positive(),
        descricao: z.string().trim().min(1).max(255),
        data: z.string().trim().min(10).max(10),
      })
    ).mutation(async ({ ctx, input }) => {
      const scope = await serviceScaleDb.getCargoScope(input.cargoId);
      if (!scope) throw new TRPCError({ code: "NOT_FOUND", message: "Função não encontrada" });
      await requireServiceScaleAccess(ctx.user, scope.companhia, scope.peloton);
      const id = await serviceScaleDb.addTreasuryEntry({ ...input, registradoPor: ctx.user.id });
      return { id };
    }),

    deleteTreasuryEntry: scaleManagerProcedure.input(
      z.object({
        id: z.number().int(),
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).mutation(async ({ ctx, input }) => {
      const scope = await serviceScaleDb.getTreasuryEntryScope(input.id);
      if (!scope) throw new TRPCError({ code: "NOT_FOUND", message: "Lançamento não encontrado" });
      await requireServiceScaleAccess(ctx.user, scope.companhia, scope.peloton);
      await serviceScaleDb.deleteTreasuryEntry(input.id);
      return { success: true };
    }),
  }),

  student: studentRouter,
});

export type AppRouter = typeof appRouter;
