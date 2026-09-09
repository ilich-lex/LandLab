(() => {
  'use strict';

  const root = document.documentElement;
  const subscribers = new Set();
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarseQuery = window.matchMedia('(pointer: coarse)');
  const forceReduced = new URLSearchParams(window.location.search).get('motion') === 'reduce';

  let framePending = false;
  let measureDirty = true;
  let lastWidth = 0;
  let lastHeight = 0;

  const isReduced = () => forceReduced || reducedQuery.matches;

  function flush(timestamp) {
    framePending = false;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const measure = measureDirty || viewportWidth !== lastWidth || viewportHeight !== lastHeight;
    const frame = {
      timestamp,
      scrollY: window.scrollY,
      viewportWidth,
      viewportHeight,
      measure,
      reduced: isReduced(),
      coarse: coarseQuery.matches
    };

    lastWidth = viewportWidth;
    lastHeight = viewportHeight;
    measureDirty = false;

    subscribers.forEach((callback) => callback(frame));
  }

  function request() {
    if (framePending || document.visibilityState === 'hidden') return;
    framePending = true;
    window.requestAnimationFrame(flush);
  }

  function invalidate() {
    measureDirty = true;
    request();
  }

  function subscribe(callback) {
    subscribers.add(callback);
    invalidate();
    return () => subscribers.delete(callback);
  }

  function observeActivity(elements) {
    const items = Array.from(elements).filter(Boolean);
    if (!items.length) return null;

    if (!('IntersectionObserver' in window)) {
      items.forEach((element) => element.classList.add('is-motion-active'));
      return null;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-motion-active', entry.isIntersecting));
    }, { rootMargin: '45% 0px 45% 0px', threshold: 0 });

    items.forEach((element) => observer.observe(element));
    return observer;
  }

  function syncMotionPreference() {
    root.dataset.motion = isReduced() ? 'reduced' : 'full';
    invalidate();
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', invalidate, { passive: true });
  window.addEventListener('orientationchange', invalidate, { passive: true });
  window.addEventListener('load', invalidate, { once: true });
  window.addEventListener('pageshow', invalidate, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') invalidate();
  });
  reducedQuery.addEventListener?.('change', syncMotionPreference);
  coarseQuery.addEventListener?.('change', invalidate);

  window.LandLabMotion = {
    subscribe,
    request,
    invalidate,
    isReduced,
    observeActivity
  };

  syncMotionPreference();
})();
