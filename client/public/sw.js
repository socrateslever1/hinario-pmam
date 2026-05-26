/**
 * Service Worker — Hinário PMAM
 *
 * Estratégia de cache:
 * - MP3/Áudio: Cache First — offline priority, atualiza em background
 * - Imagens/Fontes: Cache First — estáticas, raramente mudam
 * - JS/CSS: Network First com cache — versão recente online, offline usa cache
 * - HTML/API: Network First — sempre tenta rede primeiro
 *
 * Pré-cache: ao carregar a página, automaticamente cachea todos os assets
 * para garantir que a próxima visita offline funcione completamente.
 */

const CACHE_NAME = 'hinario-pmam-v3';
const OFFLINE_FALLBACK = '/index.html';

// Arquivos essenciais para funcionamento offline
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
  // Ativar imediatamente sem esperar páginas antigas fecharem
  self.skipWaiting();
});

// ─── Ativação ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating — clearing old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('hinario-pmam') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
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

  // MP3 e áudio: Cache First (offline priority)
  if (/\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|$)/.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Imagens e fontes: Cache First (estáticas, raramente mudam)
  if (/\.(png|jpg|jpeg|webp|svg|ico|woff2|woff|ttf)(\?|$)/.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // JS e CSS: Network First com cache para offline
  if (/\.(js|css)(\?|$)/.test(url.pathname)) {
    event.respondWith(networkFirstStrategy(request, true));
    return;
  }

  // HTML e API: Network First (sempre tenta rede)
  event.respondWith(networkFirstStrategy(request, false));
});

// ─── Network First ────────────────────────────────────────────────────────
async function networkFirstStrategy(request, shouldCache = true) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      if (shouldCache) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch {
    // Sem internet — tentar cache
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cached;
    }

    // Fallback HTML para navegação
    if (request.headers.get('accept')?.includes('text/html')) {
      const fallback = await caches.match(OFFLINE_FALLBACK);
      if (fallback) {
        console.log('[SW] Serving fallback HTML (offline)');
        return fallback;
      }
    }

    console.log('[SW] No cache available for:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// ─── Cache First ──────────────────────────────────────────────────────────
async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Atualizar cache em background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
      }
    }).catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    console.log('[SW] Offline and no cache for:', request.url);
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

  if (event.data?.type === 'PRECACHE_ASSETS') {
    const assets = event.data.assets || [];
    console.log('[SW] Pre-caching', assets.length, 'assets for offline');
    caches.open(CACHE_NAME).then((cache) => {
      assets.forEach(url => {
        fetch(url).then(response => {
          if (response.ok) {
            cache.put(url, response);
            console.log('[SW] Cached:', url);
          }
        }).catch(err => console.log('[SW] Failed to cache:', url, err));
      });
    });
  }
});
