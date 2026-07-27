const CACHE_VERSION = "apostolic-ia-v0.28.0";
const APP_SHELL = [
  "/offline",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg"
];

function isPrivateRequest(request, url) {
  return (
    request.headers.has("authorization") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/")
  );
}

function isPublicStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    APP_SHELL.includes(url.pathname)
  );
}

function canStore(response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  return (
    response.ok &&
    response.type === "basic" &&
    !/private|no-store/i.test(cacheControl)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("apostolic-ia-") && key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivateRequest(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(async () => (await caches.match("/offline")) || Response.error())
    );
    return;
  }

  if (!isPublicStatic(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!canStore(response)) return response;
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
