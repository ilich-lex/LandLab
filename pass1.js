(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const motion = window.LandLabMotion;
  const motionIsReduced = () => motion.isReduced();
  const intro = document.getElementById('ll-intro');
  const introCount = document.getElementById('ll-intro-count');
  const nav = document.getElementById('ll-nav');
  const hero = document.getElementById('top');
  const approach = document.getElementById('approach');
  const menu = document.getElementById('ll-menu');
  const menuToggle = document.getElementById('ll-menu-toggle');

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mapProgress = (value, start, end) => clamp((value - start) / (end - start));

  function finishIntro() {
    body.classList.remove('is-intro-active');
    body.classList.add('is-ready');
    if (intro) intro.classList.add('is-complete');
  }

  function playIntro() {
    if (!intro || motionIsReduced()) {
      finishIntro();
      return;
    }

    body.classList.add('is-intro-active');
    const startedAt = performance.now();
    const duration = 650;

    function tick(now) {
      const raw = clamp((now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - raw, 3);
      const value = Math.round(eased * 100);
      intro.style.setProperty('--intro-progress', eased.toFixed(4));
      if (introCount) introCount.textContent = String(value).padStart(3, '0');
      if (raw < 1) requestAnimationFrame(tick);
      else {
        finishIntro();
        window.setTimeout(() => intro.remove(), 820);
      }
    }

    requestAnimationFrame(tick);
  }

  function setMenu(open) {
    if (!menu || !menuToggle) return;
    menu.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    body.style.overflow = open ? 'hidden' : '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  document.querySelectorAll('.ll-menu a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  let metrics = { hero: null, approach: null };
  let navScrolled = null;
  let reducedState = null;

  function bounds(element) {
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: element.offsetHeight };
  }

  function measure() {
    metrics = { hero: bounds(hero), approach: bounds(approach) };
  }

  function isNear(metric, scrollY, viewport) {
    return metric && scrollY + viewport * 1.5 >= metric.top && scrollY - viewport * 0.5 <= metric.top + metric.height;
  }

  function renderScroll(frame) {
    if (frame.measure) measure();

    const scrolled = frame.scrollY > 36;
    if (nav && scrolled !== navScrolled) {
      navScrolled = scrolled;
      nav.dataset.scrolled = String(scrolled);
    }

    if (frame.reduced !== reducedState) {
      reducedState = frame.reduced;
      if (frame.reduced) {
        root.style.setProperty('--hero-progress', '0');
        root.style.setProperty('--approach-progress', '1');
      }
    }

    if (frame.reduced) return;

    if (isNear(metrics.hero, frame.scrollY, frame.viewportHeight)) {
      const range = Math.max(1, metrics.hero.height - frame.viewportHeight);
      const progress = clamp((frame.scrollY - metrics.hero.top) / range);
      root.style.setProperty('--hero-progress', progress.toFixed(4));
    }

    if (isNear(metrics.approach, frame.scrollY, frame.viewportHeight)) {
      const range = Math.max(1, metrics.approach.height - frame.viewportHeight);
      const entryLead = frame.viewportHeight * 0.7;
      const progress = clamp((frame.scrollY - metrics.approach.top + entryLead) / (range + entryLead));
      root.style.setProperty('--approach-progress', progress.toFixed(4));
      approach.style.setProperty('--approach-inset-y', `${((1 - progress) * 8).toFixed(3)}%`);
      approach.style.setProperty('--approach-inset-x', `${((1 - progress) * 3).toFixed(3)}%`);
      approach.style.setProperty('--approach-radius', `${((1 - progress) * 2.2).toFixed(3)}rem`);
      approach.style.setProperty('--line-one', mapProgress(progress, 0.08, 0.34).toFixed(4));
      approach.style.setProperty('--line-two', mapProgress(progress, 0.22, 0.51).toFixed(4));
      approach.style.setProperty('--line-three', mapProgress(progress, 0.38, 0.68).toFixed(4));
      approach.style.setProperty('--note-progress', mapProgress(progress, 0.58, 0.82).toFixed(4));
    }
  }

  document.querySelectorAll('[data-magnetic]').forEach((button) => {
    let pointerFrame = 0;
    let pointerEvent = null;

    button.addEventListener('pointermove', (event) => {
      if (motionIsReduced() || event.pointerType === 'touch') return;
      pointerEvent = { x: event.clientX, y: event.clientY };
      if (pointerFrame) return;

      pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const rect = button.getBoundingClientRect();
        const x = (pointerEvent.x - rect.left - rect.width / 2) * 0.12;
        const y = (pointerEvent.y - rect.top - rect.height / 2) * 0.14;
        button.style.setProperty('--magnet-x', `${x.toFixed(1)}px`);
        button.style.setProperty('--magnet-y', `${y.toFixed(1)}px`);
      });
    });
    button.addEventListener('pointerleave', () => {
      if (pointerFrame) cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      button.style.setProperty('--magnet-x', '0px');
      button.style.setProperty('--magnet-y', '0px');
    });
  });

  approach?.querySelectorAll('.ll-mask-line').forEach((line, index) => {
    line.firstElementChild?.style.setProperty(
      '--line-progress',
      `var(--line-${['one', 'two', 'three'][index]})`
    );
  });

  motion.observeActivity([hero, approach]);
  motion.subscribe(renderScroll);
  playIntro();
})();
