import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const serviceWorker = readFileSync(resolve(process.cwd(), "public", "sw.js"), "utf8");
const offlineShell = readFileSync(resolve(process.cwd(), "public", "offline.html"), "utf8");
const bookingQueue = readFileSync(resolve(process.cwd(), "src", "lib", "pwa", "booking-queue.ts"), "utf8");
const supplierDrafts = readFileSync(resolve(process.cwd(), "src", "lib", "pwa", "supplier-drafts.ts"), "utf8");
const supplierListingForm = readFileSync(resolve(process.cwd(), "src", "components", "suppliers", "listing-form.tsx"), "utf8");
const appLayout = readFileSync(resolve(process.cwd(), "src", "app", "layout.tsx"), "utf8");
const notificationPrompt = readFileSync(resolve(process.cwd(), "src", "components", "notifications", "notification-setup-prompt.tsx"), "utf8");
const browserPush = readFileSync(resolve(process.cwd(), "src", "lib", "notifications", "browser-push.ts"), "utf8");
const webManifest = JSON.parse(readFileSync(resolve(process.cwd(), "public", "manifest.webmanifest"), "utf8")) as {
  name: string;
  short_name: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
};

describe("ServiceHub service-worker cache contract", () => {
  it("uses one versioned cache manifest and removes obsolete ServiceHub caches", () => {
    expect(serviceWorker).toMatch(/const CACHE_VERSION = "v\d+";/);
    expect(serviceWorker).toContain("const CACHE_NAMES = Object.values(CACHES);");
    expect(serviceWorker).toContain('key.startsWith(CACHE_PREFIX) && !CACHE_NAMES.includes(key)');
    expect(serviceWorker).toContain('services: `${CACHE_PREFIX}services-${CACHE_VERSION}`');
    expect(serviceWorker).toContain('suppliers: `${CACHE_PREFIX}suppliers-${CACHE_VERSION}`');
    expect(serviceWorker).toContain('workshops: `${CACHE_PREFIX}workshops-${CACHE_VERSION}`');
    expect(serviceWorker).toContain('images: `${CACHE_PREFIX}images-${CACHE_VERSION}`');
    expect(serviceWorker).toContain('profiles: `${CACHE_PREFIX}profiles-${CACHE_VERSION}`');
    expect(serviceWorker).toContain('offline: `${CACHE_PREFIX}offline-${CACHE_VERSION}`');
  });

  it("publishes the installed app manifest with both supplied icon sizes", () => {
    expect(webManifest).toMatchObject({
      name: "ServiceHub",
      short_name: "ServiceHub",
      start_url: "/",
      display: "standalone",
      background_color: "#0F172A",
      theme_color: "#0F172A",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    });
  });

  it("allowlists public reads and leaves private APIs outside fetch interception", () => {
    expect(serviceWorker).toContain('url.pathname === "/api/services"');
    expect(serviceWorker).toContain('url.pathname === "/api/suppliers"');
    expect(serviceWorker).toContain('url.pathname === "/api/workshops"');
    expect(serviceWorker).toContain('url.pathname.startsWith("/api/")');
    expect(serviceWorker).toContain('return false');
    expect(serviceWorker).not.toContain('url.pathname.startsWith("/api/reports")');
    expect(serviceWorker).not.toContain('url.pathname.startsWith("/api/bookings")');
    expect(serviceWorker).not.toContain('url.pathname.startsWith("/api/orders")');
  });

  it("supports local public API and page caching without caching local development assets", () => {
    expect(serviceWorker).toContain('url.hostname === "localhost" || url.hostname === "127.0.0.1"');
    expect(serviceWorker).toContain("!isLocalOrigin");
    expect(serviceWorker).not.toContain("!isDevelopmentOrigin(url)");
  });

  it("caches a private profile response only under the matching account id", () => {
    expect(serviceWorker).toContain('url.pathname !== "/api/profile"');
    expect(serviceWorker).toContain('url.searchParams.get("cacheUserId")');
    expect(serviceWorker).toContain("body?.user?.id === userId");
    expect(serviceWorker).toContain('event.data?.type === "CLEAR_PRIVATE_CACHE"');
  });

  it("replays queued bookings on background sync", () => {
    expect(serviceWorker).toContain('event.tag === "servicehub-bookings"');
    expect(serviceWorker).toContain('type: "BOOKING_SYNCED"');
  });

  it("uses a shared IndexedDB version for bookings and supplier listing drafts", () => {
    expect(bookingQueue).toContain('const version = 3;');
    expect(supplierDrafts).toContain('const version = 3;');
    expect(serviceWorker).toContain('indexedDB.open("servicehub-pwa", 3)');
    expect(bookingQueue).toContain('createObjectStore("supplier-listing-drafts"');
    expect(supplierDrafts).toContain('createObjectStore("booking-request-queue"');
    expect(supplierListingForm).toContain("Listing was created, but its local draft could not be removed:");
  });

  it("displays Web Push messages as desktop notifications and opens their destination", () => {
    expect(serviceWorker).toContain('self.addEventListener("push"');
    expect(serviceWorker).toContain("self.registration.showNotification(title");
    expect(serviceWorker).toContain('self.addEventListener("notificationclick"');
    expect(serviceWorker).toContain("self.clients.openWindow(destination.href)");
  });

  it("prompts signed-in users to enable browser notifications on app entry", () => {
    expect(appLayout).toContain("{user ? <NotificationSetupPrompt key={user.id} userId={user.id} /> : null}");
    expect(notificationPrompt).toContain("getBrowserPushConfiguration()");
    expect(notificationPrompt).toContain("enableBrowserNotifications(prompt.publicKey)");
    expect(notificationPrompt).toContain("servicehub_notification_prompt_dismissed:");
    expect(notificationPrompt).toContain("servicehub:push-subscription-changed");
    expect(browserPush).toContain("Notification.requestPermission()");
    expect(browserPush).toContain('window.dispatchEvent(new Event("servicehub:push-subscription-changed"))');
  });

  it("pre-caches an offline navigation fallback without caching private page responses", () => {
    expect(serviceWorker).toContain('fetch("/offline.html")');
    expect(serviceWorker).toContain('headers.set("X-ServiceHub-Offline-Fallback", "true")');
    expect(serviceWorker).toContain("async function navigationNetworkFirst(request)");
    expect(serviceWorker).toContain("if (isNavigation(request, url))");
    expect(serviceWorker).toContain("!url.pathname.startsWith(\"/_next/\")");
    expect(serviceWorker).toContain("event.respondWith(navigationNetworkFirst(request))");
    expect(offlineShell).toContain('nav aria-label="Primary navigation"');
    expect(offlineShell).toContain('nav aria-label="Mobile navigation"');
    expect(offlineShell).toContain("async function findCachedApi(pathname, cacheHint)");
    expect(offlineShell).toContain('localStorage.getItem(key)');
    expect(offlineShell).toContain("async function recoverIfReachable()");
    expect(offlineShell).toContain('fetch(location.href, {');
    expect(offlineShell).toContain('window.addEventListener("online", recoverIfReachable)');
    expect(offlineShell).toContain('$("retry").addEventListener("click", recoverIfReachable)');
  });

  it("only stores published public detail API responses in shared caches", () => {
    expect(serviceWorker).toContain("async function isCacheablePublicApi(request, response)");
    expect(serviceWorker).toContain("data?.service?.status === \"PUBLISHED\"");
    expect(serviceWorker).toContain("data?.listing?.available === true && data.listing.stock > 0");
    expect(serviceWorker).toContain("data?.workshop?.status === \"PUBLISHED\"");
  });
});
