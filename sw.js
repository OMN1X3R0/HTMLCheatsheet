// HTML Cheat Sheet Service Worker
const CACHE_VERSION = 'v2.0.0';
const STATIC_CACHE = `html-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `html-dynamic-${CACHE_VERSION}`;

const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app.js',
  // Add your icon paths here
  '/icon-300x300.png',
  '/icon-512x512.png'
];

// Clean installation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Clean installation started');
  
  self.skipWaiting(); // Activate immediately
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch(console.error)
  );
});

// Clean activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Simple fetch strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external URLs
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        // Return cached version or fetch new
        return cached || fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Fallback for HTML requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});


