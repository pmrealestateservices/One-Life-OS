/* ===================== Journal & reviews ===================== */
let jPart = null;
const PROMPTS = {
  morning: [['matters', 'What matters most today?'], ['grateful', 'What am I grateful for?'], ['action', 'What is one action that will move me forward?']],
  evening: [['accomplished', 'What did I accomplish?'], ['learned', 'What did I learn?'], ['challenged', 'What challenged me?'], ['improve', 'What should I improve tomorrow?']],
};
A.openJournal = el => { jPart = el.dataset.part; R.jDate = R.date || today(); go('journal'); };
SCREENS.journal = () => {
  const date = R.jDate || today();
  const part = jPart || (new Date().getHours() < 14 ? 'morning' : 'evening');
  const j = S.journal[date] || {};
  const recent = Object.keys(S.journal).filter(d => d !== date && hasJournal(S.journal[d])).sort().reverse().slice(0, 20);
  const html = `<div class="stack">
    <div class="row"><button class="icon-btn" data-a="jShift" data-n="-1" aria-label="Previous day">${ICON.back}</button><button class="btn ghost grow" data-a="jShift" data-n="0">${date === today() ? 'Today · ' : ''}${fmtDate(date, { dow: true, year: date.slice(0, 4) !== today().slice(0, 4) })}</button><button class="icon-btn" data-a="jShift" data-n="1" aria-label="Next day" ${date >= today() ? 'disabled' : ''}>${ICON.chev}</button></div>
    <div class="seg">${[['morning', 'Morning'], ['evening', 'Evening'], ['notes', 'Notes']].map(([p, l]) => `<button data-a="jPart" data-p="${p}" aria-pressed="${part === p}">${l}</button>`).join('')}</div>
    ${part === 'notes' ? `<label class="f">Free notes, ideas, prayers, sermon notes${textArea('j_notes_text', j.notes, 'Write or dictate…', 'jInput')}</label>
      <label class="f">Leadership reflection (optional)${textArea('j_notes_leader', j.leader, 'A conversation, a decision, how I led…', 'jInput')}</label>`
      : PROMPTS[part].map(([k, q]) => `<label class="f"><span style="font-family:var(--serif);font-size:1.05rem;color:var(--navy)">${q}</span>${textArea(`j_${part}_${k}`, j[part]?.[k], '', 'jInput')}</label>`).join('')}
    <p class="tiny faint">Saves as you type. Use the microphone to dictate. Keep employer-confidential details out.</p>
  </div>
  <section class="section"><div class="section-head"><h2>Reviews</h2></div>
    <div class="row"><button class="btn block" data-a="newReview" data-t="weekly">Weekly</button><button class="btn block" data-a="newReview" data-t="monthly">Monthly</button><button class="btn block" data-a="newReview" data-t="quarterly">Quarterly</button></div>
    <div class="list">${S.reviews.length ? S.reviews.slice().sort((a, b) => b.start.localeCompare(a.start)).slice(0, 12).map(r => `<button class="menu-item" data-a="openReview" data-id="${r.id}"><span class="grow"><b>${r.type[0].toUpperCase() + r.type.slice(1)} review</b><br><span class="small faint num">${fmtDate(r.start)} – ${fmtDate(r.end, { year: true })}</span></span>${ICON.chev.replace('<svg', '<svg class="chev"')}</button>`).join('') : empty('No reviews yet', 'Your Sunday weekly review builds a summary from what you actually recorded.')}</div>
  </section>
  <section class="section"><div class="section-head"><h2>Past entries</h2></div>
    <div class="list">${recent.length ? recent.map(d => `<button class="menu-item" data-a="jGo" data-d="${d}"><span class="grow"><b>${fmtDate(d, { dow: true })}</b><br><span class="small faint">${esc(journalPreview(S.journal[d]).slice(0, 80))}</span></span></button>`).join('') : empty('Nothing yet', 'Entries you write appear here.')}</div>
  </section>`;
  return { title: 'Journal', html };
};
function hasJournal(j) { return j && (Object.values(j.morning || {}).some(Boolean) || Object.values(j.evening || {}).some(Boolean) || j.notes || j.leader); }
function journalPreview(j) { return [j.morning?.matters, j.evening?.accomplished, j.notes, j.morning?.grateful].filter(Boolean)[0] || ''; }
A.jShift = el => { const n = Number(el.dataset.n); R.jDate = n === 0 ? today() : addDays(R.jDate || today(), n); if (R.jDate > today()) R.jDate = today(); render(); };
A.jPart = el => { jPart = el.dataset.p; render(); };
A.jGo = el => { R.jDate = el.dataset.d; scrollTo(0, 0); render(); };
ON.jInput = el => {
  const date = R.jDate || today(); const [, part, key] = el.id.split('_');
  const j = S.journal[date] = S.journal[date] || { id: date, date };
  if (part === 'notes') { j[key === 'text' ? 'notes' : 'leader'] = el.value; }
  else { j[part] = j[part] || {}; j[part][key] = el.value; }
  touch(j); save('journal');
};

