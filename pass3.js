(() => {
  const root = document.documentElement;
  const processSection = document.querySelector('.ll-process');
  const processItems = Array.from(document.querySelectorAll('.ll-process-step'));
  const processCounter = document.querySelector('.ll-process__counter-current');
  const processRailItems = Array.from(document.querySelectorAll('.ll-process__rail li'));
  const about = document.querySelector('.ll-about');
  const contact = document.querySelector('.ll-contact');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forceReducedMotion = new URLSearchParams(window.location.search).get('motion') === 'reduce';
  const motionIsReduced = () => forceReducedMotion || reducedMotion.matches || root.dataset.motion === 'reduced';

  let ticking = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function sectionProgress(element) {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    return clamp(-rect.top / travel);
  }

  function setActiveProcess(index) {
    processItems.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === index));
    processRailItems.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === index));
    if (processCounter) processCounter.textContent = String(index + 1).padStart(2, '0');
  }

  function renderProcess() {
    if (!processSection || !processItems.length) return;

    const desktop = window.innerWidth > 980 && !motionIsReduced();
    if (!desktop) {
      processSection.style.setProperty('--process-progress', '1');
      processItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const reveal = clamp((window.innerHeight - rect.top) / Math.max(window.innerHeight * 0.72, 1));
        item.style.setProperty('--process-shift', '0%');
        item.style.setProperty('--process-opacity', '1');
        item.style.setProperty('--step-reveal', reveal.toFixed(4));
      });
      setActiveProcess(0);
      return;
    }

    const progress = sectionProgress(processSection);
    const position = progress * (processItems.length - 1);
    const activeIndex = Math.min(processItems.length - 1, Math.max(0, Math.round(position)));
    processSection.style.setProperty('--process-progress', progress.toFixed(4));

    processItems.forEach((item, index) => {
      const delta = index - position;
      const opacity = clamp(1 - Math.abs(delta) * 2.1);
      item.style.setProperty('--process-shift', `${(delta * 108).toFixed(3)}%`);
      item.style.setProperty('--process-opacity', opacity.toFixed(4));
    });
    setActiveProcess(activeIndex);
  }

  function renderSceneProgress() {
    if (about) about.style.setProperty('--about-progress', sectionProgress(about).toFixed(4));
    if (contact) {
      const rect = contact.getBoundingClientRect();
      const progress = clamp((window.innerHeight - rect.top) / Math.max(window.innerHeight + rect.height, 1));
      contact.style.setProperty('--contact-progress', progress.toFixed(4));
    }
  }

  function render() {
    ticking = false;
    renderProcess();
    renderSceneProgress();
  }

  function requestRender() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    : null;

  document.querySelectorAll('.ll-p3-reveal').forEach((element) => {
    if (motionIsReduced() || !revealObserver) element.classList.add('is-visible');
    else revealObserver.observe(element);
  });

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender);
  reducedMotion.addEventListener?.('change', () => {
    if (motionIsReduced()) document.querySelectorAll('.ll-p3-reveal').forEach((element) => element.classList.add('is-visible'));
    requestRender();
  });

  render();
  root.classList.add('ll-pass3-ready');
})();
