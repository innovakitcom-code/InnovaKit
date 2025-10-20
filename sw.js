// sw.js - NUEVO: ELIMINA CACHE EXISTENTE Y NO GUARDA NADA NUEVO
self.addEventListener('install', function(event) {
  // Saltar espera - activar inmediatamente
  self.skipWaiting();
  console.log('🚀 Nuevo Service Worker instalado');
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    // ELIMINAR TODOS LOS CACHES EXISTENTES
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          console.log('🗑️ Eliminando cache viejo:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      console.log('✅ Todos los caches antiguos eliminados');
      // Tomar control inmediato de todas las pestañas
      return self.clients.claim();
    })
  );
});

// ESTRATEGIA: NUNCA CACHEAR, SIEMPRE IR A INTERNET
self.addEventListener('fetch', function(event) {
  // Siempre buscar en la red, nunca en cache
  event.respondWith(fetch(event.request));
});
