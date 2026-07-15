const CACHE_NAME = "hinario-pmam-cache-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo/IMG_7728.PNG",
  "/documents/peculio_cfsd_2026.pdf",
  "/documents/modelo_de_parte.docx",
  "/documents/matriz_curricular_cfsd2025.docx",
  "/documents/images/pmam-brasao.png",
  "/documents/images/brasao_cfap.png",
  "/study/texts/estatuto-policiais-militares.txt",
  "/study/texts/manual-do-aluno.txt",
  "/study/texts/rdpmam.txt",
  "/study/texts/rcont.txt",
  "/study/texts/risg.txt",
  "/study/texts/rupmam.txt",
];

const AUTH_ROUTES = [
  "/api/trpc/auth.me",
  "/api/trpc/auth.login",
  "/api/trpc/auth.logout",
  "/api/trpc/auth.loginEmail",
];

const SESSION_ROUTES = [
  "/api/trpc/study.ensureStudent",
  "/api/trpc/study.getStudentSession",
  "/api/trpc/student.login",
  "/api/trpc/student.register",
];

const STATIC_CACHE_PATHS = [
  "/assets/",
  "/logo/",
  "/documents/",
  "/study/",
];

async function addToCache(cache, urls) {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      await cache.put(url, response.clone());
    }),
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.warn("[SW] Failed to cache asset:", result.reason);
    }
  });
}

self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => addToCache(cache, ASSETS_TO_CACHE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
          return undefined;
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        console.log("[SW] Navigation offline, returning index.html");
        return caches.match("/index.html", { ignoreSearch: true }).then(res => res || caches.match("/", { ignoreSearch: true }));
      }),
    );
    return;
  }

  const isAuthRoute = AUTH_ROUTES.some((route) => url.pathname.includes(route));
  const isSessionRoute = SESSION_ROUTES.some((route) => url.pathname.includes(route));

  if (isAuthRoute || isSessionRoute) {
    event.respondWith(
      fetch(request).catch(() => {
        console.log("[SW] Auth/session offline, returning error");
        return new Response(
          JSON.stringify({ error: "Offline - authentication unavailable" }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/api/trpc")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              console.log("[SW] Cached API response:", url.pathname);
            });
          }
          return response;
        })
        .catch(() => {
          console.log("[SW] API offline, returning cached response:", url.pathname);
          return caches.match(request).then(cachedRes => {
            return cachedRes || new Response(
              JSON.stringify({ error: "Offline" }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          });
        }),
    );
    return;
  }

  const shouldCacheStatic = STATIC_CACHE_PATHS.some((path) => url.pathname.includes(path));

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((response) => {
            if (response.status === 200 && shouldCacheStatic) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response.clone());
                console.log("[SW] Updated cached asset:", url.pathname);
              });
            }
          })
          .catch(() => undefined);
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (response.status === 200 && shouldCacheStatic) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
              console.log("[SW] Cached new asset:", url.pathname);
            });
          }
          return response;
        })
        .catch(() => {
          console.log("[SW] Asset offline:", url.pathname);
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data.type === "CLEAR_CACHE") {
    console.log("[SW] Clearing cache on request from client");
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});
