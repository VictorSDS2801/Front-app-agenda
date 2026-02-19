const CACHE_NAME = "agenda-pwa-v1";

// Coloque aqui os arquivos que SEMPRE devem estar disponíveis
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/student.html",
  "/admin.html",
  "/css/style.css",
  "/js/auth.js",
  "/js/student.js",
  "/js/admin.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
});

// Estratégia: cache-first para arquivos do site.
// Para API (onrender.com): network-first (pra sempre pegar dado atualizado).
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API: tenta rede primeiro
  if (url.hostname.includes("onrender.com")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Site: tenta cache primeiro
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
