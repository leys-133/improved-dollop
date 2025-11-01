self.addEventListener('install', e => {
  e.waitUntil(caches.open('rafiq-v1').then(cache => cache.addAll([
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.webmanifest'
  ])));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});