/**
 * Service Worker — Hinário PMAM
 * 
 * Estratégia simples:
 * - Tudo: Network First (tenta rede, fallback para cache)
 * - Resultado: online = sempre versão recente, offline = usa cache
 */

const CACHE_NAME = 'hinario-pmam-v4';
const OFFLINE_FALLBACK = '/index.html';
const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modo Offline</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 500px;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.1rem;
      line-height: 1.6;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    button {
      background: #d4a574;
      color: #1e3c72;
      border: none;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: opacity 0.3s;
    }
    button:hover {
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Modo Offline</h1>
    <p>Você está offline. Os dados em cache serão carregados quando a conexão for restaurada.</p>
    <button onclick="location.reload()">Tentar Novamente</button>
  </div>
</body>
</html>
`;

const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Instalacao
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando assets essenciais');
      return cache.addAll(ESSENTIAL_ASSETS).catch((err) => {
        console.warn('[SW] Falha ao cachear assets essenciais:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativacao
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker');
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

// Fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar nao-GET
  if (request.method !== 'GET') return;

  // Ignorar dominios externos (exceto CDN confiavel)
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

// Network First
async function networkFirstStrategy(request, cacheResponse = false) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      // Cachear TODAS as respostas bem-sucedidas
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Sem internet — tentar cache
    console.log('[SW] Erro ao fazer fetch, tentando cache:', request.url, error);
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Servindo do cache (offline):', request.url);
      return cached;
    }

    // Fallback para HTML (navegacao)
    if (request.headers.get('accept')?.includes('text/html')) {
      const fallback = await caches.match(OFFLINE_FALLBACK);
      if (fallback) {
        console.log('[SW] Servindo fallback HTML');
        return fallback;
      }
      console.log('[SW] Servindo pagina offline');
      return new Response(OFFLINE_PAGE, { 
        status: 200, 
        headers: { 'Content-Type': 'text/html; charset=utf-8' } 
      });
    }

    console.log('[SW] Sem cache para:', request.url);
    return new Response('Modo Offline - Dados nao disponiveis em cache', { 
      status: 503, 
      headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
    });
  }
}

// Mensagens
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache limpo');
    });
  }

  if (event.data?.type === 'CACHE_URLS' || event.data?.type === 'PRECACHE_ASSETS') {
    const urlsToCache = event.data?.urls || event.data?.assets || [];
    if (urlsToCache.length > 0) {
      console.log('[SW] Cacheando URLs solicitadas para offline:', urlsToCache.length, 'arquivos');
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return Promise.all(
            urlsToCache.map((url) => {
              return fetch(new Request(url, { mode: 'cors' }))
                .then((response) => {
                  if (response.ok) {
                    cache.put(url, response);
                    console.log('[SW] Cacheado:', url);
                  }
                })
                .catch((err) => {
                  console.warn('[SW] Falha ao cachear:', url, err);
                });
            })
          );
        })
      );
    }
  }
});
