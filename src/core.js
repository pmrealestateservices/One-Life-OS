'use strict';
/* ===================== Utilities ===================== */
const APP_VERSION = '1.0.0';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ds(new Date());
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ds(d); };
const addMonths = (s, n) => { const d = pd(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return ds(d); };
const dow = s => pd(s).getDay(); // 0 Sun
const weekStart = s => addDays(s, -((dow(s) + 6) % 7)); // Monday
const monthKey = s => s.slice(0, 7);
const daysBetween = (a, b) => Math.round((pd(b) - pd(a)) / 864e5);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtDate = (s, o = {}) => { const d = pd(s); return `${o.dow ? DOW[d.getDay()] + ' ' : ''}${d.getDate()} ${MON[d.getMonth()]}${o.year ? ' ' + d.getFullYear() : ''}`; };
const fmtLong = s => { const d = pd(s); return `${DOWL[d.getDay()]} ${d.getDate()} ${MONL[d.getMonth()]}`; };
const fmtMonth = k => { const [y, m] = k.split('-').map(Number); return `${MONL[m - 1]} ${y}`; };
const toMin = t => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = m => `${pad(Math.floor(((m % 1440) + 1440) % 1440 / 60))}:${pad(((m % 60) + 60) % 60)}`;
const nowIso = () => new Date().toISOString();
const money = v => (v == null || v === '' || isNaN(v)) ? '—' : '£' + Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });
const pct = (a, b) => b ? Math.round(a / b * 100) : null;
const sum = a => a.reduce((x, y) => x + (Number(y) || 0), 0);

