const SESSION_KEY = "pmam-email-session";
const PERSISTENT_SESSION_KEY = "pmam-email-session-persistent";
const REMEMBER_DURATION = 10 * 365 * 24 * 60 * 60 * 1000;

type StoredEmailSession = { token: string; expiresAt: number };

export function isValidEmailSession(session: StoredEmailSession | null, now = Date.now()) {
  return Boolean(session?.token && session.expiresAt > now);
}

function readStoredSession(key: string) {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || window.sessionStorage.getItem(key) || "null") as StoredEmailSession | null;
    if (!isValidEmailSession(parsed)) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getEmailSessionToken() {
  return readStoredSession(PERSISTENT_SESSION_KEY)?.token ?? readStoredSession(SESSION_KEY)?.token ?? null;
}

export function saveEmailSession(token: string, rememberMe: boolean) {
  if (typeof window === "undefined") return;
  const payload: StoredEmailSession = { token, expiresAt: Date.now() + REMEMBER_DURATION };
  window.localStorage.setItem(PERSISTENT_SESSION_KEY, JSON.stringify(payload));
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function clearEmailSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PERSISTENT_SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
}
