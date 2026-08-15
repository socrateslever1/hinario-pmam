const CACHE_NAME = "hinario-pmam-cache-v5";
const AUDIO_CACHE_NAME = "hinario-pmam-audio-v1";
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

function urlLooksLikeScriptOrStyle(value) {
  return /\.(?:m?js|css)(?:$|\?)/i.test(value);
}

function isCacheableStaticResponse(request, response) {
  if (!response || response.status !== 200) return false;

  const contentType = response.headers.get("content-type") || "";

  // Some SPA hosts answer a missing hashed asset with index.html and status 200.
  // Caching that HTML under a JS/CSS URL makes the next load render a white page.
  if (request.destination === "script") {
    return /(?:javascript|ecmascript)/i.test(contentType);
  }
  if (request.destination === "style") {
    return /text\/css/i.test(contentType);
  }
  if (urlLooksLikeScriptOrStyle(request.url) && /text\/html/i.test(contentType)) {
    return false;
  }

  return true;
}

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

async function syncAudioCache(urls) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const uniqueUrls = [...new Set(urls.filter((url) => typeof url === "string" && /^https?:\/\//i.test(url)))];
  const expected = new Set(uniqueUrls);

  const results = await Promise.allSettled(
    uniqueUrls.map(async (url) => {
      const parsed = new URL(url);
      const isCrossOrigin = parsed.origin !== self.location.origin;
      const request = new Request(url, {
        mode: isCrossOrigin ? "no-cors" : "same-origin",
        credentials: isCrossOrigin ? "omit" : "include",
      });
      const response = await fetch(request);
      if (!response.ok && response.type !== "opaque") throw new Error(`${url}: ${response.status}`);
      await cache.put(url, response.clone());
    }),
  );

  const cachedRequests = await cache.keys();
  await Promise.all(
    cachedRequests
      .filter((request) => !expected.has(request.url))
      .map((request) => cache.delete(request)),
  );

  const cached = results.filter((result) => result.status === "fulfilled").length;
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((client) => client.postMessage({ type: "AUDIO_CACHE_STATUS", cached, total: uniqueUrls.length }));
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
          if (key !== CACHE_NAME && key !== AUDIO_CACHE_NAME) {
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

  const isAudioRequest = request.destination === "audio" || /\.(mp3|wav|ogg|m4a|aac|webm)(?:$|\?)/i.test(url.pathname + url.search);
  if (isAudioRequest) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request.url);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok || response.type === "opaque") await cache.put(request.url, response.clone());
          return response;
        } catch {
          return new Response("Áudio indisponível offline", { status: 503 });
        }
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Sempre atualiza o index.html no cache quando a rede funcionar
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put("/index.html", responseClone.clone());
              cache.put("/", responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log("[SW] Navigation offline, returning index.html from cache");
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
            if (shouldCacheStatic && isCacheableStaticResponse(request, response)) {
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
          if (shouldCacheStatic && isCacheableStaticResponse(request, response)) {
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
  if (event.data?.type === "CACHE_AUDIO_URLS" && Array.isArray(event.data.urls)) {
    event.waitUntil(syncAudioCache(event.data.urls));
    return;
  }

  if (event.data?.type === "CLEAR_CACHE") {
    console.log("[SW] Clearing cache on request from client");
    Promise.all([caches.delete(CACHE_NAME), caches.delete(AUDIO_CACHE_NAME)]).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});
