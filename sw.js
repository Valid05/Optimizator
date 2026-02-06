// sw.js - Service Worker для PWA
const CACHE_NAME = "glass-cutter-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./GlassCutting.js",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching files");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("Service Worker: Installation complete");
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activated");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("Service Worker: Clearing old cache:", cache);
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => {
        console.log("Service Worker: Claiming clients");
        return self.clients.claim();
      }),
  );
});

self.addEventListener("fetch", (event) => {
  // Пропускаем запросы к аналитике и внешним ресурсам
  if (
    event.request.url.includes("google-analytics") ||
    event.request.url.includes("googletagmanager") ||
    event.request.url.startsWith("chrome-extension://")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("Service Worker: Serving from cache:", event.request.url);
        return response;
      }

      console.log("Service Worker: Fetching from network:", event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          // Кэшируем только успешные ответы
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error("Service Worker: Fetch failed:", error);
          // Можно вернуть fallback страницу
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    }),
  );
});

// Обработка сообщений от клиента
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
