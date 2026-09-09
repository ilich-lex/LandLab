(() => {
  const root = document.documentElement;
  const processSection = document.querySelector('.ll-process');
  const processItems = Array.from(document.querySelectorAll('.ll-process-step'));
  const processCounter = document.querySelector('.ll-process__counter-current');
  const processRailItems = Array.from(document.querySelectorAll('.ll-process__rail li'));
  const about = document.querySelector('.ll-about');
  const contact = document.querySelector('.ll-contact');
  const motion = window.LandLabMotion;
  const motionIsReduced = () => motion.isReduced();
  let metricsDirty = true;
  let activeProcess = -1;
  let reducedState = null;
  let metrics = { process: null, processItems: [], about: null, contact: null };

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function bounds(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: element.offsetHeight };
  }

  function measure() {
    metrics = {
      process: bounds(processSection),
      processItems: processItems.map(bounds),
      about: bounds(about),
      contact: bounds(contact)
    };
    metricsDirty = false;
  }

  function isNear(metric, frame, margin = 0.75) {
    if (!metric) return false;
    const buffer = frame.viewportHeight * margin;
    return frame.scrollY + frame.viewportHeight + buffer >= metric.top && frame.scrollY - buffer <= metric.top + metric.height;
  }

  function sectionProgress(metric, frame) {
    if (!metric) return 0;
    const travel = Math.max(1, metric.height - frame.viewportHeight);
    return clamp((frame.scrollY - metric.top) / travel);
  }

  function setActiveProcess(index) {
    if (index === activeProcess) return;
    activeProcess = index;
    processItems.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === index));
    processRailItems.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === index));
    if (processCounter) processCounter.textContent = String(index + 1).padStart(2, '0');
  }

  function renderProcess(frame) {
    if (!processSection || !processItems.length) return;

    const desktop = frame.viewportWidth > 980 && !frame.reduced;
    if (!desktop) {
      processSection.style.setProperty('--process-progress', '1');
      processItems.forEach((item, index) => {
        const itemMetric = metrics.processItems[index];
        const reveal = frame.reduced || !itemMetric
          ? 1
          : clamp((frame.scrollY + frame.viewportHeight - itemMetric.top) / Math.max(frame.viewportHeight * 0.62, 1));
        item.style.setProperty('--process-shift', '0%');
        item.style.setProperty('--process-opacity', '1');
        item.style.setProperty('--step-reveal', reveal.toFixed(4));
      });
      setActiveProcess(0);
      return;
    }

    const progress = sectionProgress(metrics.process, frame);
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

  function renderSceneProgress(frame) {
    if (about && isNear(metrics.about, frame)) {
      const progress = frame.reduced ? 0.5 : sectionProgress(metrics.about, frame);
      about.style.setProperty('--about-progress', progress.toFixed(4));
    }
    if (contact && isNear(metrics.contact, frame)) {
      const progress = frame.reduced
        ? 0.5
        : clamp((frame.scrollY + frame.viewportHeight - metrics.contact.top) / Math.max(frame.viewportHeight + metrics.contact.height, 1));
      contact.style.setProperty('--contact-progress', progress.toFixed(4));
    }
  }

  function render(frame) {
    if (frame.measure || metricsDirty) measure();

    if (frame.reduced !== reducedState) {
      reducedState = frame.reduced;
      if (frame.reduced) document.querySelectorAll('.ll-p3-reveal').forEach((element) => element.classList.add('is-visible'));
    }

    if (isNear(metrics.process, frame)) renderProcess(frame);
    renderSceneProgress(frame);
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

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      metricsDirty = true;
      motion.invalidate();
    });
    [processSection, about, contact].filter(Boolean).forEach((element) => resizeObserver.observe(element));
  }

  motion.observeActivity([processSection, about, contact]);
  motion.subscribe(render);
  root.classList.add('ll-pass3-ready');
})();
