// HTML Cheat Sheet Service Worker - Minimal Icons
const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `html-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `html-dynamic-${CACHE_VERSION}`;

// Only the files we actually have
const STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './app.js',
  './icon-300x300.png',
  './icon-512x512.png',
  './desktop.png',
  './mobile.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing with minimal icons...');
  
  self.skipWaiting(); // Activate immediately
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching available files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => console.log('All available files cached successfully'))
      .catch((error) => console.error('Cache failed:', error))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker ready to handle requests');
      return self.clients.claim();
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((fetchResponse) => {
            // Only cache successful responses
            if (fetchResponse && fetchResponse.status === 200) {
              const responseToCache = fetchResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return fetchResponse;
          })
          .catch((error) => {
            console.log('Fetch failed:', event.request.url);
            
            // Fallback for HTML requests
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // Fallback for images - use our available icons
            if (event.request.destination === 'image') {
              return caches.match('./icon-300x300.png');
            }
            
            // Generic fallback
            return new Response('Offline content not available', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'HTML Cheat Sheet is ready for offline use',
    icon: './icon-300x300.png',
    badge: './icon-300x300.png',
    tag: 'html-cheat-sheet-update'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'HTML Cheat Sheet', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('./') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});



