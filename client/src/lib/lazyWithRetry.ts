import { ComponentType, lazy, LazyExoticComponent } from "react";
import {
  hasAttemptedDeploymentRecovery,
  recoverFromStaleDeployment,
  resetDeploymentRecovery,
} from "./deploymentRecovery";

/**
 * Wraps React.lazy to gracefully handle failed chunk / module fetches
 * (e.g. when a new version of the app is deployed on Cloudflare Pages and old chunk hashes are replaced).
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T } | { [key: string]: any }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const module = await factory();
      resetDeploymentRecovery();
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

      if (isChunkError && !hasAttemptedDeploymentRecovery()) {
        console.warn("[App] Chunk loading failed due to new deployment. Reloading page...", error);
        await recoverFromStaleDeployment();
      }

      throw error;
    }
  });
}
