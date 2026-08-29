const CHUNK_RECOVERY_KEY = "chunk_retry_refreshed";
const AUDIO_CACHE_PREFIX = "hinario-pmam-audio-";

export function hasAttemptedDeploymentRecovery() {
  return window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === "true";
}

export function resetDeploymentRecovery() {
  window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
}

export function isDeploymentLoadError(error: unknown) {
  const candidate = error as { name?: string; message?: string } | null;
  const name = candidate?.name || "";
  const message = candidate?.message || "";

  return (
    name === "ChunkLoadError" ||
    name === "CSS_CHUNK_LOAD_FAILED" ||
    /dynamically imported module|module script|loading (?:css )?chunk|unable to preload css|importing a module script/i.test(message)
  );
}

export async function recoverFromStaleDeployment(force = false) {
  if (!force && hasAttemptedDeploymentRecovery()) return false;

  window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, "true");

  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(AUDIO_CACHE_PREFIX))
          .map((key) => caches.delete(key)),
      );
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } finally {
    const fallbackHref = `${window.location.pathname || "/"}${window.location.search || ""}${window.location.hash || ""}`;
    const currentHref = typeof window.location.href === "string" && window.location.href
      ? window.location.href
      : fallbackHref;

    try {
      const freshUrl = new URL(currentHref, window.location.origin || undefined);
      freshUrl.searchParams.set("app-refresh", Date.now().toString());
      window.location.replace(freshUrl.toString());
    } catch {
      const separator = fallbackHref.includes("?") ? "&" : "?";
      window.location.replace(`${fallbackHref}${separator}app-refresh=${Date.now()}`);
    }
  }

  return true;
}