/* Facts computed from saved records only */
function facts(start, end) {
  const last = end > today() ? today() : end;
  const dates = []; for (let d = start; d <= last; d = addDays(d, 1)) dates.push(d);
  let planned = 0, done = 0, skipped = 0, restDays = 0, activeDays = 0;
  const byP = {}; PILLARS.forEach(p => byP[p.id] = { planned: 0, done: 0 });
  for (const d of dates) {
    const s = dayStats(d); planned += s.planned; done += s.done; skipped += s.skipped;
    if (S.days[d]?.mode === 'rest') restDays++;
    tasksFor(d).filter(t => t.status !== 'skipped').forEach(t => { if (byP[t.pillar]) { byP[t.pillar].planned++; if (t.status === 'done') byP[t.pillar].done++; } });
    if (s.done || hasJournal(S.journal[d]) || S.days[d]?.checkin) activeDays++;
  }
  const inR = x => x >= start && x <= end;
  const logs = S.logs.filter(l => inR(l.date));
  const lk = k => logs.filter(l => l.kind === k);
  const checkins = dates.map(d => S.days[d]?.checkin).filter(Boolean);
  const avg = k => { const v = checkins.map(c => c[k]).filter(x => x != null); return v.length ? Math.round(sum(v) / v.length * 10) / 10 : null; };
  const lightsOut = S.tasks.filter(t => inR(t.date || '') && t.anchor && /^Lights out/.test(t.title) && t.status !== 'skipped');
  return {
    days: dates.length, activeDays, restDays, planned, done, skipped, completion: pct(done, planned), byPillar: byP,
    workouts: lk('workout').length || S.tasks.filter(t => inR(t.date || '') && t.kind === 'workout' && t.status === 'done').length,
    workoutMins: sum(lk('workout').map(l => l.mins)), keyboardMins: sum(lk('keyboard').map(l => l.mins)), tradingMins: sum(lk('trading').map(l => l.mins)),
    drills: lk('comms').length, cpdHours: Math.round(sum(lk('cpd').map(l => l.mins)) / 6) / 10, cpdFormalHours: Math.round(sum(lk('cpd').filter(l => l.formal).map(l => l.mins)) / 6) / 10,
    journalDays: dates.filter(d => hasJournal(S.journal[d])).length,
    milestonesDone: S.milestones.filter(m => m.done && m.doneAt && inR(m.doneAt.slice(0, 10))).length,
    avgSleep: avg('sleep'), avgEnergy: avg('energy'), checkins: checkins.length,
    bedtime: lightsOut.length ? pct(lightsOut.filter(t => t.status === 'done').length, lightsOut.length) : null,
  };
}
function suggestions(f) {
  const out = [];
  if (!f.planned) return ['Not enough recorded activity yet to suggest anything. Keep logging and check back next week.'];
  PILLARS.forEach(p => { const b = f.byPillar[p.id]; if (p.id !== 'faith' && b.planned >= 3 && b.done / b.planned < 0.5) out.push(`${p.short}: ${b.done} of ${b.planned} planned items done. Consider planning fewer, fixed sessions next week rather than more.`); });
  if (f.skipped > f.planned * 0.3) out.push('Many items were skipped. The plan may be too full for this season. Try trimming optional growth items.');
  if (f.bedtime != null && f.bedtime < 60) out.push(`Bedtime kept on ${f.bedtime}% of nights. Moving the wind-down earlier by 15 minutes may help.`);
  if (f.avgSleep != null && f.avgSleep < 6.5) out.push(`Average sleep ${f.avgSleep}h. Protect sleep before adding anything new.`);
  if (f.completion != null && f.completion >= 85) out.push('Strong follow-through. You have room to add one stretch action next week if you want it.');
  if (!f.drills) out.push('No communication drills recorded. One 10-minute drill is enough to keep the habit alive.');
  if (!f.journalDays) out.push('No journal entries yet. A one-line evening answer counts.');
  return out.length ? out : ['Steady period. Keep the same shape next week.'];
}
function periodFor(type) {
  const t = today();
  if (type === 'weekly') { const ws = weekStart(t); const s = dow(t) === 0 || dow(t) >= 5 ? ws : addDays(ws, -7); return { start: s, end: addDays(s, 6) }; }
  if (type === 'monthly') { const first = monthKey(t) + '-01'; const s = pd(t).getDate() >= 25 ? first : addMonths(first, -1); return { start: s, end: addDays(addMonths(s, 1), -1) }; }
  const q = quarterOf(t); const usePrev = daysBetween(t, q.end) > 14; const qq = usePrev ? quarterOf(addDays(q.start, -1)) : q; return { start: qq.start, end: qq.end };
}
A.newReview = el => {
  const type = el.dataset.t, p = periodFor(type);
  let r = S.reviews.find(x => x.type === type && x.start === p.start);
  if (!r) { r = touch({ id: uid('rv'), type, ...p, self: {}, createdAt: nowIso() }); S.reviews.push(r); save('reviews'); }
  go('journal', 'review', r.id, true);
};
A.openReview = el => go('journal', 'review', el.dataset.id, true);
SCREENS.review = () => {
  const r = S.reviews.find(x => x.id === R.arg); if (!r) { R.sub = null; return SCREENS.journal(); }
  const f = facts(r.start, r.end), sg = suggestions(f), s = r.self || {};
  r.facts = f; r.suggestions = sg; // snapshot kept for export/sync
  const fl = (k, v) => `<div class="row between"><span class="muted">${k}</span><b class="num">${v ?? '—'}</b></div>`;
  const html = `<div class="stack">
    <div class="stack-sm"><span class="eyebrow">${r.type} review</span><h1>${fmtDate(r.start)} – ${fmtDate(r.end, { year: true })}</h1></div>
    <div class="card stack-sm"><div class="row between"><h3>Facts</h3><span class="badge fact">From your records</span></div>
      ${fl('Completion (excl. skips)', f.completion != null ? f.completion + '%' : null)}${fl('Done / planned', `${f.done} / ${f.planned}`)}${fl('Skipped on purpose', f.skipped)}${fl('Active days', `${f.activeDays} of ${f.days}`)}${fl('Rest days', f.restDays)}
      ${fl('Workouts', f.workouts)}${fl('Keyboard practice', f.keyboardMins ? f.keyboardMins + ' min' : null)}${fl('Trading study', f.tradingMins ? f.tradingMins + ' min' : null)}${fl('Communication drills', f.drills)}${fl('CPD logged', f.cpdHours ? `${f.cpdHours} h (${f.cpdFormalHours} formal)` : null)}
      ${fl('Journal days', f.journalDays)}${fl('Milestones achieved', f.milestonesDone)}${fl('Average sleep', f.avgSleep != null ? f.avgSleep + ' h' : null)}${fl('Average energy', f.avgEnergy != null ? f.avgEnergy + ' / 5' : null)}${fl('Bedtime kept', f.bedtime != null ? f.bedtime + '%' : null)}
      <hr class="sep"><span class="eyebrow">By area</span>${PILLARS.map(p => { const b = f.byPillar[p.id]; return b.planned ? `<div class="row">${pillarDot(p.id)}<span class="grow small">${esc(p.short)}</span><span class="small num">${b.done}/${b.planned}</span></div>` : ''; }).join('') || '<span class="small faint">No planned items in this period.</span>'}
    </div>
    <div class="card stack"><div class="row between"><h3>Self-assessment</h3><span class="badge self">Self-reported</span></div>
      <label class="f">Wins${textArea('rv_wins', s.wins, '', 'rvInput')}</label>
      <label class="f">Lessons and what to change${textArea('rv_lessons', s.lessons, '', 'rvInput')}</label>
      <label class="f">Faith, marriage and service: what did I notice? (reflection, not a score)${textArea('rv_faith', s.faith, '', 'rvInput')}</label>
      ${r.type === 'weekly' ? `<span class="eyebrow">Communication this week</span>
        <label class="f">Clarity</label>${scaleInput('rv_clarity', s.clarity)}
        <label class="f">Confidence</label>${scaleInput('rv_confidence', s.confidence)}
        <label class="f">Natural conversation</label>${scaleInput('rv_natural', s.natural)}` : ''}
      <label class="f">Main focus for the next ${r.type === 'weekly' ? 'week' : r.type === 'monthly' ? 'month' : 'quarter'}${textArea('rv_next', s.next, '', 'rvInput')}</label>
    </div>
    <div class="card stack-sm"><div class="row between"><h3>Suggestions</h3><span class="badge ai">Generated by rules</span></div>
      ${sg.map(x => `<p class="small">• ${esc(x)}</p>`).join('')}
      <p class="tiny faint">Suggestions are prompts for thought, not facts. Adjust targets freely.</p></div>
  </div>`;
  return { title: 'Review', html, after: () => $$('.scale[id^="rv_"]').forEach(sc => sc.addEventListener('scale', () => { r.self = r.self || {}; r.self[sc.id.slice(3)] = Number(sc.dataset.value); touch(r); save('reviews'); })) };
};
ON.rvInput = el => { const r = S.reviews.find(x => x.id === R.arg); r.self = r.self || {}; r.self[el.id.slice(3)] = el.value; touch(r); save('reviews'); };
