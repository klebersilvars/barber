// Service Worker para CliqAgenda PWA
const CACHE_NAME = 'cliqagenda-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar cache se disponível, senão buscar na rede
        return response || fetch(event.request);
      }
    )
  );
});

// Atualizar cache quando nova versão estiver disponível
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 