/* ===================== Rules-based daily planning engine ===================== */
function defaultWorkType(date) {
  const d = dow(date);
  if (d === 0 || d === 6) return 'off';
  return (S.settings.officeDays || []).includes(d) ? 'office' : 'remote';
}
function getDay(date, create = true) {
  let day = S.days[date];
  if (!day && create) { day = S.days[date] = { date, mode: 'normal', workType: defaultWorkType(date), priorities: null, focus: '', checkin: null }; save('days'); }
  return day || { date, mode: 'normal', workType: defaultWorkType(date), priorities: null, focus: '', checkin: null };
}
function routineApplies(r, date, day) {
  if (!r.active || !r.days.includes(dow(date))) return false;
  const wt = day.workType;
  if (r.when === 'office') return wt === 'office';
  if (r.when === 'remote') return wt === 'remote';
  if (r.when === 'workday') return wt === 'office' || wt === 'remote';
  return true;
}
/* Generate routine tasks once per date (only for today and future dates the user actually opens — never back-filled). */
function generateDay(date) {
  if (date < today()) return;
  const day = getDay(date);
  if (day.generated) return;
  for (const r of S.routines) {
    if (!routineApplies(r, date, day)) continue;
    if (S.tasks.some(t => t.routineId === r.id && t.date === date)) continue;
    S.tasks.push(touch({ id: uid('t'), title: r.title, pillar: r.pillar, date, time: r.time, dur: r.dur, essential: r.essential, mvd: r.mvd, anchor: r.anchor, kind: r.kind || '', routineId: r.id, status: 'open', source: 'routine', createdAt: nowIso() }));
  }
  day.generated = true;
  save('tasks', 'days');
}
/* When work type changes, re-evaluate routine tasks that depend on it (open ones only). */
function regenerateForWorkType(date) {
  const day = getDay(date);
  S.tasks = S.tasks.filter(t => !(t.date === date && t.source === 'routine' && t.status === 'open' && (() => { const r = S.routines.find(x => x.id === t.routineId); return r && r.when !== 'any'; })()));
  day.generated = false; generateDay(date);
}
function inMode(t, mode) {
  if (mode === 'mvd') return t.essential || t.mvd;
  if (mode === 'rest') return t.essential && (t.anchor || t.mvd);
  return true;
}
function tasksFor(date) {
  const day = getDay(date, false);
  return S.tasks.filter(t => t.date === date && inMode(t, day.mode)).sort(byTime);
}
function byTime(a, b) { return (toMin(a.time) ?? 2000) - (toMin(b.time) ?? 2000) || (a.createdAt || '').localeCompare(b.createdAt || ''); }
/* Counted = planned tasks visible in the day's mode, excluding intentional skips. Rest days are never penalised. */
function dayStats(date) {
  const ts = tasksFor(date);
  const counted = ts.filter(t => t.status !== 'skipped');
  const done = counted.filter(t => t.status === 'done').length;
  return { planned: counted.length, done, skipped: ts.length - counted.length, pct: counted.length ? Math.round(done / counted.length * 100) : null, mode: getDay(date, false).mode };
}
function goalOf(id) { return S.goals.find(g => g.id === id); }
function goalProgress(g) {
  if (g.progressMode === 'manual') return g.progress || 0;
  const ms = S.milestones.filter(m => m.goalId === g.id);
  if (g.status === 'done') return 100;
  return ms.length ? Math.round(ms.filter(m => m.done).length / ms.length * 100) : 0;
}
/* Suggest top three: goal-linked and weekly actions first, then at-risk goals, then pillars neglected in the last 7 days. */
function suggestPriorities(date) {
  const ts = tasksFor(date).filter(t => t.status !== 'skipped' && !t.anchor);
  const recent = {};
  for (let i = 1; i <= 7; i++) S.tasks.filter(t => t.date === addDays(date, -i) && t.status === 'done').forEach(t => { recent[t.pillar] = (recent[t.pillar] || 0) + 1; });
  const score = t => {
    let s = 0; const g = t.goalId && goalOf(t.goalId);
    if (t.source === 'manual') s += 3;
    if (t.source === 'weekly') s += 4;
    if (g) s += 3 + (g.status === 'atrisk' || g.status === 'offtrack' ? 2 : 0);
    if (t.essential && !t.anchor) s += 2;
    if (!recent[t.pillar]) s += 1;
    if (t.status === 'done') s -= 0.5;
    return s;
  };
  const ranked = ts.map(t => [score(t), t]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  const out = [], pillars = new Set();
  for (const t of ranked) { if (out.length < 3 && !pillars.has(t.pillar)) { out.push(t.id); pillars.add(t.pillar); } }
  for (const t of ranked) { if (out.length < 3 && !out.includes(t.id)) out.push(t.id); }
  return out;
}
function prioritiesFor(date) {
  const day = getDay(date, false);
  const ids = (day.priorities || suggestPriorities(date)).filter(id => S.tasks.some(t => t.id === id));
  return { ids: ids.slice(0, 3), custom: !!day.priorities };
}
function focusFor(date) {
  const day = getDay(date, false), j = S.journal[date];
  if (day.focus) return day.focus;
  if (j?.morning?.matters) return j.morning.matters;
  const q = date < yearStart() ? { q: 1 } : quarterOf(date);
  const lines = {
    1: ['Show up, keep it simple, build the rhythm.', 'Small faithful steps beat big bursts.', 'Consistency first. Intensity later.'],
    2: ['Learn deeply, and test one business idea properly.', 'Grow the skill. Validate the offer.'],
    3: ['Execute the plan. Measure what moved.', 'Progress you can show, capacity you can count.'],
    4: ['Consolidate the gains. Prepare to scale wisely.', 'Review honestly, finish well, plan ahead.'],
  }[q.q];
  if (getDay(date, false).mode === 'rest') return 'Rest is part of the plan. Be present.';
  return lines[pd(date).getDate() % lines.length];
}
/* Timeline: fixed blocks (work, commute, events) merged with timed tasks. */
function scheduleFor(date) {
  const day = getDay(date, false), st = S.settings, items = [];
  const wt = day.workType;
  if ((wt === 'office' || wt === 'remote') && day.mode !== 'rest') {
    const ws = toMin(st.workStart || '09:00'), we = toMin(st.workEnd || '17:00');
    if (wt === 'office' && st.commute) items.push({ fixed: true, time: fromMin(ws - st.commute), end: st.workStart, title: 'Commute', pillar: '' });
    items.push({ fixed: true, time: st.workStart, end: st.workEnd, title: wt === 'office' ? 'Work — office day' : 'Work — remote day', pillar: 'pro' });
    if (wt === 'office' && st.commute) items.push({ fixed: true, time: st.workEnd, end: fromMin(we + st.commute), title: 'Commute home', pillar: '' });
  }
  for (const e of S.events.filter(e => e.date === date)) items.push({ fixed: true, event: true, time: e.start || null, end: e.end, title: e.title, pillar: '' });
  for (const t of tasksFor(date)) if (t.time) items.push({ task: t, time: t.time });
  return items.sort((a, b) => (toMin(a.time) ?? -1) - (toMin(b.time) ?? -1));
}
function workConflict(t, date) {
  const day = getDay(date, false); if (!t.time || !['office', 'remote'].includes(day.workType)) return false;
  const m = toMin(t.time), ws = toMin(S.settings.workStart), we = toMin(S.settings.workEnd);
  return m > ws && m < we && !(m >= 12 * 60 && m < 14 * 60) && t.pillar !== 'pro';
}
