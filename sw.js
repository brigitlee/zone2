// 超慢跑快樂Zone2 service worker: lets Chrome install the page and open it offline.
// When you upload a changed voices.js or icon, also change the version number below.
const CACHE = "zone2-v2";
const FILES = ["./", "voices.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  // cache: "reload" skips the browser's HTTP cache, so the stored copies are the newest ones on GitHub
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(u => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // pages: always ask GitHub for the newest copy (no-cache = check with the server, ignoring the 10-minute browser cache);
  // fall back to the stored copy when offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
        .then(r => {
          if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put("./", copy)); }
          return r;
        })
        .catch(() => caches.match("./"))
    );
    return;
  }
  // everything else (voices, icons, fonts): stored copy first, then network, and keep a copy
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === "opaque") { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  })));
});
