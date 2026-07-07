/* Xevigo — contact link enhancement
   Keeps the native mailto: behavior (opens the visitor's mail app when one is
   configured) and ALWAYS copies the address + shows a toast. This way a click
   never feels dead, even on devices/browsers with no default mail handler —
   which is the most common reason a mailto link appears to "do nothing". */
(function () {
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

  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var TO = 'support@xevigo.com';
    var err = form.querySelector('#cf-error');

    function val(id) { var el = form.querySelector(id); return el ? String(el.value || '').trim() : ''; }
    function showError(msg) { if (err) { err.textContent = msg; err.hidden = false; } }
    function clearError() { if (err) { err.hidden = true; err.textContent = ''; } }

    Array.prototype.forEach.call(form.querySelectorAll('.btn-send'), function (btn) {
      btn.addEventListener('click', function () {
        var name = val('#cf-name');
        var email = val('#cf-email');
        var topic = val('#cf-topic') || 'General question';
        var message = val('#cf-message');

        if (!name) { showError('Please enter your name.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('Please enter a valid email address.'); return; }
        if (!message) { showError('Please enter a message.'); return; }
        clearError();

        var subject = '[' + topic + '] Message from ' + name;
        var body = 'Name: ' + name + '\nEmail: ' + email + '\nTopic: ' + topic + '\n\n' + message;
        var eTo = encodeURIComponent(TO), eSu = encodeURIComponent(subject), eBo = encodeURIComponent(body);
        var provider = btn.getAttribute('data-provider');

        if (provider === 'gmail') {
          window.open('https://mail.google.com/mail/?view=cm&fs=1&to=' + eTo + '&su=' + eSu + '&body=' + eBo, '_blank', 'noopener');
        } else if (provider === 'outlook') {
          window.open('https://outlook.live.com/mail/0/deeplink/compose?to=' + eTo + '&subject=' + eSu + '&body=' + eBo, '_blank', 'noopener');
        } else {
          window.location.href = 'mailto:' + TO + '?subject=' + eSu + '&body=' + eBo;
        }
        toast('Opening your email — review your message and hit send.');
      });
    });
  }

  function enhance() {
    initContactForm();
    var links = document.querySelectorAll('a[href^="mailto:"]');
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function () {
        var email = decodeURIComponent(
          a.getAttribute('href').replace(/^mailto:/i, '').split('?')[0]
        );
        copy(email).then(function (ok) {
          toast(ok ? ('Email address copied: ' + email) : ('Contact us at: ' + email));
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
