/* ===================== PIN lock ===================== */
async function hashPin(pin, salt) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin)); return b64(d); }
function showLock() {
  return new Promise(resolve => {
    let entry = '', fails = 0;
    const el = document.createElement('div'); el.className = 'lock'; el.id = 'lock';
    const draw = (msg = '') => { el.innerHTML = `<div class="wordmark">One Life OS</div><h2>Enter your PIN</h2><div class="pin-dots">${[0, 1, 2, 3].map(i => `<i class="${i < entry.length ? 'f' : ''}"></i>`).join('')}</div><p class="small" style="color:var(--bad);min-height:1.2em">${msg}</p>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button data-k="${k}" aria-label="${k === '⌫' ? 'Delete' : k}">${k}</button>`).join('')}</div>
      <p class="tiny faint" style="max-width:280px;text-align:center">Forgot it? Data stays locked on this device. You can reinstall and restore from a backup.</p>`; };
    draw(); document.body.appendChild(el);
    el.addEventListener('click', async e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
      if (k === '⌫') entry = entry.slice(0, -1); else if (entry.length < 4) entry += k;
      draw();
      if (entry.length === 4) {
        if (await hashPin(entry, S.settings.pinSalt) === S.settings.pinHash) { el.remove(); resolve(); }
        else { fails++; entry = ''; draw(fails >= 5 ? 'Too many attempts. Wait 30 seconds.' : 'Incorrect PIN'); if (fails >= 5) { el.style.pointerEvents = 'none'; setTimeout(() => { el.style.pointerEvents = ''; fails = 0; draw(); }, 30000); } }
      }
    });
  });
}
A.setPin = () => openSheet('Set a 4-digit PIN', `<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" id="pin1" placeholder="New PIN"><input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" id="pin2" placeholder="Repeat PIN"><button class="btn primary block" data-a="savePin">Save PIN</button>`);
A.savePin = async () => {
  const a = val('pin1'), b = val('pin2'); if (!/^\d{4}$/.test(a)) return toast('Use exactly 4 digits'); if (a !== b) return toast('PINs do not match');
  S.settings.pinSalt = uid(); S.settings.pinHash = await hashPin(a, S.settings.pinSalt); save('settings'); closeSheet(); if ($('#view')) render(); toast('PIN set');
};
A.removePin = () => { delete S.settings.pinHash; delete S.settings.pinSalt; save('settings'); if ($('#view')) render(); toast('PIN removed'); };

/* ===================== Onboarding (under 5 minutes) ===================== */
const OB = { step: 0, o: { name: 'Paul', wifeName: '', officeDays: [2, 4], workStart: '09:00', workEnd: '17:00', commute: 45, wake: '06:00', bedtime: '22:30', bibleDay: 1, bibleTime: '19:30', churchTime: '10:00', dateNight: 5, yearStart: '2026-10-14' }, goals: STARTER_GOALS.filter(g => g.on).map(g => g.key) };
function obRead() {
  const o = OB.o; const g = id => document.getElementById(id);
  if (g('obName')) { o.name = g('obName').value; o.wifeName = g('obWife').value; }
  if (g('obWs')) { o.workStart = g('obWs').value; o.workEnd = g('obWe').value; o.commute = g('obCommute').value; o.officeDays = $$('#obOffice [aria-pressed="true"]').map(b => Number(b.dataset.d)); }
  if (g('obWake')) { o.wake = g('obWake').value; o.bedtime = g('obBed').value; o.bibleDay = g('obBibleDay').value; o.bibleTime = g('obBibleTime').value; o.churchTime = g('obChurch').value; o.dateNight = g('obDate').value; }
  if (g('obGoals')) OB.goals = $$('#obGoals input:checked').map(c => c.dataset.k);
}
function renderOnboarding() {
  const o = OB.o, s = OB.step;
  const daySel = (id, v, days = [0, 1, 2, 3, 4, 5, 6]) => `<select id="${id}">${days.map(d => `<option value="${d}" ${Number(v) === d ? 'selected' : ''}>${DOWL[d]}</option>`).join('')}</select>`;
  const steps = [
    `<h1>Welcome to ONE LIFE OS</h1><p class="muted">Vision to daily action, in one calm place. Setup takes about three minutes, and you can change everything later.</p>
     <label class="f">Your name<input type="text" id="obName" value="${esc(o.name)}"></label><label class="f">Your wife's name (optional, used for reminders)<input type="text" id="obWife" value="${esc(o.wifeName)}"></label>`,
    `<h1>Your working week</h1><p class="muted">The planner keeps growth tasks out of working hours.</p>
     <label class="f">Usual office days</label><div class="chips" id="obOffice">${[1, 2, 3, 4, 5].map(d => `<button class="chip" data-a="lgChip" data-d="${d}" aria-pressed="${o.officeDays.includes(d)}">${DOW[d]}</button>`).join('')}</div>
     <div class="field-row"><label class="f">Work starts<input type="time" id="obWs" value="${o.workStart}"></label><label class="f">Work ends<input type="time" id="obWe" value="${o.workEnd}"></label></div>
     <label class="f">Commute each way on office days (minutes)<input type="number" inputmode="numeric" id="obCommute" value="${o.commute}"></label>`,
    `<h1>Your rhythm</h1><p class="muted">These become protected commitments.</p>
     <div class="field-row"><label class="f">Wake<input type="time" id="obWake" value="${o.wake}"></label><label class="f">Bedtime target<input type="time" id="obBed" value="${o.bedtime}"></label></div>
     <div class="field-row"><label class="f">Bible study day${daySel('obBibleDay', o.bibleDay)}</label><label class="f">Starts<input type="time" id="obBibleTime" value="${o.bibleTime}"></label></div>
     <label class="f">Sunday church (keyboard) starts<input type="time" id="obChurch" value="${o.churchTime}"></label>
     <label class="f">Date night${daySel('obDate', o.dateNight)}</label>`,
    `<h1>Starter goals</h1><p class="muted">Sensible starting points for ${cycleFor(yearStart()).label}, each with quarterly milestones. Nothing is marked as achieved. Untick anything that doesn't fit and edit the rest later.</p>
     <div class="stack-sm" id="obGoals">${PILLARS.map(p => `<span class="eyebrow">${esc(p.name)}</span><div class="list">${STARTER_GOALS.filter(g => g.pillar === p.id).map(g => `<label class="task"><input type="checkbox" class="switch" data-k="${g.key}" ${OB.goals.includes(g.key) ? 'checked' : ''}><span class="grow small">${esc(g.title)}</span></label>`).join('')}</div>`).join('')}</div>`,
    `<h1>Privacy and data</h1>
     <div class="callout">Everything is saved on this phone as you go. You can download backups any time, and turn on encrypted cloud backup and Notion sync in More.</div>
     <div class="callout">This is a personal app. Don't enter DVS case details, client information or government documents. Keep learning notes general.</div>
     <button class="btn block" data-a="setPin">${ICON.lock} Set a PIN (optional)</button>`,
  ];
  document.body.innerHTML = `<div id="app" class="ob"><div class="stack"><div class="wordmark">One Life OS</div><div class="steps">${steps.map((_, i) => `<i class="${i <= s ? 'on' : ''}"></i>`).join('')}</div>${steps[s]}
    <div class="row" style="margin-top:8px">${s ? '<button class="btn block" data-a="obBack">Back</button>' : ''}<button class="btn primary block" data-a="obNext">${s === steps.length - 1 ? 'Start my plan' : 'Continue'}</button></div></div></div>`;
}
A.obNext = () => { obRead(); if (OB.step < 4) { OB.step++; renderOnboarding(); scrollTo(0, 0); return; } finishOnboarding(); };
A.obBack = () => { obRead(); OB.step--; renderOnboarding(); };
async function finishOnboarding() {
  seedFromOnboarding(OB.o, OB.goals);
  try { navigator.storage && navigator.storage.persist && await navigator.storage.persist(); } catch (e) { }
  await flush();
  startApp();
  toast('Your plan is ready');
}

/* ===================== Boot ===================== */
function startApp() {
  shell(); applyTheme(); R.date = null; go('today');
  setTimeout(autoJobs, 2500);
}
async function boot() {
  await loadAll();
  applyTheme();
  if (memoryOnly) document.title = 'ONE LIFE OS (not saving)';
  if (!S.settings.onboarded) { renderOnboarding(); return; }
  if (S.settings.pinHash) { document.body.innerHTML = ''; await showLock(); }
  startApp();
  if (memoryOnly) toast('Storage is blocked in this browser, so changes will not be saved.');
}
let lastDay = today();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && S.settings.onboarded && $('#view')) {
    if (today() !== lastDay) { lastDay = today(); if (!R.sub) { R.date = null; render(); } }
  }
});
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { toast('Update ready. Reopen the app to use it.'); } }); });
  }).catch(() => { });
}
boot();
