// sw.js - Service Worker DESHABILITADO para desarrollo
const CACHE_NAME = 'laser-control-dev-' + Date.now();

self.addEventListener('install', event => {
  console.log('🔧 Service Worker instalado (sin cache)');
  self.skipWaiting(); // Activar inmediatamente
});

self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activado (sin cache)');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // NO cachear nada - siempre ir a la red
  event.respondWith(fetch(event.request));
});
