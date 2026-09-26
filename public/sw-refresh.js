/* Imported by the generated service worker (vite.config.js → workbox.importScripts).
   When a NEW worker replaces an older one, reload the open tabs once so nobody keeps looking at
   a page the old worker served from its cache (e.g. the pre-move studio pages at the site root).
   First installs do not reload: during 'install' an older worker is active only on an update.
   If the worker is restarted between install and activate the flag is lost and nothing reloads —
   the next navigation shows the new site anyway. */
var replacingOlderWorker = false;

self.addEventListener('install', function () {
  replacingOlderWorker = !!(self.registration && self.registration.active);
});

self.addEventListener('activate', function (event) {
  if (!replacingOlderWorker) return;
  event.waitUntil(
    self.clients.claim()
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (windows) {
        return Promise.all(windows.map(function (w) {
          return 'navigate' in w ? w.navigate(w.url).catch(function () {}) : null;
        }));
      })
  );
});
