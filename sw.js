// ================================================================
// UNTHA SAT — Service Worker
// Estrategia: Network First con caída a caché para soporte offline
// ================================================================

const CACHE_NAME    = "untha-sat-v1";
const ASSETS_CACHE  = [
  "index.html",
  "manifest.json"
];

// ── Instalación: pre-cachear los archivos estáticos ──
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_CACHE))
      .then(() => self.skipWaiting()) // Activar inmediatamente sin esperar
  );
});

// ── Activación: limpiar cachés antiguas ──
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: Network First (intenta red, cae a caché si no hay conexión) ──
self.addEventListener("fetch", event => {
  // No interceptar llamadas POST a la API (deben ir siempre a la red)
  if (event.request.method === "POST") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, guardarla en caché para uso offline
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin conexión: servir desde caché
        return caches.match(event.request);
      })
  );
});
