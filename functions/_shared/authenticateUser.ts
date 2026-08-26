import type { User } from "../../shared/types";
import { HttpError } from "../../shared/_core/errors";
import { sdk } from "../../server/_core/sdk";

export async function authenticatePagesUser(request: Request): Promise<User | null> {
  const pseudoReq = {
    headers: {
      cookie: request.headers.get("cookie") || undefined,
      "x-email-session": request.headers.get("x-email-session") || undefined,
    },
  } as any;

  try {
    const user = await sdk.authenticateRequest(pseudoReq);
    if (user) return user;
  } catch (error) {
    if (!(error instanceof HttpError && error.statusCode === 403)) throw error;
  }

  const emailSession = pseudoReq.headers["x-email-session"];
  if (!emailSession) return null;
  try {
    return await sdk.authenticateSessionToken(String(emailSession));
  } catch (error) {
    if (error instanceof HttpError && error.statusCode === 403) return null;
    throw error;
  }
}
