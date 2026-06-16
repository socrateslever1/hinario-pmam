import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as studentDb from "./studentDb";
import { validateNumerica, getCompanhiaLabel, getPelotonLabel } from "../shared/studentValidation";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

export const studentRouter = router({
  register: publicProcedure
    .input(
      z.object({
        numerica: z.string().trim().length(4),
        nomeGuerra: z.string().trim().min(2).max(255),
        senha: z.string().min(6),
        confirmarSenha: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      // Validar numérica
      const validation = validateNumerica(input.numerica);
      if (!validation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validation.error || "Numérica inválida",
        });
      }

      // Validar senhas
      if (input.senha !== input.confirmarSenha) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "As senhas não coincidem",
        });
      }

      // Verificar se aluno já existe
      const exists = await studentDb.studentExists(input.numerica);
      if (exists) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Aluno com esta numérica já existe",
        });
      }

      // Criar aluno
      const student = await studentDb.createStudent(
        input.numerica,
        input.nomeGuerra,
        input.senha,
        validation.companhia,
        validation.peloton
      );

      if (!student) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar conta",
        });
      }

      return {
        id: student.id,
        numerica: student.numerica,
        nomeGuerra: student.nomeGuerra,
        companhia: student.companhia,
        peloton: student.peloton,
        sessionToken: student.sessionToken ?? "",
        companhiaLabel: getCompanhiaLabel(student.companhia),
        pelotonLabel: getPelotonLabel(student.peloton),
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        numerica: z.string().trim().length(4),
        senha: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validar numérica
      const validation = validateNumerica(input.numerica);
      if (!validation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Numérica inválida",
        });
      }

      // Verificar credenciais
      const isValid = await studentDb.verifyStudentPassword(
        input.numerica,
        input.senha
      );

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Numérica ou senha incorretos",
        });
      }

      // Buscar dados do aluno
      const student = await studentDb.getStudentByNumerica(input.numerica);
      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aluno não encontrado",
        });
      }

      const sessionToken = await studentDb.rotateStudentSessionToken(student.id);

      // Se o aluno for xerife (tiver cadastro na tabela de usuários), loga ele também como usuário/xerife
      try {
        const email = `${student.numerica}@pmam.com`;
        const user = await db.getUserByEmail(email);
        if (user) {
          const userSessionToken = await sdk.createSessionToken(user.openId, {
            name: user.name || "",
            expiresInMs: ONE_YEAR_MS,
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, userSessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        }
      } catch (err) {
        console.error("[StudentLogin] Failed to auto-login xerife user:", err);
      }

      return {
        id: student.id,
        numerica: student.numerica,
        nomeGuerra: student.nomeGuerra,
        companhia: student.companhia,
        peloton: student.peloton,
        sessionToken,
        companhiaLabel: getCompanhiaLabel(student.companhia),
        pelotonLabel: getPelotonLabel(student.peloton),
      };
    }),
  getProfile: publicProcedure
    .input(
      z.object({
        id: z.number(),
        sessionToken: z.string(),
      })
    )
    .query(async ({ input }) => {
      const isSessionValid = await studentDb.verifyStudentSession(input.id, input.sessionToken);
      if (!isSessionValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sessão inválida ou expirada",
        });
      }

      const student = await studentDb.getStudentById(input.id);
      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aluno não encontrado",
        });
      }

      return {
        ...student,
        companhiaLabel: getCompanhiaLabel(student.companhia),
        pelotonLabel: getPelotonLabel(student.peloton),
      };
    }),

  updateProfile: publicProcedure
    .input(
      z.object({
        id: z.number(),
        sessionToken: z.string(),
        nomeGuerra: z.string().trim().min(2).max(255).optional(),
        nomeCompleto: z.string().trim().optional(),
        rg: z.string().trim().optional(),
        email: z.string().trim().email().or(z.literal("")).optional(),
        fotoUrl: z.string().optional(),
        senha: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const isSessionValid = await studentDb.verifyStudentSession(input.id, input.sessionToken);
      if (!isSessionValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sessão inválida ou expirada",
        });
      }

      await studentDb.updateStudentProfile(input.id, {
        nomeGuerra: input.nomeGuerra,
        nomeCompleto: input.nomeCompleto,
        rg: input.rg,
        email: input.email === "" ? null : input.email,
        fotoUrl: input.fotoUrl,
        senha: input.senha,
      });

      const updated = await studentDb.getStudentById(input.id);
      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao carregar perfil atualizado",
        });
      }

      return {
        ...updated,
        companhiaLabel: getCompanhiaLabel(updated.companhia),
        pelotonLabel: getPelotonLabel(updated.peloton),
      };
    }),
});
