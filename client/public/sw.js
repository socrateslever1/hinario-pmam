const CACHE_VERSION = 'v1';
const CACHE_NAME = `hinario-pmam-${CACHE_VERSION}`;
const RUNTIME_CACHE = `hinario-pmam-runtime-${CACHE_VERSION}`;
const API_CACHE = `hinario-pmam-api-${CACHE_VERSION}`;

// Arquivos essenciais para cache offline
const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Padrões de URLs para cache
const CACHE_PATTERNS = {
  api: /^\/api\/trpc\/(hymn|drill|cfap|mission)/,
  assets: /\.(js|css|woff2|png|jpg|jpeg|webp|svg|ico|json|mp3|wav|m4a|mp4|ogg)$/,
  pages: /\/(hinos|drill|cfap|sobre|estudos|xerife)(\?|$)/,
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching essential assets');
      return cache.addAll(ESSENTIAL_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some essential assets:', err);
        // Continuar mesmo se falhar em alguns assets
        return Promise.resolve();
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

  // Ignorar requisições de outros domínios (exceto CDN confiáveis)
  const isSameDomain = url.origin === self.location.origin;
  const isTrustedCDN = url.hostname.includes('cloudfront') || 
                       url.hostname.includes('d2xsxph8kpxj0f') ||
                       url.hostname.includes('manus.space');
  
  if (!isSameDomain && !isTrustedCDN) {
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
    
    // Fallback para página offline
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/index.html').then((response) => {
        return response || new Response('Offline - Conteúdo não disponível', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/html' },
        });
      });
    }
    
    return new Response('Offline', {
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
    
    // Fallback para imagem placeholder se for imagem
    if (request.headers.get('accept')?.includes('image')) {
      return new Response(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        {
          headers: { 'Content-Type': 'image/png' },
        }
      );
    }
    
    return new Response('Offline - Recurso não disponível', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch((error) => {
      console.log('[SW] Fetch failed in SWR:', request.url);
      return cached || new Response('Offline', { status: 503 });
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
    Promise.all([
      caches.delete(RUNTIME_CACHE),
      caches.delete(API_CACHE),
    ]).then(() => {
      console.log('[SW] Caches cleared');
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

  if (event.data.type === 'PRECACHE_ASSETS') {
    const assets = event.data.assets || [];
    caches.open(RUNTIME_CACHE).then((cache) => {
      assets.forEach((url) => {
        cache.add(url).catch((err) => {
          console.warn('[SW] Failed to precache:', url, err);
        });
      });
    });
  }
});
