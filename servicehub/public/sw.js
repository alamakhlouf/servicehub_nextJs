const CACHE_VERSION = "v8";
const CACHE_PREFIX = "servicehub-";
const CACHES = Object.freeze({
  static: `${CACHE_PREFIX}static-${CACHE_VERSION}`,
  services: `${CACHE_PREFIX}services-${CACHE_VERSION}`,
  suppliers: `${CACHE_PREFIX}suppliers-${CACHE_VERSION}`,
  workshops: `${CACHE_PREFIX}workshops-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}images-${CACHE_VERSION}`,
  profiles: `${CACHE_PREFIX}profiles-${CACHE_VERSION}`,
  offline: `${CACHE_PREFIX}offline-${CACHE_VERSION}`,
});
const CACHE_NAMES = Object.values(CACHES);

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isPublicApi(request, url) {
  if (request.method !== "GET" || !isSameOrigin(request) || !url.pathname.startsWith("/api/")) return false;
  return url.pathname === "/api/services" ||
    /^\/api\/services\/[a-f0-9]{24}$/.test(url.pathname) ||
    url.pathname === "/api/suppliers" ||
    /^\/api\/suppliers\/[a-f0-9]{24}$/.test(url.pathname) ||
    /^\/api\/suppliers\/profile\/[a-f0-9]{24}$/.test(url.pathname) ||
    url.pathname === "/api/workshops" ||
    url.pathname === "/api/workshops/categories" ||
    /^\/api\/workshops\/[a-f0-9]{24}$/.test(url.pathname);
}

async function isCacheablePublicApi(request, response) {
  const path = new URL(request.url).pathname;
  if (/^\/api\/services\/[a-f0-9]{24}$/.test(path)) {
    const data = await response.clone().json().catch(() => null);
    return data?.service?.status === "PUBLISHED";
  }
  if (/^\/api\/suppliers\/[a-f0-9]{24}$/.test(path)) {
    const data = await response.clone().json().catch(() => null);
    return data?.listing?.available === true && data.listing.stock > 0;
  }
  if (/^\/api\/workshops\/[a-f0-9]{24}$/.test(path)) {
    const data = await response.clone().json().catch(() => null);
    return data?.workshop?.status === "PUBLISHED";
  }
  return response.ok;
}

function profileCacheUserId(request, url) {
  if (request.method !== "GET" || !isSameOrigin(request) || url.pathname !== "/api/profile") return null;
  const userId = url.searchParams.get("cacheUserId");
  return userId && /^[a-f\d]{24}$/i.test(userId) ? userId : null;
}

function isPublicPage(request, url) {
  return request.method === "GET" && request.mode === "navigate" && isSameOrigin(request) &&
    (/^\/services\/[a-f0-9]{24}$/.test(url.pathname) ||
      /^\/suppliers\/[a-f0-9]{24}$/.test(url.pathname) ||
      /^\/workshops\/[a-f0-9]{24}$/.test(url.pathname));
}

function isNavigation(request, url) {
  return request.method === "GET" && request.mode === "navigate" && isSameOrigin(request) &&
    !url.pathname.startsWith("/_next/");
}

function isPublicImage(request, url) {
  return request.method === "GET" && request.destination === "image" && isSameOrigin(request) &&
    (/^\/service-images\//.test(url.pathname) ||
      /^\/supplier-images\//.test(url.pathname) ||
      /^\/workshop-images\//.test(url.pathname));
}

function isPublicStatic(request, url) {
  const isLocalOrigin = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return request.method === "GET" && isSameOrigin(request) && !isLocalOrigin &&
    (request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "font" ||
      url.pathname.startsWith("/_next/static/") ||
      url.pathname === "/manifest.webmanifest" ||
      url.pathname.startsWith("/icons/"));
}

async function profileNetworkFirst(request, userId) {
  const cache = await caches.open(CACHES.profiles);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const body = await response.clone().json();
      if (body?.user?.id === userId) await cache.put(request, response.clone());
      return response;
    }
    const cached = await cache.match(request);
    return cached ? staleResponse(cached) : response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return staleResponse(cached);
    return new Response(JSON.stringify({ error: "Profile is unavailable offline and has no saved copy." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function openBookingDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("servicehub-pwa", 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open booking queue"));
  });
}

async function syncBookings() {
  const database = await openBookingDatabase();
  try {
    if (!database.objectStoreNames.contains("booking-request-queue")) return;
    const transaction = database.transaction("booking-request-queue", "readonly");
    const items = await new Promise((resolve, reject) => {
      const request = transaction.objectStore("booking-request-queue").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Unable to read booking queue"));
    });
    for (const item of items) {
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: item.serviceId,
            requestedDate: item.requestedDate,
            requestedTime: item.requestedTime,
            addressOrArea: item.addressOrArea,
            note: item.note,
            clientRequestId: item.clientRequestId,
          }),
        });
        if (response.ok) {
          await updateQueuedBooking(database, item.clientRequestId, null);
          await notifyClients({ type: "BOOKING_SYNCED", clientRequestId: item.clientRequestId });
        } else {
          const result = await response.json().catch(() => ({}));
          const retryable = response.status === 429 || response.status >= 500;
          await updateQueuedBooking(database, item.clientRequestId, {
            ...item,
            state: retryable ? "PENDING_SYNC" : "SYNC_FAILED",
            error: result.error || "The server could not accept this booking request.",
            updatedAt: new Date().toISOString(),
          });
          if (retryable) throw new Error("Booking sync should be retried.");
        }
      } catch (error) {
        if (typeof self.registration.sync !== "undefined") throw error;
        await updateQueuedBooking(database, item.clientRequestId, {
          ...item,
          state: "PENDING_SYNC",
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } finally {
    database.close();
  }
}

function updateQueuedBooking(database, id, value) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("booking-request-queue", "readwrite");
    const store = transaction.objectStore("booking-request-queue");
    const request = value ? store.put(value) : store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Unable to update booking queue"));
  });
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) client.postMessage(message);
}

function staleResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("X-ServiceHub-Cache", "stale");
  headers.set("X-ServiceHub-Offline-Label", "Offline copy — may be outdated");
  return response.clone().blob().then((body) => new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}

async function networkFirst(request, cacheName, publicOnly = false) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok &&
      (!publicOnly || response.headers.get("X-ServiceHub-Public") === "1") &&
      await isCacheablePublicApi(request, response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return staleResponse(cached);
    if (request.destination === "document") return offlinePage();
    return new Response(JSON.stringify({ error: "Offline and no cached public response is available." }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

async function offlinePage() {
  const cached = await (await caches.open(CACHES.offline)).match("/offline.html");
  if (!cached) return new Response("You're offline. Reconnect to load this page.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const headers = new Headers(cached.headers);
  headers.set("X-ServiceHub-Offline-Fallback", "true");
  return new Response(await cached.blob(), { status: 200, headers });
}

async function navigationNetworkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      return await fetch(request);
    } catch {
      return offlinePage();
    }
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
  event.waitUntil(
    fetch("/offline.html")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load offline fallback page.");
        return caches.open(CACHES.offline).then((cache) => cache.put("/offline.html", response));
      }),
  );
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
  if (event.data?.type === "CLEAR_PRIVATE_CACHE") {
    event.waitUntil(caches.delete(CACHES.profiles));
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "servicehub-bookings") event.waitUntil(syncBookings());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch (error) {
    console.error("Unable to parse a browser notification payload:", error);
  }
  const title = typeof payload.title === "string" ? payload.title : "ServiceHub update";
  const body = typeof payload.body === "string" ? payload.body : "You have a new notification.";
  const href = typeof payload.href === "string" && payload.href.startsWith("/") ? payload.href : "/dashboard/notifications";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag: typeof payload.id === "string" ? `servicehub-${payload.id}` : "servicehub-notification",
    data: { href },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = typeof event.notification.data?.href === "string" ? event.notification.data.href : "/dashboard/notifications";
  const destination = new URL(href, self.location.origin);
  if (destination.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          void client.navigate(destination.href);
          return client.focus();
        }
      }
      return self.clients.openWindow(destination.href);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const profileUserId = profileCacheUserId(request, url);
  if (profileUserId) {
    event.respondWith(profileNetworkFirst(request, profileUserId));
    return;
  }
  if (isPublicApi(request, url)) {
    const cacheName = url.pathname.startsWith("/api/services") ? CACHES.services :
      url.pathname.startsWith("/api/suppliers") ? CACHES.suppliers : CACHES.workshops;
    event.respondWith(networkFirst(request, cacheName, url.pathname.startsWith("/api/workshops")));
    return;
  }
  if (isPublicPage(request, url)) {
    const cacheName = url.pathname.startsWith("/services/") ? CACHES.services :
      url.pathname.startsWith("/suppliers/") ? CACHES.suppliers : CACHES.workshops;
    event.respondWith(networkFirst(request, cacheName));
    return;
  }
  if (isNavigation(request, url)) {
    event.respondWith(navigationNetworkFirst(request));
    return;
  }
  if (isPublicImage(request, url)) {
    event.respondWith(cacheFirst(request, CACHES.images));
    return;
  }
  if (isPublicStatic(request, url)) event.respondWith(cacheFirst(request, CACHES.static));
});
