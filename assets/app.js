/* Xevigo — contact link enhancement
   Keeps the native mailto: behavior (opens the visitor's mail app when one is
   configured) and ALWAYS copies the address + shows a toast. This way a click
   never feels dead, even on devices/browsers with no default mail handler —
   which is the most common reason a mailto link appears to "do nothing". */
(function () {
  function currentLocale() {
    return document.documentElement.getAttribute('data-locale') === 'zh' ? 'zh' : 'en';
  }
  function L(en, zh) { return currentLocale() === 'zh' ? zh : en; }

  function applyLocale(loc) {
    var el = document.documentElement;
    el.setAttribute('data-locale', loc);
    el.setAttribute('lang', loc === 'zh' ? 'zh-Hans' : 'en');
    try { localStorage.setItem('xv-locale', loc); } catch (e) {}
    var te = el.getAttribute('data-title-en'), tz = el.getAttribute('data-title-zh');
    if (te && tz) document.title = loc === 'zh' ? tz : te;
    Array.prototype.forEach.call(document.querySelectorAll('[data-ph-en]'), function (n) {
      var v = loc === 'zh' ? n.getAttribute('data-ph-zh') : n.getAttribute('data-ph-en');
      if (v != null) n.setAttribute('placeholder', v);
    });
    Array.prototype.forEach.call(document.querySelectorAll('option[data-en]'), function (o) {
      var v = loc === 'zh' ? o.getAttribute('data-zh') : o.getAttribute('data-en');
      if (v != null) o.textContent = v;
    });
  }

  function initLocale() {
    applyLocale(currentLocale());
    Array.prototype.forEach.call(document.querySelectorAll('.lang-toggle'), function (b) {
      b.addEventListener('click', function () {
        applyLocale(currentLocale() === 'zh' ? 'en' : 'zh');
      });
    });
  }

  function injectStyles() {
    if (document.getElementById('xv-toast-style')) return;
    var s = document.createElement('style');
    s.id = 'xv-toast-style';
    s.textContent =
      '.xv-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,16px);' +
      'background:#1c2333;color:#fff;padding:11px 18px;border-radius:999px;' +
      'font:600 0.9rem/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
      'box-shadow:0 20px 60px rgba(28,35,51,.28);opacity:0;z-index:1000;' +
      'pointer-events:none;max-width:calc(100vw - 32px);text-align:center;' +
      'transition:opacity .25s ease,transform .25s ease;}' +
      '.xv-toast.show{opacity:1;transform:translate(-50%,0);}';
    document.head.appendChild(s);
  }

  function toast(msg) {
    injectStyles();
    var t = document.createElement('div');
    t.className = 'xv-toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2600);
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
        .then(function () { return true; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function enhance() {
    initLocale();
    var links = document.querySelectorAll('a[href^="mailto:"]');
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function () {
        var email = decodeURIComponent(
          a.getAttribute('href').replace(/^mailto:/i, '').split('?')[0]
        );
        copy(email).then(function (ok) {
          toast((ok ? L('Email address copied: ', '邮箱地址已复制：') : L('Contact us at: ', '联系我们：')) + email);
        });
        // No preventDefault(): a configured mail app still opens as normal.
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance);
  } else {
    enhance();
  }
})();
