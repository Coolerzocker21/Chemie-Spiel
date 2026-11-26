/* Reaktionslabor – Offline-Speicher. Bei einem Update die Versionsnummer erhöhen. */
const V = "reaktionslabor-v4";
const CORE = ["./", "index.html", "manifest.webmanifest", "rubik.woff2", "inter.woff2",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon.svg", "favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Seite: erst Internet (für Updates), sonst gespeicherte Version
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put("index.html", copy)); }
      return res;
    }).catch(() => caches.match("index.html").then(m => m || caches.match("./"))));
    return;
  }
  // Schriften, Icons usw.: erst Speicher, sonst Internet
  e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)); }
    return res;
  })));
});
