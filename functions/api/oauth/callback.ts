import { COOKIE_NAME, ONE_YEAR_MS } from "../../../shared/const";
import * as db from "../../../server/db";
import { sdk } from "../../../server/_core/sdk";

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response(JSON.stringify({ error: "code and state are required" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return new Response(JSON.stringify({ error: "openId missing from user info" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    const headers = new Headers();
    // Use standard cookie options (match getSessionCookieOptions in Express)
    const isProd = context.env?.NODE_ENV === "production" || process.env.NODE_ENV === "production";
    headers.append(
      "Set-Cookie", 
      `${COOKIE_NAME}=${sessionToken}; Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}; Path=/; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`
    );
    headers.append("Location", "/");

    return new Response(null, {
      status: 302,
      headers
    });
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return new Response(JSON.stringify({ error: "OAuth callback failed" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
