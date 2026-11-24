// Manifesto: header state, Didi's art slots, chapter reveals, scene parallax, the timeline and the year counter.
// One rAF per scroll; layout is measured once (and on resize). transform and opacity only.
(() => { const main = () => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('js');

  /* art slots: manifesto-ch1..8 (and manifesto-cta, else ch8's art) from sync-illustrations.sh replace the torn-paper scenes */
  const slots = (window.FABRUM_ILLUSTRATIONS || {}).slots || {};
  $$('.scene[data-slot]').forEach(fig => {   // the closing panel's scene
    const f = slots[fig.dataset.slot] || (fig.dataset.slot === 'manifesto-cta' && slots['manifesto-ch8']); if (!f) return;
    const pic = document.createElement('picture');
    if (f.webp && f.png) { const s = document.createElement('source'); s.type = 'image/webp'; s.srcset = f.webp; pic.append(s); }
    const img = new Image(); img.src = f.png || f.webp; img.loading = 'lazy'; img.decoding = 'async'; img.alt = fig.dataset.alt || '';
    if (f.w) { img.width = f.w; img.height = f.h; }
    pic.append(img);
    img.addEventListener('load', () => { pic.style.cssText = ''; fig.replaceChildren(pic); fig.classList.add('has-art'); fig.removeAttribute('aria-hidden'); }, { once: true });
    pic.style.cssText = 'position:absolute;opacity:0;pointer-events:none'; fig.append(pic);
  });

  /* the student stage: Didi's manifesto-ch<n>-bg + -group layers, or one manifesto-ch<n> image, replace the SVG era */
  const stage = $('[data-stage]');
  const pictureFor = (f, alt) => {
    const pic = document.createElement('picture');
    if (f.webp && f.png) { const s = document.createElement('source'); s.type = 'image/webp'; s.srcset = f.webp; pic.append(s); }
    const img = new Image(); img.loading = 'lazy'; img.src = f.png || f.webp; img.decoding = 'async'; img.alt = alt || '';
    if (f.w) { img.width = f.w; img.height = f.h; }
    pic.append(img); return { pic, img };
  };
  // the picture waits inside its layer (a lazy image only loads once it is in the document), then replaces the SVG
  const swapIn = (el, f) => { const { pic, img } = pictureFor(f); pic.style.cssText = 'position:absolute;inset:0;opacity:0';
    const go = () => { pic.style.cssText = ''; el.replaceChildren(pic); }; img.addEventListener('load', go, { once: true }); el.append(pic); };
  const art = [];   // per era: true when Didi's -bg/-group pair is in
  if (stage) for (let n = 1; n <= 8; n++) {
    const one = slots[`manifesto-ch${n}`], bgA = slots[`manifesto-ch${n}-bg`], grA = slots[`manifesto-ch${n}-group`];
    const bg = $(`.st-bg[data-n="${n}"]`, stage), gr = $(`.st-grp[data-n="${n}"]`, stage), pr = $(`.st-pr[data-n="${n}"]`, stage);
    if (bgA && grA) { swapIn(bg, bgA); swapIn(gr, grA); pr.replaceChildren(); art[n - 1] = true; }
    else if (one) { swapIn(bg, one); gr.replaceChildren(); pr.replaceChildren(); }
  }

  /* header: transparent over the navy hero, solid once you scroll */
  const head = $('[data-head]');
  const onHead = () => { const y = window.scrollY; head.classList.toggle('is-scrolled', y > 8); head.classList.toggle('at-top', y <= 8); };
  window.addEventListener('scroll', onHead, { passive: true }); onHead();

  /* chapter reveals */
  const chs = $$('.ch');
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: .12 });
    chs.forEach(c => io.observe(c));
  } else chs.forEach(c => c.classList.add('in'));

  /* year counter: ticks from the last year to the next */
  const num = $('[data-num]'), place = $('[data-place]'), dots = $$('.tl-dot');
  let shown = +(chs[0] && chs[0].dataset.year) || 0, active = -1, tick = 0;
  const setActive = k => {
    if (k === active) return; active = k;
    dots.forEach((d, i) => { d.classList.toggle('is-on', i <= k); d.classList.toggle('is-now', i === k); });
    const c = chs[Math.max(0, k)]; if (!c) return;
    place.textContent = c.dataset.place;
    const to = +c.dataset.year, from = shown, label = c.dataset.label;
    cancelAnimationFrame(tick);
    if (reduce.matches || from === to) { num.textContent = label; shown = to; return; }
    const t0 = performance.now(), dur = Math.min(900, 300 + Math.abs(to - from) * 1.2);
    const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      shown = Math.round(from + (to - from) * e); num.textContent = p < 1 ? shown : label; if (p < 1) tick = requestAnimationFrame(step); };
    tick = requestAnimationFrame(step);
  };

  /* scroll frame: timeline ink, active chapter, scene + hero parallax */
  const ink = $('[data-ink]'), tl = $('.tl'), mobile = window.matchMedia('(max-width: 860px)');
  let L = null, ticking = false;
  const measure = () => {
    const sy = window.scrollY, top = r => r.getBoundingClientRect().top + sy;
    L = { tlTop: top(chs[0]), tlEnd: top(chs[chs.length - 1]) + chs[chs.length - 1].offsetHeight * .5,
          chTops: chs.map(c => top(c)),
          scenes: $$('.ch .scene').map(s => ({ top: top(s), h: s.offsetHeight, ls: $$('.sl', s).map(l => ({ el: l, d: +l.dataset.d })) })),
          hero: $$('.msl').map(l => ({ el: l, d: +l.dataset.d })), heroH: $('.m-hero').offsetHeight,
          stageBottom: stage ? stage.offsetTop + 0 : 0 };
    if (stage) { const f = $('.stage-frame', stage).getBoundingClientRect(); L.bandBottom = mobile.matches ? parseFloat(getComputedStyle(stage).top) + f.height : 0; }
    lastF = -1;
    frame();
  };
  const frame = () => {
    ticking = false; if (!L) return;
    const y = window.scrollY, vh = window.innerHeight, still = reduce.matches;
    const p = Math.max(0, Math.min(1, (y + vh * .5 - L.tlTop) / Math.max(1, L.tlEnd - L.tlTop)));
    ink.style.transform = mobile.matches ? `scaleX(${still ? 1 : p.toFixed(4)})` : `scaleY(${still ? 1 : p.toFixed(4)})`;
    let k = 0; L.chTops.forEach((t, i) => { if (y + vh * .55 >= t) k = i; }); setActive(k);
    if (stage) morph(y, vh, k, still);
    if (still) return;
    L.scenes.forEach(s => {
      if (s.top > y + vh + 200 || s.top + s.h < y - 200) return;
      const c = ((s.top + s.h / 2) - (y + vh / 2)) / vh;          // -1 .. 1 around the viewport centre
      s.ls.forEach(l => { l.el.style.transform = `translate3d(0,${(c * l.d * 46).toFixed(1)}px,0)`; });
    });
    if (y < L.heroH) L.hero.forEach(l => { l.el.style.transform = `translate3d(0,${(y * l.d).toFixed(1)}px,0)`; });
  };
  /* the morph: f runs 0..7 through the chapters; each boundary crossfades the setting (sliding), the group
     (same five marks, a small dip in scale) and swaps the props. transform and opacity only. */
  let lastF = -1, capN = 0;
  const st = stage ? { bg: $$('.st-bg', stage), gr: $$('.st-grp', stage), pr: $$('.st-pr', stage), wrap: $('[data-group]', stage), cap: $('[data-cap]', stage),
                       caps: JSON.parse(stage.dataset.caps), gt: JSON.parse(stage.dataset.gt), frame: $('.stage-frame', stage) } : null;
  if (st) {
    const D = k => JSON.parse(stage.dataset[k]);
    const capsArt = D('capsArt'), panel = D('panel'), panelArt = D('panelArt'), seated = D('seated');
    st.caps = st.caps.map((c, i) => art[i] ? capsArt[i] : c);
    st.panel = panel.map((c, i) => (art[i] ? panelArt[i] : c).match(/\w\w/g).map(h => parseInt(h, 16)));
    st.seated = seated.map((v, i) => art[i] ? v : 0);
    st.cap.textContent = st.caps[0];
  }
  const ss = (a, b, x) => { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  const put = (el, on, o, tf) => {
    if (el._on !== on) { el._on = on; el.style.visibility = on ? 'visible' : 'hidden'; el.style.willChange = on ? 'transform, opacity' : 'auto'; }
    if (!on) return;
    const so = o.toFixed(3); if (el._o !== so) { el._o = so; el.style.opacity = so; }
    if (el._t !== tf) { el._t = tf; el.style.transform = tf; }
  };
  const morph = (y, vh, k, still) => {
    let f;
    if (still) f = Math.max(0, k);
    else {
      const anchor = mobile.matches ? y + L.bandBottom + (vh - L.bandBottom) * .32 : y + vh * .55, Z = vh * (mobile.matches ? .42 : .5);
      f = 0; for (let i = 1; i < L.chTops.length; i++) f += Math.max(0, Math.min(1, (anchor - (L.chTops[i] - Z * .5)) / Z));
    }
    if (Math.abs(f - lastF) < .0004) return; lastF = f;
    const e = Math.min(7, Math.floor(f)), t = f - e, s = t * t * (3 - 2 * t);
    // sitting <-> standing: heads move ~5% of the frame, so the outgoing group sinks (or rises) toward the new pose
    const sa = st.seated[e] > 0, sb = st.seated[Math.min(7, e + 1)] > 0, pose = !still && sa !== sb, drop = pose ? (sb ? 5 : -5) : 0;
    const pa = st.panel[e], pb = st.panel[Math.min(7, e + 1)], bgc = `rgb(${pa.map((v, j) => Math.round(v + (pb[j] - v) * s)).join(',')})`;
    if (st.frame._c !== bgc) { st.frame._c = bgc; st.frame.style.backgroundColor = bgc; }
    for (let i = 0; i < 8; i++) {
      const cur = i === e, nxt = i === e + 1 && t > 0;
      if (cur) {
        put(st.bg[i], true, 1, `translate3d(${(-s * 4).toFixed(2)}%,0,0) scale(${(1.06 - .03 * s).toFixed(4)})`);
        put(st.gr[i], true, 1 - (pose ? ss(.2, .8, t) : ss(.3, .9, t)), `translate3d(0,calc(${(s * 8).toFixed(1)}px + ${(drop * s).toFixed(2)}%),0)`);
        put(st.pr[i], true, 1 - ss(0, .45, t), `translate3d(0,${(ss(0, .45, t) * 28).toFixed(1)}px,0)`);
      } else if (nxt) {
        put(st.bg[i], true, ss(0, .75, t), `translate3d(${((1 - s) * 6).toFixed(2)}%,0,0) scale(${(1.03 + .03 * s).toFixed(4)})`);
        put(st.gr[i], true, pose ? ss(.2, .8, t) : ss(.15, .75, t), `translate3d(0,calc(${((1 - s) * -8).toFixed(1)}px - ${(drop * (1 - s)).toFixed(2)}%),0)`);
        const p = ss(.55, 1, t); put(st.pr[i], true, p, `translate3d(0,${((1 - p) * 28).toFixed(1)}px,0)`);
      } else { put(st.bg[i], false); put(st.gr[i], false); put(st.pr[i], false); }
    }
    const a = st.gt[e], b = st.gt[Math.min(7, e + 1)], dip = Math.sin(Math.PI * t);
    const gx = a[0] + (b[0] - a[0]) * s, gy = a[1] + (b[1] - a[1]) * s + dip * 6, gs = (a[2] + (b[2] - a[2]) * s) * (1 - .035 * dip);
    const tf = still ? 'none' : `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0) scale(${gs.toFixed(4)})`;
    if (st.wrap._t !== tf) { st.wrap._t = tf; st.wrap.style.transform = tf; }
    const c = Math.min(7, Math.round(f)); if (c !== capN) { capN = c; st.cap.textContent = st.caps[c]; }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  const reset = () => { if (reduce.matches) { $$('.sl,.msl').forEach(l => l.style.transform = ''); chs.forEach(c => c.classList.add('in')); } measure(); };
  let rt; const re = () => { clearTimeout(rt); rt = setTimeout(measure, 120); };
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', re);
  if ('ResizeObserver' in window) new ResizeObserver(re).observe($('main'));
  reduce.addEventListener && reduce.addEventListener('change', reset);
  window.addEventListener('load', measure); document.fonts && document.fonts.ready.then(measure);
  measure();
};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main); else main();
})();
