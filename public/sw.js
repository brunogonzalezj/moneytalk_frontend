const CACHE_NAME = 'moneytalk-cache-v2';
const RUNTIME_CACHE = 'moneytalk-runtime-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch with caching
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Parse URL safely
  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    // Invalid URL, skip
    return;
  }

  // Skip cross-origin requests and unsupported schemes
  if (url.origin !== location.origin || 
      url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' ||
      url.protocol === 'safari-extension:') {
    return;
  }

  // Skip WebSocket requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Solo interceptar requests GET para evitar problemas con API calls
        if (request.method !== 'GET') {
          return fetch(request);
        }

        return fetch(request)
          .catch(error => {
            console.warn('Service Worker: Fetch failed for', request.url, error);
            // Para errores de red, intentar devolver una página de error básica
            if (request.destination === 'document') {
              return caches.match('/offline.html') || new Response('Network error', { 
                status: 503, 
                statusText: 'Service Unavailable' 
              });
            }
            throw error;
          })
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200) {
              return response;
            }

            // Only cache HTTP/HTTPS responses
            if (!request.url.startsWith('http')) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache).catch(err => {
                  console.warn('Cache put failed:', err.message);
                });
              })
              .catch(error => {
                console.warn('Service Worker: Cache open failed for', request.url, error);
              });

            return response;
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de MoneyTalk',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ir a MoneyTalk',
        icon: '/icon.svg'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('MoneyTalk', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Notification click received.');

  event.notification.close();

  if (event.action === 'explore') {
    // Open the app to the main page
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default behavior - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event.notification);
});