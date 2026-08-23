const CACHE_NAME = "hinario-pmam-cache-v9";
const AUDIO_CACHE_NAME = "hinario-pmam-audio-v2";
const AUDIO_DOWNLOAD_CONCURRENCY = 3;
let audioSyncQueue = Promise.resolve();
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

const PUBLIC_CATALOG_PROCEDURES = new Set([
  "blog.list",
  "buglePanel.list",
  "hymns.list",
  "ordemUnidaAudio.list",
  "ordemUnidaAudio.listVoiceProfiles",
]);

const STATIC_CACHE_PATHS = [
  "/assets/",
  "/logo/",
  "/documents/",
  "/study/",
  "/history/",
  "/uploads/",
  "/audio/",
];

function urlLooksLikeScriptOrStyle(value) {
  return /\.(?:m?js|css)(?:$|\?)/i.test(value);
}

function isCacheableStaticResponse(request, response) {
  if (!response || response.status !== 200) return false;

  const contentType = response.headers.get("content-type") || "";

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

function isPublicCatalogRequest(url) {
  if (!url.pathname.startsWith("/api/trpc/")) return false;
  const procedures = decodeURIComponent(url.pathname.slice("/api/trpc/".length)).split(",");
  return procedures.length > 0 && procedures.every((procedure) => PUBLIC_CATALOG_PROCEDURES.has(procedure));
}

const AUDIO_FILE_PATTERN = /\.(mp3|wav|ogg|m4a|aac|flac|webm)(?:$|\?)/i;

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

function normalizeAudioUrl(url) {
  if (typeof url !== "string" || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:")) return null;
  try {
    return new URL(trimmed, self.location.origin).href;
  } catch {
    return null;
  }
}

async function syncAudioCache(urls) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const normalizedUrls = urls
    .map(normalizeAudioUrl)
    .filter((url) => Boolean(url));
  const uniqueUrls = [...new Set(normalizedUrls)];
  const expected = new Set(uniqueUrls);

  const results = new Array(uniqueUrls.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(AUDIO_DOWNLOAD_CONCURRENCY, uniqueUrls.length) },
    async () => {
      while (nextIndex < uniqueUrls.length) {
        const index = nextIndex;
        nextIndex += 1;
        const url = uniqueUrls[index];
        try {
          // Check if already in cache first to save bandwidth
          const existing = await cache.match(url);
          if (existing) {
            results[index] = { status: "fulfilled" };
            continue;
          }

          const parsed = new URL(url);
          const isCrossOrigin = parsed.origin !== self.location.origin;
          const request = new Request(url, {
            mode: isCrossOrigin ? "no-cors" : "same-origin",
            credentials: isCrossOrigin ? "omit" : "include",
          });
          const response = await fetch(request);
          if (!response.ok && response.type !== "opaque") throw new Error(`${url}: ${response.status}`);
          await cache.put(url, response.clone());
          results[index] = { status: "fulfilled" };
        } catch (reason) {
          results[index] = { status: "rejected", reason };
        }
      }
    },
  );
  await Promise.all(workers);

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

  const audioRequest = request.destination === "audio" || AUDIO_FILE_PATTERN.test(url.pathname + url.search);
  if (audioRequest) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        // 1. Cache-First: Play immediately from cache with 0ms latency (even when internet is slow or offline)
        const cached = await cache.match(request.url, { ignoreSearch: true });
        if (cached) {
          return cached;
        }

        // 2. Network fallback: Fetch and cache for future instant offline playback
        try {
          const parsed = new URL(request.url);
          const isCrossOrigin = parsed.origin !== self.location.origin;
          const req = new Request(request.url, {
            mode: isCrossOrigin ? "no-cors" : "same-origin",
            credentials: isCrossOrigin ? "omit" : "include",
          });
          const response = await fetch(req);
          if (response.ok || response.type === "opaque") {
            cache.put(request.url, response.clone());
          }
          return response;
        } catch {
          return new Response("Áudio indisponível offline", { status: 503 });
        }
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (url.pathname === "/index.html" && url.searchParams.has("version-check")) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
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
      fetch(request, { credentials: "include", cache: "no-store" }).catch(() => {
        console.log("[SW] Auth/session offline, returning error");
        return new Response(
          JSON.stringify({ error: "Offline - authentication unavailable" }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
    return;
  }

  if (isPublicCatalogRequest(url)) {
    const cachePromise = caches.open(CACHE_NAME);
    const cachedResponsePromise = cachePromise.then((cache) => cache.match(request));
    const refreshPromise = cachePromise.then((cache) =>
      fetch(request).then((response) => {
        if (response.status === 200) {
          return cache.put(request, response.clone()).then(() => response);
        }
        return response;
      }),
    );

    event.waitUntil(refreshPromise.then(() => undefined).catch(() => undefined));
    event.respondWith(
      cachedResponsePromise.then((cached) =>
        cached || refreshPromise.catch(() =>
          new Response(
            JSON.stringify({ error: "Offline - catalogo indisponivel" }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          ),
        ),
      ),
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
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cachedRes => {
            if (cachedRes) return cachedRes;
            return new Response(
              JSON.stringify({ error: "Offline - API indisponível" }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          });
        }),
    );
    return;
  }

  const isStaticCache = STATIC_CACHE_PATHS.some((path) => url.pathname.startsWith(path));
  if (isStaticCache) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (isCacheableStaticResponse(request, response)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      }),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheableStaticResponse(request, response)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_AUDIO_URLS") {
    const urls = Array.isArray(event.data.urls) ? event.data.urls : [];
    audioSyncQueue = audioSyncQueue
      .catch(() => undefined)
      .then(() => syncAudioCache(urls));
    event.waitUntil(audioSyncQueue.catch((error) => console.warn("[SW] Audio cache sync failed:", error)));
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== AUDIO_CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
    );
  }
});
