import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { authenticatedFetchOptions } from "./lib/authFetchOptions";
import { getEmailSessionToken } from "./lib/emailSession";
import {
  hasAttemptedDeploymentRecovery,
  recoverFromStaleDeployment,
} from "./lib/deploymentRecovery";
import "./index.css";

// Global listener for Vite dynamic chunk loading failures (caused by new deployments)
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    if (hasAttemptedDeploymentRecovery()) return;
    event.preventDefault();
    console.warn("[Vite] Chunk preload failed (likely new deployment). Reloading page...", event);
    void recoverFromStaleDeployment();
  });

  window.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!link || link.hasAttribute("download")) return;

    if (link.target && link.target === "_blank") {
      link.target = "_self";
    }

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    const isAsset = /\.(pdf|png|jpg|jpeg|webp|gif|mp3|mp4|wav|ogg|docx?|xlsx?|zip)$/i.test(url.pathname) || url.pathname.startsWith("/api/");
    if (!isAsset) {
      event.preventDefault();
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  });
}

const API_REQUEST_TIMEOUT_MS = 8_000;
const PUBLIC_CATALOG_PROCEDURES = new Set([
  "blog.list",
  "buglePanel.list",
  "hymns.list",
  "ordemUnidaAudio.list",
  "ordemUnidaAudio.listVoiceProfiles",
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  const upstreamSignal = init?.signal;

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort();
    } else {
      upstreamSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  return globalThis.fetch(input, {
    ...(init ?? {}),
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout));
}

function isPublicCatalogRequest(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof window === "undefined") return false;

  const method = String(init?.method || "GET").toUpperCase();
  if (method !== "GET") return false;

  const rawUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  const url = new URL(rawUrl, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (!url.pathname.startsWith("/api/trpc/")) return false;

  const procedures = decodeURIComponent(url.pathname.slice("/api/trpc/".length))
    .split(",")
    .map((procedure) => procedure.trim())
    .filter(Boolean);

  return procedures.length > 0 && procedures.every((procedure) => PUBLIC_CATALOG_PROCEDURES.has(procedure));
}

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Não redirecionar automaticamente para OAuth - usar login próprio
  // window.location.href = getLoginUrl();
  return;
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        const headers = new Headers(init?.headers ?? {});
        const isPublicCatalog = isPublicCatalogRequest(input, init);

        if (typeof window !== "undefined" && !isPublicCatalog) {
          const studentId = window.localStorage.getItem("gradeStudentId");
          const token = window.localStorage.getItem("gradeStudentToken");
          if (studentId && token) {
            headers.set("x-student-id", studentId);
            headers.set("x-student-token", token);
          }
          const emailSessionToken = getEmailSessionToken();
          if (emailSessionToken) {
            headers.set("x-email-session", emailSessionToken);
          }
        }
        return fetchWithTimeout(input, {
          ...(init ?? {}),
          headers,
          ...(isPublicCatalog ? { credentials: "omit" as RequestCredentials } : authenticatedFetchOptions),
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
