const CACHE_NAME = 'multiplixe-v2';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/catalogo',
  '/ranking',
  '/playbooks',
  '/biblioteca-videos',
  '/onboarding',
  '/avaliacoes',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase') || url.pathname.includes('functions')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((response) => {
        if (response) return response;
        if (event.request.mode === 'navigate') return caches.match('/');
        return new Response('Offline', { status: 503 });
      }))
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {
    title: 'MULTIPLIXE',
    body: 'Você tem uma nova notificação!',
    icon: '/icons/icon-192x192.png',
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: data.actions || [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') event.waitUntil(syncProgress());
});

async function syncProgress() {
  const cache = await caches.open('pending-updates');
  const requests = await cache.keys();
  for (const request of requests) {
    try {
      const response = await fetch(request.clone());
      if (response.ok) await cache.delete(request);
    } catch {
      // network unavailable, will retry on next sync
    }
  }
}
