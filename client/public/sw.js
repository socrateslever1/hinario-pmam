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

  // Tudo: Network First (tenta rede, fallback para cache)
  event.respondWith(networkFirstStrategy(request));
});

// ─── Network First ────────────────────────────────────────────────────────
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      // Cachear resposta bem-sucedida
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
});
