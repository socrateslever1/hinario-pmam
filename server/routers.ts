import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storageDelete, storagePut, storagePutWithRollback } from "./storage";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import bcrypt from "bcryptjs";
import { getStudyStudentNumberErrorMessage, isValidStudyStudentNumber } from "../shared/study";
import { getFoCodeDefinition, normalizeFoCode } from "../shared/foCatalog";
import * as gradeDb from "./gradeDb";
import * as studentDb from "./studentDb";
import * as serviceScaleDb from "./serviceScaleDb";
import * as peculioDb from "./peculioDb";
import * as administrativeDailyDb from "./administrativeDailyDb";
import * as cfapPersonnelDb from "./cfapPersonnelDb";
import * as cfapHistoryDb from "./cfapHistoryDb";
import * as officialDocumentsDb from "./officialDocumentsDb";
import * as documentosParteDb from "./documentosParteDb";
import * as foDb from "./foDb";
import * as bugleDb from "./bugleDb";
import * as ordemUnidaAudioDb from "./ordemUnidaAudioDb";
import { validateNumerica, getCompanhiaLabel, getPelotonLabel } from "../shared/studentValidation";
import { studentRouter } from "./studentRouter";

const INVALID_LOGIN_MESSAGE = "E-mail ou senha inválidos.";
const INVALID_STUDY_STUDENT_NUMBER_MESSAGE = getStudyStudentNumberErrorMessage();
const lcTimeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: "Informe um horario valido no formato HH:MM.",
});

const studyStudentNumberSchema = z.string().trim().refine(isValidStudyStudentNumber, {
  message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE,
});

const optionalContentUrl = z
  .string()
  .trim()
  .max(15 * 1024 * 1024)
  .refine(
    (val) => !val || val.startsWith("http://") || val.startsWith("https://") || val.startsWith("/") || val.startsWith("data:"),
    { message: "Informe uma URL válida ou áudio." },
  )
  .nullable()
  .optional();
const bugleCallFields = {
  name: z.string().trim().min(1).max(255),
  audioUrl: optionalContentUrl,
  iconKey: z.string().trim().min(1).max(64).default("music"),
  troopState: z.string().trim().max(120).nullable().optional(),
  category: z.string().trim().min(1).max(100).default("geral"),
  sourceUrl: optionalContentUrl,
  sortOrder: z.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
};
const marchFields = {
  title: z.string().trim().min(1).max(255),
  composer: z.string().trim().max(255).nullable().optional(),
  audioUrl: optionalContentUrl,
  sourceUrl: optionalContentUrl,
  sortOrder: z.number().int().min(0).max(10000).default(0),
  isActive: z.boolean().default(true),
};

const PUBLIC_BUGLE_PANEL_CACHE_MS = 60_000;
let publicBuglePanelCache: { expiresAt: number; data: any } | null = null;
let publicBuglePanelPromise: Promise<any> | null = null;

function clearPublicBuglePanelCache() {
  publicBuglePanelCache = null;
  publicBuglePanelPromise = null;
}

async function getPublicBuglePanel() {
  const now = Date.now();
  if (publicBuglePanelCache && publicBuglePanelCache.expiresAt > now) {
    return publicBuglePanelCache.data;
  }
  if (!publicBuglePanelPromise) {
    publicBuglePanelPromise = Promise.all([
      bugleDb.listBugleCalls(true),
      bugleDb.listMarches(true),
    ]).then(([calls, marches]) => {
      const data = { calls, marches };
      publicBuglePanelCache = { expiresAt: Date.now() + PUBLIC_BUGLE_PANEL_CACHE_MS, data };
      publicBuglePanelPromise = null;
      return data;
    }).catch((error) => {
      publicBuglePanelPromise = null;
      throw error;
    });
  }
  return publicBuglePanelPromise;
}

const cfapPersonnelInputSchema = z.object({
  category: z.enum(["comando", "administracao", "corpo_alunos", "apoio"]),
  rank: z.string().trim().min(2).max(60),
  fullName: z.string().trim().min(3).max(255),
  ci: z.string().trim().max(40).nullable().optional(),
  permanentFunction: z.string().trim().min(2).max(255),
  section: z.string().trim().max(120).nullable().optional(),
  companhia: z.number().int().min(1).max(5).nullable().optional(),
  peloton: z.number().int().min(1).max(2).nullable().optional(),
  isActive: z.boolean().optional(),
  sourceDocument: z.string().trim().max(255).nullable().optional(),
  sourceDate: z.string().trim().max(10).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

const cfapHistoryLinkSchema = z.object({
  title: z.string().trim().min(1).max(180),
  url: z.string().trim().url().max(2000),
});
const cfapHistoryInputSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  rank: z.string().trim().min(2).max(80),
  name: z.string().trim().min(3).max(255),
  periods: z.array(z.string().trim().min(3).max(120)).min(1).max(8),
  portraitUrl: z.string().trim().max(15 * 1024 * 1024).refine(
    (value) => !value || value.startsWith("/") || value.startsWith("https://") || value.startsWith("data:image/"),
    { message: "Informe uma imagem local, HTTPS ou data URL válida." },
  ).nullable(),
  biography: z.string().trim().max(30000).nullable(),
  highlights: z.array(z.string().trim().min(3).max(2000)).max(30),
  videos: z.array(cfapHistoryLinkSchema).max(20),
  sources: z.array(cfapHistoryLinkSchema).max(30),
  inMemoriam: z.boolean(),
  isVisible: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000),
});

const OFFICIAL_DOCUMENT_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "odt", "ods", "txt", "png", "jpg", "jpeg",
]);
const MAX_OFFICIAL_DOCUMENT_SIZE = 15 * 1024 * 1024;
const MAX_BAIXADO_DOCUMENT_SIZE = 15 * 1024 * 1024;
const MAX_ORDEM_UNIDA_AUDIO_SIZE = 50 * 1024 * 1024;
const MAX_VOICE_AUTHOR_PHOTO_SIZE = 8 * 1024 * 1024;
const MAX_STANDARD_MEDIA_SIZE = 50 * 1024 * 1024;
const MAX_BLOG_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_ADITAMENTO_SIZE = 15 * 1024 * 1024;
const BLOG_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ADITAMENTO_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const ORDEM_UNIDA_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg", "audio/mp3", "audio/x-mp3", "audio/wav", "audio/x-wav", "audio/wave",
  "audio/ogg", "audio/webm", "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac",
  "audio/x-aac", "audio/flac", "application/octet-stream",
]);
const VOICE_AUTHOR_PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function voiceProfileKey(authorName: string) {
  return authorName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "default";
}
const BAIXADO_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
const COMMAND_ROLES = [
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
  "comandante_cia",
  "comandante_pel",
] as const;
const GLOBAL_COMMAND_ROLES = [
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
] as const;
const COMMAND_ACCESS_ROLES = [
  "admin",
  "master",
  "comandante_corpo",
  "subcomandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "comandante_cia",
  "comandante_pel",
] as const;
const STUDENT_DOCUMENT_APPROVER_ROLES = [
  "master",
  "admin",
  "comandante_corpo",
  "subcomandante_corpo",
  "sub_comandante_corpo",
  "comandante_cfap",
  "subcomandante_cfap",
  "sub_comandante_cfap",
] as const;

function isCommandRole(role?: string | null) {
  return COMMAND_ROLES.includes(String(role || "") as any);
}

function isGlobalCommandRole(role?: string | null) {
  return GLOBAL_COMMAND_ROLES.includes(String(role || "") as any);
}

function isGeneralCommandRole(role?: string | null) {
  return STUDENT_DOCUMENT_APPROVER_ROLES.includes(String(role || "") as any);
}


async function requireStudentSession(studentId: number, sessionToken: string) {
  const isValid = await studentDb.verifyStudentSession(studentId, sessionToken);
  if (!isValid) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão do aluno inválida" });
  }
}

function requireActivatedStudent(student: studentDb.StudentData) {
  if (student.registrationStatus !== "active") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Esta numérica ainda é uma vaga disponível. Nenhum lançamento pode ser vinculado a uma vaga sem aluno cadastrado.",
    });
  }
  return student;
}

async function requireStudyStudentSession(
  studentId: number,
  sessionToken: string,
  studentNumber: string,
) {
  await requireStudentSession(studentId, sessionToken);
  const student = await studentDb.getStudentById(studentId);
  if (!student || student.numerica !== studentNumber) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso ao progresso de estudos negado" });
  }
  return student;
}

async function requireStudentDisciplineScope(
  studentId: number,
  sessionToken: string,
  disciplineId: number,
) {
  await requireStudentSession(studentId, sessionToken);
  const student = await studentDb.getStudentById(studentId);
  if (!student) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
  }
  const isAvailable = await gradeDb.isDisciplineAvailableForScope(
    disciplineId,
    student.companhia,
    student.peloton,
  );
  if (!isAvailable) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Disciplina indisponível para o seu pelotão" });
  }
  return student;
}

// Admin or Master can access
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "master") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

const masterOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "master" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Gestão de usuários restrita ao Xerife Geral ou Administrador" });
  }
  return next({ ctx });
});

// Xerife Geral: master/admin, a user explicitly assigned as principal, or any commander.
const masterProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (
    ctx.user.role === "master" ||
    ctx.user.role === "admin" ||
    isGlobalCommandRole(ctx.user.role)
  ) {
    return next({ ctx });
  }

  const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
  if (assignment?.level === "principal") {
    return next({ ctx });
  }

  throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao comando ou Xerife Geral" });
});

