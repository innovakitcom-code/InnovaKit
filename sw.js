// sw.js - VERSIÓN OPTIMIZADA (combina lo mejor)
const CACHE_NAME = 'innovakit-cache-v4.0';
const OFFLINE_URL = '/offline.html';

// Recursos críticos para cache inmediato
const PRECACHE_URLS = [
  '/',
  '/index.html', 
  '/productos.json',
  '/png/favicon.png',
  '/png/Icono.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;500;700&display=swap'
];

self.addEventListener('install', event => {
  console.log('🔧 Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cacheando recursos críticos');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting()) // ⬅️ ACTUALIZACIÓN INMEDIATA
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Eliminando cache viejo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // ⬅️ CONTROL INMEDIATO
  );
});

self.addEventListener('fetch', event => {
  // Solo cachear solicitudes GET de nuestro origen
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 1. Primero intentar cache
        if (cachedResponse) {
          console.log(`📂 Sirviendo desde cache: ${event.request.url}`);
          return cachedResponse;
        }

        // 2. Si no está en cache, ir a la red
        return fetch(event.request.clone())
          .then(response => {
            // Solo cachear respuestas exitosas
            if (!response || response.status !== 200) {
              return response;
            }

            // Cachear dinámicamente
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('❌ Error de red:', error);
            // Si es HTML y estamos offline, mostrar página offline
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            return new Response('Sin conexión', { 
              status: 408, 
              headers: { 'Content-Type': 'text/plain' } 
            });
          });
      })
  );
});