const CACHE_NAME = 'padelsanpedro-pwa-v2';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [
  OFFLINE_URL,
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Las páginas dinámicas nunca se cachean agresivamente: siempre van a la red
  // y si no hay conexión muestran la pantalla offline cuidada.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Next.js genera assets inmutables con hash en /_next/static/
  const isImmutableAsset = url.pathname.startsWith('/_next/static/') || PRECACHE.includes(url.pathname);
  if (!isImmutableAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    }))
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'Padel San Pedro',
      body: event.data.text(),
      url: '/',
    };
  }

  const title = data.title || 'Padel San Pedro';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    vibrate: [150, 60, 150, 60, 250],
    tag: data.tag || 'psp-notification',
    renotify: true,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Ver en App' }
    ]
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Actualizar App Badging si está disponible
      (async () => {
        if ('setAppBadge' in self.navigator) {
          try {
            await self.navigator.setAppBadge(data.badgeCount || 1);
          } catch (e) {
            // Ignorar si el navegador no lo soporta en este contexto
          }
        }
      })()
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Limpiar el badge al abrir
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch(() => {});
  }

  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
