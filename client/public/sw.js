const CACHE_VERSION = 'v1';
const CACHE_NAME = `hinario-pmam-${CACHE_VERSION}`;
const RUNTIME_CACHE = `hinario-pmam-runtime-${CACHE_VERSION}`;
const API_CACHE = `hinario-pmam-api-${CACHE_VERSION}`;

// Arquivos essenciais para cache offline
const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
];

// Padrões de URLs para cache
const CACHE_PATTERNS = {
  api: /^\/api\/trpc\/(hymn|drill|cfap)/,
  assets: /\.(js|css|woff2|png|jpg|jpeg|webp|svg|ico)$/,
  pages: /\/(hinos|drill|cfap|sobre|estudos)(\?|$)/,
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching essential assets');
      return cache.addAll(ESSENTIAL_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== RUNTIME_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de cache: Network First para API, Cache First para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de outros domínios (exceto CDN)
  if (url.origin !== self.location.origin && !url.hostname.includes('cloudfront')) {
    return;
  }

  // API: Network First com fallback para cache
  if (CACHE_PATTERNS.api.test(url.pathname)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Assets: Cache First com fallback para network
  if (CACHE_PATTERNS.assets.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Páginas: Network First com fallback para cache
  if (CACHE_PATTERNS.pages.test(url.pathname)) {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Padrão: Stale While Revalidate
  event.respondWith(staleWhileRevalidateStrategy(request, RUNTIME_CACHE));
});

// Network First Strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, using cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - Conteúdo não disponível', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Cache First Strategy
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    return new Response('Offline - Recurso não disponível', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(cacheName);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || fetchPromise;
}

// Background Sync para sincronizar dados quando voltar online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Sincronizar dados em cache com o servidor
    console.log('[SW] Syncing data with server');
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Message Handler para comunicação com a página
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      console.log('[SW] Runtime cache cleared');
    });
  }

  if (event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    caches.open(RUNTIME_CACHE).then((cache) => {
      cache.addAll(urls).catch((err) => {
        console.warn('[SW] Failed to cache URLs:', err);
      });
    });
  }
});
