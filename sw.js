const CACHE_NAME = 'laser-control-v1.0.0';

// Instalación - SOLO cachear lo esencial
self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache abierto');
        // Cachear solo los archivos CRÍTICOS que SABEMOS que existen
        return cache.addAll([
          '/',
          '/index.html'
        ]).catch(error => {
          console.log('⚠️ Algunos recursos no se pudieron cachear:', error);
        });
      })
  );
});

// Activación
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - Estrategia más robusta
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve cache si existe, sino hace fetch
        return response || fetch(event.request);
      })
      .catch(error => {
        console.log('❌ Error en fetch:', error);
        // Puedes retornar una página offline aquí
      })
  );
});
