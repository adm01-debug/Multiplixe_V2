// 🔔 SERVICE WORKER - PUSH NOTIFICATIONS
// Arquivo: public/sw.js
// Deploy: Copiar para /public/ de cada sistema

const CACHE_NAME = 'notifications-v1';
const NOTIFICATION_TAG = 'notification-update';

// Install - Cache recursos estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/icon-192.png',
        '/icon-512.png',
        '/badge-72.png',
        '/sounds/notification.mp3',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate - Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push - Receber notificação
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  if (!event.data) {
    console.warn('[SW] Push event without data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Nova Notificação',
      message: event.data.text(),
      priority: 1,
    };
  }

  const options = {
    body: data.message,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag || NOTIFICATION_TAG,
    data: {
      url: data.action_url || '/',
      notification_id: data.notification_id,
      timestamp: Date.now(),
    },
    requireInteraction: data.priority >= 2, // Urgente/Alta fica na tela
    silent: data.priority === 0, // Sucesso sem som
    vibrate: data.priority >= 2 ? [200, 100, 200] : [100],
    actions: [
      {
        action: 'open',
        title: data.action_label || 'Ver',
        icon: '/icons/open.png',
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/close.png',
      },
    ],
  };

  // Reproduzir som se prioridade alta
  if (data.priority >= 2) {
    event.waitUntil(playNotificationSound());
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click - Ação ao clicar
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  const notificationId = event.notification.data?.notification_id;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem janela aberta, focar nela
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Senão, abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .then((client) => {
        // Marcar notificação como lida
        if (notificationId && client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notificationId,
          });
        }
      })
  );
});

// Notification Close - Rastrear fechamento
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
  
  const notificationId = event.notification.data?.notification_id;
  
  if (notificationId) {
    event.waitUntil(
      fetch('/api/notifications/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: notificationId,
          action: 'closed',
          timestamp: Date.now(),
        }),
      }).catch(() => {
        // Silenciar erros de analytics
      })
    );
  }
});

// Background Sync - Sincronizar quando voltar online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Helper: Reproduzir som
async function playNotificationSound() {
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'PLAY_SOUND',
        sound: '/sounds/notification.mp3',
      });
    }
  } catch (error) {
    console.error('[SW] Error playing sound:', error);
  }
}

// Helper: Sincronizar notificações offline
async function syncNotifications() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    const pendingNotifications = requests
      .filter(req => req.url.includes('/api/notifications/send'))
      .map(req => cache.match(req));
    
    const responses = await Promise.all(pendingNotifications);
    
    for (const response of responses) {
      if (response) {
        const data = await response.json();
        // Reenviar notificação
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
    }
    
    console.log('[SW] Synced', responses.length, 'notifications');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Message - Comunicação com página
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service Worker loaded');
