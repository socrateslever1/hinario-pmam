import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import * as studentDb from "./studentDb";
import * as serviceScaleDb from "./serviceScaleDb";
import { storagePut } from "./storage";
import { validateNumerica, getCompanhiaLabel, getPelotonLabel } from "../shared/studentValidation";

const MAX_BAIXADO_DOCUMENT_SIZE = 15 * 1024 * 1024;
const BAIXADO_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

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

      const sessionToken = await studentDb.rotateStudentSessionToken(student.id);

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

  contestObservation: publicProcedure
    .input(
      z.object({
        id: z.number(),
        sessionToken: z.string(),
        observationId: z.number().int().positive(),
        text: z.string().trim().min(5).max(5000),
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
      const observation = await serviceScaleDb.getStudentObservation(input.observationId);
      if (!observation || Number(observation.student_id) !== Number(input.id)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "FO não encontrado." });
      }
      if (observation.validation_status !== "approved" || observation.annulled_at) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Somente FO homologado e ainda válido pode ser contestado." });
      }
      if (observation.contest_status && observation.contest_status !== "none") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este FO já possui contestação registrada." });
      }
      await serviceScaleDb.contestStudentObservation({
        id: input.observationId,
        source: "portal",
        text: input.text,
      });
      return { success: true };
    }),

  internalReports: publicProcedure
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
      return serviceScaleDb.listInternalReports({
        studentId: input.id,
        status: "active",
        visibleToStudent: true,
      });
    }),

  licencaCacadaStatus: publicProcedure
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
      return serviceScaleDb.listStudentLcCases(input.id);
    }),

  baixadoDocuments: publicProcedure
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
          message: "Sessao invalida ou expirada",
        });
      }
      return serviceScaleDb.listBaixadoDocuments(input.id);
    }),

  uploadBaixadoDocument: publicProcedure
    .input(
      z.object({
        id: z.number(),
        sessionToken: z.string(),
        fileName: z.string().trim().min(1).max(180),
        mimeType: z.string().trim().min(3).max(120),
        base64Data: z.string().min(1),
        note: z.string().trim().max(1000).nullable().optional(),
        baixadoKind: z.enum(["informativo", "ausente_com_atestado", "ausente_sem_atestado", "presente_sem_atestado"]).optional(),
        hpmHomologated: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const isSessionValid = await studentDb.verifyStudentSession(input.id, input.sessionToken);
      if (!isSessionValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sessao invalida ou expirada",
        });
      }
      const student = await studentDb.getStudentById(input.id);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno nao encontrado" });
      }
      if (!BAIXADO_DOCUMENT_MIME_TYPES.has(input.mimeType)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Envie PDF ou imagem do atestado/documento" });
      }
      const buffer = Buffer.from(input.base64Data, "base64");
      if (buffer.length > MAX_BAIXADO_DOCUMENT_SIZE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Arquivo maior que 15MB" });
      }
      const ext = input.fileName.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "pdf";
      const fileKey = `baixados/${student.companhia}-${student.peloton}/${student.id}/${Date.now()}-${nanoid(8)}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      const documentId = await serviceScaleDb.createBaixadoDocument({
        studentId: student.id,
        companhia: student.companhia,
        peloton: student.peloton,
        fileUrl: url,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: buffer.length,
        note: input.note ?? null,
        baixadoKind: input.baixadoKind ?? "ausente_com_atestado",
        hpmHomologated: input.hpmHomologated ?? false,
        uploadedByStudentId: student.id,
      });
      return { id: documentId, url };
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
        id: z.number().int().positive(),
        sessionToken: z.string().min(16),
        numerica: z.string().trim().optional(),
        rg: z.string().trim().optional(),
      })
    )
    .query(async ({ input }) => {
      const isSessionValid = await studentDb.verifyStudentSession(input.id, input.sessionToken);
      if (!isSessionValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida ou expirada" });
      }
      if (!input.numerica && !input.rg) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Informe a numérica ou o RG/CI para busca",
        });
      }

      const student = await studentDb.getStudentById(input.id);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aluno não encontrado" });
      }

      const requestedNumerica = input.numerica?.replace(/\D/g, "") || "";
      const requestedRg = input.rg?.replace(/\D/g, "") || "";
      
      // Permitir que qualquer pessoa busque os dados para preencher o documento
      // O usuário pediu explicitamente: "tem que liberar a busca nos campos acima" para "fazer para outra pessoa"
      let targetStudent = student;

      if (requestedNumerica && requestedNumerica !== student.numerica) {
        const found = await studentDb.getStudentByNumerica(requestedNumerica);
        if (found) targetStudent = found;
      } else if (requestedRg && requestedRg !== (student.rg?.replace(/\D/g, "") || "")) {
        // Fallback: se tivermos que buscar por RG, na verdade não temos um endpoint fácil no studentDb, 
        // mas podemos apenas permitir a busca por numérica por agora, ou fazer uma query rápida
        const { query } = await import("./mysql");
        const rows = await query("SELECT id FROM pmam_students WHERE REPLACE(rg, '.', '') = ? OR REPLACE(rg, '-', '') = ? LIMIT 1", [requestedRg, requestedRg]);
        if (rows && rows.length > 0) {
          const found = await studentDb.getStudentById((rows[0] as any).id);
          if (found) targetStudent = found;
        }
      }

      return {
        id: targetStudent.id,
        numerica: targetStudent.numerica,
        nomeGuerra: targetStudent.nomeGuerra,
        nomeCompleto: targetStudent.nomeCompleto || "",
        rg: targetStudent.rg || "",
        cpf: targetStudent.cpf || "",
        email: targetStudent.email || "",
        companhia: targetStudent.companhia || 0,
        peloton: targetStudent.peloton || 0,
      };
    }),

  searchStudents: publicProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ input }) => {
      const q = `%${input.query}%`;
      const { query } = await import("./mysql");
      const rows = await query(
        `SELECT id, numerica, nome_guerra, nome_completo, rg, cpf, companhia, peloton 
         FROM pmam_students 
         WHERE numerica LIKE ? OR nome_guerra LIKE ? OR nome_completo LIKE ? 
         LIMIT 10`,
        [q, q, q]
      );
      
      return rows.map((r: any) => ({
        id: r.id,
        numerica: r.numerica,
        nomeGuerra: r.nome_guerra,
        nomeCompleto: r.nome_completo,
        rg: r.rg,
        cpf: r.cpf,
        companhia: r.companhia,
        peloton: r.peloton,
      }));
    }),
});