// Allow master, admin, any commander, or any user with a xerife assignment
const scaleManagerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (
    ctx.user.role === "master" ||
    ctx.user.role === "admin" ||
    isCommandRole(ctx.user.role)
  ) {
    return next({ ctx });
  }
  const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
  if (assignment) {
    return next({ ctx });
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a comandantes, administradores ou xerifes" });
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

function canCommandViewAllClassrooms(user: any) {
  return isGlobalCommandRole(user?.role);
}

async function requireClassroomViewAccess(
  user: any,
  companhia: number,
  peloton?: number | null,
) {
  if (canCommandViewAllClassrooms(user)) {
    return null;
  }
  return requireServiceScaleAccess(user, companhia, peloton);
}

function canApproveStudentDocuments(user: any) {
  return isGeneralCommandRole(user?.role);
}

function canHomologateFoLc(user: any) {
  return user?.role === "master" || user?.role === "admin" || user?.role === "comandante_corpo";
}

function requireFoLcHomologationAccess(user: any) {
  if (!canHomologateFoLc(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Homologação de FO/LC restrita ao Comandante do CAL",
    });
  }
}

function requireStudentDocumentApprovalAccess(user: any) {
  if (!canApproveStudentDocuments(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Aprovação de Parte restrita ao Comando do Corpo de Alunos",
    });
  }
}

