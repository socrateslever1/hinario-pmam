import { clearEmailSession } from "./emailSession";
import { clearStudentSession } from "./studentSession";

type LogoutDependencies = {
  cancelAuthQuery: () => Promise<unknown>;
  setAuthUser: (user: null) => void;
  requestServerLogout: () => Promise<unknown>;
  onRemoteError?: (error: unknown) => void;
};

let logoutInFlight: Promise<void> | null = null;

export function clearBrowserAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("auth-user-info");
  clearStudentSession();
  clearEmailSession();
}

export function executeClientLogout(dependencies: LogoutDependencies) {
  if (logoutInFlight) return logoutInFlight;

  logoutInFlight = (async () => {
    // Remove tokens before any refetch. Otherwise auth.me can authenticate with
    // the old email/student token and put the user back into the cache.
    clearBrowserAuthSession();
    dependencies.setAuthUser(null);

    try {
      await dependencies.cancelAuthQuery();
    } catch {
      // Local logout must continue even if a query could not be cancelled.
    }
    dependencies.setAuthUser(null);

    try {
      await dependencies.requestServerLogout();
    } catch (error) {
      dependencies.onRemoteError?.(error);
    } finally {
      clearBrowserAuthSession();
      dependencies.setAuthUser(null);
    }
  })().finally(() => {
    logoutInFlight = null;
  });

  return logoutInFlight;
}
