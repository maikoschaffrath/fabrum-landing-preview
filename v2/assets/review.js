/* Review comments for preview builds. Off for launch: set REVIEW_MODE: false in config.js
   (or delete this file and its <script> tag). ?review=0 in the URL also turns it off.
   Notes live in localStorage, so they survive reloads; "Copy all notes" exports plain text. */
(() => {
  const cfg = window.FABRUM_CONFIG || {};
  if (!cfg.REVIEW_MODE || new URLSearchParams(location.search).get('review') === '0') return;
  const start = () => {
  const KEY = 'fabrum-review-notes-v1';
  const PAGE = document.documentElement.dataset.reviewPage || (document.title.split('·')[0].trim() || location.pathname);
  let mem = [];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return mem; } };
  const save = a => { mem = a; try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = `
.rv-ui{font:500 15px/1.4 var(--display,system-ui,sans-serif);color:#121A2C;-webkit-font-smoothing:antialiased}
.rv-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:9990;display:flex;align-items:center;gap:8px;min-height:44px;padding:0 16px 0 14px;border-radius:999px;border:1.5px solid #121A2C;background:#F2E8D8;color:#121A2C;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 6px 18px -8px rgba(18,26,44,.5)}
.rv-fab:hover{background:#E8DCC7}
.rv-fab[aria-pressed=true]{background:#121A2C;color:#F2E8D8}
.rv-fab svg{width:18px;height:18px}
.rv-count{min-width:20px;height:20px;border-radius:10px;background:#E2632E;color:#121A2C;font:700 12px/20px var(--mono,monospace);text-align:center;padding:0 5px}
.rv-count:empty{display:none}
@media (max-width:860px){.rv-fab{right:12px;bottom:calc(84px + env(safe-area-inset-bottom));min-height:40px;padding:0 12px;font-size:13px;opacity:.94}}
.rv-bar{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:9991;display:none;align-items:center;gap:12px;padding:8px 8px 8px 16px;border-radius:999px;background:#121A2C;color:#F2E8D8;font-size:14px;box-shadow:0 8px 24px -10px rgba(18,26,44,.6);max-width:calc(100vw - 24px)}
.review-on .rv-bar{display:flex}
.rv-bar span{white-space:nowrap}
@media (max-width:860px){.rv-bar{top:72px;font-size:13px;gap:8px;padding:6px 6px 6px 12px}}
.rv-bar button{all:unset;cursor:pointer;padding:6px 12px;border-radius:999px;background:#2C3A55;font-weight:700;font-size:13px;white-space:nowrap}
.rv-bar button:focus-visible,.rv-ui button:focus-visible{outline:3px solid #E2632E;outline-offset:2px}
.review-on body,.review-on body *{cursor:crosshair}
.review-on .rv-ui,.review-on .rv-ui *{cursor:auto}
.review-on .rv-ui button{cursor:pointer}
.rv-pins{position:absolute;left:0;top:0;width:0;height:0;z-index:9980;display:none}
.review-on .rv-pins,.rv-list-open .rv-pins{display:block}
.rv-pin{position:absolute;width:28px;height:28px;margin:-28px 0 0 -4px;border-radius:14px 14px 14px 2px;background:#E2632E;color:#121A2C;border:2px solid #F2E8D8;font:700 12px/24px var(--mono,monospace);text-align:center;box-shadow:0 3px 8px rgba(18,26,44,.35);cursor:pointer;padding:0}
.rv-pin.is-draft{background:#F4D38E}
.rv-pop{position:absolute;z-index:9995;width:min(300px,calc(100vw - 24px));background:#F2E8D8;border:1.5px solid #121A2C;border-radius:14px;padding:12px;box-shadow:0 14px 32px -12px rgba(18,26,44,.55)}
.rv-pop p{margin:0 0 8px;font-size:12px;color:#44536E;font-family:var(--mono,monospace);text-transform:uppercase;letter-spacing:.04em}
.rv-pop textarea,.rv-copy textarea{width:100%;min-height:84px;box-sizing:border-box;border:1.5px solid #A9B0BE;border-radius:8px;padding:8px 10px;font:inherit;font-size:15px;background:#FBF6EC;color:#121A2C;resize:vertical}
.rv-pop textarea:focus{outline:none;border-color:#E2632E;box-shadow:0 0 0 3px rgba(226,99,46,.25)}
.rv-row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.rv-btn{all:unset;cursor:pointer;padding:8px 14px;border-radius:999px;font-weight:800;font-size:13px;border:1.5px solid #121A2C;color:#121A2C}
.rv-btn--main{background:#E2632E;border-color:#E2632E}
.rv-btn--quiet{border-color:transparent;text-decoration:underline;text-underline-offset:.2em}
.rv-list{position:fixed;right:16px;bottom:calc(72px + env(safe-area-inset-bottom));z-index:9993;width:min(380px,calc(100vw - 24px));max-height:min(70vh,560px);display:none;flex-direction:column;background:#F2E8D8;border:1.5px solid #121A2C;border-radius:16px;box-shadow:0 18px 40px -14px rgba(18,26,44,.6)}
.rv-list-open .rv-list{display:flex}
@media (max-width:860px){.rv-list{right:12px;left:12px;width:auto;bottom:calc(132px + env(safe-area-inset-bottom))}}
.rv-list header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;border-bottom:1px solid #CDBFA6}
.rv-list h2{margin:0;font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:.02em}
.rv-items{list-style:none;margin:0;padding:6px 14px;overflow:auto;flex:1}
.rv-items li{padding:10px 0;border-bottom:1px solid #CDBFA6}
.rv-items li:last-child{border-bottom:0}
.rv-meta{font:500 11px/1.3 var(--mono,monospace);text-transform:uppercase;letter-spacing:.04em;color:#44536E}
.rv-note{margin:4px 0 6px;white-space:pre-wrap}
.rv-items .rv-row{margin-top:0}
.rv-items .rv-btn{padding:4px 10px;font-size:12px}
.rv-empty{color:#44536E;font-size:14px;padding:8px 0}
.rv-foot{padding:12px 14px;border-top:1px solid #CDBFA6;display:flex;gap:8px;flex-wrap:wrap}
.rv-copy{margin-top:10px}
.rv-copy p{font-size:13px;margin:0 0 6px;color:#44536E}
.rv-toast{position:fixed;left:50%;bottom:calc(140px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9999;background:#121A2C;color:#F2E8D8;padding:10px 16px;border-radius:999px;font-weight:700;font-size:14px;opacity:0;transition:opacity .25s;pointer-events:none}
.rv-toast.on{opacity:1}
@media print{.rv-ui,.rv-pins{display:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);

  const ui = document.createElement('div'); ui.className = 'rv-ui'; ui.setAttribute('data-review-ui', '');
  ui.innerHTML = `
<button class="rv-fab" type="button" aria-pressed="false" aria-label="Comment mode"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span class="rv-fab-l">Comment</span><span class="rv-count"></span></button>
<div class="rv-bar" role="status"><span>Tap to pin a note</span><button type="button" data-act="list">Notes</button><button type="button" data-act="exit">Done</button></div>
<section class="rv-list" aria-label="Review notes"><header><h2>Review notes</h2><button class="rv-btn rv-btn--quiet" type="button" data-act="close">Close</button></header>
<ol class="rv-items"></ol><div class="rv-foot"><button class="rv-btn rv-btn--main" type="button" data-act="copy">Copy all notes</button><button class="rv-btn" type="button" data-act="mode">Add a note</button></div><div class="rv-copy-wrap"></div></section>
<div class="rv-toast" aria-live="polite"></div>`;
  document.body.append(ui);
  const pins = document.createElement('div'); pins.className = 'rv-pins'; pins.setAttribute('data-review-ui', ''); document.body.append(pins);
  const html = document.documentElement, fab = ui.querySelector('.rv-fab'), list = ui.querySelector('.rv-list'), items = ui.querySelector('.rv-items');
  const toast = m => { const t = ui.querySelector('.rv-toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2200); };

  /* where a click landed: section (id + heading), nearest text, and x/y as a % of that section */
  const sectionOf = el => el.closest('article[id], section[id]') || el.closest('article, section, header, footer') || document.querySelector('main') || document.body;
  const headingOf = sec => { const h = sec.querySelector('h1, h2, h3, .wordmark'); return h ? h.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : ''; };
  const snippetOf = el => {
    let n = el;
    while (n && n !== document.body) {
      const t = (n.innerText || n.textContent || '').replace(/\s+/g, ' ').trim();
      if (t.length >= 3) return t.length > 120 ? t.slice(0, 117) + '…' : t;
      n = n.parentElement;
    }
    return '';
  };
  const secEl = note => (note.section && document.getElementById(note.section)) || [...document.querySelectorAll('section, article, header, footer')].find(s => headingOf(s) === note.heading) || document.body;
  const place = note => {
    const s = secEl(note), r = s.getBoundingClientRect();
    return { left: r.left + scrollX + r.width * note.x / 100, top: r.top + scrollY + r.height * note.y / 100 };
  };

  let mode = false, draft = null, pop = null;
  const pageNotes = () => load().filter(n => n.page === PAGE);
  const render = () => {
    const mine = pageNotes();
    fab.querySelector('.rv-count').textContent = mine.length || '';
    pins.innerHTML = '';
    mine.forEach(n => { const b = document.createElement('button'); b.type = 'button'; b.className = 'rv-pin'; b.textContent = n.n; b.dataset.id = n.id;
      b.setAttribute('aria-label', `Note ${n.n}: ${n.note}`); const p = place(n); b.style.left = p.left + 'px'; b.style.top = p.top + 'px'; pins.append(b); });
    if (draft) { const b = document.createElement('span'); b.className = 'rv-pin is-draft'; b.textContent = draft.n; const p = place(draft); b.style.left = p.left + 'px'; b.style.top = p.top + 'px'; pins.append(b); }
    const all = load();
    items.innerHTML = all.length ? all.map(n => `<li data-id="${n.id}"><div class="rv-meta">#${n.n} · ${esc(n.page)} · ${esc(n.heading || n.section || 'page')}</div><p class="rv-note">${esc(n.note)}</p>
<div class="rv-row">${n.page === PAGE ? '<button class="rv-btn" type="button" data-act="goto">Show</button>' : ''}<button class="rv-btn" type="button" data-act="edit">Edit</button><button class="rv-btn rv-btn--quiet" type="button" data-act="del">Delete</button></div></li>`).join('')
      : '<li class="rv-empty">No notes yet. Press “Add a note”, then tap the page where you want it.</li>';
  };
  const setMode = on => { mode = on; html.classList.toggle('review-on', on); fab.setAttribute('aria-pressed', on); closePop(); render(); };
  const closePop = () => { if (pop) pop.remove(); pop = null; if (draft) { draft = null; render(); } };

  const openPop = (note, isNew) => {
    if (pop) pop.remove();
    pop = document.createElement('div'); pop.className = 'rv-pop rv-ui'; pop.setAttribute('data-review-ui', ''); pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', `Note ${note.n}`);
    pop.innerHTML = `<p>#${note.n} · ${esc(note.heading || note.section || 'page')}</p><textarea aria-label="Your note" placeholder="What should change here?">${esc(note.note || '')}</textarea>
<div class="rv-row"><button class="rv-btn rv-btn--main" type="button" data-act="save">Save</button><button class="rv-btn" type="button" data-act="cancel">Cancel</button>${isNew ? '' : '<button class="rv-btn rv-btn--quiet" type="button" data-act="delete">Delete</button>'}</div>`;
    document.body.append(pop);
    const p = place(note), w = pop.offsetWidth, vw = document.documentElement.clientWidth;
    pop.style.left = Math.max(12 + scrollX, Math.min(p.left - 16, scrollX + vw - w - 12)) + 'px'; pop.style.top = (p.top + 10) + 'px';
    const ta = pop.querySelector('textarea'); ta.focus({ preventScroll: true });
    pop.addEventListener('click', ev => {
      ev.stopPropagation();
      const a = ev.target.closest('[data-act]'); if (!a) return;
      const all = load();
      if (a.dataset.act === 'save') {
        const text = ta.value.trim(); if (!text) { ta.focus(); return; }
        const i = all.findIndex(x => x.id === note.id);
        if (i >= 0) all[i].note = text; else all.push(Object.assign(note, { note: text }));
        save(all); draft = null; pop.remove(); pop = null; render(); toast(`Note ${note.n} saved`);
      } else if (a.dataset.act === 'delete') { save(all.filter(x => x.id !== note.id)); pop.remove(); pop = null; render(); toast('Note deleted'); }
      else closePop();
    });
    ta.addEventListener('keydown', ev => { if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') pop.querySelector('[data-act=save]').click(); });
  };

  /* in comment mode, a click anywhere on the page drops a pin (and doesn't follow links or press buttons) */
  document.addEventListener('click', ev => {
    if (!mode || ev.target.closest('[data-review-ui]')) return;
    ev.preventDefault(); ev.stopPropagation();
    if (pop) { closePop(); return; }
    const sec = sectionOf(ev.target), r = sec.getBoundingClientRect();
    const all = load(), n = all.reduce((m, x) => Math.max(m, x.n), 0) + 1;
    draft = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), n, page: PAGE, section: sec.id || '', heading: headingOf(sec), snippet: snippetOf(ev.target),
      viewport: `${innerWidth}×${innerHeight}`, x: +((ev.clientX - r.left) / Math.max(1, r.width) * 100).toFixed(2), y: +((ev.clientY - r.top) / Math.max(1, r.height) * 100).toFixed(2),
      url: location.pathname.split('/').pop() || 'index.html', created: new Date().toISOString(), note: '' };
    render(); openPop(draft, true);
  }, true);

  const asText = () => {
    const all = load(), when = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    return `Fabrum review notes (${all.length}), copied ${when}\n\n` + all.map(n =>
      `#${n.n} · ${n.page} · ${n.heading || '(no heading)'}${n.section ? ` (#${n.section})` : ''}\nNear: “${n.snippet}”\nNote: ${n.note}\n(${n.viewport}, ${n.x}% across, ${n.y}% down the section)`).join('\n\n') + '\n';
  };
  const showFallback = text => {
    const w = ui.querySelector('.rv-copy-wrap');
    w.innerHTML = `<div class="rv-copy" style="padding:0 14px 14px"><p>Copying was blocked here. Select the text below and copy it.</p><textarea readonly></textarea></div>`;
    const ta = w.querySelector('textarea'); ta.value = text; ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
  };
  const copyAll = async () => {
    const text = asText();
    try { if (!navigator.clipboard || !window.isSecureContext) throw 0; await navigator.clipboard.writeText(text); toast('Notes copied'); ui.querySelector('.rv-copy-wrap').innerHTML = ''; }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:-9999px'; document.body.append(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
      ta.remove();
      if (ok) toast('Notes copied'); else showFallback(text);
    }
  };

  ui.addEventListener('click', ev => {
    const a = ev.target.closest('[data-act]');
    if (ev.target.closest('.rv-fab')) { setMode(!mode); return; }
    if (!a) return;
    const act = a.dataset.act, li = a.closest('li[data-id]'), all = load(), note = li && all.find(x => x.id === li.dataset.id);
    if (act === 'exit') setMode(false);
    else if (act === 'list') { html.classList.add('rv-list-open'); render(); }
    else if (act === 'close') { html.classList.remove('rv-list-open'); ui.querySelector('.rv-copy-wrap').innerHTML = ''; }
    else if (act === 'mode') { html.classList.remove('rv-list-open'); setMode(true); }
    else if (act === 'copy') copyAll();
    else if (act === 'del' && note) { save(all.filter(x => x.id !== note.id)); render(); }
    else if ((act === 'edit' || act === 'goto') && note) {
      if (note.page !== PAGE) { const t = prompt(`Edit note #${note.n}`, note.note); if (t != null && t.trim()) { note.note = t.trim(); save(all); render(); } return; }
      const p = place(note); scrollTo({ top: Math.max(0, p.top - innerHeight / 2), behavior: 'smooth' });
      if (act === 'edit') setTimeout(() => openPop(note, false), 350);
    }
  });
  pins.addEventListener('click', ev => { const b = ev.target.closest('.rv-pin[data-id]'); if (!b) return; ev.stopPropagation(); const n = load().find(x => x.id === b.dataset.id); if (n) openPop(n, false); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if (pop) closePop(); else if (mode) setMode(false); else html.classList.remove('rv-list-open'); } });
  let rt; const re = () => { clearTimeout(rt); rt = setTimeout(render, 150); };
  addEventListener('resize', re); addEventListener('load', render); if ('ResizeObserver' in window) new ResizeObserver(re).observe(document.body);
  addEventListener('storage', ev => { if (ev.key === KEY) render(); });
  render();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
