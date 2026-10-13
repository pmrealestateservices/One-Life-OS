/* ===================== Progress analytics (real records only) ===================== */
let range = 30;
const SERIES = ['var(--p-pro)', 'var(--p-faith)', 'var(--p-biz)', 'var(--p-comms)', 'var(--p-health)', 'var(--p-skills)'];
function firstUse() { return (S.settings.createdAt || nowIso()).slice(0, 10); }
function rangeStart() { const s = addDays(today(), -(range - 1)); return s < firstUse() ? firstUse() : s; }
function buckets() {
  const start = addDays(today(), -(range - 1)), out = [];
  if (range === 7) { for (let d = start; d <= today(); d = addDays(d, 1)) out.push({ label: DOW[dow(d)].slice(0, 2), start: d, end: d }); }
  else if (range === 365) { for (let i = 11; i >= 0; i--) { const s = addMonths(monthKey(today()) + '-01', -i); out.push({ label: MON[pd(s).getMonth()].slice(0, 3), start: s, end: addDays(addMonths(s, 1), -1) }); } }
  else { let ws = weekStart(start); while (ws <= today()) { out.push({ label: fmtDate(ws).replace(' ', ' '), start: ws, end: addDays(ws, 6) }); ws = addDays(ws, 7); } }
  return out.filter(b => b.end >= firstUse()).map(b => { let planned = 0, done = 0; for (let d = b.start < firstUse() ? firstUse() : b.start; d <= b.end && d <= today(); d = addDays(d, 1)) { const s = dayStats(d); planned += s.planned; done += s.done; } return { ...b, planned, done, pct: planned ? Math.round(done / planned * 100) : null }; });
}
/* ---- SVG primitives ---- */
function barSvg(items, { max = 100, unit = '%', h = 150, color = 'var(--gold)' } = {}) {
  const W = 320, padL = 28, padB = 22, padT = 14, n = items.length, bw = Math.min(28, (W - padL - 8) / n * 0.62), step = (W - padL - 8) / n;
  const y = v => padT + (h - padT - padB) * (1 - v / max);
  const grid = [0, max / 2, max].map(v => `<line x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${padL - 6}" y="${y(v) + 3}" text-anchor="end">${Math.round(v)}${unit}</text>`).join('');
  const bars = items.map((it, i) => { const x = padL + step * i + (step - bw) / 2; const show = n <= 14 || i % Math.ceil(n / 12) === 0;
    return `${it.value == null ? `<text x="${x + bw / 2}" y="${y(0) - 4}" text-anchor="middle">–</text>` : `<rect x="${x}" y="${y(it.value)}" width="${bw}" height="${Math.max(1, y(0) - y(it.value))}" rx="3" fill="${it.color || color}"><title>${esc(it.label)}: ${it.value}${unit}</title></rect>${n <= 8 ? `<text x="${x + bw / 2}" y="${y(it.value) - 4}" text-anchor="middle" style="fill:var(--ink-2)">${it.value}</text>` : ''}`}
    ${show ? `<text x="${x + bw / 2}" y="${h - 6}" text-anchor="middle">${esc(it.label)}</text>` : ''}`; }).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${h}" role="img">${grid}${bars}</svg></div>`;
}
function groupedSvg(items, h = 160) {
  const max = Math.max(4, ...items.map(i => i.planned)); const W = 320, padL = 28, padB = 22, padT = 10, n = items.length, step = (W - padL - 8) / n, bw = Math.min(12, step * 0.34);
  const y = v => padT + (h - padT - padB) * (1 - v / max);
  const grid = [0, Math.round(max / 2), max].map(v => `<line x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${padL - 6}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${h}" role="img">${grid}${items.map((it, i) => { const x = padL + step * i + step / 2; const show = n <= 14 || i % Math.ceil(n / 12) === 0;
    return `<rect x="${x - bw - 1}" y="${y(it.planned)}" width="${bw}" height="${y(0) - y(it.planned)}" rx="2" fill="var(--line)"><title>${esc(it.label)} planned ${it.planned}</title></rect><rect x="${x + 1}" y="${y(it.done)}" width="${bw}" height="${y(0) - y(it.done)}" rx="2" fill="var(--navy)"><title>${esc(it.label)} done ${it.done}</title></rect>${show ? `<text x="${x}" y="${h - 6}" text-anchor="middle">${esc(it.label)}</text>` : ''}`; }).join('')}</svg></div>
    <div class="legend"><span><i class="dot" style="background:var(--line)"></i>Planned</span><span><i class="dot" style="background:var(--navy)"></i>Completed</span></div>`;
}
function lineSvg(series, labels, { max = 100, min = 0, unit = '', h = 150 } = {}) {
  const W = 320, padL = 28, padR = 10, padB = 22, padT = 12, n = labels.length;
  const x = i => padL + (n <= 1 ? (W - padL - padR) / 2 : (W - padL - padR) * i / (n - 1)), y = v => padT + (h - padT - padB) * (1 - (v - min) / (max - min));
  const grid = [min, (min + max) / 2, max].map(v => `<line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${padL - 6}" y="${y(v) + 3}" text-anchor="end">${Math.round(v * 10) / 10}${unit}</text>`).join('');
  const lines = series.map(s => { const pts = s.values.map((v, i) => v == null ? null : [x(i), y(v)]); const segs = []; let cur = [];
    pts.forEach(p => { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
    const last = pts.filter(Boolean).pop();
    return segs.map(sg => `<polyline points="${sg.map(p => p.join(',')).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`).join('') + pts.filter(Boolean).map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="${p === last ? 3.6 : 2.2}" fill="${s.color}"/>`).join(''); }).join('');
  const lbl = labels.map((l, i) => (n <= 12 || i % Math.ceil(n / 8) === 0 || i === n - 1) ? `<text x="${x(i)}" y="${h - 6}" text-anchor="middle">${esc(l)}</text>` : '').join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${h}" role="img">${grid}${lines}${lbl}</svg></div>${series.length > 1 ? `<div class="legend">${series.map(s => `<span><i class="dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>` : ''}`;
}
function donutSvg(segs, center) {
  const total = sum(segs.map(s => s.value)); const r = 52, c = 2 * Math.PI * r; let off = 0;
  const arcs = segs.filter(s => s.value).map(s => { const len = s.value / total * c; const el = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${s.color}" stroke-width="20" stroke-dasharray="${Math.max(0, len - 2)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"><title>${esc(s.label)}: ${s.value}</title></circle>`; off += len; return el; }).join('');
  return `<div class="row" style="gap:16px;align-items:center"><div class="chart" style="width:140px;flex:none"><svg viewBox="0 0 140 140" role="img"><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="20"/>${arcs}<text x="70" y="68" text-anchor="middle" style="font-size:20px;fill:var(--navy);font-family:var(--serif)">${center[0]}</text><text x="70" y="86" text-anchor="middle">${center[1]}</text></svg></div>
  <div class="stack-sm grow small">${segs.map(s => `<div class="row">${`<i class="dot" style="background:${s.color}"></i>`}<span class="grow">${esc(s.label)}</span><b class="num">${s.display ?? s.value}</b></div>`).join('')}</div></div>`;
}
const hbar = (label, p, color, right) => `<div class="stack-sm" style="gap:4px"><div class="row between small"><span class="grow" style="min-width:0">${label}</span><b class="num">${right ?? p + '%'}</b></div><div class="bar"><i style="width:${clamp(p, 0, 100)}%;background:${color}"></i></div></div>`;
const chartCard = (title, what, body, note = '') => `<div class="card chart-card"><div><h3>${title}</h3><p class="what">${what}</p></div>${body}${note ? `<p class="tiny faint">${note}</p>` : ''}</div>`;
const noData = msg => `<div class="empty"><b>No data yet</b><span>${msg}</span></div>`;

SCREENS.progress = () => {
  const start = rangeStart(), end = today();
  const f = facts(start, end), bs = buckets();
  const hasTasks = bs.some(b => b.planned);
  // 1 & 6
  const bucketWord = range === 7 ? 'day' : range === 365 ? 'month' : 'week';
  const c1 = hasTasks ? barSvg(bs.map(b => ({ label: b.label, value: b.pct }))) : noData('Tick off planned tasks on Today and your completion rate appears here.');
  const c6 = hasTasks ? groupedSvg(bs) : noData('Planned and completed items are counted from the days you use the app.');
  // 2 monthly consistency
  const months = []; for (let i = 11; i >= 0; i--) { const s = addMonths(monthKey(today()) + '-01', -i); if (addDays(addMonths(s, 1), -1) >= firstUse()) months.push(s); }
  const cons = months.map(s => { let act = 0, elig = 0; for (let d = s < firstUse() ? firstUse() : s; d < addMonths(s, 1) && d <= today(); d = addDays(d, 1)) { if (S.days[d]?.mode === 'rest') continue; elig++; const st = dayStats(d); if (st.done || hasJournal(S.journal[d]) || S.days[d]?.checkin) act++; } return elig ? Math.round(act / elig * 100) : null; });
  const c2 = cons.some(v => v) ? lineSvg([{ name: 'Active days', color: 'var(--gold)', values: cons }], months.map(m => MON[pd(m).getMonth()])) : noData('Shows the share of non-rest days each month with at least one completed item, check-in or journal entry.');
  // 3 by pillar
  const pSegs = PILLARS.map(p => ({ label: p.short, value: f.byPillar[p.id].done, color: p.color, display: `${f.byPillar[p.id].done}/${f.byPillar[p.id].planned}` }));
  const c3 = f.done ? donutSvg(pSegs, [String(f.done), 'completed']) : noData('Completed items, split by life area.');
  // 4 quarterly milestones
  const cs = cycleFor(today() < yearStart() ? yearStart() : today()).start;
  const qd = [1, 2, 3, 4].map(q => { const ms = S.milestones.filter(m => m.kind === 'quarter' && m.q === q && (goalOf(m.goalId)?.cycle || yearStart()) === cs); return { label: `Q${q} (${ms.filter(m => m.done).length}/${ms.length})`, value: ms.length ? Math.round(ms.filter(m => m.done).length / ms.length * 100) : null }; });
  const c4 = qd.some(q => q.value != null) ? barSvg(qd, { color: 'var(--navy)' }) : noData('Add quarterly milestones to your goals.');
  // 5 goals
  const goals = S.goals.filter(g => (g.cycle || yearStart()) === cs);
  const c5 = goals.length ? `<div class="stack-sm">${goals.map(g => hbar(`${pillarDot(g.pillar)} ${esc(g.title)}`, goalProgress(g), P[g.pillar].color)).join('')}</div>` : noData('Your annual goals appear here.');
  // 7 time allocation
  const logged = S.logs.filter(l => l.date >= start && l.date <= end);
  const loggedTaskIds = new Set(logged.map(l => l.taskId).filter(Boolean));
  const tAlloc = PILLARS.map(p => { const rec = sum(logged.filter(l => l.pillar === p.id).map(l => l.mins)); const est = sum(S.tasks.filter(t => t.date >= start && t.date <= end && t.status === 'done' && t.pillar === p.id && !loggedTaskIds.has(t.id) && !(t.kind && logged.some(l => l.date === t.date && l.kind === t.kind))).map(t => t.dur)); return { p, rec, est, total: rec + est }; });
  const tMax = Math.max(1, ...tAlloc.map(t => t.total));
  const c7 = tAlloc.some(t => t.total) ? `<div class="stack-sm">${tAlloc.map(t => `<div class="stack-sm" style="gap:4px"><div class="row between small"><span>${pillarDot(t.p.id)} ${esc(t.p.short)}</span><b class="num">${Math.round(t.total / 6) / 10} h</b></div><div class="bar" style="display:flex"><i style="width:${t.rec / tMax * 100}%;background:${t.p.color};border-radius:0"></i><i style="width:${t.est / tMax * 100}%;background:${t.p.color};opacity:.4;border-radius:0"></i></div></div>`).join('')}
    <div class="legend"><span><i class="dot" style="background:var(--ink-2)"></i>Recorded (activity logs)</span><span><i class="dot" style="background:var(--ink-2);opacity:.4"></i>Estimated (task durations)</span></div></div>` : noData('Comes from your activity logs (recorded) and the planned minutes of completed tasks (estimated).');
  // 8 finance
  const c8 = S.finance.targets.length ? `<div class="stack-sm">${S.finance.targets.map(t => hbar(`${esc(t.name)} <span class="faint">${t.kind}</span>`, finProgress(t) ?? 0, 'var(--p-biz)', `${money(finCurrent(t))} / ${money(t.target)}`)).join('')}</div>` : noData('Add your own targets in More → Personal finance.');
  // 9 competencies
  const comps = S.competencies.filter(c => c.history.length).sort((a, b) => b.history[b.history.length - 1].date.localeCompare(a.history[a.history.length - 1].date)).slice(0, 6);
  const cDates = [...new Set(comps.flatMap(c => c.history.map(h => h.date)))].sort();
  const c9 = comps.length ? lineSvg(comps.map((c, i) => { let lastV = null; return { name: c.name.length > 28 ? c.name.slice(0, 27) + '…' : c.name, color: SERIES[i], values: cDates.map(d => { const h = c.history.find(x => x.date === d); if (h) lastV = h.value; return h ? h.value : null; }) }; }), cDates.map(d => fmtDate(d)), { max: 5, min: 0 }) : noData('Rate your competencies in More → Professional development. Each update adds a point.');
  // comms self-assessment
  const wr = S.reviews.filter(r => r.type === 'weekly' && r.self && (r.self.clarity || r.self.confidence || r.self.natural)).sort((a, b) => a.start.localeCompare(b.start)).slice(-12);
  const cC = wr.length ? lineSvg([['clarity', 'Clarity', 'var(--p-comms)'], ['confidence', 'Confidence', 'var(--gold)'], ['natural', 'Natural conversation', 'var(--p-pro)']].map(([k, n, c]) => ({ name: n, color: c, values: wr.map(r => r.self[k] ?? null) })), wr.map(r => fmtDate(r.start)), { max: 5 }) : noData('Rate clarity, confidence and natural conversation in your weekly review.');
  // 10 projects
  const c10 = S.projects.length ? `<div class="stack-sm">${WORKSPACES.map(w => S.projects.filter(p => p.ws === w.id).map(p => { const d = p.milestones.filter(m => m.done).length; return hbar(`<b>${esc(w.name)}</b> · ${esc(p.title)}`, pct(d, p.milestones.length) || 0, 'var(--p-biz)', `${d}/${p.milestones.length}`); }).join('')).join('')}</div>` : noData('Add projects in More → Business & property.');
  // 11 heatmap
  const hDays = Math.max(range, 91), hStart = weekStart(addDays(today(), -(hDays - 1)));
  let cells = ''; let anyHeat = false;
  for (let d = hStart; d <= addDays(weekStart(today()), 6); d = addDays(d, 1)) {
    if (d > today() || d < firstUse()) { cells += `<i style="opacity:${d > today() ? 0 : .35}"></i>`; continue; }
    const st = dayStats(d), rest = S.days[d]?.mode === 'rest', j = hasJournal(S.journal[d]) ? 1 : 0; const score = st.done + j + (S.days[d]?.checkin ? 1 : 0); if (score) anyHeat = true;
    const lvl = rest ? 'rest' : score === 0 ? 0 : score <= 2 ? 1 : score <= 5 ? 2 : 3;
    cells += `<i style="background:var(--heat-${lvl})" title="${fmtDate(d, { dow: true })}: ${st.done} done${j ? ', journal' : ''}${rest ? ' (rest day)' : ''}"></i>`;
  }
  const c11 = `<div class="chart-wrap"><div class="heat">${cells}</div></div><div class="legend"><span><i class="dot" style="background:var(--heat-0);border-radius:2px"></i>None</span><span><i class="dot" style="background:var(--heat-1);border-radius:2px"></i>Light</span><span><i class="dot" style="background:var(--heat-3);border-radius:2px"></i>Full</span><span><i class="dot" style="background:var(--heat-rest);border-radius:2px"></i>Rest day</span></div>${anyHeat ? '' : '<p class="small faint">Your days fill in here as you use the app.</p>'}`;
  // 12 month compare
  const tm = monthKey(today()) + '-01', lm = addMonths(tm, -1);
  const a = facts(tm, addDays(addMonths(tm, 1), -1)), noPrev = addDays(tm, -1) < firstUse(), b = noPrev ? {} : facts(lm < firstUse() ? firstUse() : lm, addDays(tm, -1));
  const cmpRows = [['Completion', a.completion != null ? a.completion + '%' : '—', b.completion != null ? b.completion + '%' : '—'], ['Items done', a.done, b.done], ['Active days', a.activeDays, b.activeDays], ['Journal days', a.journalDays, b.journalDays], ['Workouts', a.workouts, b.workouts], ['Comms drills', a.drills, b.drills], ['CPD hours', a.cpdHours, b.cpdHours], ['Milestones', a.milestonesDone, b.milestonesDone]];
  const c12 = true ? `<div style="overflow-x:auto"><table class="small num" style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:6px 0" class="faint">Measure</th><th style="text-align:right" class="faint">${MON[pd(tm).getMonth()]} (so far)</th><th style="text-align:right" class="faint">${MON[pd(lm).getMonth()]}</th></tr></thead><tbody>${cmpRows.map(r => `<tr style="border-top:1px solid var(--line)"><td style="padding:7px 0">${r[0]}</td><td style="text-align:right"><b>${r[1]}</b></td><td style="text-align:right">${noPrev ? '<span class="faint">—</span>' : r[2] ?? '—'}</td></tr>`).join('')}</tbody></table></div>` : noData('Available once you have used the app across two months.');

  const html = `<div class="stack">
    <div class="seg">${[[7, '7 days'], [30, '30 days'], [90, '90 days'], [365, '12 months']].map(([v, l]) => `<button data-a="range" data-v="${v}" aria-pressed="${range === v}">${l}</button>`).join('')}</div>
    <p class="tiny faint">Since ${fmtDate(start, { year: true })}. Only what you have recorded is shown. Rest days and items skipped on purpose are excluded from rates.</p>
    <div class="kpis"><div class="kpi"><b>${f.completion != null ? f.completion + '%' : '—'}</b><span>Completion</span></div><div class="kpi"><b>${f.activeDays}</b><span>Active days</span></div><div class="kpi"><b>${f.milestonesDone}</b><span>Milestones</span></div></div>
    ${chartCard('Completion rate', `Completed ÷ planned items per ${bucketWord}, excluding skips. “–” means nothing was planned.`, c1)}
    ${chartCard('Planned vs completed', `Number of items planned and completed per ${bucketWord}.`, c6)}
    ${chartCard('Daily engagement', 'Each square is a day. Darker means more completed items, check-ins and journal entries.', c11)}
    ${chartCard('By life area', 'Completed items in each area for this period (done / planned).', c3, 'Faith and marriage items count as kept rhythms, not as a measure of spiritual life.')}
    ${chartCard('Time allocation', 'Hours by area. Solid is recorded in activity logs, faded is estimated from completed tasks\' planned minutes.', c7)}
    ${chartCard('Monthly consistency', 'Share of non-rest days each month with at least one completed item, check-in or journal entry.', c2)}
    ${chartCard('Month comparison', 'This month so far against last month, from saved records.', c12)}
    ${chartCard('Quarterly milestones', 'Share of each quarter\'s milestones achieved, current year. Not affected by the date filter.', c4)}
    ${chartCard('Annual goal progress', 'From milestones and objectives achieved, or your own estimate where you chose self-assessed.', c5)}
    ${chartCard('Business projects', 'Project milestones completed in each workspace.', c10)}
    ${chartCard('Financial targets', 'Latest balance you entered against each target.', c8)}
    ${chartCard('Competency confidence', 'Your self-rated confidence (1–5) over time, for the six most recently updated competencies.', c9)}
    ${chartCard('Communication self-assessment', 'Weekly self-ratings (1–5) from your weekly reviews.', cC)}
  </div>`;
  return { title: 'Progress', html };
};
A.range = el => { range = Number(el.dataset.v); render(); };
