import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../shared/types";
import { sdk } from "./sdk";
import { verifyStudentSession } from "../studentDb";
import { query } from "../mysql";
import { HttpError } from "../../shared/_core/errors";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  resHeaders?: Headers;
  user: User | null;
};

function isTransientDatabaseError(error: unknown) {
  const err = error as any;
  const message = String(err?.message ?? error ?? "");
  const causeCode = String(err?.cause?.code ?? err?.code ?? "");

  return (
    causeCode === "DB_QUERY_TIMEOUT" ||
    causeCode === "DB_TEMPORARILY_UNAVAILABLE" ||
    causeCode === "UND_ERR_CONNECT_TIMEOUT" ||
    message.includes("fetch failed") ||
    message.includes("Connect Timeout") ||
    message.includes("Database query timed out")
  );
}

function isCooldownError(error: unknown) {
  const err = error as any;
  return String(err?.cause?.code ?? err?.code ?? "") === "DB_TEMPORARILY_UNAVAILABLE";
}

const PUBLIC_CATALOG_PROCEDURES = new Set([
  "blog.list",
  "buglePanel.list",
  "hymns.list",
  "ordemUnidaAudio.list",
  "ordemUnidaAudio.listVoiceProfiles",
]);

function isPublicCatalogRequest(req: CreateExpressContextOptions["req"]) {
  if (req.method !== "GET") return false;
  const originalUrl = req.originalUrl || req.url || "";
  const marker = "/api/trpc/";
  const markerIndex = originalUrl.indexOf(marker);
  if (markerIndex === -1) return false;
  const procedurePath = originalUrl.slice(markerIndex + marker.length).split("?")[0] || "";
  const procedures = decodeURIComponent(procedurePath).split(",").filter(Boolean);
  return procedures.length > 0 && procedures.every((procedure) => PUBLIC_CATALOG_PROCEDURES.has(procedure));
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  if (isPublicCatalogRequest(opts.req)) {
    return {
      req: opts.req,
      res: opts.res,
      user: null,
    };
  }

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Apenas um cookie ausente ou inválido deve deixar o usuário como anônimo.
    // Falhas transitórias de banco/infraestrutura não podem apagar a sessão ativa no cliente.
    if (error instanceof HttpError && error.statusCode === 403) {
      user = null;
    } else if (isTransientDatabaseError(error)) {
      if (isCooldownError(error)) {
        user = null;
      } else {
      // Banco remoto indisponivel: tratar como anonimo sem poluir o log local.
      user = null;
      }
    } else {
      throw error;
    }
  }

  // Alguns navegadores móveis isolam ou descartam cookies HttpOnly no primeiro redirecionamento.
  // Para esses casos, o cliente envia o mesmo JWT assinado em cabeçalho por uma sessão local limitada.
  if (!user) {
    const emailSessionHeader = opts.req.headers["x-email-session"];
    const emailSessionToken = Array.isArray(emailSessionHeader) ? emailSessionHeader[0] : emailSessionHeader;
    if (emailSessionToken) {
      try {
        user = await sdk.authenticateSessionToken(String(emailSessionToken));
      } catch (error) {
        if (isTransientDatabaseError(error)) {
          if (!isCooldownError(error)) {
          // Banco remoto indisponivel: tratar como anonimo sem poluir o log local.
          }
        } else if (!(error instanceof HttpError && error.statusCode === 403)) {
          throw error;
        }
      }
    }
  }

  // Fallback: if no admin cookie session, check for student headers
  if (!user) {
    const studentIdHeader = opts.req.headers["x-student-id"];
    const studentTokenHeader = opts.req.headers["x-student-token"];
    if (studentIdHeader && studentTokenHeader) {
      try {
        const studentId = Number(studentIdHeader);
        const sessionToken = String(studentTokenHeader);
        const isSessionValid = await verifyStudentSession(studentId, sessionToken);
        if (isSessionValid) {
          const userRows = await query(
            "SELECT * FROM pmam_users WHERE student_id = ? LIMIT 1",
            [studentId]
          );
          const userRow = userRows[0];
          if (userRow) {
            user = {
              id: userRow.id,
              openId: userRow.open_id,
              name: userRow.name,
              email: userRow.email,
              role: userRow.role as 'user' | 'admin' | 'master',
              createdAt: userRow.created_at,
              updatedAt: userRow.updated_at,
              lastSignedIn: userRow.last_signed_in,
              loginMethod: userRow.login_method,
            };
          }
        }
      } catch (e) {
        console.error("[Context] Student fallback authentication failed:", e);
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
