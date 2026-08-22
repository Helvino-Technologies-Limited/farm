// Minimal service worker: makes the app installable and provides an offline fallback page for
// navigation only. Deliberately does NOT cache app data/HTML — this is a live business system,
// so serving stale sales/inventory data offline would be actively harmful. Full offline
// transaction support (sync queue) is a tracked future phase, not implemented here.
const CACHE = "avepo-shell-v2";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  // Only precache static, hash-free paths — the favicon/apple-icon routes are served at a
  // build-hashed URL (e.g. /icon?<hash>) so they can't be listed here reliably, and a single
  // failed addAll() entry rejects the whole install step.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/manifest.json"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
