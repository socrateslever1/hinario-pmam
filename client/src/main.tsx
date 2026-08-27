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

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !link.target || link.target === "_self") return;

    event.preventDefault();
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
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
        if (typeof window !== "undefined") {
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
          ...authenticatedFetchOptions,
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
