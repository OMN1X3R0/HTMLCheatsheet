// Service Worker for HTML Cheat Sheet PWA
const CACHE_NAME = 'html-cheat-sheet-v1.0.0';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// Files to cache during installation
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-32x32.png',
  '/icons/icon-64x64.png',
  '/icons/icon-128x128.png',
  '/icons/icon-192x192.png',
  '/icons/icon-256x256.png',
  '/icons/icon-512x512.png',
  '/styles/main.css',
  '/scripts/app.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installation completed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((fetchResponse) => {
            // Check if valid response
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            // Clone the response
            const responseToCache = fetchResponse.clone();

            // Add to dynamic cache
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('Service Worker: Caching new resource', event.request.url);
              });

            return fetchResponse;
          })
          .catch((error) => {
            console.log('Service Worker: Fetch failed, serving fallback', error);
            
            // If it's an HTML request, serve the main page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
            
            // For images, serve a fallback image
            if (event.request.headers.get('accept').includes('image')) {
              return caches.match('/icons/icon-192x192.png');
            }
          });
      })
  );
});

// Background Sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

// Periodic Sync for updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-update') {
    console.log('Service Worker: Periodic sync for content updates');
    event.waitUntil(checkForUpdates());
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Perform any background sync tasks here
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Check for updates function
async function checkForUpdates() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const requests = STATIC_FILES.map(url => new Request(url));
    
    const responses = await Promise.all(
      requests.map(request => 
        fetch(request).catch(() => null)
      )
    );
    
    // Update cache with new versions
    await Promise.all(
      responses.map((response, index) => {
        if (response && response.ok) {
          return cache.put(requests[index], response);
        }
      })
    );
    
    console.log('Content update check completed');
  } catch (error) {
    console.error('Update check failed:', error);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New content available in HTML Cheat Sheet',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-32x32.png',
    tag: 'html-cheat-sheet-update',
    renotify: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'HTML Cheat Sheet', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
