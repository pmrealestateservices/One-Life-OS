/* ===================== App shell, routing, sheets ===================== */
const A = {};          // click actions: data-a="name"
const ON = {};         // input/change handlers: data-on="name"
const R = { tab: 'today', sub: null, arg: null, date: null, stack: [] };
const TABS = [['today', 'Today'], ['goals', 'Goals'], ['progress', 'Progress'], ['journal', 'Journal'], ['more', 'More']];
const SCREENS = {};    // name -> () => html

function shell() {
  document.body.innerHTML = `
  <div id="app"><header class="topbar" id="topbar"></header><main id="view"></main></div>
  <button class="fab" id="fab" data-a="quickAdd" aria-label="Add a task">${ICON.plus}</button>
  <div class="tabbar"><nav>${TABS.map(([id, l]) => `<button data-a="tab" data-id="${id}" aria-label="${l}">${ICON[id]}<span>${l}</span></button>`).join('')}</nav></div>`;
}
function go(tab, sub = null, arg = null, push = false) {
  if (push) R.stack.push({ tab: R.tab, sub: R.sub, arg: R.arg, y: scrollY }); else R.stack = [];
  Object.assign(R, { tab, sub, arg });
  render(); scrollTo(0, 0);
}
function back() { const p = R.stack.pop(); if (!p) return go(R.tab); Object.assign(R, p); render(); scrollTo(0, p.y || 0); }
function render() {
  if (R.tab === 'today' && !R.sub) generateDay(R.date || today());
  const key = R.sub || R.tab;
  const scr = SCREENS[key] || SCREENS.today;
  const out = scr();
  $('#topbar').innerHTML = out.top ?? topTitle(out.title || '');
  $('#view').innerHTML = out.html;
  $$('.tabbar button').forEach(b => b.setAttribute('aria-current', b.dataset.id === R.tab ? 'page' : 'false'));
  $('#fab').hidden = !['today', 'goals'].includes(R.tab) || (R.sub && R.sub !== 'goal');
  out.after && out.after();
  setSaveDot(dirty.size > 0);
}
function topTitle(title, backBtn = R.stack.length > 0, right = '') {
  return `<div class="row grow">${backBtn ? `<button class="icon-btn" data-a="back" aria-label="Back">${ICON.back}</button>` : ''}<div class="title grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(title)}</div></div>
  <div class="row">${right}<div class="save-dot" id="saveDot"><i></i><span>Saved</span></div></div>`;
}
A.tab = el => go(el.dataset.id);
A.back = () => back();

/* Sheets */
let sheetClose = null;
function openSheet(title, html, opts = {}) {
  closeSheet(true);
  const s = document.createElement('div');
  s.className = 'scrim'; s.id = 'scrim';
  s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div>
    <div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" data-a="closeSheet" aria-label="Close">${ICON.close}</button></div>
    <div class="stack" id="sheetBody">${html}</div></div>`;
  s.addEventListener('click', e => { if (e.target === s) closeSheet(); });
  document.body.appendChild(s);
  document.body.style.overflow = 'hidden';
  sheetClose = opts.onClose || null;
  opts.after && opts.after($('#sheetBody'));
}
function closeSheet(silent) {
  const s = $('#scrim'); if (!s) return;
  s.remove(); document.body.style.overflow = '';
  const cb = sheetClose; sheetClose = null; stopDictation();
  if (!silent && cb) cb();
}
A.closeSheet = () => closeSheet();

let toastT;
function toast(msg, undo) {
  $('#toast')?.remove(); clearTimeout(toastT);
  const t = document.createElement('div'); t.className = 'toast'; t.id = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button data-a="toastUndo">Undo</button>' : ''}`;
  document.body.appendChild(t); A.toastUndo = () => { undo && undo(); t.remove(); };
  toastT = setTimeout(() => t.remove(), undo ? 5000 : 2600);
}

/* Delegated events (no inline handlers) */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = A[el.dataset.a]; if (!fn) return;
  e.preventDefault(); fn(el, e);
});
document.addEventListener('input', e => { const el = e.target.closest('[data-on]'); if (el && ON[el.dataset.on]) ON[el.dataset.on](el, e); });
document.addEventListener('change', e => { const el = e.target.closest('[data-onchange]'); if (el && ON[el.dataset.onchange]) ON[el.dataset.onchange](el, e); });

/* Small form helpers */
const val = id => { const el = document.getElementById(id); if (!el) return ''; return el.type === 'checkbox' ? el.checked : el.value; };
const pillarSelect = (id, sel, allowNone = true) => `<select id="${id}">${allowNone ? `<option value="" ${!sel ? 'selected' : ''}>General</option>` : ''}${PILLARS.map(p => `<option value="${p.id}" ${sel === p.id ? 'selected' : ''}>${esc(p.short)}</option>`).join('')}</select>`;
const scaleInput = (id, v, max = 5, labels) => `<div class="scale" id="${id}" data-value="${v ?? ''}">${Array.from({ length: max }, (_, i) => `<button type="button" data-a="scalePick" data-v="${i + 1}" aria-pressed="${v === i + 1}" aria-label="${labels ? labels[i] : i + 1}">${i + 1}</button>`).join('')}</div>`;
A.scalePick = el => { const box = el.parentElement; box.dataset.value = el.dataset.v; $$('button', box).forEach(b => b.setAttribute('aria-pressed', b === el)); box.dispatchEvent(new Event('scale', { bubbles: true })); };
const scaleVal = id => { const v = document.getElementById(id)?.dataset.value; return v ? Number(v) : null; };
const toggleRow = (id, label, on, hint = '') => `<label class="toggle"><span class="grow"><span>${esc(label)}</span>${hint ? `<br><span class="tiny faint">${esc(hint)}</span>` : ''}</span><input type="checkbox" class="switch" id="${id}" ${on ? 'checked' : ''}></label>`;
const textArea = (id, value, ph = '', on = '') => `<div class="mic-wrap"><textarea id="${id}" placeholder="${esc(ph)}" ${on ? `data-on="${on}"` : ''}>${esc(value || '')}</textarea>${micBtn(id)}</div>`;
const empty = (title, body, btn = '') => `<div class="empty"><b>${esc(title)}</b><span>${esc(body)}</span>${btn}</div>`;

/* Voice dictation: Web Speech API where available; iOS keyboard mic always works too. */
let rec = null, recTarget = null;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const micBtn = id => SR ? `<button type="button" class="mic" data-a="dictate" data-target="${id}" aria-label="Dictate">${ICON.mic}</button>` : '';
A.dictate = el => {
  if (rec && recTarget === el.dataset.target) return stopDictation();
  stopDictation();
  const ta = document.getElementById(el.dataset.target); if (!ta) return;
  try {
    rec = new SR(); rec.lang = 'en-GB'; rec.continuous = true; rec.interimResults = false; recTarget = el.dataset.target;
    const base = ta.value;
    let finalText = '';
    rec.onresult = ev => { for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript; ta.value = (base ? base + ' ' : '') + finalText.trim(); ta.dispatchEvent(new Event('input', { bubbles: true })); };
    rec.onend = () => { el.classList.remove('on'); rec = null; recTarget = null; };
    rec.onerror = () => { toast('Dictation unavailable here. Use the mic on your keyboard.'); };
    rec.start(); el.classList.add('on');
  } catch (e) { toast('Dictation unavailable here. Use the mic on your keyboard.'); }
};
function stopDictation() { try { rec && rec.stop(); } catch (e) { } rec = null; recTarget = null; $$('.mic.on').forEach(m => m.classList.remove('on')); }

/* Theme */
function applyTheme() {
  const t = S.settings.theme || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
}
