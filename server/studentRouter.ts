import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as studentDb from "./studentDb";
import * as serviceScaleDb from "./serviceScaleDb";
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
        cpf: z.string().trim().optional(),
        rg: z.string().trim().optional(),
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
      const existingStudent = await studentDb.getStudentByNumerica(input.numerica);
      let student: any = null;

      if (existingStudent) {
        // A conta só é considerada ativa se já tiver um sessionToken real e se a senha não for a temporária "temp"
        const isTempPassword = await studentDb.verifyStudentPassword(input.numerica, "temp");
        const isAlreadyActivated = existingStudent.sessionToken && 
                                   existingStudent.sessionToken !== "null" && 
                                   existingStudent.sessionToken !== "undefined" && 
                                   !isTempPassword;

        if (isAlreadyActivated) {
          // Normalizar CPFs e RGs para comparação
          const dbCpf = existingStudent.cpf ? existingStudent.cpf.replace(/\D/g, "") : "";
          const dbRg = existingStudent.rg ? existingStudent.rg.replace(/\D/g, "") : "";

          const inputCpf = input.cpf ? input.cpf.replace(/\D/g, "") : "";
          const inputRg = input.rg ? input.rg.replace(/\D/g, "") : "";

          const matchesCpf = dbCpf && inputCpf && dbCpf === inputCpf;
          const matchesRg = dbRg && inputRg && dbRg === inputRg;

          // Se a conta já ativa tem CPF ou RG, exige validação para redefinir
          if (!matchesCpf && !matchesRg) {
            if (!dbCpf && !dbRg) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Esta numérica já está cadastrada e ativa. Para recuperar sua conta, entre em contato com o Xerife do seu pelotão.",
              });
            } else {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Esta numérica já está cadastrada e ativa. Para redefinir sua senha e reassumir a conta, informe o CPF ou RG cadastrado corretos.",
              });
            }
          }
        }

        // Se passou na validação ou não estava ativo ainda, assume a conta
        await studentDb.updateStudentProfile(existingStudent.id, {
          nomeGuerra: input.nomeGuerra,
          senha: input.senha,
          cpf: input.cpf || undefined,
          rg: input.rg || undefined,
        });
        
        // Rotacionar token de sessão para logá-los
        const sessionToken = await studentDb.rotateStudentSessionToken(existingStudent.id);
        
        student = {
          id: existingStudent.id,
          numerica: existingStudent.numerica,
          nomeGuerra: input.nomeGuerra,
          companhia: existingStudent.companhia,
          peloton: existingStudent.peloton,
          sessionToken,
        };
      } else {
        // Criar novo aluno se não existir
        student = await studentDb.createStudent(
          input.numerica,
          input.nomeGuerra,
          input.senha,
          validation.companhia,
          validation.peloton
        );
        
        // Se CPF ou RG foram preenchidos, salvá-los no perfil recém-criado
        if (student && (input.cpf || input.rg)) {
          await studentDb.updateStudentProfile(student.id, {
            cpf: input.cpf || undefined,
            rg: input.rg || undefined,
          });
        }
      }

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
        senha: z.string().min(4),
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

  observations: publicProcedure
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
      return serviceScaleDb.listStudentObservations(input.id, { onlyVisibleToStudent: true });
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
        cpf: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        address: z.string().trim().optional(),
        birthDate: z.string().trim().optional(),
        bloodType: z.string().trim().optional(),
        emergencyContact: z.string().trim().optional(),
        emergencyPhone: z.string().trim().optional(),
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
        cpf: input.cpf || null,
        phone: input.phone || null,
        address: input.address || null,
        birthDate: input.birthDate || null,
        bloodType: input.bloodType || null,
        emergencyContact: input.emergencyContact || null,
        emergencyPhone: input.emergencyPhone || null,
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

  getByNumericaOrRg: publicProcedure
    .input(
      z.object({
        numerica: z.string().trim().optional(),
        rg: z.string().trim().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.numerica && !input.rg) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Informe a numérica ou o RG/CI para busca",
        });
      }

      let student = null;
      if (input.numerica) {
        student = await studentDb.getStudentByNumerica(input.numerica);
      } else if (input.rg) {
        student = await studentDb.getStudentByRg(input.rg);
      }

      if (!student) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aluno não encontrado",
        });
      }

      return {
        id: student.id,
        numerica: student.numerica,
        nomeGuerra: student.nomeGuerra,
        nomeCompleto: student.nomeCompleto || "",
        rg: student.rg || "",
        companhia: student.companhia,
        peloton: student.peloton,
        companhiaLabel: getCompanhiaLabel(student.companhia),
        pelotonLabel: getPelotonLabel(student.peloton),
      };
    }),
});
