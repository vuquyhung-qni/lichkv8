const CACHE_NAME = 'lichkv8-v131-default-calendar-remember-login';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './modules/hkg.js',
  './modules/hkg.css',
  './modules/duty.js',
  './modules/duty.css',
  './Mau_import_lich_truc_ban_HQKV8_v127.xlsx'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => null))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME && /^lct-|lichkv8|hqkv8/i.test(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (/script\.google\.com|script\.googleusercontent\.com|googleapis\.com|googleusercontent\.com/.test(url.hostname)) return;

  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => null);
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
