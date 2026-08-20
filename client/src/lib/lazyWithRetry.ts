import { ComponentType, lazy, LazyExoticComponent } from "react";

/**
 * Wraps React.lazy to gracefully handle failed chunk / module fetches
 * (e.g. when a new version of the app is deployed on Cloudflare Pages and old chunk hashes are replaced).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | { [key: string]: any }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = window.sessionStorage.getItem("chunk_retry_refreshed") === "true";

    try {
      const module = await factory();
      window.sessionStorage.removeItem("chunk_retry_refreshed");
      if ("default" in module) {
        return module as { default: T };
      }
      // Handle named exports if any
      const firstExport = Object.values(module)[0];
      return { default: firstExport } as { default: T };
    } catch (error: any) {
      const isChunkError =
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("Importing a module script failed") ||
        error?.message?.includes("error loading dynamically imported module") ||
        error?.name === "ChunkLoadError";

      if (isChunkError && !pageHasBeenForceRefreshed) {
        console.warn("[App] Chunk loading failed due to new deployment. Reloading page...", error);
        window.sessionStorage.setItem("chunk_retry_refreshed", "true");
        window.location.reload();
        // Return a pending promise so React doesn't render an error while reloading
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }
  });
}
