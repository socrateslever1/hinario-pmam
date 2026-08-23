const CHUNK_RECOVERY_KEY = "chunk_retry_refreshed";
const AUDIO_CACHE_PREFIX = "hinario-pmam-audio-";

export function hasAttemptedDeploymentRecovery() {
  return window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === "true";
}

export function resetDeploymentRecovery() {
  window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
}

export async function recoverFromStaleDeployment() {
  if (hasAttemptedDeploymentRecovery()) return false;

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
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update().catch(() => undefined);
    }
  } finally {
    window.location.reload();
  }

  return true;
}
