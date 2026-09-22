(function () {
  'use strict';

  if (window.__landlabPrivacyReady) return;
  window.__landlabPrivacyReady = true;

  var COUNTER_ID = 112915025;
  var CONSENT_KEY = 'landlab_analytics_consent_v1';
  var scriptLoaded = false;
  var volatileConsent = null;

  function readConsent() {
    try {
      var value = window.localStorage.getItem(CONSENT_KEY);
      return value === 'granted' || value === 'denied' ? value : volatileConsent;
    } catch (error) {
      return volatileConsent;
    }
  }

  function saveConsent(value) {
    volatileConsent = value;
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch (error) {
      /* Consent still applies for the current page when storage is unavailable. */
    }
  }

  function removeAnalyticsCookies() {
    var names = ['_ym_uid', '_ym_d', '_ym_isad', '_ym_visorc', '_yasc'];
    var hostname = window.location.hostname;
    var domains = ['', hostname, '.' + hostname, '.land-lab.ru'];

    names.forEach(function (name) {
      domains.forEach(function (domain) {
        var domainPart = domain ? '; domain=' + domain : '';
        document.cookie = name + '=; Max-Age=0; path=/' + domainPart + '; SameSite=Lax';
      });
    });

    try {
      Object.keys(window.localStorage).forEach(function (key) {
        if (key !== CONSENT_KEY && key.indexOf('_ym') === 0) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (error) {
      /* Storage cleanup is best effort. */
    }
  }

  function hasConsent() {
    return readConsent() === 'granted';
  }

  function loadMetrika() {
    if (!hasConsent() || scriptLoaded) return;

    scriptLoaded = true;
    window['disableYaCounter' + COUNTER_ID] = false;
    window.ym = window.ym || function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = Date.now();

    window.ym(COUNTER_ID, 'init', {
      webvisor: true,
      clickmap: true,
      accurateTrackBounce: true,
      trackLinks: true
    });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + COUNTER_ID;
    script.dataset.landlabAnalytics = 'yandex-metrika';
    document.head.appendChild(script);
  }

  window.landlabTrackGoal = function (goalName) {
    if (!hasConsent() || !scriptLoaded || typeof window.ym !== 'function') return;
    window.ym(COUNTER_ID, 'reachGoal', goalName);
  };

  function closeBanner() {
    var banner = document.getElementById('ll-cookie-consent');
    if (banner) banner.remove();
    document.body.classList.remove('has-cookie-consent');
  }

  function applyConsent(value) {
    var wasLoaded = scriptLoaded;
    saveConsent(value);

    if (value === 'granted') {
      loadMetrika();
      closeBanner();
      return;
    }

    window['disableYaCounter' + COUNTER_ID] = true;
    removeAnalyticsCookies();
    closeBanner();

    if (wasLoaded) window.location.reload();
  }

  function showBanner() {
    closeBanner();

    var banner = document.createElement('section');
    banner.id = 'll-cookie-consent';
    banner.className = 'll-cookie-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Настройки аналитики');
    banner.innerHTML =
      '<div class="ll-cookie-consent__copy">' +
        '<strong>Аналитика сайта</strong>' +
        '<p>Мы используем файлы cookie и Яндекс Метрику для анализа работы сайта. ' +
          '<a href="/privacy/">Подробнее — в политике конфиденциальности.</a></p>' +
      '</div>' +
      '<div class="ll-cookie-consent__actions">' +
        '<button type="button" class="ll-cookie-consent__button ll-cookie-consent__button--accept" data-consent="granted">Принять</button>' +
        '<button type="button" class="ll-cookie-consent__button" data-consent="denied">Отклонить</button>' +
      '</div>';

    banner.addEventListener('click', function (event) {
      var button = event.target.closest('[data-consent]');
      if (button) applyConsent(button.dataset.consent);
    });

    document.body.appendChild(banner);
    document.body.classList.add('has-cookie-consent');
    window.requestAnimationFrame(function () {
      banner.classList.add('is-visible');
    });
  }

  function initPageControls() {
    document.querySelectorAll('[data-analytics-settings]').forEach(function (control) {
      control.addEventListener('click', showBanner);
    });

    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href]');
      if (!link) return;

      try {
        var url = new URL(link.href, window.location.href);
        if (url.hostname === 't.me' || url.hostname === 'telegram.me') {
          window.landlabTrackGoal('telegram_click');
        } else if (url.hostname === 'wa.me' || url.hostname.indexOf('whatsapp.') !== -1) {
          window.landlabTrackGoal('whatsapp_click');
        }
      } catch (error) {
        /* Invalid links remain fully functional without analytics. */
      }
    });

    if (readConsent() === null) showBanner();
  }

  window['disableYaCounter' + COUNTER_ID] = !hasConsent();
  if (hasConsent()) loadMetrika();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageControls, { once: true });
  } else {
    initPageControls();
  }
})();
