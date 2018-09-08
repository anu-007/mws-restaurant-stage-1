const staticContentCache = 'restaurantStatic-v1';
const dynamicContentCache = 'restaurantDynamic-v1';

const cssFiles = [
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
  'css/styles.css'
];

const jsFiles = [
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
  'js/dbhelper.js',
  'js/main.js',
  'js/restaurant_info.js'
];

/**
 * Register a service worker for caching static and dynamic assets.
 */
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(staticContentCache)
      .then((cache) => {
        return cache.addAll([
          '/',
          ...cssFiles,
          ...jsFiles
        ]);
      }).catch(() => {
        console.log('Error caching static contents');
      })
  );
});

/**
 * Register a service worker for caching static and dynamic assets.
 */
self.addEventListener('activate', (e) => {
  if (self.clients && clients.claim) {
    clients.claim();
  }
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('contentCache') && cacheName !== staticContentCache;
        })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

/**
 * Returns response from cache or hit the network and cache new data
 */
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
    .then((response) => {
      if (response) {
        return response;
      }
      let fetchRequest = e.request.clone();
      return fetch(fetchRequest)
        .then((response) => {
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          let responseToCache = response.clone();
          caches.open(dynamicContentCache)
            .then((cache) => {
              cache.put(e.request, responseToCache);
            });
            return response;
        });
    })
    // .catch(() => {
    //   console.log('Not found in cache');
    // })
  );
});