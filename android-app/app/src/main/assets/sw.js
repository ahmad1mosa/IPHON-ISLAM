// Service Worker لتطبيق GS إسلام للعمل في وضع عدم الاتصال (Offline-First)
const CACHE_NAME = 'gs-islam-v2.6.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/prayer.css',
  './css/tasbeeh.css',
  './css/quran.css',
  './css/adhkar.css',
  './js/i18n.js',
  './js/adhkar-data.js',
  './js/surah-data.js',
  './js/prayer-calc.js',
  './js/tasbeeh.js',
  './js/quran.js',
  './js/adhkar.js',
  './js/app.js',
  './audio/makkah.mp3',
  './audio/madinah.mp3',
  './audio/alaqsa.mp3',
  './audio/egypt.mp3',
  './audio/alafasy.mp3',
  './icons/icon-512.png',
  './icons/gs-logo.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
