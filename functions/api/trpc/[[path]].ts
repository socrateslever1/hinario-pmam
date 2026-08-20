import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../server/routers';
import { sdk } from '../../../server/_core/sdk';
import { verifyStudentSession } from '../../../server/studentDb';
import { query } from '../../../server/mysql';
import type { User } from '../../../shared/types';
import type { TrpcContext } from '../../../server/_core/context';
import { HttpError } from '../../../shared/_core/errors';
import { PUBLIC_CATALOG_CACHE_CONTROL, isPublicCatalogRequest } from '../../_shared/publicCatalogCache';

async function createFetchContext(req: Request): Promise<TrpcContext> {
  let user: User | null = null;
  
  const pseudoReq = {
    headers: {
      cookie: req.headers.get("cookie") || undefined,
      "x-student-id": req.headers.get("x-student-id") || undefined,
      "x-student-token": req.headers.get("x-student-token") || undefined,
      "x-email-session": req.headers.get("x-email-session") || undefined,
    }
  } as any;

  try {
    user = await sdk.authenticateRequest(pseudoReq);
  } catch (error) {
    if (error instanceof HttpError && error.statusCode === 403) {
      user = null;
    } else {
      throw error;
    }
  }

  if (!user) {
    const emailSessionToken = pseudoReq.headers["x-email-session"];
    if (emailSessionToken) {
      try {
        user = await sdk.authenticateSessionToken(String(emailSessionToken));
      } catch (error) {
        if (!(error instanceof HttpError && error.statusCode === 403)) {
          throw error;
        }
      }
    }
  }

  if (!user) {
    const studentIdHeader = pseudoReq.headers["x-student-id"];
    const studentTokenHeader = pseudoReq.headers["x-student-token"];
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
    req: pseudoReq,
    res: {},
    user
  };
}

export const onRequest: PagesFunction = async (context) => {
  (globalThis as any).cloudflareEnv = context.env;
  const resHeaders = new Headers();
  const publicCatalogRequest = isPublicCatalogRequest(context.request);
  if (publicCatalogRequest) {
    resHeaders.set("Cache-Control", PUBLIC_CATALOG_CACHE_CONTROL);
  }
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: context.request,
    router: appRouter,
    createContext: async () => {
      if (publicCatalogRequest) {
        return {
          req: { headers: {} } as any,
          res: {},
          user: null,
          resHeaders,
        } satisfies TrpcContext;
      }
      const ctx = await createFetchContext(context.request);
      ctx.resHeaders = resHeaders;
      return ctx;
    },
    responseMeta() {
      return {
        headers: resHeaders,
      };
    },
  });
};
