/**
 * Service Worker — Hinário PMAM
 * 
 * Estratégia simples:
 * - Tudo: Network First (tenta rede, fallback para cache)
 * - Resultado: online = sempre versão recente, offline = usa cache
 */

const CACHE_NAME = 'hinario-pmam-v4';
const OFFLINE_FALLBACK = '/index.html';

const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ─── Instalação ──────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ESSENTIAL_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache essential assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// ─── Ativação ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('hinario-pmam') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar não-GET
  if (request.method !== 'GET') return;

  // Ignorar domínios externos (exceto CDN confiável)
  const isSameOrigin = url.origin === self.location.origin;
  const isTrustedCDN = url.hostname.includes('cloudfront') ||
                       url.hostname.includes('d2xsxph8kpxj0f') ||
                       url.hostname.includes('manus.space');
  if (!isSameOrigin && !isTrustedCDN) return;

  // API tRPC: cachear para offline
  if (url.pathname.includes('/api/trpc/')) {
    event.respondWith(networkFirstStrategy(request, true));
    return;
  }

  // Tudo mais: Network First
  event.respondWith(networkFirstStrategy(request));
});

// ─── Network First ────────────────────────────────────────────────────────
async function networkFirstStrategy(request, cacheResponse = false) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      // Cachear TODAS as respostas bem-sucedidas
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Sem internet — tentar cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cached;
    }

    // Fallback para HTML (navegação)
    if (request.headers.get('accept')?.includes('text/html')) {
      const fallback = await caches.match(OFFLINE_FALLBACK);
      if (fallback) {
        console.log('[SW] Serving fallback HTML');
        return fallback;
      }
    }

    console.log('[SW] No cache for:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// ─── Mensagens ────────────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }

  if (event.data?.type === 'CACHE_URLS' || event.data?.type === 'PRECACHE_ASSETS') {
    const urlsToCache = event.data?.urls || event.data?.assets || [];
    if (urlsToCache.length > 0) {
      console.log('[SW] Caching requested URLs for offline use:', urlsToCache.length, 'files');
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return Promise.all(
            urlsToCache.map((url) => {
              return fetch(new Request(url, { mode: 'cors' }))
                .then((response) => {
                  if (response.ok || response.type === 'opaque') {
                    return cache.put(url, response);
                  }
                })
                .catch((err) => console.warn('[SW] Failed to cache requested URL:', url, err));
            })
          );
        })
      );
      // Optional: Post message back to client saying it's done
      event.source?.postMessage({ type: 'CACHE_URLS_DONE', urls: urlsToCache });
    }
  }
});

