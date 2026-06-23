// 쉬는 시간 알림 클릭 처리 — Workbox 생성 SW에 importScripts 로 합쳐짐.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/suneung-quiz.html';
  event.waitUntil((async function () {
    var all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if ('focus' in c) {
        try { await c.navigate(url); } catch (e) {}
        return c.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  })());
});
