const CACHE_VERSION = "v4";
const CACHE_PREFIX = "servicehub-";
const CACHES = Object.freeze({
  static: `${CACHE_PREFIX}static-${CACHE_VERSION}`,
  services: `${CACHE_PREFIX}services-${CACHE_VERSION}`,
  suppliers: `${CACHE_PREFIX}suppliers-${CACHE_VERSION}`,
  workshops: `${CACHE_PREFIX}workshops-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}images-${CACHE_VERSION}`,
});
const CACHE_NAMES = Object.values(CACHES);

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isDevelopmentOrigin(url) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

function isPublicApi(request, url) {
  if (request.method !== "GET" || !isSameOrigin(request) || isDevelopmentOrigin(url) || !url.pathname.startsWith("/api/")) return false;
  return url.pathname === "/api/services" ||
    /^\/api\/services\/[a-f0-9]{24}$/.test(url.pathname) ||
    url.pathname === "/api/suppliers" ||
    /^\/api\/suppliers\/[a-f0-9]{24}$/.test(url.pathname) ||
    /^\/api\/suppliers\/profile\/[a-f0-9]{24}$/.test(url.pathname) ||
    url.pathname === "/api/workshops" ||
    /^\/api\/workshops\/[a-f0-9]{24}$/.test(url.pathname);
}

function isPublicPage(request, url) {
  return request.method === "GET" && request.mode === "navigate" && isSameOrigin(request) && !isDevelopmentOrigin(url) &&
    (/^\/services\/[a-f0-9]{24}$/.test(url.pathname) ||
      /^\/suppliers\/[a-f0-9]{24}$/.test(url.pathname) ||
      /^\/workshops\/[a-f0-9]{24}$/.test(url.pathname));
}

function isPublicImage(request, url) {
  return request.method === "GET" && request.destination === "image" && isSameOrigin(request) && !isDevelopmentOrigin(url) &&
    (/^\/service-images\//.test(url.pathname) ||
      /^\/supplier-images\//.test(url.pathname) ||
      /^\/workshop-images\//.test(url.pathname));
}

function isPublicStatic(request, url) {
  return request.method === "GET" && isSameOrigin(request) && !isDevelopmentOrigin(url) &&
    (request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "font" ||
      url.pathname.startsWith("/_next/static/") ||
      url.pathname === "/manifest.webmanifest" ||
      url.pathname.startsWith("/icons/"));
}

function staleResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("X-ServiceHub-Cache", "stale");
  return response.clone().blob().then((body) => new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return staleResponse(cached);
    if (request.destination === "document") return new Response("ServiceHub is offline. Reconnect to load this page.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    return new Response(JSON.stringify({ error: "Offline and no cached public response is available." }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("", { status: 503 });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && !CACHE_NAMES.includes(key))
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (isPublicApi(request, url)) {
    const cacheName = url.pathname.startsWith("/api/services") ? CACHES.services :
      url.pathname.startsWith("/api/suppliers") ? CACHES.suppliers : CACHES.workshops;
    event.respondWith(networkFirst(request, cacheName));
    return;
  }
  if (isPublicPage(request, url)) {
    const cacheName = url.pathname.startsWith("/services/") ? CACHES.services :
      url.pathname.startsWith("/suppliers/") ? CACHES.suppliers : CACHES.workshops;
    event.respondWith(networkFirst(request, cacheName));
    return;
  }
  if (isPublicImage(request, url)) {
    event.respondWith(cacheFirst(request, CACHES.images));
    return;
  }
  if (isPublicStatic(request, url)) event.respondWith(cacheFirst(request, CACHES.static));
});
