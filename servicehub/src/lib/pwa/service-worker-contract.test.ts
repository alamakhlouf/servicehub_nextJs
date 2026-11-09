import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const serviceWorker = readFileSync(resolve(process.cwd(), "public", "sw.js"), "utf8");

describe("ServiceHub service-worker cache contract", () => {
  it("uses one versioned cache manifest and removes obsolete ServiceHub caches", () => {
    expect(serviceWorker).toMatch(/const CACHE_VERSION = "v\d+";/);
    expect(serviceWorker).toContain("const CACHE_NAMES = Object.values(CACHES);");
    expect(serviceWorker).toContain('key.startsWith(CACHE_PREFIX) && !CACHE_NAMES.includes(key)');
    expect(serviceWorker).toContain('services: `${CACHE_PREFIX}services-${CACHE_VERSION}`');
    expect(serviceWorker).toContain('suppliers: `${CACHE_PREFIX}suppliers-${CACHE_VERSION}`');
    expect(serviceWorker).toContain('workshops: `${CACHE_PREFIX}workshops-${CACHE_VERSION}`');
    expect(serviceWorker).toContain('images: `${CACHE_PREFIX}images-${CACHE_VERSION}`');
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

  it("does not cache development origins", () => {
    expect(serviceWorker).toContain('url.hostname === "localhost" || url.hostname === "127.0.0.1"');
    expect(serviceWorker).toContain("!isDevelopmentOrigin(url)");
  });
});
