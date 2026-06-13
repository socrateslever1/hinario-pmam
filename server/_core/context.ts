import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../shared/types";
import { sdk } from "./sdk";
import { verifyStudentSession } from "../studentDb";
import { query } from "../mysql";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
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
