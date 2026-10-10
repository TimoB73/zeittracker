// Service Worker: macht die App offline nutzbar.
// Strategie: zuerst Netzwerk (damit Updates sofort ankommen), ohne Netz aus dem Cache.

const CACHE = 'zeittracker-v1';
const DATEIEN = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', ereignis => {
  ereignis.waitUntil(caches.open(CACHE).then(cache => cache.addAll(DATEIEN)));
  self.skipWaiting();
});

self.addEventListener('activate', ereignis => {
  ereignis.waitUntil(
    caches.keys()
      .then(namen => Promise.all(namen.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ereignis => {
  if (ereignis.request.method !== 'GET') return;
  ereignis.respondWith(
    fetch(ereignis.request)
      .then(antwort => {
        const kopie = antwort.clone();
        caches.open(CACHE).then(cache => cache.put(ereignis.request, kopie));
        return antwort;
      })
      .catch(() => caches.match(ereignis.request, { ignoreSearch: true }))
  );
});