async function isXerifeGeral(user: any) {
  if (user.role === "master" || user.role === "admin" || isGeneralCommandRole(user.role)) return true;
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
  const openedAt = peculioDb.getPeculioOpenedAt(date, entryTime);
  const lockedAt = peculioDb.getPeculioLockedAt(date, entryTime);
  const lateArrivalUntil = peculioDb.getPeculioLateArrivalUntil(date, entryTime);
  const unlock = await peculioDb.getPeculioUnlock(companhia, peloton, date);
  const unlockedUntil = unlock?.unlockedUntil ? new Date(unlock.unlockedUntil) : null;
  const isReleased = Boolean(unlockedUntil && unlockedUntil.getTime() > now.getTime());
  
  const notOpenedYet = now.getTime() < openedAt.getTime();
  const alreadyPassed = now.getTime() >= lockedAt.getTime();
  const lockedByTime = alreadyPassed || notOpenedYet;

  const closedAt = report?.closedAt ? new Date(report.closedAt) : null;
  const manuallyClosed = Boolean(closedAt);
  const general = await isXerifeGeral(user);

  return {
    entryTime,
    openedAt: openedAt.toISOString(),
    lockedAt: lockedAt.toISOString(),
    lateArrivalUntil: lateArrivalUntil.toISOString(),
    closedAt: closedAt?.toISOString() ?? null,
    closedBy: report?.closedBy ?? null,
    closedByName: report?.closedByName ?? null,
    isManuallyClosed: manuallyClosed,
    notOpenedYet,
    isLocked: (lockedByTime || manuallyClosed) && !isReleased && !general,
    isReleased,
    unlockedUntil: unlockedUntil?.toISOString() ?? null,
    releaseReason: unlock?.reason ?? null,
    canRelease: general,
    canEdit: (!lockedByTime && !manuallyClosed) || isReleased || general,
    canRegisterArrival: (alreadyPassed || manuallyClosed) && !isReleased && !general,
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
      if (ctx.res && typeof (ctx.res as any).clearCookie === "function") {
        (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      } else if (ctx.resHeaders) {
        let cookieStr = `${COOKIE_NAME}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=${cookieOptions.sameSite || 'Lax'}`;
        if (cookieOptions.secure) {
          cookieStr += '; Secure';
        }
        ctx.resHeaders.append('Set-Cookie', cookieStr);
      }
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure.input(
      z.object({
        name: z.string().trim().min(2).max(255).optional(),
        fotoUrl: z.string().trim().max(2 * 1024 * 1024).nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true, message: 'Perfil atualizado com sucesso' };
    }),
    listCommandDirectory: protectedProcedure.query(async () => {
      const commandRoles = ['admin', 'master', ...COMMAND_ROLES];
      const users = await db.getAllUsers();
      return users
        .filter(u => commandRoles.includes(u.role || ''))
        .map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          pelotaoId: u.pelotaoId,
          companhiaId: u.companhiaId,
          fotoUrl: u.fotoUrl,
        }));
    }),
    loginEmail: publicProcedure.input(z.object({
      email: z.string(),
      password: z.string().min(1),
      rememberMe: z.boolean().optional().default(false),
    })).mutation(async ({ input, ctx }) => {
      let emailOrNumeric = input.email.trim();
      let normalizedEmail = emailOrNumeric.toLowerCase();
      let numerica = /^\d{4}$/.test(emailOrNumeric) ? emailOrNumeric : null;

      if (numerica) {
        normalizedEmail = `${emailOrNumeric}@pmam.com`;
      } else if (/^\d{4}@pmam\.com$/.test(normalizedEmail)) {
        numerica = normalizedEmail.split('@')[0];
      }

      let user = await db.getUserByEmail(normalizedEmail);

      // Auto-create user from student record if user row doesn't exist yet
      if (!user && numerica) {
        const student = await studentDb.getStudentByNumerica(numerica);
        if (student) {
          if (student.registrationStatus !== "active") {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Esta vaga ainda não possui cadastro. Use o acesso do aluno para criar sua conta.",
            });
          }
          console.info(`[Auth] User not found for ${normalizedEmail}, but student ${numerica} exists. Auto-creating user row...`);
          const hashedPassword = await bcrypt.hash(input.password, 10);
          const openId = `student-${numerica}-${Date.now()}`;
          const { query } = await import("./mysql");
          await query(
            `INSERT INTO pmam_users (open_id, name, email, password, login_method, role, student_id, companhia_id, pelotao_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'email', 'student', ?, ?, ?, NOW(), NOW())`,
            [openId, student.nomeGuerra || `Aluno ${numerica}`, normalizedEmail, hashedPassword, student.id, student.companhia, student.peloton]
          );
          user = await db.getUserByEmail(normalizedEmail);
        }
      }

      if (!user) {
        console.warn(`[Auth] Login failed: User not found for email ${normalizedEmail}`);
        throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_LOGIN_MESSAGE });
      }

      if (user.isActive === false) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada. Procure um administrador." });
      }

      if (!user.password) {
        console.warn(`[Auth] Login failed: User ${normalizedEmail} has no password set`);
        throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_LOGIN_MESSAGE });
      }
      
      const dbPassword = user.password;
      const isBcrypt = dbPassword && (dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$") || dbPassword.startsWith("$2y$"));
      let valid = false;

      if (isBcrypt) {
        valid = await bcrypt.compare(input.password, dbPassword);
      } else if (dbPassword && dbPassword.startsWith("hash:")) {
        valid = await bcrypt.compare(input.password, dbPassword);
      } else {
        valid = input.password === dbPassword;
      }

      // Check fallback student logic or default password if not valid yet
      if (!valid) {
        let numericaToTest = numerica;
        if (!numericaToTest && user.studentId) {
          const student = await studentDb.getStudentById(user.studentId);
          if (student) numericaToTest = student.numerica;
        }

        if (numericaToTest) {
          const isStudentPasswordValid = await studentDb.verifyStudentPassword(numericaToTest, input.password);
          if (isStudentPasswordValid) {
            console.info(`[Auth] Fallback login successful for student ${numericaToTest}. Syncing password to pmam_users.`);
            const studentData = await studentDb.getStudentByNumerica(numericaToTest);
            if (studentData) {
              const { query } = await import("./mysql");
              const newHash = await bcrypt.hash(input.password, 10);
              await query(
                "UPDATE pmam_users SET password = ?, student_id = ? WHERE id = ?",
                [newHash, studentData.id, user.id]
              );
              user.password = newHash;
              user.studentId = studentData.id;
              valid = true;
            }
          }
        }
      }
      
      if (!valid) {
        console.warn(`[Auth] Login failed: Invalid password for user ${normalizedEmail}`);
        throw new TRPCError({ code: "UNAUTHORIZED", message: INVALID_LOGIN_MESSAGE });
      }
      // Create session token with 10 years expiration (practically forever)
      const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "user",
        expiresInMs: TEN_YEARS_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      if (ctx.res && typeof ctx.res.cookie === "function") {
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: TEN_YEARS_MS });
      } else if (ctx.resHeaders) {
        let cookieStr = `${COOKIE_NAME}=${sessionToken}; Max-Age=${Math.floor(TEN_YEARS_MS / 1000)}; Path=/; HttpOnly; SameSite=${cookieOptions.sameSite || 'Lax'}`;
        if (cookieOptions.secure) {
          cookieStr += '; Secure';
        }
        ctx.resHeaders.append('Set-Cookie', cookieStr);
      }
      // Update last signed in
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      return { success: true, sessionToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, forcePasswordChange: user.forcePasswordChange, fotoUrl: user.fotoUrl } };
    }),
  }),

  study: router({
    ensureStudent: publicProcedure.input(z.object({
      studentId: z.number().int().positive(),
      sessionToken: z.string().min(16),
      studentNumber: studyStudentNumberSchema,
      displayName: z.string().trim().min(2).max(120).nullable().optional(),
    })).mutation(async ({ input }) => {
      try {
        await requireStudyStudentSession(input.studentId, input.sessionToken, input.studentNumber);
        return await db.ensureStudyStudentSession(
          input.studentNumber,
          input.displayName ?? null,
          null
        );
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_STUDY_STUDENT_NUMBER") {
          throw new TRPCError({ code: "BAD_REQUEST", message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE });
        }
        throw error;
      }
    }),
    dashboard: publicProcedure.input(z.object({
      studentId: z.number().int().positive(),
      sessionToken: z.string().min(16),
      studentNumber: studyStudentNumberSchema,
    })).query(async ({ input }) => {
      try {
        await requireStudyStudentSession(input.studentId, input.sessionToken, input.studentNumber);
        return await db.getStudyDashboard(input.studentNumber, null);
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_STUDY_STUDENT_NUMBER") {
          throw new TRPCError({ code: "BAD_REQUEST", message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE });
        }
        throw error;
      }
    }),
    getModuleProgress: publicProcedure.input(z.object({
      studentId: z.number().int().positive(),
      sessionToken: z.string().min(16),
      studentNumber: studyStudentNumberSchema,
      moduleSlug: z.string().trim().min(1).max(96),
    })).query(async ({ input }) => {
      try {
        await requireStudyStudentSession(input.studentId, input.sessionToken, input.studentNumber);
        return await db.getStudyModuleProgress(input.studentNumber, null, input.moduleSlug);
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_STUDY_STUDENT_NUMBER") {
          throw new TRPCError({ code: "BAD_REQUEST", message: INVALID_STUDY_STUDENT_NUMBER_MESSAGE });
        }
        throw error;
      }
    }),
    saveModuleProgress: publicProcedure.input(z.object({
      studentId: z.number().int().positive(),
      sessionToken: z.string().min(16),
      studentNumber: studyStudentNumberSchema,
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
        await requireStudyStudentSession(input.studentId, input.sessionToken, input.studentNumber);
        return await db.saveStudyModuleProgress(
          input.studentNumber,
          null,
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
      const canManageHymns = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!canManageHymns) {
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
    })).mutation(async ({ ctx, input }) => {
      const canManageHymns = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!canManageHymns) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
      const result = await db.createHymn(input);
      return { success: true, id: (result as any).insertId ?? null };
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
    })).mutation(async ({ ctx, input }) => {
      const canManageHymns = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!canManageHymns) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
      const { id, ...data } = input;
      await db.updateHymn(id, data);
      return { success: true };
    }),
    delete: masterProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const canManageHymns = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!canManageHymns) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
      await db.deleteHymn(input.id);
      return { success: true };
    }),
    uploadAudio: masterProcedure.input(z.object({
      id: z.number(),
      fileData: z.string().min(1).max(70 * 1024 * 1024),
      fileName: z.string().trim().min(1).max(255),
      variant: z.enum(["voice", "instrumental"]).default("voice"),
    })).mutation(async ({ ctx, input }) => {
      const canManageHymns = ctx.user.role === "master" || ctx.user.role === "admin";
      if (!canManageHymns) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
      const validFormats = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'webm'];
      const ext = input.fileName.split('.').pop()?.toLowerCase() || '';
      if (!validFormats.includes(ext)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Formato não suportado. Use: ${validFormats.join(', ')}`
        });
      }
      const buffer = Buffer.from(input.fileData, 'base64');
      const maxSize = 50 * 1024 * 1024;
      if (!buffer.length || buffer.length > maxSize) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Arquivo invÃ¡lido ou maior que 50 MB`
        });
      }
      const fileKey = `hymns/${input.id}-${nanoid()}.${ext}`;
      const mimeType = `audio/${ext === 'mp3' ? 'mpeg' : ext}`;
      if (!(await db.getHymnById(input.id))) throw new TRPCError({ code: "NOT_FOUND", message: "Hino nÃ£o encontrado" });
      const { url } = await storagePutWithRollback(fileKey, buffer, mimeType, async ({ url }) => {
        await db.updateHymn(input.id, input.variant === "instrumental" ? { instrumentalAudioUrl: url } : { audioUrl: url });
        return { url };
      });
      return { success: true, url };
    }),
  }),

  charlieMike: router({
    list: publicProcedure.query(async () => db.getHymnsByCollection("tfm")),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const track = await db.getHymnById(input.id);
      if (!track || track.collection !== "tfm") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Faixa Charlie Mike não encontrada" });
      }
      return track;
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
      fileName: z.string().trim().min(1).max(255),
      mimeType: z.string().trim().min(1).max(120),
      base64Data: z.string().min(1).max(70 * 1024 * 1024),
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
      const expectedMimePrefix = input.type === "image" ? "image/" : input.type === "video" ? "video/" : input.type === "audio" ? "audio/" : null;
      if (!buffer.length || buffer.length > MAX_STANDARD_MEDIA_SIZE || (expectedMimePrefix && !input.mimeType.startsWith(expectedMimePrefix))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "MÃ­dia invÃ¡lida, incompatÃ­vel ou maior que 50 MB" });
      }
      const result = await storagePutWithRollback(fileKey, buffer, input.mimeType, async ({ url }) => ({
        mediaId: await db.createMissionMedia(input.missionId, {
          type: input.type, title: input.title, description: input.description, url,
          fileSize: buffer.length, mimeType: input.mimeType, duration: input.duration, uploadedBy: ctx.user.id,
        }),
        url,
      }));
      return { ...result, fileKey };
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
      if (
        ctx.user.role !== "master" &&
        ctx.user.role !== "admin" &&
        !isGeneralCommandRole(ctx.user.role)
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
      return db.getStats();
    }),
    uploadAudio: masterProcedure.input(z.object({
      hymnId: z.number(),
      fileName: z.string().trim().min(1).max(255),
      fileBase64: z.string().min(1).max(70 * 1024 * 1024),
      contentType: z.string().trim().regex(/^audio\//),
    })).mutation(async ({ ctx, input }) => {
      const general = await isXerifeGeral(ctx.user);
      if (!general) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito" });
      }
      const buffer = Buffer.from(input.fileBase64, "base64");
      if (!buffer.length || buffer.length > MAX_STANDARD_MEDIA_SIZE) throw new TRPCError({ code: "BAD_REQUEST", message: "Ãudio invÃ¡lido ou maior que 50 MB" });
      if (!(await db.getHymnById(input.hymnId))) throw new TRPCError({ code: "NOT_FOUND", message: "Hino nÃ£o encontrado" });
      const fileKey = `hymns/audio/${input.hymnId}-${nanoid(8)}-${input.fileName}`;
      const { url } = await storagePutWithRollback(fileKey, buffer, input.contentType, async ({ url }) => {
        await db.updateHymn(input.hymnId, { audioUrl: url });
        return { url };
      });
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
      const all = await db.getAllSettings();
      const defaultKeys = [
        "footer_phone", "footer_email", "footer_address", "footer_text", "footer_instagram", "footer_facebook",
        "cfap_current_commander_flanks_enabled", "cfap_current_commander_left_photo", "cfap_current_commander_right_photo"
      ];
      for (const key of defaultKeys) {
        if (all[key] === undefined) all[key] = null;
      }
      return all;
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
    list: masterOnlyProcedure.query(async () => {
      return db.getAllUsers();
    }),
    create: masterOnlyProcedure.input(z.object({
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
    updateRole: masterOnlyProcedure.input(z.object({
      id: z.number(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => {
      await db.updateUserRole(input.id, input.role);
      return { success: true };
    }),
    resetPassword: masterOnlyProcedure.input(z.object({
      id: z.number(),
      password: z.string().min(4),
    })).mutation(async ({ input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 12);
      await db.resetUserPassword(input.id, hashedPassword);
      return { success: true };
    }),
    delete: masterOnlyProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteUser(input.id);
      return { success: true };
    }),
  }),

  ordemUnidaAudio: router({
    listVoiceProfiles: publicProcedure.query(async () => {
      return ordemUnidaAudioDb.listVoiceProfiles(true);
    }),
    saveVoiceProfile: masterProcedure.input(z.object({
      name: z.string().trim().min(2).max(255),
      photoFileName: z.string().trim().max(255).nullable().optional(),
      photoMimeType: z.string().trim().max(100).nullable().optional(),
      photoFileSize: z.number().int().positive().max(MAX_VOICE_AUTHOR_PHOTO_SIZE).nullable().optional(),
      photoFileData: z.string().max(12 * 1024 * 1024).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      if (!(await isXerifeGeral(ctx.user))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cadastro de voz restrito ao comando geral" });
      }
      const profileKey = voiceProfileKey(input.name);
      let photoUrl: string | null = null;
      if (input.photoFileData) {
        const mimeType = input.photoMimeType?.toLowerCase() || "";
        if (!VOICE_AUTHOR_PHOTO_MIME_TYPES.has(mimeType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A foto deve ser JPG, PNG ou WEBP" });
        }
        const photoBuffer = Buffer.from(input.photoFileData, "base64");
        if (!photoBuffer.length || photoBuffer.length !== input.photoFileSize || photoBuffer.length > MAX_VOICE_AUTHOR_PHOTO_SIZE) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Foto do militar inválida" });
        }
        const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
        const photoKey = `ordem-unida/vozes/militares/${profileKey}-${Date.now()}-${nanoid(8)}.${extension}`;
        return storagePutWithRollback(photoKey, photoBuffer, mimeType, ({ url }) =>
          ordemUnidaAudioDb.upsertVoiceProfile({ profileKey, name: input.name, photoUrl: url }),
        );
      }
      return ordemUnidaAudioDb.upsertVoiceProfile({ profileKey, name: input.name, photoUrl });
    }),
    list: publicProcedure.query(async () => {
      return ordemUnidaAudioDb.listActiveOrdemUnidaAudios();
    }),
    listAll: masterProcedure.query(async ({ ctx }) => {
      if (!(await isXerifeGeral(ctx.user))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cadastro de áudio restrito ao comando geral" });
      }
      return ordemUnidaAudioDb.listAllOrdemUnidaAudios();
    }),
    upload: masterProcedure.input(z.object({
      itemId: z.string().trim().regex(/^(corneta|dobrado|voz)-[a-z0-9-]+$/, "Identificador do item inválido"),
      itemTitle: z.string().trim().min(1).max(255),
      itemType: z.enum(["corneta", "dobrado", "voz"]),
      fileName: z.string().trim().min(1).max(255),
      fileSize: z.number().int().positive().max(MAX_ORDEM_UNIDA_AUDIO_SIZE),
      mimeType: z.string().trim().min(1).max(100),
      fileData: z.string().min(1).max(70 * 1024 * 1024),
      duration: z.number().int().nonnegative().max(60 * 60 * 8).nullable().optional(),
      voiceAuthorName: z.string().trim().max(255).nullable().optional(),
      voiceAuthorPhotoFileName: z.string().trim().max(255).nullable().optional(),
      voiceAuthorPhotoMimeType: z.string().trim().max(100).nullable().optional(),
      voiceAuthorPhotoFileSize: z.number().int().positive().max(MAX_VOICE_AUTHOR_PHOTO_SIZE).nullable().optional(),
      voiceAuthorPhotoFileData: z.string().max(12 * 1024 * 1024).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      if (!(await isXerifeGeral(ctx.user))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cadastro de áudio restrito ao comando geral" });
      }
      if (!ORDEM_UNIDA_AUDIO_MIME_TYPES.has(input.mimeType.toLowerCase())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Formato de áudio não permitido" });
      }
      if (input.itemType === "voz" && !input.voiceAuthorName) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o nome do militar autor da voz" });
      }

      const buffer = Buffer.from(input.fileData, "base64");
      if (!buffer.length || buffer.length !== input.fileSize || buffer.length > MAX_ORDEM_UNIDA_AUDIO_SIZE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo inválido ou com tamanho divergente" });
      }

      const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "audio";
      const fileKey = `ordem-unida/${input.itemType}/${input.itemId}-${Date.now()}-${nanoid(10)}-${safeFileName}`;
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType);
      let photoFileKey: string | null = null;
      let voiceAuthorPhotoUrl: string | null = null;
      try {
      if (input.itemType === "voz" && input.voiceAuthorPhotoFileData) {
        const photoMimeType = input.voiceAuthorPhotoMimeType?.toLowerCase() || "";
        if (!VOICE_AUTHOR_PHOTO_MIME_TYPES.has(photoMimeType)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A foto deve ser JPG, PNG ou WEBP" });
        }
        const photoBuffer = Buffer.from(input.voiceAuthorPhotoFileData, "base64");
        if (!photoBuffer.length || photoBuffer.length !== input.voiceAuthorPhotoFileSize || photoBuffer.length > MAX_VOICE_AUTHOR_PHOTO_SIZE) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Foto do militar inválida" });
        }
        const extension = photoMimeType === "image/png" ? "png" : photoMimeType === "image/webp" ? "webp" : "jpg";
        const photoKey = `ordem-unida/vozes/militares/${voiceProfileKey(input.voiceAuthorName || "default")}-${Date.now()}-${nanoid(8)}.${extension}`;
        const storedPhoto = await storagePut(photoKey, photoBuffer, photoMimeType);
        photoFileKey = storedPhoto.key;
        voiceAuthorPhotoUrl = storedPhoto.url;
      }
      const audio = await ordemUnidaAudioDb.upsertOrdemUnidaAudio({
        itemId: input.itemId,
        itemTitle: input.itemTitle,
        itemType: input.itemType,
        audioUrl: url,
        fileKey: key,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        duration: input.duration,
        voiceProfileKey: input.itemType === "voz" ? voiceProfileKey(input.voiceAuthorName || "default") : "default",
        voiceAuthorName: input.itemType === "voz" ? input.voiceAuthorName : null,
        voiceAuthorPhotoUrl,
        uploadedBy: ctx.user.id,
      });
      if (input.itemType === "voz" && input.voiceAuthorName) {
        await ordemUnidaAudioDb.upsertVoiceProfile({
          profileKey: voiceProfileKey(input.voiceAuthorName),
          name: input.voiceAuthorName,
          photoUrl: voiceAuthorPhotoUrl,
        });
      }
      return { success: true, audio };
      } catch (error) {
        await Promise.allSettled([storageDelete(key), ...(photoFileKey ? [storageDelete(photoFileKey)] : [])]);
        throw error;
      }
    }),
    deactivate: masterProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (!(await isXerifeGeral(ctx.user))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cadastro de áudio restrito ao comando geral" });
      }
      await ordemUnidaAudioDb.deactivateOrdemUnidaAudio(input.id);
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
      youtubeUrl: z.string().optional(),
      cornettaAudioUrl: z.string().optional(),
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
      youtubeUrl: z.string().nullable().optional(),
      cornettaAudioUrl: z.string().nullable().optional(),
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
      fileName: z.string().trim().min(1).max(255),
      fileBase64: z.string().min(1).max(70 * 1024 * 1024),
      contentType: z.string().trim().min(1).max(120),
      fileType: z.enum(["video", "pdf", "image"]),
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const allowed = input.fileType === "video" ? input.contentType.startsWith("video/") : input.fileType === "image" ? input.contentType.startsWith("image/") : input.contentType === "application/pdf";
      if (!allowed || !buffer.length || buffer.length > MAX_STANDARD_MEDIA_SIZE) throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo invÃ¡lido, incompatÃ­vel ou maior que 50 MB" });
      if (!(await db.getDrillById(input.drillId))) throw new TRPCError({ code: "NOT_FOUND", message: "Ordem unida nÃ£o encontrada" });
      const fileKey = `drill/${input.fileType}/${input.drillId}-${nanoid(8)}-${input.fileName}`;
      const updateData: any = {};
      const { url } = await storagePutWithRollback(fileKey, buffer, input.contentType, async ({ url }) => {
        if (input.fileType === "video") updateData.videoUrl = url;
        if (input.fileType === "pdf") updateData.pdfUrl = url;
        if (input.fileType === "image") updateData.imageUrl = url;
        await db.updateDrill(input.drillId, updateData);
        return { url };
      });
      return { success: true, url };
    }),
  }),

  buglePanel: router({
    list: publicProcedure.query(async () => getPublicBuglePanel()),
    listAll: masterProcedure.query(async () => ({
      calls: await bugleDb.listBugleCalls(false),
      marches: await bugleDb.listMarches(false),
    })),
    createCall: masterProcedure
      .input(z.object(bugleCallFields))
      .mutation(async ({ input }) => {
        clearPublicBuglePanelCache();
        return { id: await bugleDb.createBugleCall(input) };
      }),
    updateCall: masterProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: bugleCallFields.name.optional(),
        audioUrl: optionalContentUrl,
        iconKey: bugleCallFields.iconKey.optional(),
        troopState: bugleCallFields.troopState,
        category: bugleCallFields.category.optional(),
        sourceUrl: optionalContentUrl,
        sortOrder: bugleCallFields.sortOrder.optional(),
        isActive: bugleCallFields.isActive.optional(),
      }))
      .mutation(async ({ input }) => {
        clearPublicBuglePanelCache();
        const { id, ...data } = input;
        await bugleDb.updateBugleCall(id, data);
        return { success: true };
      }),
    deleteCall: masterProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        clearPublicBuglePanelCache();
        await bugleDb.deleteBugleCall(input.id);
        return { success: true };
      }),
    createMarch: masterProcedure
      .input(z.object(marchFields))
      .mutation(async ({ input }) => {
        clearPublicBuglePanelCache();
        return { id: await bugleDb.createMarch(input) };
      }),
    updateMarch: masterProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: marchFields.title.optional(),
        composer: marchFields.composer,
        audioUrl: optionalContentUrl,
        sourceUrl: optionalContentUrl,
        sortOrder: marchFields.sortOrder.optional(),
        isActive: marchFields.isActive.optional(),
      }))
      .mutation(async ({ input }) => {
        clearPublicBuglePanelCache();
        const { id, ...data } = input;
        await bugleDb.updateMarch(id, data);
        return { success: true };
      }),
    deleteMarch: masterProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        clearPublicBuglePanelCache();
        await bugleDb.deleteMarch(input.id);
        return { success: true };
      }),
    uploadAudio: masterProcedure
      .input(z.object({
        kind: z.enum(["call", "march"]),
        id: z.number().int().positive(),
        fileData: z.string().min(1).max(80 * 1024 * 1024),
        fileName: z.string().trim().min(1).max(255),
      }))
      .mutation(async ({ input }) => {
        const validFormats = new Set(["mp3", "wav", "ogg", "m4a", "aac", "webm"]);
        const ext = input.fileName.split(".").pop()?.toLowerCase() || "";
        if (!validFormats.has(ext)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Use um áudio MP3, WAV, OGG, M4A, AAC ou WEBM." });
        }
        const buffer = Buffer.from(input.fileData, "base64");
        if (buffer.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "O arquivo de áudio está vazio ou inválido." });
        }
        if (buffer.length > 50 * 1024 * 1024) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "O áudio deve ter no máximo 50 MB." });
        }
        const mimeType = `audio/${ext === "mp3" ? "mpeg" : ext}`;
        const folder = input.kind === "call" ? "calls" : "marches";
        const { url } = await storagePutWithRollback(`bugle/${folder}/${input.id}-${nanoid(8)}.${ext}`, buffer, mimeType, async ({ url }) => {
          if (input.kind === "call") await bugleDb.updateBugleCall(input.id, { audioUrl: url });
          else await bugleDb.updateMarch(input.id, { audioUrl: url });
          return { url };
        });
        clearPublicBuglePanelCache();
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
      fileName: z.string().trim().min(1).max(255),
      mimeType: z.string().trim().min(1).max(120),
      base64Data: z.string().min(1).max(21 * 1024 * 1024),
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
      if (!BLOG_IMAGE_MIME_TYPES.has(input.mimeType) || !buffer.length || buffer.length > MAX_BLOG_IMAGE_SIZE) throw new TRPCError({ code: "BAD_REQUEST", message: "Envie uma imagem JPG, PNG, WEBP ou GIF de atÃ© 15 MB" });
      const { url } = await storagePutWithRollback(fileKey, buffer, input.mimeType, async ({ url }) => {
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
      return { url };
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
      await requireStudentDisciplineScope(input.studentId, input.sessionToken, input.disciplineId);
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
      if (input.disciplineId !== undefined) {
        await requireStudentDisciplineScope(input.studentId, input.sessionToken, input.disciplineId);
      }
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

  }),

  gradeAdmin: router({
    createDiscipline: adminProcedure.input(
      z.object({
        name: z.string().trim().min(2).max(255),
        description: z.string().trim().max(2000).optional(),
        startDate: z.string().trim().nullable().optional(),
        examDate: z.string().trim().nullable().optional(),
        status: z.string().trim().optional(),
        studyMaterialUrl: z.string().trim().nullable().optional(),
        studyMaterialName: z.string().trim().nullable().optional(),
        gaivotasLinks: z.string().trim().nullable().optional(),
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).mutation(async ({ input, ctx }) => {
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

      await gradeDb.upsertPlatoonDiscipline(
        disc.id,
        input.companhia,
        input.peloton,
        input.startDate,
        input.examDate,
        input.status
      );
      return disc;
    }),

    updateDiscipline: adminProcedure.input(
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
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
      })
    ).mutation(async ({ input, ctx }) => {
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

      await gradeDb.upsertPlatoonDiscipline(
        input.id,
        input.companhia,
        input.peloton,
        input.startDate,
        input.examDate,
        input.status
      );
      return { success: true };
    }),

    deleteDiscipline: adminProcedure.input(
      z.object({
        id: z.number(),
      })
    ).mutation(async ({ input }) => {
      await gradeDb.deleteCatalogDiscipline(input.id);
      return { success: true };
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
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      requireActivatedStudent(student);
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

    students: scaleManagerProcedure.query(async ({ ctx }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      const all = (await studentDb.getAllStudents()).filter((student) => student.registrationStatus === "active");
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

  officialDocuments: router({
    list: publicProcedure.query(async () => {
      return officialDocumentsDb.listOfficialDocuments(true);
    }),

    listAll: masterProcedure.query(async () => {
      return officialDocumentsDb.listOfficialDocuments(false);
    }),

    upload: masterProcedure.input(z.object({
      title: z.string().trim().min(3).max(180),
      description: z.string().trim().max(500).nullable().optional(),
      fileName: z.string().trim().min(1).max(255),
      mimeType: z.string().trim().min(1).max(120),
      fileBase64: z.string().min(1).max(21_000_000),
    })).mutation(async ({ ctx, input }) => {
      const extension = input.fileName.split(".").pop()?.toLowerCase() || "";
      if (!OFFICIAL_DOCUMENT_EXTENSIONS.has(extension)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato não permitido. Envie PDF, documento Office, OpenDocument, texto ou imagem.",
        });
      }

      const buffer = Buffer.from(input.fileBase64, "base64");
      if (buffer.length === 0 || buffer.length > MAX_OFFICIAL_DOCUMENT_SIZE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "O arquivo deve ter no máximo 15 MB.",
        });
      }

      const safeFileName = input.fileName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "") || `documento.${extension}`;
      const fileKey = `official-documents/${Date.now()}-${nanoid(8)}-${safeFileName}`;
      const { id } = await storagePutWithRollback(fileKey, buffer, input.mimeType, async ({ key, url }) => ({ id: await officialDocumentsDb.createOfficialDocument({
        title: input.title,
        description: input.description || null,
        fileName: input.fileName,
        fileUrl: url,
        fileKey: key,
        mimeType: input.mimeType,
        fileSize: buffer.length,
        uploadedBy: ctx.user.id,
      }) }));

      return { success: true, id };
    }),

    delete: masterProcedure.input(
      z.object({ id: z.number().int().positive() }),
    ).mutation(async ({ input }) => {
      const deleted = await officialDocumentsDb.deleteOfficialDocument(input.id);
      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado" });
      }
      return { success: true };
    }),
  }),

  cfapPersonnel: router({
    summary: masterProcedure.query(async () => {
      return cfapPersonnelDb.getCfapPersonnelSummary();
    }),

    list: masterProcedure.input(
      z.object({
        includeInactive: z.boolean().optional(),
        search: z.string().trim().max(120).optional(),
      }).optional()
    ).query(async ({ input }) => {
      return cfapPersonnelDb.listCfapPersonnel(input);
    }),

    create: masterProcedure.input(cfapPersonnelInputSchema).mutation(async ({ ctx, input }) => {
      const id = await cfapPersonnelDb.createCfapPersonnel(input, ctx.user.id);
      return { success: true, id };
    }),

    update: masterProcedure.input(
      cfapPersonnelInputSchema.extend({ id: z.number().int().positive() })
    ).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await cfapPersonnelDb.updateCfapPersonnel(id, data, ctx.user.id);
      return { success: true };
    }),

    seedInitial: masterProcedure.mutation(async ({ ctx }) => {
      return cfapPersonnelDb.seedInitialCfapPersonnel(ctx.user.id);
    }),
  }),

  cfapHistory: router({
    list: publicProcedure.query(async () => {
      return cfapHistoryDb.listCfapHistoryRecords();
    }),
    listAdmin: masterProcedure.query(async () => {
      return cfapHistoryDb.listCfapHistoryRecords({ includeHidden: true });
    }),
    upsert: masterProcedure.input(cfapHistoryInputSchema).mutation(async ({ ctx, input }) => {
      await cfapHistoryDb.upsertCfapHistoryRecord(input, ctx.user.id);
      return { success: true };
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

    myAccess: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        return null;
      }
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const isGeneral = ctx.user.role === "master" || ctx.user.role === "admin" || isGeneralCommandRole(ctx.user.role) || assignment?.level === "principal";
      return {
        assignment,
        scope: serviceScaleDb.getDefaultScope(ctx.user, assignment),
        isMaster: ctx.user.role === "master",
        isGeneral,
        canApproveStudentDocuments: canApproveStudentDocuments(ctx.user),
        canHomologateFoLc: canHomologateFoLc(ctx.user),
        role: ctx.user.role,
      };
    }),

    students: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
        registeredOnly: z.boolean().optional(),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      let companhia = input?.companhia ?? scope.companhia;
      let peloton = input?.peloton ?? scope.peloton;

      const isComandante = isGlobalCommandRole(ctx.user.role);
      const isGeneral = await isXerifeGeral(ctx.user);
      if (isComandante && !input?.companhia) {
        companhia = undefined;
        peloton = undefined;
      }

      if (!isComandante && !isGeneral && companhia) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      } else if (!isComandante && !isGeneral && !scope.unrestricted) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Xerife sem escopo configurado" });
      }

      return serviceScaleDb.listStudents({ companhia, peloton, activeOnly: input?.registeredOnly === true });
    }),

    getPlatoon: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        weekStart: z.string().trim().min(10).max(10),
      })
    ).query(async ({ ctx, input }) => {
      const isComandante = isGlobalCommandRole(ctx.user.role);
      const isGeneral = await isXerifeGeral(ctx.user);
      if (!isComandante && !isGeneral) {
        await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      }
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
      base64Data: z.string().min(1).max(21 * 1024 * 1024),
    })).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      const ext = input.fileName.split(".").pop() || "pdf";
      const buffer = Buffer.from(input.base64Data, "base64");
      if (!ADITAMENTO_MIME_TYPES.has(input.mimeType) || !buffer.length || buffer.length > MAX_ADITAMENTO_SIZE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Envie PDF ou imagem de atÃ© 15 MB" });
      }
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
      const assignedStudentIds = [
        input.xerifeId,
        input.subXerifeId,
        ...(input.cleaning ?? []).flatMap((item) => item.studentIds),
      ].filter((id): id is number => typeof id === "number");
      for (const studentId of Array.from(new Set(assignedStudentIds))) {
        const student = await studentDb.getStudentById(studentId);
        if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        requireActivatedStudent(student);
      }
      const week = await serviceScaleDb.upsertWeeklyScale({
        ...input,
        updatedBy: ctx.user.id,
      });
      return week;
    }),

    updateStudentCondition: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
        condition: z.enum(["pronto", "falta", "atraso", "diverso_destino", "destino_ignorado", "dispensa_medica", "dispensa_administrativa", "baixado"]),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      requireActivatedStudent(student);
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);
      await studentDb.updateStudentCondition(input.studentId, input.condition);
      return { success: true };
    }),

    listBaixados: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      let companhia = input?.companhia ?? scope.companhia;
      let peloton = input?.peloton ?? scope.peloton;

      if (companhia) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      } else if (!scope.unrestricted) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado para este escopo" });
      }

      return serviceScaleDb.listBaixadoStudents({ companhia, peloton });
    }),

    setStudentBaixado: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int().positive(),
        isBaixado: z.boolean(),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      requireActivatedStudent(student);
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);
      await studentDb.updateStudentCondition(input.studentId, input.isBaixado ? "baixado" : "pronto");
      return { success: true };
    }),

    uploadBaixadoDocument: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int().positive(),
        fileName: z.string().trim().min(1).max(180),
        mimeType: z.string().trim().min(3).max(120),
        base64Data: z.string().min(1).max(21 * 1024 * 1024),
        note: z.string().trim().max(1000).nullable().optional(),
        baixadoKind: z.enum(["informativo", "ausente_com_atestado", "ausente_sem_atestado", "presente_sem_atestado"]).optional(),
        hpmHomologated: z.boolean().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      requireActivatedStudent(student);
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);
      if (!BAIXADO_DOCUMENT_MIME_TYPES.has(input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Envie PDF ou imagem do atestado/documento" });
      }
      const buffer = Buffer.from(input.base64Data, "base64");
      if (!buffer.length || buffer.length > MAX_BAIXADO_DOCUMENT_SIZE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo maior que 15MB" });
      }
      const ext = input.fileName.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "pdf";
      const fileKey = `baixados/${student.companhia}-${student.peloton}/${student.id}/${Date.now()}-${nanoid(8)}.${ext}`;
      const { id, url } = await storagePutWithRollback(fileKey, buffer, input.mimeType, async ({ url }) => ({ id: await serviceScaleDb.createBaixadoDocument({
        studentId: student.id,
        companhia: student.companhia,
        peloton: student.peloton,
        fileUrl: url,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: buffer.length,
        note: input.note ?? null,
        baixadoKind: input.baixadoKind ?? "informativo",
        hpmHomologated: input.hpmHomologated ?? false,
        uploadedBy: ctx.user.id,
      }), url }));
      return { id, url };
    }),

    listInternalReports: scaleManagerProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
        status: z.enum(["active", "resolved", "cancelled", "all"]).default("active"),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      let companhia = input?.companhia ?? scope.companhia;
      let peloton = input?.peloton ?? scope.peloton;

      if (companhia) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      } else if (!scope.unrestricted) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado para este escopo" });
      }

      return serviceScaleDb.listInternalReports({
        companhia,
        peloton,
        status: input?.status ?? "active",
      });
    }),

    createInternalReport: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int().positive(),
        type: z.enum(["demanda_servico", "desistente", "desertor", "baixado", "outro"]),
        title: z.string().trim().min(3).max(180),
        note: z.string().trim().max(5000).nullable().optional(),
        serviceDate: z.string().trim().max(10).nullable().optional(),
        servicePeriod: z.enum(["diurno", "noturno", "24h", "extra", "outro"]).nullable().optional(),
        priority: z.enum(["normal", "important", "urgent"]).optional(),
        assignedTo: z.string().trim().max(120).nullable().optional(),
        visibleToStudent: z.boolean().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      requireActivatedStudent(student);
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);
      const id = await serviceScaleDb.createInternalReport({
        studentId: student.id,
        companhia: student.companhia,
        peloton: student.peloton,
        type: input.type,
        title: input.title,
        note: input.note ?? null,
        serviceDate: input.serviceDate ?? null,
        servicePeriod: input.servicePeriod ?? null,
        priority: input.priority ?? "normal",
        assignedTo: input.assignedTo ?? null,
        visibleToStudent: input.visibleToStudent ?? true,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

    updateInternalReportStatus: scaleManagerProcedure.input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["active", "resolved", "cancelled"]),
      })
    ).mutation(async ({ ctx, input }) => {
      const report = await serviceScaleDb.getInternalReport(input.id);
      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Informe interno não encontrado" });
      }
      await requireServiceScaleAccess(ctx.user, report.companhia, report.peloton);
      await serviceScaleDb.updateInternalReportStatus({
        id: input.id,
        status: input.status,
        resolvedBy: ctx.user.id,
      });
      return { success: true };
    }),

    createRosterStudent: scaleManagerProcedure.input(
      z.object({
        numerica: z.string().trim().length(4),
        companhia: z.number().int().min(1).max(5),
        peloton: z.number().int().min(1).max(2),
        deskNumber: z.number().int().positive().nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const validation = validateNumerica(input.numerica);
      if (!validation.isValid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: validation.error || "Numérica inválida" });
      }
      if (validation.companhia !== input.companhia || validation.peloton !== input.peloton) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A numérica informada não pertence à sala selecionada" });
      }
      await requireServiceScaleAccess(ctx.user, validation.companhia, validation.peloton);
      if (await studentDb.studentExists(input.numerica)) {
        throw new TRPCError({ code: "CONFLICT", message: "Esta numérica já está cadastrada" });
      }
      const student = await studentDb.createStudentSlot(
        input.numerica,
        validation.companhia,
        validation.peloton,
        input.deskNumber
      );
      if (!student) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar vaga" });
      }
      return student;
    }),

    updateRosterStudent: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
        numerica: z.string().trim().length(4).optional(),
        nomeGuerra: z.string().trim().min(2).max(255).optional(),
        nomeCompleto: z.string().trim().optional(),
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
        deskNumber: z.number().int().nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);

      let nextCompanhia = input.companhia ?? student.companhia;
      let nextPeloton = input.peloton ?? student.peloton;

      if (input.numerica && input.numerica !== student.numerica) {
        const validation = validateNumerica(input.numerica);
        if (!validation.isValid) {
          throw new TRPCError({ code: "BAD_REQUEST", message: validation.error || "Numérica inválida" });
        }
        const existing = await studentDb.getStudentByNumerica(input.numerica);
        if (existing && existing.id !== student.id) {
          throw new TRPCError({ code: "CONFLICT", message: "Aluno com esta numérica já existe" });
        }
        nextCompanhia = input.companhia ?? validation.companhia;
        nextPeloton = input.peloton ?? validation.peloton;
      }

      await requireServiceScaleAccess(ctx.user, nextCompanhia, nextPeloton);
      await studentDb.updateStudentRosterData(input.studentId, {
        numerica: input.numerica,
        nomeGuerra: input.nomeGuerra,
        nomeCompleto: input.nomeCompleto,
        companhia: nextCompanhia,
        peloton: nextPeloton,
        deskNumber: input.deskNumber,
      });
      return { success: true };
    }),

    deleteRosterStudent: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);
      await studentDb.deleteStudent(input.studentId);
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
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      requireActivatedStudent(student);
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
        requireActivatedStudent(student);
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
        foCode: z.string().trim().max(32).nullable().optional(),
        note: z.string().trim().min(1).max(200000),
      })
    ).mutation(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      requireActivatedStudent(student);
      await requireClassroomViewAccess(ctx.user, student.companhia, student.peloton);
      const isComandante = isGlobalCommandRole(ctx.user.role);
      const general = await isXerifeGeral(ctx.user);
      const needsValidation = input.type === "positive" || input.type === "negative";
      const foCode = input.foCode ? normalizeFoCode(input.foCode) : "";
      if (input.type === "positive" || input.type === "negative") {
        if (!foCode) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Todo FO+ ou FO- deve ter código." });
        }
        if (!getFoCodeDefinition(input.type, foCode)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Código de FO inválido para este tipo." });
        }
      }
      const isApprovedDirectly = isComandante || general || !needsValidation;
      const id = await serviceScaleDb.createStudentObservation({
        studentId: student.id,
        companhia: student.companhia,
        peloton: student.peloton,
        type: input.type,
        note: input.note,
        foCode: needsValidation ? foCode : null,
        createdBy: ctx.user.id,
        validationStatus: isApprovedDirectly ? "approved" : "pending",
        validatedBy: isApprovedDirectly && needsValidation ? ctx.user.id : null,
        validatedAt: isApprovedDirectly && needsValidation ? new Date() : null,
      });
      if (isApprovedDirectly && needsValidation) {
        await serviceScaleDb.recomputeLcCaseForStudentCode(
          student.id,
          student.companhia,
          student.peloton,
          foCode,
        );
      }
      return { id };
    }),

    studentObservations: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
      })
    ).query(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      requireActivatedStudent(student);
      await requireClassroomViewAccess(ctx.user, student.companhia, student.peloton);
      return serviceScaleDb.listStudentObservations(input.studentId);
    }),

    studentLcCases: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
      })
    ).query(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno nÃ£o encontrado" });
      requireActivatedStudent(student);
      await requireClassroomViewAccess(ctx.user, student.companhia, student.peloton);
      return serviceScaleDb.listStudentLcCases(input.studentId);
    }),

    foCodeBalance: scaleManagerProcedure.input(
      z.object({
        studentId: z.number().int(),
        foCode: z.string().trim().min(1).max(32),
      })
    ).query(async ({ ctx, input }) => {
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      requireActivatedStudent(student);
      await requireClassroomViewAccess(ctx.user, student.companhia, student.peloton);
      return serviceScaleDb.getFoCodeBalance(student.id, input.foCode);
    }),

    pendingStudentObservations: masterProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      let companhia = input?.companhia;
      let peloton = input?.peloton;
      if (!scope.unrestricted) {
        if (scope.companhia) {
          companhia = scope.companhia;
        }
        if (scope.peloton) {
          peloton = scope.peloton;
        }
        if (!scope.companhia) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado para este escopo" });
        }
      } else if (companhia) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      }
      return serviceScaleDb.listPendingStudentObservations({ companhia, peloton });
    }),

    reviewedStudentObservations: masterProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      let companhia = input?.companhia;
      let peloton = input?.peloton;
      if (!scope.unrestricted) {
        companhia = scope.companhia;
        peloton = scope.peloton;
        if (!companhia) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado para este escopo" });
        }
      } else if (companhia) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      }
      return serviceScaleDb.listReviewedStudentObservations({ companhia, peloton });
    }),

    contestedStudentObservations: masterProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
        status: z.enum(["none", "pending", "accepted", "rejected", "all"]).default("pending"),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      let companhia = input?.companhia;
      let peloton = input?.peloton;
      if (!scope.unrestricted) {
        companhia = scope.companhia;
        peloton = scope.peloton;
        if (!companhia) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado para este escopo" });
        }
      } else if (companhia) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      }
      return serviceScaleDb.listContestedStudentObservations({
        companhia,
        peloton,
        status: input?.status ?? "pending",
      });
    }),

    registerFoContestation: scaleManagerProcedure.input(
      z.object({
        id: z.number().int().positive(),
        text: z.string().trim().min(5).max(5000),
      })
    ).mutation(async ({ ctx, input }) => {
      const observation = await serviceScaleDb.getStudentObservation(input.id);
      if (!observation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "FO não encontrado." });
      }
      await requireServiceScaleAccess(ctx.user, observation.companhia, observation.peloton);
      if (observation.validation_status !== "approved" || observation.annulled_at) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Somente FO homologado e ainda válido pode ser contestado." });
      }
      if (observation.contest_status && observation.contest_status !== "none") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este FO já possui contestação registrada." });
      }
      await serviceScaleDb.contestStudentObservation({
        id: input.id,
        source: "cal",
        text: input.text,
      });
      return { success: true };
    }),

    validateStudentObservation: masterProcedure.input(
      z.object({
        id: z.number().int(),
        status: z.enum(["approved", "rejected"]),
        validationNote: z.string().trim().max(500).nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireFoLcHomologationAccess(ctx.user);
      const observation = await serviceScaleDb.getStudentObservation(input.id);
      if (!observation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Anotação não encontrada" });
      }
      await requireServiceScaleAccess(ctx.user, observation.companhia, observation.peloton);
      await serviceScaleDb.validateStudentObservation({
        id: input.id,
        status: input.status,
        validatedBy: ctx.user.id,
        validationNote: input.validationNote ?? null,
      });
      if (observation.fo_code) {
        await serviceScaleDb.recomputeLcCaseForStudentCode(
          observation.student_id,
          observation.companhia,
          observation.peloton,
          observation.fo_code,
        );
      }
      return { success: true };
    }),

    decideFoContestation: masterProcedure.input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["accepted", "rejected"]),
        decisionNote: z.string().trim().max(1000).nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireFoLcHomologationAccess(ctx.user);
      const observation = await serviceScaleDb.getStudentObservation(input.id);
      if (!observation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "FO não encontrado." });
      }
      await requireServiceScaleAccess(ctx.user, observation.companhia, observation.peloton);
      await serviceScaleDb.decideObservationContest({
        id: input.id,
        status: input.status,
        decidedBy: ctx.user.id,
        decisionNote: input.decisionNote ?? null,
      });
      if (input.status === "accepted" && observation.fo_code) {
        await serviceScaleDb.recomputeLcCaseForStudentCode(
          observation.student_id,
          observation.companhia,
          observation.peloton,
          observation.fo_code,
        );
      }
      return { success: true };
    }),

    lcCases: masterProcedure.input(
      z.object({
        companhia: z.number().int().min(1).max(5).optional(),
        peloton: z.number().int().min(1).max(2).optional(),
        status: z.enum(["pending", "homologated", "rejected", "cancelled", "active", "all"]).default("pending"),
      }).optional()
    ).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      let companhia = input?.companhia;
      let peloton = input?.peloton;
      if (!scope.unrestricted) {
        companhia = scope.companhia;
        peloton = scope.peloton;
        if (!companhia) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado para este escopo" });
        }
      } else if (companhia) {
        await requireServiceScaleAccess(ctx.user, companhia, peloton);
      }
      return serviceScaleDb.listLcCases({
        companhia,
        peloton,
        status: input?.status ?? "pending",
      });
    }),

    decideLcCase: masterProcedure.input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["homologated", "rejected"]),
        recolhimentoDate: z.string().trim().max(10).nullable().optional(),
        recolhimentoTime: lcTimeSchema.nullable().optional(),
        durationHours: z.number().int().min(1).max(240).nullable().optional(),
        procedures: z.string().trim().max(8000).nullable().optional(),
      })
    ).mutation(async ({ ctx, input }) => {
      requireFoLcHomologationAccess(ctx.user);
      const lcCase = await serviceScaleDb.getLcCase(input.id);
      if (!lcCase) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Caso de LC não encontrado." });
      }
      await requireServiceScaleAccess(ctx.user, lcCase.companhia, lcCase.peloton);
      if (input.status === "homologated") {
        if (!input.recolhimentoDate || !input.recolhimentoTime || !input.durationHours || !input.procedures?.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Para homologar a LC, informe a data, a hora, a duracao e os procedimentos ao aluno.",
          });
        }
      }
      await serviceScaleDb.decideLcCase({
        id: input.id,
        status: input.status,
        recolhimentoDate: input.recolhimentoDate ?? null,
        recolhimentoTime: input.recolhimentoTime ?? null,
        durationHours: input.durationHours ?? null,
        procedures: input.procedures ?? null,
        judgedBy: ctx.user.id,
      });
      return { success: true };
    }),

    createDirectLcCase: masterProcedure.input(
      z.object({
        studentId: z.number().int().positive(),
        directReason: z.string().trim().min(5).max(8000),
        recolhimentoDate: z.string().trim().min(10).max(10),
        recolhimentoTime: lcTimeSchema,
        durationHours: z.number().int().min(1).max(240),
        procedures: z.string().trim().min(5).max(8000),
      })
    ).mutation(async ({ ctx, input }) => {
      requireFoLcHomologationAccess(ctx.user);
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno nÃ£o encontrado" });
      }
      requireActivatedStudent(student);
      await requireServiceScaleAccess(ctx.user, student.companhia, student.peloton);
      const lcCase = await serviceScaleDb.createDirectLcCase({
        studentId: student.id,
        companhia: student.companhia,
        peloton: student.peloton,
        directReason: input.directReason,
        recolhimentoDate: input.recolhimentoDate,
        recolhimentoTime: input.recolhimentoTime,
        durationHours: input.durationHours,
        procedures: input.procedures,
        createdBy: ctx.user.id,
      });
      return { success: true, lcCase };
    }),

    foReasons: scaleManagerProcedure.query(async () => {
      return serviceScaleDb.listFoReasons("approved");
    }),

    pendingFoReasons: masterProcedure.query(async () => {
      return serviceScaleDb.listFoReasons("pending");
    }),

    suggestFoReason: scaleManagerProcedure.input(
      z.object({
        type: z.enum(["positive", "negative"]),
        label: z.string().trim().min(3).max(500),
      })
    ).mutation(async ({ ctx, input }) => {
      const general = await isXerifeGeral(ctx.user);
      return serviceScaleDb.suggestFoReason({
        type: input.type,
        label: input.label,
        createdBy: ctx.user.id,
        approveImmediately: general,
      });
    }),

    validateFoReason: masterProcedure.input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["approved", "rejected"]),
      })
    ).mutation(async ({ ctx, input }) => {
      await serviceScaleDb.validateFoReason({
        id: input.id,
        status: input.status,
        validatedBy: ctx.user.id,
      });
      return { success: true };
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
      requireActivatedStudent(student);
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

  /**
   * MANUS_LOCK: PECULIO_CRITICAL_MODULE
   * Nao alterar deliberadamente estas rotas sem autorizacao explicita do dono do projeto.
   * Preservar regras de escopo, fechamento, liberacao, chegada tardia, justificativa e revisao pelo Xerife Geral.
   */
  administrativeDaily: router({
    list: scaleManagerProcedure.input(z.object({ date: z.string().trim().length(10) })).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      return administrativeDailyDb.listAdministrativeDaily(input.date, scope.unrestricted ? undefined : scope.companhia ?? undefined, scope.unrestricted ? undefined : scope.peloton ?? undefined);
    }),
    openPendings: scaleManagerProcedure.query(async ({ ctx }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      return administrativeDailyDb.listOpenAdministrativePendings(scope.unrestricted ? undefined : scope.companhia ?? undefined, scope.unrestricted ? undefined : scope.peloton ?? undefined);
    }),
    peculioSummary: scaleManagerProcedure.input(z.object({ date: z.string().trim().length(10) })).query(async ({ ctx, input }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id);
      const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      const rows = await peculioDb.listPeculioSummaries(input.date);
      return rows.filter((row) => scope.unrestricted || (row.companhia === scope.companhia && (!scope.peloton || row.peloton === scope.peloton)));
    }),
    weeklyConfig: scaleManagerProcedure.query(async ({ ctx }) => {
      const assignment = await serviceScaleDb.getXerifeAssignment(ctx.user.id); const scope = serviceScaleDb.getDefaultScope(ctx.user, assignment);
      const rows = await administrativeDailyDb.listWeeklyConfig();
      return rows.filter((row) => scope.unrestricted || (row.companhia === scope.companhia && (!scope.peloton || row.peloton === scope.peloton)));
    }),
    saveWeeklyConfig: scaleManagerProcedure.input(z.object({ companhia: z.number().int().min(1).max(5), peloton: z.number().int().min(1).max(2), ranchWeekdays: z.array(z.number().int().min(0).max(6)), lunchWeekdays: z.array(z.number().int().min(0).max(6)), snackWeekdays: z.array(z.number().int().min(0).max(6)) })).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      return administrativeDailyDb.saveWeeklyConfig({ ...input, updatedBy: ctx.user.id });
    }),
    save: scaleManagerProcedure.input(z.object({
      date: z.string().trim().length(10), companhia: z.number().int().min(1).max(5), peloton: z.number().int().min(1).max(2),
      locationStatus: z.enum(["sala", "fora_sala", "formatura", "rancho", "dispensado"]),
      formationStatus: z.enum(["nao_informado", "nao_houve", "prevista", "realizada"]),
      lunchStatus: z.enum(["nao_informado", "aguardando", "avancou", "concluido"]),
      snackStatus: z.enum(["nao_informado", "aguardando", "concluido"]), ranchAdvance: z.boolean(),
      punishmentSummary: z.string().max(2000).nullable(), factsSummary: z.string().max(4000).nullable(), pendingSummary: z.string().max(2000).nullable(), pendingResolved: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      return administrativeDailyDb.saveAdministrativeDaily({ ...input, updatedBy: ctx.user.id });
    }),
  }),

  peculio: router({
    history: masterProcedure.input(
      z.object({ limit: z.number().int().min(1).max(365).optional() }).optional()
    ).query(async ({ input }) => peculioDb.listPeculioHistory(input?.limit ?? 90)),

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
            status: z.enum(["pronto", "falta", "atraso", "diverso_destino", "destino_ignorado", "dispensa_medica", "dispensa_administrativa", "baixado"]),
            observacao: z.string().trim().nullable().optional(),
            arrivalTime: z.string().datetime().nullable().optional(),
          })
        ),
      })
    ).mutation(async ({ ctx, input }) => {
      await requireServiceScaleAccess(ctx.user, input.companhia, input.peloton);
      for (const status of input.statuses) {
        const student = await studentDb.getStudentById(status.studentId);
        if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
        requireActivatedStudent(student);
      }
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
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      requireActivatedStudent(student);
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
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      requireActivatedStudent(student);
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
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      requireActivatedStudent(student);
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
      const student = await studentDb.getStudentById(input.studentId);
      if (!student) throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      requireActivatedStudent(student);
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

  documentosParte: router({
    criarEEnviar: publicProcedure.input(
      z.object({
        studentId: z.number().int(),
        sessionToken: z.string(),
        tipoDocumento: z.string(),
        tipoParte: z.string(),
        remetente: z.string(),
        destinatario: z.string(),
        assunto: z.string(),
        anexo: z.string().nullable(),
        localData: z.string(),
        conteudoJson: z.string(),
        imagemCabecalhoEsq: z.string().nullable(),
        imagemCabecalhoDir: z.string().nullable(),
        assinaturaDigital: z.string().nullable(),
      })
    ).mutation(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      const id = await documentosParteDb.criarDocumentoParte(input);
      return { success: true, id };
    }),

    listarMinhasPartes: publicProcedure.input(
      z.object({
        studentId: z.number().int(),
        sessionToken: z.string(),
      })
    ).query(async ({ input }) => {
      await requireStudentSession(input.studentId, input.sessionToken);
      return documentosParteDb.listarDocumentosEstudante(input.studentId);
    }),

    listarPartesPendentes: scaleManagerProcedure.query(async ({ ctx }) => {
      requireStudentDocumentApprovalAccess(ctx.user);
      return documentosParteDb.listarDocumentosXerife({
        level: "principal",
        companhia: null,
        peloton: null,
      });
    }),

    responderParte: scaleManagerProcedure.input(
      z.object({
        id: z.number().int(),
        status: z.enum(['aceito', 'recusado', 'negociacao']),
        observacaoXerife: z.string().nullable(),
      })
    ).mutation(async ({ ctx, input }) => {
      const doc = await documentosParteDb.obterDocumentoParte(input.id);
      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Documento não encontrado" });
      }
      
      requireStudentDocumentApprovalAccess(ctx.user);
      
      const success = await documentosParteDb.responderDocumentoParte(
        input.id,
        input.status,
        input.observacaoXerife,
        ctx.user.name || "Administrador"
      );
      
      return { success };
    }),
  }),

  access: router({
    createAccess: masterOnlyProcedure.input(
      z.object({
        name: z.string().trim().min(2).max(255),
        email: z.string().trim().min(3).max(255),
        role: z.enum(COMMAND_ACCESS_ROLES),
        pelotaoId: z.number().int().min(1).max(2).nullable().optional(),
        companhiaId: z.number().int().min(1).max(5).nullable().optional(),
      })
    ).mutation(async ({ input }) => {
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Usuario ja cadastrado' });
      }
      
      const result = await db.createAccessUser({
        name: input.name,
        email: input.email,
        role: input.role,
        pelotaoId: input.pelotaoId,
        companhiaId: input.companhiaId,
      });
      
      return {
        success: true,
        email: result.email,
        tempPassword: result.tempPassword,
        message: 'Usuário de comando criado com sucesso. Compartilhe o usuário e a senha temporária.',
      };
    }),

    listAccesses: masterOnlyProcedure.query(async () => {
      return await db.listAccessUsers();
    }),

    updateAccess: masterOnlyProcedure.input(
      z.object({
        id: z.number().int(),
        name: z.string().trim().min(2).max(255).optional(),
        role: z.enum(COMMAND_ACCESS_ROLES).optional(),
        pelotaoId: z.number().int().min(1).max(2).nullable().optional(),
        companhiaId: z.number().int().min(1).max(5).nullable().optional(),
      })
    ).mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await db.updateAccessUser(id, updates);
      return { success: true, message: 'Acesso atualizado com sucesso' };
    }),

    setActive: masterOnlyProcedure.input(
      z.object({
        id: z.number().int().positive(),
        isActive: z.boolean(),
      })
    ).mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.id && !input.isActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode desativar a própria conta." });
      }
      await db.setUserActive(input.id, input.isActive);
      return { success: true, message: input.isActive ? "Conta reativada" : "Conta desativada" };
    }),

    deleteAccess: masterOnlyProcedure.input(
      z.object({
        id: z.number().int(),
      })
    ).mutation(async ({ input }) => {
      await db.deleteUser(input.id);
      return { success: true, message: 'Acesso deletado com sucesso' };
    }),

    changePassword: protectedProcedure.input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6).max(255),
      })
    ).mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.password) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Usuário não encontrado.' });
      }
      
      const dbPassword = user.password;
      const isBcrypt = dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$") || dbPassword.startsWith("$2y$");
      let isValid = false;
      if (isBcrypt) {
        isValid = await bcrypt.compare(input.currentPassword, dbPassword);
      } else {
        isValid = input.currentPassword === dbPassword;
      }
      
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Senha atual incorreta' });
      }
      
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      await db.updateUserPassword(ctx.user.id, hashedPassword);
      
      return { success: true, message: 'Senha alterada com sucesso' };
    }),
  }),

  /**
   * Fato Observado (FO) - Upload de Provas (Fotos/Vídeos)
   */
  foProofs: router({
    uploadProof: scaleManagerProcedure.input(
      z.object({
        studentObservationId: z.number().int(),
        fileName: z.string().trim().min(1).max(255),
        fileSize: z.number().int().min(1),
        mimeType: z.string().trim().max(100).default(""),
        fileData: z.string().min(1).max(70 * 1024 * 1024), // Base64 encoded file data
      })
    ).mutation(async ({ ctx, input }) => {
      await foDb.ensureFoProofSchema();
      const observation = await serviceScaleDb.getStudentObservation(input.studentObservationId);
      if (!observation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fato observado não encontrado" });
      }
      await requireClassroomViewAccess(ctx.user, observation.companhia, observation.peloton);

      // Validar tipo de arquivo
      const validTypes = [
        "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
        "video/mp4", "video/webm", "video/quicktime",
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      const extension = input.fileName.split(".").pop()?.toLowerCase() || "";
      const inferredMimeType =
        input.mimeType ||
        (extension === "jpg" || extension === "jpeg" ? "image/jpeg" :
        extension === "png" ? "image/png" :
        extension === "webp" ? "image/webp" :
        extension === "gif" ? "image/gif" :
        extension === "heic" ? "image/heic" :
        extension === "heif" ? "image/heif" : "");
      if (!validTypes.includes(inferredMimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tipo de arquivo não permitido" });
      }

      // Validar tamanho (máx 50MB)
      const maxSizeBytes = 50 * 1024 * 1024;
      if (input.fileSize > maxSizeBytes) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo excede tamanho máximo de 50MB" });
      }

      // Converter base64 para Buffer
      const buffer = Buffer.from(input.fileData, "base64");
      if (buffer.length === 0 || buffer.length > maxSizeBytes || buffer.length !== input.fileSize) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo inválido ou com tamanho divergente" });
      }

      // Determinar tipo de prova
      let proofType: "foto" | "video" | "audio" | "documento" = "documento";
      if (inferredMimeType.startsWith("image/")) proofType = "foto";
      else if (inferredMimeType.startsWith("video/")) proofType = "video";
      else if (inferredMimeType.startsWith("audio/")) proofType = "audio";

      // Upload para S3
      const safeFileName = input.fileName
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "prova";
      const fileKey = `fo-provas/${ctx.user.id}/${Date.now()}-${nanoid()}-${safeFileName}`;
      const { provaId, url } = await storagePutWithRollback(fileKey, buffer, inferredMimeType, async ({ url }) => ({ provaId: await foDb.createFatoObservadoProva({
        studentObservationId: input.studentObservationId,
        arquivoUrl: url,
        tipo: proofType,
        nomeArquivo: input.fileName,
        tamanho: input.fileSize,
        mimeType: inferredMimeType,
        criadoPor: ctx.user.id,
      }), url }));

      return { id: provaId, url };
    }),

    listProofs: scaleManagerProcedure.input(
      z.object({
        studentObservationId: z.number().int(),
      })
    ).query(async ({ ctx, input }) => {
      await foDb.ensureFoProofSchema();
      const observation = await serviceScaleDb.getStudentObservation(input.studentObservationId);
      if (!observation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fato observado não encontrado" });
      }
      await requireClassroomViewAccess(ctx.user, observation.companhia, observation.peloton);
      return foDb.listFatoObservadoProvas(input.studentObservationId);
    }),

    deleteProof: scaleManagerProcedure.input(
      z.object({
        provaId: z.number().int(),
      })
    ).mutation(async ({ ctx, input }) => {
      await foDb.ensureFoProofSchema();
      const prova = await foDb.getFatoObservadoProva(input.provaId);
      if (!prova) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Prova não encontrada" });
      }
      const observation = await serviceScaleDb.getStudentObservation(prova.studentObservationId);
      if (!observation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Fato observado não encontrado" });
      }
      await requireClassroomViewAccess(ctx.user, observation.companhia, observation.peloton);
      await foDb.deleteFatoObservadoProva(input.provaId);
      return { success: true };
    }),
  }),

  student: studentRouter,
});
export type AppRouter = typeof appRouter;
