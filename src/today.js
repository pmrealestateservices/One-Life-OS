/* ===================== Today ===================== */
let todayView = 'list';
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
function ringSvg(p, size = 84, stroke = 8) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - (p ?? 0) / 100);
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${stroke}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--gold)" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg>`;
}
function taskRow(t, o = {}) {
  const g = t.goalId && goalOf(t.goalId);
  const conflict = o.date && workConflict(t, o.date);
  return `<div class="task ${t.status}" data-id="${t.id}">
    ${o.num ? `<span class="prio-num">${o.num}</span>` : ''}
    <button class="check" data-a="toggleTask" data-id="${t.id}" aria-label="${t.status === 'done' ? 'Mark not done' : 'Mark done'}: ${esc(t.title)}">${ICON.check}</button>
    <button class="tbody" data-a="openTask" data-id="${t.id}">
      <span class="ttl">${esc(t.title)}</span>
      <span class="meta">${t.pillar ? pillarDot(t.pillar) : ''}${t.time ? `<span class="num">${t.time}</span>` : ''}${t.dur ? `<span>${t.dur} min</span>` : ''}${t.essential ? '<span class="badge ess">Essential</span>' : ''}${t.status === 'skipped' ? `<span>Skipped${t.skipReason ? ' · ' + esc(t.skipReason) : ''}</span>` : ''}${g ? `<span>↳ ${esc(g.title.slice(0, 34))}${g.title.length > 34 ? '…' : ''}</span>` : ''}${conflict ? '<span class="badge warn">During work hours</span>' : ''}</span>
    </button></div>`;
}
SCREENS.today = () => {
  const date = R.date || today(), isToday = date === today();
  const day = getDay(date), st = dayStats(date), pr = prioritiesFor(date);
  const ts = tasksFor(date).filter(t => !pr.ids.includes(t.id));
  const ess = ts.filter(t => t.essential), grow = ts.filter(t => !t.essential);
  const hidden = S.tasks.filter(t => t.date === date).length - tasksFor(date).length;
  const wk = weekStart(date);
  const unsched = S.tasks.filter(t => !t.date && t.weekStart === wk && t.status === 'open');
  const j = S.journal[date];
  const hour = new Date().getHours();
  const top = `<div class="row grow"><button class="icon-btn" data-a="dayShift" data-n="-1" aria-label="Previous day">${ICON.back}</button>
    <button class="btn ghost grow" data-a="dayShift" data-n="0" style="justify-content:center">${isToday ? 'Today · ' : ''}${fmtDate(date, { dow: true })}</button>
    <button class="icon-btn" data-a="dayShift" data-n="1" aria-label="Next day">${ICON.chev}</button></div><div class="save-dot" id="saveDot"><i></i><span>Saved</span></div>`;
  const ringLbl = day.mode === 'rest' && !st.planned ? '<b>Rest</b>' : `<b>${st.pct ?? 0}%</b><span>${st.done}/${st.planned}</span>`;
  const html = `
  <div class="stack">
    <div class="stack-sm">
      <h1>${isToday ? `${greeting()}, ${esc(S.settings.name || 'Paul')}` : fmtLong(date)}</h1>
      <button class="focus" data-a="editFocus" style="background:none;border:0;padding:0;text-align:left">“${esc(focusFor(date))}”</button>
      <span class="tiny faint">${esc(phaseLabel(date))}</span>
    </div>
    <div class="hero">
      <div class="ring" role="img" aria-label="${st.done} of ${st.planned} done">${ringSvg(st.pct)}<div class="lbl">${ringLbl}</div></div>
      <div class="stack-sm grow">
        <b>${day.mode === 'rest' && !st.planned ? 'Rest day' : `${st.done} of ${st.planned} done`}</b>
        ${st.skipped ? `<span class="small muted">${st.skipped} skipped on purpose</span>` : ''}
        ${isToday && day.checkin ? `<button class="row small muted" data-a="checkin" style="background:none;border:0;padding:0;gap:10px;flex-wrap:wrap;text-align:left"><span>Sleep <b class="num">${day.checkin.sleep ?? '—'}h</b></span><span>Energy <b class="num">${day.checkin.energy ?? '—'}/5</b></span><span class="link" style="padding:0;min-height:0">Edit</span></button>` : ''}
      </div>
    </div>
    <div class="seg" role="group" aria-label="Day mode">
      ${[['normal', 'Full day'], ['mvd', 'Minimum day'], ['rest', 'Rest day']].map(([m, l]) => `<button data-a="setMode" data-m="${m}" aria-pressed="${day.mode === m}">${l}</button>`).join('')}
    </div>
    <div class="chips scroll" role="group" aria-label="Work day type">${[['office', 'Office day'], ['remote', 'Remote day'], ['off', 'Day off'], ['leave', 'Leave']].map(([w, l]) => `<button class="chip" data-a="setWork" data-w="${w}" aria-pressed="${day.workType === w}">${l}</button>`).join('')}</div>
    ${day.mode === 'mvd' ? `<div class="callout">Minimum Viable Day: only essentials and a few small habits are shown${hidden ? ` (${hidden} growth items hidden, not counted)` : ''}. That's a win.</div>` : ''}
    ${day.mode === 'rest' ? `<div class="callout">Rest day. Only core rhythms are shown and nothing else counts against you.</div>` : ''}
    ${isToday && !day.checkin ? `<button class="card gold row" data-a="checkin" style="text-align:left;width:100%"><span class="grow"><b>Daily check-in</b><br><span class="small muted">Sleep, energy and today's shape. About 30 seconds.</span></span>${ICON.chev.replace('<svg', '<svg width="20" height="20"')}</button>` : ''}
  </div>

  <section class="section">
    <div class="section-head"><h2>Top three</h2><button class="link" data-a="editPriorities">${pr.custom ? 'Edit' : 'Suggested · Edit'}</button></div>
    ${pr.ids.length ? `<div class="list">${pr.ids.map((id, i) => taskRow(S.tasks.find(t => t.id === id), { num: i + 1, date })).join('')}</div>`
      : `<div class="list">${empty('Nothing to prioritise yet', 'Add a task with +, or schedule one of this week\'s goal actions.')}</div>`}
  </section>

  <section class="section">
    <div class="section-head"><h2>Today</h2>
      <div class="seg" style="width:180px">${[['list', 'List'], ['timeline', 'Timeline']].map(([v, l]) => `<button data-a="todayView" data-v="${v}" aria-pressed="${todayView === v}">${l}</button>`).join('')}</div></div>
    ${todayView === 'list' ? `
      ${ess.length ? `<span class="eyebrow">Essential commitments</span><div class="list">${ess.map(t => taskRow(t, { date })).join('')}</div>` : ''}
      ${grow.length ? `<span class="eyebrow">Growth · optional</span><div class="list">${grow.map(t => taskRow(t, { date })).join('')}</div>` : ''}
      ${!ess.length && !grow.length ? `<div class="list">${empty(date < today() ? 'Nothing was planned for this day' : 'A clear day', date < today() ? 'Past days are never back-filled.' : 'Tap + to add something, or enjoy the space.')}</div>` : ''}`
      : timelineHtml(date)}
  </section>

  ${unsched.length ? `<section class="section"><div class="section-head"><h2>This week, not yet scheduled</h2></div>
    <div class="list">${unsched.map(t => `<div class="task"><span class="grow"><span class="ttl">${esc(t.title)}</span><br><span class="meta">${t.pillar ? pillarDot(t.pillar) : ''}${t.goalId && goalOf(t.goalId) ? esc(goalOf(t.goalId).title.slice(0, 40)) : ''}</span></span><button class="btn sm" data-a="scheduleHere" data-id="${t.id}">${isToday ? 'Do today' : 'This day'}</button></div>`).join('')}</div></section>` : ''}

  <section class="section">
    <div class="row">
      <button class="btn block ${hour < 12 && isToday ? 'primary' : ''}" data-a="openJournal" data-part="morning">${ICON.sun} Morning${j?.morning && Object.values(j.morning).some(Boolean) ? ' ✓' : ''}</button>
      <button class="btn block ${hour >= 17 && isToday ? 'primary' : ''}" data-a="openJournal" data-part="evening">${ICON.moon} Evening reflection${j?.evening && Object.values(j.evening).some(Boolean) ? ' ✓' : ''}</button>
    </div>
  </section>`;
  return { top, html };
};
function timelineHtml(date) {
  const items = scheduleFor(date);
  const untimed = tasksFor(date).filter(t => !t.time);
  if (!items.length && !untimed.length) return `<div class="list">${empty('Nothing scheduled', 'Timed tasks and work hours appear here.')}</div>`;
  return `<div class="tl">${items.map(it => it.task ? `<div class="tl-item"><span class="tl-time">${it.time}</span><div class="list">${taskRow(it.task, { date })}</div></div>`
    : `<div class="tl-item"><span class="tl-time">${it.time || 'All day'}</span><div class="tl-block ${it.fixed ? 'fixed' : ''}" style="border-left-color:${it.pillar ? P[it.pillar].color : 'var(--ink-3)'}"><b>${esc(it.title)}</b>${it.end ? ` <span class="faint num">until ${it.end}</span>` : ''}${it.event ? ' <span class="badge">Calendar</span>' : ''}</div></div>`).join('')}
    ${untimed.length ? `<div class="tl-item"><span class="tl-time">Any time</span><div class="list">${untimed.map(t => taskRow(t, { date })).join('')}</div></div>` : ''}</div>`;
}
A.todayView = el => { todayView = el.dataset.v; render(); };
A.dayShift = el => { const n = Number(el.dataset.n); R.date = n === 0 ? today() : addDays(R.date || today(), n); render(); };
A.setMode = el => {
  const date = R.date || today(), day = getDay(date); day.mode = el.dataset.m; save('days'); render();
  if (day.mode === 'mvd') toast('Minimum Viable Day: essentials only. Growth items aren\'t counted.');
  if (day.mode === 'rest') toast('Rest day set. Nothing here counts against you.');
};
A.setWork = el => { const date = R.date || today(), day = getDay(date); day.workType = el.dataset.w; save('days'); if (date >= today()) regenerateForWorkType(date); render(); };

const LOG_KIND = { workout: 'Workout', keyboard: 'Keyboard practice', trading: 'Trading study', comms: 'Communication drill', cpd: 'CPD / learning' };
A.toggleTask = el => {
  const t = S.tasks.find(x => x.id === el.dataset.id); if (!t) return;
  const was = t.status;
  t.status = t.status === 'done' ? 'open' : 'done'; t.doneAt = t.status === 'done' ? nowIso() : null; delete t.skipReason; touch(t);
  save('tasks'); render();
  if (t.status === 'done' && t.kind && LOG_KIND[t.kind]) {
    toast(`Done. Log ${LOG_KIND[t.kind].toLowerCase()} details?`); const btn = document.createElement('button'); btn.textContent = 'Log'; btn.dataset.a = 'logFromTask'; btn.dataset.id = t.id; $('#toast')?.appendChild(btn);
  } else if (t.status === 'done') { if (navigator.vibrate) navigator.vibrate(8); }
  else if (was === 'done') toast('Marked not done');
};
A.logFromTask = el => { const t = S.tasks.find(x => x.id === el.dataset.id); $('#toast')?.remove(); openLog(t.kind, { mins: t.dur, date: t.date, taskId: t.id }); };
A.scheduleHere = el => { const t = S.tasks.find(x => x.id === el.dataset.id); t.date = R.date || today(); touch(t); save('tasks'); render(); toast('Scheduled'); };

function goalOptions(sel) { return `<option value="">No linked goal</option>${S.goals.filter(g => g.status !== 'done').map(g => `<option value="${g.id}" ${sel === g.id ? 'selected' : ''}>${esc(P[g.pillar]?.short || '')} · ${esc(g.title)}</option>`).join('')}`; }
A.quickAdd = (el) => {
  const gid = el?.dataset?.goal || (R.sub === 'goal' ? R.arg : '');
  const g = gid && goalOf(gid);
  openSheet('Add', `
    <input type="text" id="qaTitle" placeholder="What needs doing?" autocomplete="off" enterkeyhint="done">
    <div class="chips" id="qaWhen">${[['today', 'Today'], ['tomorrow', 'Tomorrow'], ['week', 'This week'], ['date', 'Pick date']].map(([v, l], i) => `<button class="chip" data-a="qaWhen" data-v="${v}" aria-pressed="${g ? v === 'week' : i === 0}">${l}</button>`).join('')}</div>
    <div class="field-row" id="qaDateRow" hidden><label class="f">Date<input type="date" id="qaDate" value="${addDays(today(), 2)}"></label><span></span></div>
    <div class="field-row"><label class="f">Area${pillarSelect('qaPillar', g ? g.pillar : '')}</label><label class="f">Time (optional)<input type="time" id="qaTime"></label></div>
    <label class="f">Linked goal<select id="qaGoal">${goalOptions(gid)}</select></label>
    ${toggleRow('qaEss', 'Essential commitment', false, 'Shown even on a Minimum Viable Day')}
    <button class="btn primary block" data-a="qaSave">Add</button>`, { after: b => setTimeout(() => $('#qaTitle', b).focus(), 250) });
  $('#qaTitle').addEventListener('keydown', e => { if (e.key === 'Enter') A.qaSave(); });
};
A.qaWhen = el => { $$('#qaWhen .chip').forEach(c => c.setAttribute('aria-pressed', c === el)); $('#qaDateRow').hidden = el.dataset.v !== 'date'; };
A.qaSave = () => {
  const title = val('qaTitle').trim(); if (!title) { $('#qaTitle').focus(); return; }
  const when = $('#qaWhen [aria-pressed="true"]').dataset.v; const base = R.date || today();
  const date = when === 'today' ? base : when === 'tomorrow' ? addDays(base, 1) : when === 'date' ? val('qaDate') : null;
  const goalId = val('qaGoal'); const g = goalId && goalOf(goalId);
  S.tasks.push(touch({ id: uid('t'), title, pillar: val('qaPillar') || (g ? g.pillar : ''), date, weekStart: date ? weekStart(date) : weekStart(base), time: val('qaTime') || null, dur: null, essential: val('qaEss'), goalId: goalId || null, status: 'open', source: when === 'week' ? 'weekly' : 'manual', createdAt: nowIso() }));
  save('tasks'); closeSheet(); render(); toast(date ? `Added to ${date === today() ? 'today' : fmtDate(date, { dow: true })}` : 'Added to this week');
};
A.openTask = el => {
  const t = S.tasks.find(x => x.id === el.dataset.id); if (!t) return;
  const date = R.date || today(); const isPrio = prioritiesFor(t.date || date).ids.includes(t.id);
  openSheet('Task', `
    <input type="text" id="tTitle" value="${esc(t.title)}">
    <div class="field-row"><label class="f">Area${pillarSelect('tPillar', t.pillar)}</label><label class="f">Date<input type="date" id="tDate" value="${t.date || ''}"></label></div>
    <div class="field-row"><label class="f">Time<input type="time" id="tTime" value="${t.time || ''}"></label><label class="f">Minutes (estimate)<input type="number" inputmode="numeric" id="tDur" value="${t.dur ?? ''}"></label></div>
    <label class="f">Linked goal<select id="tGoal">${goalOptions(t.goalId)}</select></label>
    ${toggleRow('tEss', 'Essential commitment', t.essential)}
    <label class="f">Notes${textArea('tNotes', t.notes, 'Optional')}</label>
    <button class="btn primary block" data-a="tSave" data-id="${t.id}">Save</button>
    <span class="eyebrow">Reschedule</span>
    <div class="chips"><button class="chip" data-a="tMove" data-id="${t.id}" data-to="tomorrow">Tomorrow</button><button class="chip" data-a="tMove" data-id="${t.id}" data-to="week">Later this week</button><button class="chip" data-a="tMove" data-id="${t.id}" data-to="nextweek">Next week</button>${t.date ? `<button class="chip" data-a="togglePrio" data-id="${t.id}">${isPrio ? 'Remove from top three' : 'Make a top-three priority'}</button>` : ''}</div>
    <span class="eyebrow">Skip on purpose (not counted against you)</span>
    <div class="chips">${['Rest', 'Unavoidable change', 'Deprioritised', 'Ill / recovering'].map(r => `<button class="chip" data-a="tSkip" data-id="${t.id}" data-r="${r}" aria-pressed="${t.skipReason === r}">${r}</button>`).join('')}</div>
    ${t.status === 'skipped' ? `<button class="btn block" data-a="tUnskip" data-id="${t.id}">Undo skip</button>` : ''}
    <button class="btn ghost danger block" data-a="tDelete" data-id="${t.id}">${ICON.trash} Delete task</button>
    ${t.routineId ? '<p class="tiny faint">This came from a routine. Edit routines in More → Routines.</p>' : ''}`);
};
A.tSave = el => {
  const t = S.tasks.find(x => x.id === el.dataset.id);
  Object.assign(t, { title: val('tTitle').trim() || t.title, pillar: val('tPillar'), date: val('tDate') || null, time: val('tTime') || null, dur: val('tDur') ? Number(val('tDur')) : null, goalId: val('tGoal') || null, essential: val('tEss'), notes: val('tNotes') });
  if (t.date) t.weekStart = weekStart(t.date);
  touch(t); save('tasks'); closeSheet(); render(); toast('Saved');
};
A.tMove = el => {
  const t = S.tasks.find(x => x.id === el.dataset.id), base = t.date || today();
  if (el.dataset.to === 'tomorrow') { t.date = addDays(base, 1); }
  else if (el.dataset.to === 'week') { t.date = null; t.weekStart = weekStart(base); }
  else { t.date = null; t.weekStart = addDays(weekStart(base), 7); }
  if (t.date) t.weekStart = weekStart(t.date);
  t.status = 'open'; t.anchor = false; t.rescheduled = (t.rescheduled || 0) + 1; touch(t); save('tasks'); closeSheet(); render(); toast('Rescheduled');
};
A.tSkip = el => { const t = S.tasks.find(x => x.id === el.dataset.id); t.status = 'skipped'; t.skipReason = el.dataset.r; touch(t); save('tasks'); closeSheet(); render(); toast('Skipped on purpose'); };
A.tUnskip = el => { const t = S.tasks.find(x => x.id === el.dataset.id); t.status = 'open'; delete t.skipReason; touch(t); save('tasks'); closeSheet(); render(); };
A.tDelete = el => {
  const i = S.tasks.findIndex(x => x.id === el.dataset.id); const [t] = S.tasks.splice(i, 1);
  tombstone('tasks', t.id); save('tasks'); closeSheet(); render();
  toast('Task deleted', () => { S.tasks.push(t); untombstone(t.id); save('tasks'); render(); });
};
A.togglePrio = el => {
  const t = S.tasks.find(x => x.id === el.dataset.id), day = getDay(t.date);
  let ids = prioritiesFor(t.date).ids.slice();
  ids = ids.includes(t.id) ? ids.filter(x => x !== t.id) : [t.id, ...ids].slice(0, 3);
  day.priorities = ids; save('days'); closeSheet(); render();
};
A.editPriorities = () => {
  const date = R.date || today(), cur = prioritiesFor(date).ids;
  const ts = tasksFor(date).filter(t => t.status !== 'skipped');
  openSheet('Top three', `<p class="small muted">Pick up to three. Suggestions favour goal-linked actions, goals at risk and areas you haven't touched this week.</p>
    <div class="list">${ts.map(t => `<label class="task"><input type="checkbox" class="switch" data-prio="${t.id}" ${cur.includes(t.id) ? 'checked' : ''}><span class="grow"><span class="ttl">${esc(t.title)}</span><br><span class="meta">${t.pillar ? pillarDot(t.pillar) : ''}${t.time || ''}</span></span></label>`).join('') || empty('No tasks today', 'Add one with +')}</div>
    <div class="row"><button class="btn block" data-a="prioReset">Use suggestions</button><button class="btn primary block" data-a="prioSave">Save</button></div>`);
};
A.prioSave = () => { const ids = $$('[data-prio]').filter(c => c.checked).map(c => c.dataset.prio).slice(0, 3); getDay(R.date || today()).priorities = ids; save('days'); closeSheet(); render(); };
A.prioReset = () => { getDay(R.date || today()).priorities = null; save('days'); closeSheet(); render(); };
A.editFocus = () => {
  const date = R.date || today(), day = getDay(date);
  openSheet('Daily focus', `<input type="text" id="focusIn" value="${esc(day.focus || '')}" placeholder="${esc(focusFor(date))}">
  <p class="tiny faint">Leave blank to use your morning journal answer or the quarter's theme.</p><button class="btn primary block" data-a="focusSave">Save</button>`);
};
A.focusSave = () => { getDay(R.date || today()).focus = val('focusIn').trim(); save('days'); closeSheet(); render(); };
A.checkin = () => {
  const date = today(), c = getDay(date).checkin || {};
  openSheet('Daily check-in', `
    <label class="f">Hours slept <b class="num" id="slpOut">${c.sleep ?? 7}</b><input type="range" id="ciSleep" min="3" max="10" step="0.5" value="${c.sleep ?? 7}" data-on="slp"></label>
    <label class="f">Energy</label>${scaleInput('ciEnergy', c.energy, 5, ['Drained', 'Low', 'OK', 'Good', 'Great'])}
    <label class="f">Body and recovery</label>${scaleInput('ciRecovery', c.recovery)}
    <label class="f">Overall wellbeing</label>${scaleInput('ciWell', c.wellbeing)}
    <label class="f">Anything on your mind? (optional)<input type="text" id="ciNote" value="${esc(c.note || '')}"></label>
    <button class="btn primary block" data-a="ciSave">Save check-in</button>
    <p class="tiny faint" id="ciHint"></p>`);
};
ON.slp = el => { $('#slpOut').textContent = el.value; };
A.ciSave = () => {
  const day = getDay(today());
  day.checkin = { sleep: Number(val('ciSleep')), energy: scaleVal('ciEnergy'), recovery: scaleVal('ciRecovery'), wellbeing: scaleVal('ciWell'), note: val('ciNote'), at: nowIso() };
  save('days'); closeSheet();
  if ((day.checkin.energy && day.checkin.energy <= 2) || day.checkin.sleep < 6) {
    openSheet('Lighter day?', `<p>Low energy or short sleep. A Minimum Viable Day keeps essentials and a few small habits, and nothing else counts.</p>
    <div class="row"><button class="btn block" data-a="closeSheet">Keep full day</button><button class="btn primary block" data-a="setMode" data-m="mvd">Switch to Minimum</button></div>`);
    A.setMode = (orig => el => { closeSheet(true); A.setMode = orig; orig(el); })(A.setMode);
  }
  render();
};
