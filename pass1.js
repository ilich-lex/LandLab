(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const forceReducedMotion = new URLSearchParams(window.location.search).get('motion') === 'reduce';
  const motionIsReduced = () => forceReducedMotion || reduceMotion.matches;
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

  let frameRequested = false;

  function renderScroll() {
    frameRequested = false;
    const scrollY = window.scrollY;
    const viewport = window.innerHeight;

    if (nav) nav.dataset.scrolled = String(scrollY > 36);

    if (!motionIsReduced() && hero) {
      const range = Math.max(1, hero.offsetHeight - viewport);
      const progress = clamp((scrollY - hero.offsetTop) / range);
      root.style.setProperty('--hero-progress', progress.toFixed(4));
    }

    if (!motionIsReduced() && approach) {
      const range = Math.max(1, approach.offsetHeight - viewport);
      const entryLead = viewport * 0.7;
      const progress = clamp((scrollY - approach.offsetTop + entryLead) / (range + entryLead));
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

  function requestRender() {
    if (!frameRequested) {
      frameRequested = true;
      requestAnimationFrame(renderScroll);
    }
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  reduceMotion.addEventListener('change', () => {
    root.dataset.motion = motionIsReduced() ? 'reduced' : 'full';
    if (motionIsReduced()) {
      root.style.setProperty('--hero-progress', '0');
      root.style.setProperty('--approach-progress', '1');
    }
    requestRender();
  });

  document.querySelectorAll('[data-magnetic]').forEach((button) => {
    button.addEventListener('pointermove', (event) => {
      if (motionIsReduced() || event.pointerType === 'touch') return;
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.14;
      button.style.setProperty('--magnet-x', `${x.toFixed(1)}px`);
      button.style.setProperty('--magnet-y', `${y.toFixed(1)}px`);
    });
    button.addEventListener('pointerleave', () => {
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

  root.dataset.motion = motionIsReduced() ? 'reduced' : 'full';
  playIntro();
  requestRender();
})();
