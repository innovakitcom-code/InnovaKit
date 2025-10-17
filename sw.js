// sw.js - Service Worker para cache
const CACHE_NAME = 'innovakit-v2.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/productos.json',
  '/png/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});