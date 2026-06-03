import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as studentDb from "./studentDb";
import { validateNumerica, getCompanhiaLabel, getPelotonLabel } from "../shared/studentValidation";

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
    .mutation(async ({ input }) => {
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

      return {
        id: student.id,
        numerica: student.numerica,
        nomeGuerra: student.nomeGuerra,
        companhia: student.companhia,
        peloton: student.peloton,
        companhiaLabel: getCompanhiaLabel(student.companhia),
        pelotonLabel: getPelotonLabel(student.peloton),
      };
    }),
});
