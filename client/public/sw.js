const CACHE_NAME = "hinario-pmam-cache-v2";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo/IMG_7728.PNG",
];

// Rotas de autenticação que NUNCA devem ser cacheadas
const AUTH_ROUTES = [
  "/api/trpc/auth.me",
  "/api/trpc/auth.login",
  "/api/trpc/auth.logout",
  "/api/trpc/auth.loginEmail",
];

// Rotas de sessão de aluno que NUNCA devem ser cacheadas
const SESSION_ROUTES = [
  "/api/trpc/study.ensureStudent",
  "/api/trpc/study.getStudentSession",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== "GET") return;

  // SPA navigation fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match("/index.html") || caches.match("/");
      })
    );
    return;
  }

  // NEVER cache authentication or session routes
  const isAuthRoute = AUTH_ROUTES.some(route => url.pathname.includes(route));
  const isSessionRoute = SESSION_ROUTES.some(route => url.pathname.includes(route));
  
  if (isAuthRoute || isSessionRoute) {
    // Network-first for auth/session: always try to fetch fresh
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If offline, return error response instead of cached data
          return new Response(
            JSON.stringify({ error: "Offline - authentication unavailable" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        })
    );
    return;
  }

  // Handle other tRPC GET queries (grades, hymns catalog etc) for offline fallback
  if (url.pathname.startsWith("/api/trpc")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets caching
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background to update cache (Stale-While-Revalidate)
        fetch(request)
          .then((response) => {
            if (response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
            }
          })
          .catch(() => undefined);
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Cache new assets on the fly
        if (response.status === 200 && (url.pathname.includes("/assets/") || url.pathname.includes("/logo/"))) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
