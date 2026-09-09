(() => {
  'use strict';

  const root = document.documentElement;
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forceReduced = new URLSearchParams(window.location.search).get('motion') === 'reduce';
  const reduceMotion = () => forceReduced || reducedQuery.matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const map = (value, start, end) => clamp((value - start) / Math.max(0.0001, end - start));

  const services = document.querySelector('.ll-services');
  const serviceItems = Array.from(document.querySelectorAll('.ll-service'));
  const serviceSteps = Array.from(document.querySelectorAll('.ll-services__progress li'));
  const serviceCounter = document.querySelector('.ll-services__counter-current');
  const workIntro = document.querySelector('.ll-work-intro');
  const cases = Array.from(document.querySelectorAll('.ll-case'));
  const workOutro = document.querySelector('.ll-work-outro');

  let viewportHeight = window.innerHeight;
  let viewportWidth = window.innerWidth;
  let framePending = false;
  let metricsDirty = true;
  let metrics = {
    services: null,
    serviceItems: [],
    workIntro: null,
    cases: [],
    workOutro: null
  };

  function bounds(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      height: element.offsetHeight
    };
  }

  function measure() {
    viewportHeight = window.innerHeight;
    viewportWidth = window.innerWidth;
    metrics = {
      services: bounds(services),
      serviceItems: serviceItems.map(bounds),
      workIntro: bounds(workIntro),
      cases: cases.map(bounds),
      workOutro: bounds(workOutro)
    };
    metricsDirty = false;
  }

  function setServiceState(scrollY) {
    if (!services || !metrics.services) return;

    const desktopScene = viewportWidth > 980 && !reduceMotion();
    if (!desktopScene) {
      services.style.setProperty('--services-progress', '1');
      services.style.setProperty('--services-inset', '0%');
      serviceItems.forEach((item, index) => {
        const itemMetric = metrics.serviceItems[index];
        const reveal = reduceMotion() || !itemMetric
          ? 1
          : map(scrollY + viewportHeight * 0.9, itemMetric.top, itemMetric.top + viewportHeight * 0.55);
        item.style.setProperty('--mobile-reveal', reveal.toFixed(4));
        item.style.setProperty('--service-shift', '0%');
        item.style.setProperty('--service-opacity', '1');
        item.style.setProperty('--service-scale', '1');
        item.classList.toggle('is-active', index === 0);
      });
      return;
    }

    const range = Math.max(1, metrics.services.height - viewportHeight);
    const progress = clamp((scrollY - metrics.services.top) / range);
    const intro = map(progress, 0, 0.055);
    const phase = map(progress, 0.06, 0.94) * Math.max(0, serviceItems.length - 1);
    const activeIndex = Math.round(phase);

    services.style.setProperty('--services-progress', progress.toFixed(4));
    services.style.setProperty('--services-inset', `${((1 - intro) * 7).toFixed(3)}%`);
    services.style.setProperty('--service-accent-x', (activeIndex / Math.max(1, serviceItems.length - 1)).toFixed(4));

    serviceItems.forEach((item, index) => {
      const delta = index - phase;
      const distance = Math.abs(delta);
      const opacity = clamp(1 - distance * 1.45);
      const scale = 1 - Math.min(distance, 1) * 0.045;
      item.style.setProperty('--service-shift', `${(delta * 112).toFixed(3)}%`);
      item.style.setProperty('--service-opacity', opacity.toFixed(4));
      item.style.setProperty('--service-scale', scale.toFixed(4));
      item.classList.toggle('is-active', index === activeIndex);
    });

    serviceSteps.forEach((step, index) => step.classList.toggle('is-active', index === activeIndex));
    if (serviceCounter) serviceCounter.textContent = String(activeIndex + 1).padStart(2, '0');
  }

  function setWorkIntroState(scrollY) {
    if (!workIntro || !metrics.workIntro) return;
    if (reduceMotion()) {
      workIntro.style.setProperty('--work-intro-progress', '1');
      return;
    }

    const range = Math.max(1, metrics.workIntro.height - viewportHeight);
    const progress = clamp((scrollY - metrics.workIntro.top + viewportHeight * 0.08) / range);
    workIntro.style.setProperty('--work-intro-progress', progress.toFixed(4));
  }

  function setCaseStates(scrollY) {
    cases.forEach((item, index) => {
      const itemMetric = metrics.cases[index];
      if (!itemMetric) return;

      if (reduceMotion()) {
        item.style.setProperty('--case-progress', '0.5');
        item.style.setProperty('--case-reveal', '1');
        return;
      }

      const progress = clamp(
        (scrollY - itemMetric.top + viewportHeight * 0.8) /
        Math.max(viewportHeight, itemMetric.height + viewportHeight * 0.1)
      );
      const reveal = map(scrollY + viewportHeight * 0.92, itemMetric.top, itemMetric.top + viewportHeight * 0.62);
      item.style.setProperty('--case-progress', progress.toFixed(4));
      item.style.setProperty('--case-reveal', reveal.toFixed(4));
    });
  }

  function setOutroState(scrollY) {
    if (!workOutro || !metrics.workOutro) return;
    const progress = reduceMotion()
      ? 1
      : map(scrollY + viewportHeight * 0.9, metrics.workOutro.top, metrics.workOutro.top + viewportHeight * 0.76);
    workOutro.style.setProperty('--work-outro-inset', `${((1 - progress) * 15).toFixed(3)}%`);
  }

  function render() {
    framePending = false;
    if (metricsDirty) measure();
    const scrollY = window.scrollY;
    setServiceState(scrollY);
    setWorkIntroState(scrollY);
    setCaseStates(scrollY);
    setOutroState(scrollY);
  }

  function requestRender() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(render);
  }

  function refreshMetrics() {
    metricsDirty = true;
    requestRender();
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', refreshMetrics, { passive: true });
  window.addEventListener('load', refreshMetrics, { once: true });
  reducedQuery.addEventListener('change', refreshMetrics);

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      if (!framePending) refreshMetrics();
    });
    [services, workIntro, workOutro].filter(Boolean).forEach((element) => observer.observe(element));
  }

  refreshMetrics();
})();
