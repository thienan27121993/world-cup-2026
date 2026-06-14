/* WORLD CUP 2026 — Service Worker
   - PWA オフラインキャッシュ
   - 予約通知 (Notification Triggers / TimestampTrigger) の発火基盤
   - 本物の Web Push (サーバー → push イベント) の受け口
*/
const CACHE = 'wc26-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // ライブAPI(/live, /standings)はキャッシュせず常に取得
  if (/\/live|\/standings|api/.test(req.url)) return;
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).catch(() => caches.match('./index.html')))
  );
});

/* 本物のプッシュ通知：配信サーバーから push が届いたとき */
self.addEventListener('push', e => {
  let d = { title: '⚽ WORLD CUP 2026', body: '試合がまもなく始まります', url: './' };
  try { if (e.data) d = Object.assign(d, e.data.json()); } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body,
      icon: './icon.svg',
      badge: './icon.svg',
      tag: d.tag || 'wc26-push',
      data: { url: d.url || './' },
      vibrate: [80, 40, 80]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
