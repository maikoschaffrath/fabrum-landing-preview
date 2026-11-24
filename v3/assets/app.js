// Runs after the DOM is parsed, whether loaded with defer or inlined into <head> (the prototype).
(() => { const main = () => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('js');

  /* ---------- pricing flag ---------- */
  const cfg = window.FABRUM_CONFIG || {};
  if (cfg.SHOW_PRICE) {
    const box = $('[data-price]');
    $('[data-price-amount]').textContent = cfg.PRICE;
    $('[data-price-note]').textContent = cfg.PRICE_NOTE;
    box.hidden = false;
    $('[data-price-hidden-copy]').textContent = 'Nothing to pay to join the waitlist or apply. A deposit holds your place once you accept an offer.';
  }

  /* ---------- illustration slots (Didi's papercut files) ----------
     manifest.js is written by sync-illustrations.sh. Each slot gets a <picture>
     (WebP first, PNG fallback) with its real size, so nothing shifts as it loads.
     Everything except the hero is lazy-loaded. A slot with no file keeps its SVG. */
  const ill = window.FABRUM_ILLUSTRATIONS || { slots: {}, heroLayers: [] };
  const picture = (f, { alt = '', lazy = true, cls = '' } = {}) => {
    const pic = document.createElement('picture');
    if (f.webp && f.png) { const so = document.createElement('source'); so.type = 'image/webp'; so.srcset = f.webp; pic.append(so); }
    const img = new Image();
    img.src = f.png || f.webp; img.alt = alt; img.decoding = 'async';
    img.loading = lazy ? 'lazy' : 'eager'; if (!lazy) img.fetchPriority = 'high';
    if (f.w) { img.width = f.w; img.height = f.h; }
    if (cls) img.className = cls;
    pic.append(img);
    return { pic, img };
  };
  $$('[data-illo]').forEach(fig => {
    const slot = fig.dataset.illo;
    if (slot === 'hero') return;                       // the hero is handled with its layers below
    const f = (ill.slots || {})[slot];
    if (!f) { fig.classList.add('illo--placeholder'); return; }
    const alt = fig.dataset.alt || '';
    const { pic, img } = picture(f, { alt });
    // The <img> has to be in the document for native lazy loading to start, so it waits,
    // invisible, inside the figure; once loaded it replaces the placeholder art.
    pic.className = 'illo-pending';
    if (f.w && slot !== 'curriculum') fig.style.aspectRatio = `${f.w} / ${f.h}`;   // reserve the space: no layout shift
    fig.classList.add('illo--awaiting');
    fig.append(pic);
    img.addEventListener('load', () => {
      pic.className = '';
      fig.replaceChildren(pic); fig.classList.replace('illo--awaiting', 'illo--loaded');
      if (alt) fig.removeAttribute('aria-hidden');
    }, { once: true });
  });

  /* hero: Didi's parallax layers (hero-layer-1..n, back to front) > hero-v2 > papercut mountain SVG */
  const stack = $('[data-hero-stack]');
  if (stack && ill.heroLayers && ill.heroLayers.length) {
    const n = ill.heroLayers.length, f0 = ill.heroLayers[0];
    const v3 = document.documentElement.dataset.theme === 'v3';
    if (f0.w) stack.style.setProperty('--hero-ar', `${f0.w} / ${f0.h}`);
    // v3: Didi's speeds (0.15 / 0.40 / 0.75 / 1.00, back to front) become how far each sheet lags the
    // scroll, kept modest so the skyline and the crowd stay registered. v2: back layer lags most.
    const DIDI = [0.15, 0.40, 0.75, 1.00];
    stack.replaceChildren(...ill.heroLayers.map((f, i) => {
      const { pic, img } = picture(f, { lazy: false, cls: 'hsheet-img' });
      img.dataset.speed = (v3 && n === 4 ? (1 - DIDI[i]) * 0.2 : 0.16 * (1 - i / Math.max(1, n - 1))).toFixed(3);
      return pic;
    }));
    if (v3) { stack.closest('.hero').classList.add('hero--art'); document.documentElement.classList.add('has-hero-art'); }   // full-bleed art, type in the left sky
  } else if (stack && ill.slots && ill.slots.hero) {
    const f = ill.slots.hero;
    stack.replaceWith(picture(f, { lazy: false, cls: 'hero-single' }).pic);
  }

  /* ---------- tabs (stage explorer + curriculum camps) ---------- */
  function tabs(list, tabSel) {
    const ts = $$(tabSel, list);
    const select = (t, focus) => {
      ts.forEach(x => {
        const on = x === t;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        const dot = document.querySelector(`.stone[data-for="${x.id}"]`); if (dot) dot.classList.toggle('is-on', on);
        const p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) { p.hidden = !on; if (on) { p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter'); } }
      });
      if (focus) t.focus();
    };
    ts.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', ev => {
        const k = ev.key; let n = null;
        if (k === 'ArrowDown' || k === 'ArrowRight') n = ts[(i + 1) % ts.length];
        if (k === 'ArrowUp' || k === 'ArrowLeft') n = ts[(i - 1 + ts.length) % ts.length];
        if (k === 'Home') n = ts[0];
        if (k === 'End') n = ts[ts.length - 1];
        if (n) { ev.preventDefault(); select(n, true); }
      });
    });
  }
  const st = $('.stage-tabs'); if (st) tabs(st, '.stage-tab');
  const cp = $('.camps'); if (cp) tabs(cp, '.camp');

  /* ---------- mission cards flip ---------- */
  $$('.mc-flip').forEach(b => b.addEventListener('click', () => {
    const card = b.closest('.mc');
    const on = !card.classList.contains('is-flipped');
    card.classList.toggle('is-flipped', on);
    b.setAttribute('aria-pressed', on);
  }));

  /* ---------- community matcher ---------- */
  const EVENTS = {
    food:     { kind: 'Dinner · table of 6', title: 'Supper club in Hackney', when: 'Fri 19:30 · 2.5 hrs' },
    running:  { kind: 'Run club · group of 8', title: 'Victoria Park loop', when: 'Sun 09:00' },
    climbing: { kind: 'Climbing · group of 6', title: 'Bouldering, then food', when: 'Wed 19:00' },
    startups: { kind: "Leaders' dinner · table of 10", title: 'Dinner in Soho with an experienced founder', when: 'Tue 19:00' },
    jazz:     { kind: 'Whole cohort', title: 'Cohort social in Peckham', when: 'Sat 18:00' },
    film:     { kind: 'Small group · 6', title: 'Late screening, then a drink', when: 'Thu 20:30' },
  };
  const chips = $$('.chip');
  const order = ['food', 'running', 'climbing', 'startups', 'jazz', 'film'];
  const render = () => {
    const on = chips.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.k);
    const pick = on.length ? on[on.length - 1] : 'food';
    const ev = EVENTS[pick];
    const names = on.length ? on : ['food'];
    const why = names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
    const t = $('.ticket');
    t.classList.remove('swap'); void t.offsetWidth; t.classList.add('swap');
    $('[data-t=kind]').textContent = ev.kind;
    $('[data-t=title]').textContent = ev.title;
    $('[data-t=when]').textContent = ev.when;
    $('[data-t=why]').textContent = 'Matched on ' + why + '.';
  };
  chips.forEach(c => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') !== 'true');
    render();
  }));

  /* ---------- waitlist (front end only; not connected to any service) ---------- */
  const form = $('#waitlist');
  if (form) form.addEventListener('submit', ev => {
    ev.preventDefault();
    const name = $('#wl-name'), email = $('#wl-email');
    const okName = name.value.trim().length > 1;
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    [[name, okName, '#wl-name-err'], [email, okEmail, '#wl-email-err']].forEach(([el, ok, err]) => {
      el.setAttribute('aria-invalid', !ok);
      $(err).hidden = ok;
      if (!ok) el.setAttribute('aria-describedby', err.slice(1)); else el.removeAttribute('aria-describedby');
    });
    if (!okName) return name.focus();
    if (!okEmail) return email.focus();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Adding you…';
    // TODO: connect to the real waitlist endpoint once Maiko approves one.
    setTimeout(() => {
      $$('.field, .form-legal, button[type=submit]', form).forEach(el => el.hidden = true);
      const done = $('.wl-done', form); done.hidden = false; done.focus();
    }, 500);
  });

  /* ---------- header state + mobile CTA ---------- */
  const head = $('[data-head]'), mcta = $('[data-mobile-cta]'), hero = $('.hero'), tuition = $('#tuition');
  const onScroll = () => {
    const y = window.scrollY;
    head.classList.toggle('is-scrolled', y > 8); head.classList.toggle('at-top', y <= 8);
    const past = hero.getBoundingClientRect().bottom < 0;
    const atForm = tuition.getBoundingClientRect().top < window.innerHeight && tuition.getBoundingClientRect().bottom > 0;
    mcta.classList.toggle('is-on', past && !atForm);
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- landscape: hero sheets, ridge bands and the trail ----------
     One rAF per scroll. Layout is measured once (and again on resize), so a frame
     only does arithmetic and writes transform/opacity. Under reduced motion the
     whole landscape is drawn in its finished, static state. */
  (() => {
    const ridges = $$('[data-ridge]'), pins = $$('[data-pin]'), trailEl = $('[data-trail]');
    const heroLayers = () => $$('[data-hero-stack] [data-speed]');
    if (!trailEl || pins.length < 2) return;
    const NS = 'http://www.w3.org/2000/svg';
    let L = null, ticking = false, still = reduce.matches;

    const build = () => {
      const de = document.documentElement, vw = de.clientWidth, sy = window.scrollY;
      const w = $('.promise'); const cs = getComputedStyle(w);
      const textLeft = w.getBoundingClientRect().left + parseFloat(cs.paddingLeft);
      const lane = Math.max(12, Math.round(textLeft * 0.46));
      const amp = Math.max(0, Math.min(lane - 6, textLeft - lane - 10, 36));
      de.style.setProperty('--pin-x', lane + 'px');
      // anchors: the foot of each camp pin
      const pts = pins.map(p => { const r = p.getBoundingClientRect(); return r.bottom + sy - 4; });
      const top = pts[0], H = Math.max(1, pts[pts.length - 1] - top);
      // sample x(y): straight through each camp, one gentle switchback between camps
      const step = 6, xs = [];
      for (let y = 0; y <= H; y += step) {
        const py = y + top; let k = 0;
        while (k < pts.length - 2 && py > pts[k + 1]) k++;
        const t = (py - pts[k]) / Math.max(1, pts[k + 1] - pts[k]);
        xs.push(lane + amp * Math.sin(Math.PI * 2 * t) * (k % 2 ? -1 : 1) * Math.sin(Math.PI * t));
      }
      let d = `M${xs[0].toFixed(1)} 0`;
      for (let i = 1; i < xs.length; i++) d += `L${xs[i].toFixed(1)} ${Math.min(H, i * step)}`;
      const W = textLeft;
      const svg = (cls) => { const e = document.createElementNS(NS, 'svg'); e.setAttribute('class', cls); e.setAttribute('width', W); e.setAttribute('height', H); e.setAttribute('viewBox', `0 0 ${W} ${H}`);
        const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); e.append(p); return e; };
      const clip = document.createElement('div'); clip.className = 'trail-clip'; clip.style.width = W + 'px'; clip.style.height = H + 'px';
      const ink = svg('trail-ink'); clip.append(ink);
      const head = document.createElement('span'); head.className = 'trail-head';
      trailEl.style.transform = `translateY(${top}px)`;
      trailEl.replaceChildren(svg('trail-ghost'), clip, head);
      L = {
        top, H, xs, step, clip, ink, head, pts,
        hero: (() => { const h = $('.hero'); return { bottom: h.offsetTop + h.offsetHeight }; })(),
        ridges: ridges.map((r, ri) => { const b = r.getBoundingClientRect(); return { first: ri === 0, top: b.top + sy, h: b.height, layers: $$('.rl', r).map(l => ({ el: l, s: +l.dataset.speed, i: [...l.parentNode.children].indexOf(l) })) }; }),
      };
      frame(true);
    };

    const frame = () => {
      ticking = false;
      if (!L) return;
      const y = window.scrollY, vh = window.innerHeight;
      // 1. trail: reveal from base camp down to a point 62% down the viewport
      const r = still ? L.H : Math.max(0, Math.min(L.H, y + vh * 0.62 - L.top));
      L.clip.style.transform = `translate3d(0,${r - L.H}px,0)`;
      L.ink.style.transform = `translate3d(0,${L.H - r}px,0)`;
      const i = Math.min(L.xs.length - 1, Math.round(r / L.step));
      L.head.style.transform = `translate3d(${L.xs[i].toFixed(1)}px,${r}px,0)`;
      L.head.classList.toggle('is-on', !still && r > 0 && r < L.H);
      pins.forEach((p, k) => p.classList.toggle('is-reached', still || r >= L.pts[k] - L.top - 2));
      if (still) return;
      // 2. hero sheets drift at their own speeds while the hero is on screen
      if (y < L.hero.bottom) heroLayers().forEach(l => { l.style.transform = `translate3d(0,${(y * +l.dataset.speed).toFixed(1)}px,0)`; });
      // 3. ridge bands: parallax around the band's centre, and the back sheets unfold up from behind the front one
      L.ridges.forEach(b => {
        if (b.top > y + vh + 300 || b.top + b.h < y - 300) return;
        const c = (b.top + b.h / 2) - (y + vh / 2);
        const e = Math.max(0, Math.min(1, (y + vh - b.top) / (vh * 0.55)));
        const ease = 1 - Math.pow(1 - e, 3);
        b.layers.forEach(l => {
          const unfold = b.first ? 0 : (1 - ease) * [64, 34, 0][l.i];
          l.el.style.transform = `translate3d(0,${(-c * l.s + unfold).toFixed(1)}px,0)`;
          if (l.i < 2 && !b.first) l.el.style.opacity = (0.25 + 0.75 * ease).toFixed(3);
        });
      });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    const apply = () => {
      still = reduce.matches;
      document.documentElement.classList.toggle('no-motion', still);
      if (still) { heroLayers().forEach(l => l.style.transform = ''); L && L.ridges.forEach(b => b.layers.forEach(l => { l.el.style.transform = ''; l.el.style.opacity = ''; })); }
      frame();
    };
    let rt; const rebuild = () => { clearTimeout(rt); rt = setTimeout(build, 120); };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', rebuild);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe($('main'));
    reduce.addEventListener && reduce.addEventListener('change', apply);
    window.addEventListener('load', build);
    document.fonts && document.fonts.ready.then(build);
    build(); apply();
  })();

  /* ---------- scroll reveals ---------- */
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const els = $$('.h2, .body, .promise-h, .promise-sub, .deck, .route, .cpanels, .q, .person, .matcher, .fit-cols, .steps, .tuition-panel, .faq-list, .recipe-list');
    els.forEach(el => el.classList.add('rv'));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(el => io.observe(el));
  }
};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main); else main();
})();
