/* DataPD · 최박사사진관 — shared helpers (no dependencies) */
(function () {
  'use strict';

  // Clear values the retired services on this domain (demo login, DOYOU pages) left in this browser.
  // The old demo login stored e-mail and password in plain text. Nothing is sent anywhere.
  try {
    var ls = window.localStorage;
    for (var i = ls.length - 1; i >= 0; i--) {
      var k = ls.key(i);
      if (k && (/^datapd.(users|session)./.test(k) || k === 'datapd.pending' || /^doyou./.test(k))) ls.removeItem(k);
    }
  } catch (err) {}

  // Mark the current page in the header nav when a page did not set aria-current itself.
  var path = location.pathname.replace(/\/index\.html$/, '/');
  document.querySelectorAll('.nav a').forEach(function (a) {
    if (a.hasAttribute('aria-current')) return;
    var href = a.getAttribute('href');
    if (href && href === path) a.setAttribute('aria-current', 'page');
  });

  // Copy buttons: <button data-copy="text"> or data-copy-target="#id".
  // One visually hidden live region announces the copy result to screen readers.
  var live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);

  function announce(msg) {
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 60);
  }

  // Fallback for browsers without navigator.clipboard (or when it is denied).
  function legacyCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.setAttribute('aria-hidden', 'true');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    ta.style.fontSize = '16px';
    document.body.appendChild(ta);
    var ok = false;
    try {
      ta.select();
      ta.setSelectionRange(0, text.length);
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(ta);
    if (btn && btn.focus) btn.focus();
    return ok;
  }

  function feedback(btn, ok) {
    clearTimeout(btn._copyTimer);
    btn.textContent = ok ? '복사됨' : '복사 실패';
    announce(ok ? '클립보드에 복사했습니다.' : '복사하지 못했습니다. 직접 선택해 복사해 주세요.');
    btn._copyTimer = setTimeout(function () {
      btn.textContent = btn.dataset.label;
    }, ok ? 1400 : 2400);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy],[data-copy-target]');
    if (!btn) return;
    // Keep the original label once, so repeated clicks always restore it.
    if (!btn.dataset.label) btn.dataset.label = btn.textContent;
    var text = btn.getAttribute('data-copy');
    if (!text) {
      var el = null;
      try { el = document.querySelector(btn.getAttribute('data-copy-target')); } catch (err) { el = null; }
      text = el ? el.textContent.trim() : '';
    }
    if (!text) { feedback(btn, false); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { feedback(btn, true); },
        function () { feedback(btn, legacyCopy(text, btn)); }
      );
    } else {
      feedback(btn, legacyCopy(text, btn));
    }
  });
})();
