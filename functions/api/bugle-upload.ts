import { nanoid } from "nanoid";
import type { User } from "../../shared/types";
import { HttpError } from "../../shared/_core/errors";
import { sdk } from "../../server/_core/sdk";
import { query } from "../../server/mysql";
import { verifyStudentSession } from "../../server/studentDb";
import {
  canManageBugleUploads,
  getCurrentBugleAudioUrl,
  setBugleAudioUrl,
  validateBugleUpload,
  type BugleUploadKind,
} from "../../server/bugleUpload";
import { normalizeStorageKey, publicStorageUrl } from "../../server/storagePath";

type UploadEnv = { UPLOADS_BUCKET?: R2Bucket };

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function authenticate(request: Request): Promise<User | null> {
  const pseudoReq = {
    headers: {
      cookie: request.headers.get("cookie") || undefined,
      "x-student-id": request.headers.get("x-student-id") || undefined,
      "x-student-token": request.headers.get("x-student-token") || undefined,
      "x-email-session": request.headers.get("x-email-session") || undefined,
    },
  } as any;

  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(pseudoReq);
  } catch (error) {
    if (!(error instanceof HttpError && error.statusCode === 403)) throw error;
  }

  if (!user && pseudoReq.headers["x-email-session"]) {
    try {
      user = await sdk.authenticateSessionToken(String(pseudoReq.headers["x-email-session"]));
    } catch (error) {
      if (!(error instanceof HttpError && error.statusCode === 403)) throw error;
    }
  }

  if (!user && pseudoReq.headers["x-student-id"] && pseudoReq.headers["x-student-token"]) {
    try {
      const studentId = Number(pseudoReq.headers["x-student-id"]);
      if (Number.isInteger(studentId) && await verifyStudentSession(studentId, String(pseudoReq.headers["x-student-token"]))) {
        const rows = await query<any>("SELECT * FROM pmam_users WHERE student_id = ? LIMIT 1", [studentId]);
        const row = rows[0];
        if (row) {
          user = {
            id: Number(row.id), openId: row.open_id, name: row.name, email: row.email,
            role: row.role, createdAt: row.created_at, updatedAt: row.updated_at,
            lastSignedIn: row.last_signed_in, loginMethod: row.login_method,
          };
        }
      }
    } catch (error) {
      console.error("[Bugle upload] Falha ao validar sessão de aluno", error);
    }
  }

  return user;
}

function r2KeyFromPublicUrl(value: string | null | undefined) {
  if (!value?.startsWith("/uploads/bugle/")) return null;
  try {
    return normalizeStorageKey(value.slice("/uploads/".length).split("/").map(decodeURIComponent).join("/"));
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction<UploadEnv> = async (context) => {
  (globalThis as any).cloudflareEnv = context.env;
  let createdKey: string | null = null;

  try {
    const user = await authenticate(context.request);
    if (!user) return json({ error: "Sessão expirada. Entre novamente." }, 401);
    if (!await canManageBugleUploads(user)) return json({ error: "Acesso restrito ao comando ou Xerife Geral." }, 403);
    if (!context.env.UPLOADS_BUCKET) {
      return json({ error: "Armazenamento de áudio não configurado no Cloudflare." }, 503);
    }

    const form = await context.request.formData();
    const kind = form.get("kind");
    const id = Number(form.get("id"));
    const file = form.get("file");
    if ((kind !== "call" && kind !== "march") || !Number.isInteger(id) || id <= 0) {
      return json({ error: "Destino do áudio inválido." }, 400);
    }
    if (!file || typeof file === "string") return json({ error: "Selecione um arquivo de áudio." }, 400);

    const validation = validateBugleUpload(file.name, file.size);
    if ("error" in validation) return json({ error: validation.error }, 400);

    const previousUrl = await getCurrentBugleAudioUrl(kind, id);
    if (previousUrl === undefined) return json({ error: "Toque ou dobrado não encontrado." }, 404);

    const folder = kind === "call" ? "calls" : "marches";
    createdKey = normalizeStorageKey(`bugle/${folder}/${id}-${nanoid(10)}.${validation.extension}`);
    await context.env.UPLOADS_BUCKET.put(createdKey, file.stream(), {
      httpMetadata: {
        contentType: validation.mimeType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: { uploadedBy: String(user.id), originalName: file.name.slice(0, 180) },
    });

    const url = publicStorageUrl(createdKey);
    try {
      await setBugleAudioUrl(kind as BugleUploadKind, id, url);
    } catch (error) {
      await context.env.UPLOADS_BUCKET.delete(createdKey);
      createdKey = null;
      throw error;
    }

    const previousKey = r2KeyFromPublicUrl(previousUrl);
    if (previousKey && previousKey !== createdKey) {
      context.waitUntil(context.env.UPLOADS_BUCKET.delete(previousKey).catch(() => undefined));
    }
    return json({ success: true, url });
  } catch (error) {
    console.error("[Bugle upload]", error);
    return json({ error: "Não foi possível armazenar o áudio. Tente novamente." }, 500);
  }
};