/* ===================== Icons (inline SVG, stroke) ===================== */
const I = (p, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
const ICON = {
  today: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  goals: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
  progress: I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  journal: I('<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>'),
  more: I('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'stroke-width="2.6"'),
  chev: I('<path d="M9 6l6 6-6 6"/>'),
  back: I('<path d="M15 6l-6 6 6 6"/>'),
  close: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  mic: I('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  moon: I('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 3v1M12 20v1M3 12h1M20 12h1"/>'),
  cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  brief: I('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'),
  home: I('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  pound: I('<path d="M17 20H7c2-1.5 2.5-4 2-7M6 13h8M15 7.5A3.5 3.5 0 0 0 8.5 6C8 8 9 11 9 13"/>'),
  log: I('<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="18" cy="17" r="3"/>'),
  repeat: I('<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  cloud: I('<path d="M7 18a5 5 0 1 1 1.6-9.7A6 6 0 0 1 20 11a4 4 0 0 1-1 7z"/><path d="M12 12v6M9.5 14.5L12 12l2.5 2.5"/>'),
  download: I('<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>'),
  phone: I('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
  star: I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
  edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  skip: I('<path d="M5 5l9 7-9 7zM18 5v14"/>'),
  people: I('<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 5.5 5"/>'),
  lock: I('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  music: I('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  book: I('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>'),
};

/* ===================== Pillars ===================== */
const PILLARS = [
  { id: 'faith', name: 'Faith, Marriage & Service', short: 'Faith & Family', color: 'var(--p-faith)' },
  { id: 'pro', name: 'Professional Excellence — DVS', short: 'Professional', color: 'var(--p-pro)' },
  { id: 'biz', name: 'Business, Property & Wealth', short: 'Business', color: 'var(--p-biz)' },
  { id: 'comms', name: 'Communication & Leadership', short: 'Communication', color: 'var(--p-comms)' },
  { id: 'health', name: 'Health & Performance', short: 'Health', color: 'var(--p-health)' },
  { id: 'skills', name: 'Skills & Creative Development', short: 'Skills', color: 'var(--p-skills)' },
];
const P = Object.fromEntries(PILLARS.map(p => [p.id, p]));
const pillarDot = id => `<span class="dot" style="background:${P[id]?.color || 'var(--ink-3)'}"></span>`;

const WORKSPACES = [
  { id: 'pmres', name: 'PMRes', blurb: 'Consultancy, investor services, acquisitions, development, refurbishment, disposals' },
  { id: 'pio', name: 'Property Is One', blurb: 'Education, content, audience development, knowledge sharing' },
  { id: 'origin', name: 'Origin Property', blurb: 'Potential joint venture with a business partner' },
  { id: 'ghana', name: 'Ghana portfolio', blurb: 'Family assets, four-apartment development, future opportunities' },
];
const GOAL_STATUS = { notstarted: ['Not started', ''], ontrack: ['On track', 'ok'], atrisk: ['At risk', 'warn'], offtrack: ['Needs attention', 'bad'], paused: ['Paused', ''], done: ['Achieved', 'ok'] };

/* ===================== Persistent store (IndexedDB) ===================== */
const COLLECTIONS = ['settings', 'goals', 'milestones', 'routines', 'tasks', 'days', 'journal', 'competencies', 'projects', 'finance', 'logs', 'reviews', 'events', 'sync'];
const S = {}; // in-memory state, one entry per collection
const IDB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('IndexedDB unavailable'));
      const r = indexedDB.open('one-life-os', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  get(k) { return new Promise((res, rej) => { const t = this.db.transaction('kv').objectStore('kv').get(k); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); },
  put(k, v) { return new Promise((res, rej) => { const tx = this.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); },
};
let memoryOnly = false;
const dirty = new Set();
let saveTimer = null;
function defaults(k) {
  return ({ settings: {}, days: {}, journal: {}, finance: { targets: [], entries: [] }, sync: { map: {}, deleted: [] } })[k] ?? [];
}
async function loadAll() {
  try { await IDB.open(); } catch (e) { memoryOnly = true; }
  for (const k of COLLECTIONS) {
    let v = null;
    if (!memoryOnly) { try { v = await IDB.get(k); } catch (e) { v = null; } }
    S[k] = v ?? defaults(k);
  }
}
function save(...keys) {
  keys.forEach(k => dirty.add(k));
  setSaveDot(true);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 250);
}
async function flush() {
  const keys = [...dirty]; dirty.clear();
  if (memoryOnly) { setSaveDot(false, 'Not saved — storage blocked'); return; }
  try {
    for (const k of keys) await IDB.put(k, JSON.parse(JSON.stringify(S[k])));
    setSaveDot(false);
  } catch (e) { keys.forEach(k => dirty.add(k)); setSaveDot(false, 'Save failed — retrying'); setTimeout(flush, 2000); }
}
window.addEventListener('pagehide', () => { if (dirty.size) flush(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && dirty.size) flush(); });
function setSaveDot(pending, msg) {
  const el = $('#saveDot'); if (!el) return;
  el.classList.toggle('pending', !!pending);
  el.querySelector('span').textContent = msg || (pending ? 'Saving' : 'Saved');
}
const touch = r => { r.updatedAt = nowIso(); return r; };

/* ===================== Year cycle & quarters ===================== */
const PHASES = [
  { q: 1, name: 'Foundations and consistency' },
  { q: 2, name: 'Professional development and validated business launch activity' },
  { q: 3, name: 'Execution, measurable progress and financial capacity' },
  { q: 4, name: 'Consolidation, evaluation and preparation for future scaling' },
];
const yearStart = () => S.settings.yearStart || '2026-10-14';
function cycleFor(date) { // returns {start, end, label, n}
  const base = yearStart();
  let n = 0; let start = base;
  if (date < base) { while (date < start) { n--; start = addMonths(base, 12 * n); } }
  else { while (addMonths(base, 12 * (n + 1)) <= date) n++; start = addMonths(base, 12 * n); }
  const end = addDays(addMonths(start, 12), -1);
  return { start, end, n, label: `${pd(start).getFullYear()}–${String(pd(end).getFullYear()).slice(2)}` };
}
function quarterOf(date) {
  const c = cycleFor(date);
  for (let q = 1; q <= 4; q++) {
    const s = addMonths(c.start, (q - 1) * 3), e = addDays(addMonths(c.start, q * 3), -1);
    if (date >= s && date <= e) return { q, start: s, end: e, cycle: c, phase: PHASES[q - 1].name };
  }
  return { q: 4, start: c.start, end: c.end, cycle: c, phase: PHASES[3].name };
}
function quarterRange(cycleStart, q) { return { start: addMonths(cycleStart, (q - 1) * 3), end: addDays(addMonths(cycleStart, q * 3), -1) }; }

function phaseLabel(date) {
  if (date < yearStart()) return `Year one starts ${fmtDate(yearStart(), { dow: true })} · Q1 ${PHASES[0].name}`;
  const q = quarterOf(date); return `Q${q.q} · ${q.phase}`;
}
