/* ===================== Goals cascade ===================== */
let goalView = 'year', goalPillar = 'all', goalCycle = null;
const statusBadge = s => { const [l, c] = GOAL_STATUS[s] || GOAL_STATUS.notstarted; return `<span class="badge ${c}">${l}</span>`; };
function cycleGoals(cs) { return S.goals.filter(g => (g.cycle || yearStart()) === cs); }
function currentCycleStart() { return goalCycle || cycleFor(today() < yearStart() ? yearStart() : today()).start; }

SCREENS.goals = () => {
  const cs = currentCycleStart(), cyc = cycleFor(cs);
  const refDate = today() < cs ? cs : (today() > cyc.end ? cyc.end : today());
  const q = quarterOf(refDate);
  const goals = cycleGoals(cs).filter(g => goalPillar === 'all' || g.pillar === goalPillar);
  const cycles = [...new Set([yearStart(), ...S.goals.map(g => g.cycle).filter(Boolean)])].sort();
  const yearMap = `<div class="card tight"><div class="row between"><span class="eyebrow">Year ${cyc.label} · ${fmtDate(cyc.start, { year: true })} – ${fmtDate(cyc.end, { year: true })}</span>${cycles.length > 1 ? `<select id="cycSel" data-onchange="cycSel" style="width:auto;min-height:34px;padding:4px 8px">${cycles.map(c => `<option value="${c}" ${c === cs ? 'selected' : ''}>${cycleFor(c).label}</option>`).join('')}</select>` : ''}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px">${PHASES.map(ph => { const r = quarterRange(cs, ph.q); const cur = refDate >= r.start && refDate <= r.end; return `<div style="padding:8px;border-radius:10px;background:${cur ? 'var(--navy)' : 'var(--surface-2)'};color:${cur ? 'var(--bg)' : 'var(--ink-2)'}"><b style="font-family:var(--serif)">Q${ph.q}</b><div class="tiny" style="opacity:.85">${fmtDate(r.start)}</div></div>`; }).join('')}</div>
    <p class="small muted" style="margin-top:8px">Now: <b>Q${q.q}</b> · ${esc(q.phase)}</p></div>`;
  const views = `<div class="seg">${[['year', 'Year'], ['quarter', 'Quarter'], ['month', 'Month'], ['week', 'Week']].map(([v, l]) => `<button data-a="goalView" data-v="${v}" aria-pressed="${goalView === v}">${l}</button>`).join('')}</div>`;
  const chips = `<div class="chips scroll"><button class="chip" data-a="goalPillar" data-p="all" aria-pressed="${goalPillar === 'all'}">All areas</button>${PILLARS.map(p => `<button class="chip" data-a="goalPillar" data-p="${p.id}" aria-pressed="${goalPillar === p.id}">${pillarDot(p.id)} ${esc(p.short)}</button>`).join('')}</div>`;
  let body = '';
  if (goalView === 'year') {
    body = goals.length ? PILLARS.filter(p => goals.some(g => g.pillar === p.id)).map(p => `<div class="stack-sm"><span class="eyebrow">${esc(p.name)}</span><div class="list">${goals.filter(g => g.pillar === p.id).map(goalCard).join('')}</div></div>`).join('')
      : `<div class="list">${empty('No goals here yet', 'Add an annual goal to start the cascade.')}</div>`;
    body += `<button class="btn block" data-a="newGoal">${ICON.plus} Add annual goal</button>`;
    if (today() >= quarterRange(cs, 4).start && !cycles.includes(addMonths(cs, 12))) body += `<button class="btn block gold" data-a="newCycle">Start ${cycleFor(addMonths(cs, 12)).label}: carry goals forward</button>`;
  } else if (goalView === 'quarter') {
    body = [1, 2, 3, 4].map(qq => { const r = quarterRange(cs, qq); const ms = S.milestones.filter(m => m.kind === 'quarter' && m.q === qq && goals.some(g => g.id === m.goalId));
      const done = ms.filter(m => m.done).length;
      return `<details ${qq === q.q ? 'open' : ''}><summary>Q${qq} · ${fmtDate(r.start)}–${fmtDate(r.end)} <span class="faint small num" style="margin-left:auto">${done}/${ms.length}</span></summary>
      <p class="small muted" style="margin-bottom:8px">${esc(PHASES[qq - 1].name)}</p><div class="list">${ms.length ? ms.map(m => msRow(m, true)).join('') : empty('No milestones', 'Add them from a goal.')}</div></details>`; }).join('');
  } else if (goalView === 'month') {
    const mk = monthKey(refDate);
    const months = Array.from({ length: 12 }, (_, i) => monthKey(addMonths(cs, i)));
    body = `<div class="chips scroll">${months.map(m => `<button class="chip" data-a="goalMonth" data-m="${m}" aria-pressed="${(R.goalMonth || mk) === m}">${MON[Number(m.slice(5)) - 1]} ${m.slice(2, 4)}</button>`).join('')}</div>`;
    const sel = R.goalMonth || mk;
    const ms = S.milestones.filter(m => m.kind === 'month' && m.period === sel && goals.some(g => g.id === m.goalId));
    body += `<h3>${fmtMonth(sel)} objectives</h3><div class="list">${ms.length ? ms.map(m => msRow(m, true)).join('') : empty('No objectives for this month', 'Open a goal and add a monthly objective. Keep it to one or two per goal.')}</div>`;
  } else {
    const wk = weekStart(today());
    const ts = S.tasks.filter(t => (t.weekStart === wk || (t.date && weekStart(t.date) === wk)) && (t.goalId || t.source === 'weekly') && (goalPillar === 'all' || t.pillar === goalPillar));
    body = `<h3>Week of ${fmtDate(wk)}</h3><p class="small muted">Weekly actions linked to goals. Schedule them onto a day, or leave them floating for the week.</p>
    <div class="list">${ts.length ? ts.map(t => `<div class="task ${t.status}"><button class="check" data-a="toggleTask" data-id="${t.id}" aria-label="Toggle">${ICON.check}</button><button class="tbody" data-a="openTask" data-id="${t.id}"><span class="ttl">${esc(t.title)}</span><span class="meta">${t.pillar ? pillarDot(t.pillar) : ''}${t.date ? fmtDate(t.date, { dow: true }) : 'Not scheduled'}${t.goalId && goalOf(t.goalId) ? ' · ' + esc(goalOf(t.goalId).title.slice(0, 30)) : ''}</span></button></div>`).join('') : empty('No weekly actions yet', 'Tap + and choose "This week", or add from a goal.')}</div>`;
  }
  return { title: 'Goals', html: `<div class="stack">${yearMap}${views}${chips}${body}</div>` };
};
function goalCard(g) {
  const p = goalProgress(g);
  const next = S.milestones.filter(m => m.goalId === g.id && !m.done).sort((a, b) => (a.due || '').localeCompare(b.due || ''))[0];
  return `<button class="goal-card" data-a="openGoal" data-id="${g.id}"><span class="row between"><span class="ttl" style="font-weight:600">${esc(g.title)}</span>${statusBadge(g.status)}</span>
  <span class="row"><span class="bar grow"><i style="width:${p}%;background:${P[g.pillar].color}"></i></span><span class="small num faint">${p}%</span></span>
  ${next ? `<span class="small muted">Next: ${esc(next.title)}${next.period ? ` · ${next.kind === 'quarter' ? next.period : fmtMonth(next.period)}` : ''}</span>` : ''}</button>`;
}
function msRow(m, showGoal) {
  const g = goalOf(m.goalId);
  return `<div class="task ${m.done ? 'done' : ''}"><button class="check" data-a="toggleMs" data-id="${m.id}" aria-label="Toggle milestone">${ICON.check}</button>
  <button class="tbody" data-a="editMs" data-id="${m.id}"><span class="ttl">${esc(m.title)}</span><span class="meta">${showGoal && g ? `${pillarDot(g.pillar)} ${esc(g.title.slice(0, 40))}` : ''}${m.done && m.doneAt ? ` · done ${fmtDate(m.doneAt.slice(0, 10))}` : ''}</span></button></div>`;
}
A.goalView = el => { goalView = el.dataset.v; render(); };
A.goalPillar = el => { goalPillar = el.dataset.p; render(); };
A.goalMonth = el => { R.goalMonth = el.dataset.m; render(); };
ON.cycSel = el => { goalCycle = el.value; render(); };
A.openGoal = el => go('goals', 'goal', el.dataset.id, true);
A.toggleMs = el => { const m = S.milestones.find(x => x.id === el.dataset.id); m.done = !m.done; m.doneAt = m.done ? nowIso() : null; touch(m); save('milestones'); render(); if (m.done) toast('Milestone achieved'); };

SCREENS.goal = () => {
  const g = goalOf(R.arg); if (!g) { R.sub = null; return SCREENS.goals(); }
  const p = goalProgress(g), cs = g.cycle || yearStart();
  const ms = S.milestones.filter(m => m.goalId === g.id);
  const wk = weekStart(today());
  const weekTs = S.tasks.filter(t => t.goalId === g.id && (t.weekStart === wk || (t.date && weekStart(t.date) === wk)));
  const allTs = S.tasks.filter(t => t.goalId === g.id);
  const mk = monthKey(today());
  const months = [...new Set(ms.filter(m => m.kind === 'month').map(m => m.period))].sort();
  const html = `<div class="stack">
    <div class="stack-sm"><span class="eyebrow">${pillarDot(g.pillar)} ${esc(P[g.pillar].name)}</span><h1>${esc(g.title)}</h1></div>
    <div class="card stack-sm">
      <div class="row between"><b>${p}% complete</b>${statusBadge(g.status)}</div>
      <div class="bar"><i style="width:${p}%;background:${P[g.pillar].color}"></i></div>
      <span class="tiny faint">${g.progressMode === 'manual' ? 'Self-assessed progress' : 'Calculated from milestones and objectives achieved'}</span>
      <div class="chips" style="margin-top:6px">${Object.entries(GOAL_STATUS).map(([k, [l]]) => `<button class="chip" style="min-height:32px;font-size:.8rem;padding:4px 10px" data-a="goalStatus" data-s="${k}" aria-pressed="${g.status === k}">${l}</button>`).join('')}</div>
    </div>
    <div class="card stack-sm">
      <div class="row between"><span class="eyebrow">Why it matters</span><button class="link" data-a="editGoal" data-id="${g.id}">Edit goal</button></div>
      <p>${esc(g.why) || '<span class="faint">Not written yet</span>'}</p>
      <span class="eyebrow">Success looks like</span><p>${esc(g.criteria) || '<span class="faint">Add measurable criteria</span>'}</p>
      <span class="eyebrow">Target date</span><p class="num">${g.targetDate ? fmtDate(g.targetDate, { year: true }) : '—'}</p>
      ${g.deps ? `<span class="eyebrow">Dependencies</span><p>${esc(g.deps)}</p>` : ''}
      ${g.risks ? `<span class="eyebrow">Risks</span><p>${esc(g.risks)}</p>` : ''}
    </div>
    <section class="section"><div class="section-head"><h2>Quarterly milestones</h2></div>
      ${[1, 2, 3, 4].map(q => { const r = quarterRange(cs, q); const list = ms.filter(m => m.kind === 'quarter' && m.q === q);
        return `<div class="stack-sm"><div class="row between"><span class="eyebrow">Q${q} · ${fmtDate(r.start)}–${fmtDate(r.end)}</span><button class="link" data-a="addMs" data-kind="quarter" data-q="${q}">+ Add</button></div>${list.length ? `<div class="list">${list.map(m => msRow(m)).join('')}</div>` : ''}</div>`; }).join('')}
    </section>
    <section class="section"><div class="section-head"><h2>Monthly objectives</h2><button class="link" data-a="addMs" data-kind="month">+ Add</button></div>
      ${months.length ? months.map(mo => `<div class="stack-sm"><span class="eyebrow">${fmtMonth(mo)}${mo === mk ? ' · this month' : ''}</span><div class="list">${ms.filter(m => m.kind === 'month' && m.period === mo).map(m => msRow(m)).join('')}</div></div>`).join('') : `<div class="list">${empty('No monthly objectives yet', 'Break this quarter\'s milestone into one or two objectives for this month.')}</div>`}
    </section>
    <section class="section"><div class="section-head"><h2>This week's actions</h2><button class="link" data-a="quickAdd" data-goal="${g.id}">+ Add</button></div>
      <div class="list">${weekTs.length ? weekTs.map(t => `<div class="task ${t.status}"><button class="check" data-a="toggleTask" data-id="${t.id}" aria-label="Toggle">${ICON.check}</button><button class="tbody" data-a="openTask" data-id="${t.id}"><span class="ttl">${esc(t.title)}</span><span class="meta">${t.date ? fmtDate(t.date, { dow: true }) : 'Not scheduled'}</span></button></div>`).join('') : empty('No actions this week', 'One small, concrete action is enough.')}</div>
      <p class="tiny faint">${allTs.filter(t => t.status === 'done').length} linked actions completed in total.</p>
    </section>
    <section class="section"><div class="section-head"><h2>Evidence of progress</h2><button class="link" data-a="addEvidence">+ Add</button></div>
      <div class="list">${(g.evidence || []).length ? g.evidence.slice().reverse().map((e, i) => `<div class="task"><span class="grow"><span class="ttl">${esc(e.text)}</span><br><span class="meta num">${fmtDate(e.date, { year: true })}</span></span><button class="icon-btn" data-a="delEvidence" data-i="${g.evidence.length - 1 - i}" aria-label="Delete evidence">${ICON.trash}</button></div>`).join('') : empty('No evidence yet', 'Record outcomes, links, feedback or results as they happen.')}</div>
    </section>
    <button class="btn ghost danger block" data-a="delGoal">${ICON.trash} Delete goal</button>
  </div>`;
  return { title: P[g.pillar].short, html };
};
A.goalStatus = el => { const g = goalOf(R.arg); g.status = el.dataset.s; touch(g); save('goals'); render(); };
function goalForm(g = {}) {
  return `<label class="f">Goal<input type="text" id="gTitle" value="${esc(g.title || '')}" placeholder="e.g. Build working mastery of…"></label>
  <label class="f">Area${pillarSelect('gPillar', g.pillar || (goalPillar !== 'all' ? goalPillar : 'pro'), false)}</label>
  <label class="f">Why it matters${textArea('gWhy', g.why)}</label>
  <label class="f">Measurable success criteria${textArea('gCrit', g.criteria)}</label>
  <div class="field-row"><label class="f">Target date<input type="date" id="gTarget" value="${g.targetDate || cycleFor(currentCycleStart()).end}"></label>
  <label class="f">Progress<select id="gMode"><option value="auto" ${g.progressMode !== 'manual' ? 'selected' : ''}>From milestones</option><option value="manual" ${g.progressMode === 'manual' ? 'selected' : ''}>Self-assessed</option></select></label></div>
  ${g.progressMode === 'manual' ? `<label class="f">Self-assessed progress <b id="gpOut">${g.progress || 0}%</b><input type="range" id="gProg" min="0" max="100" step="5" value="${g.progress || 0}" data-on="gp"></label>` : ''}
  <label class="f">Dependencies<input type="text" id="gDeps" value="${esc(g.deps || '')}" placeholder="What does this rely on?"></label>
  <label class="f">Risks<input type="text" id="gRisks" value="${esc(g.risks || '')}" placeholder="What could get in the way?"></label>`;
}
ON.gp = el => { $('#gpOut').textContent = el.value + '%'; };
function readGoalForm(g) {
  Object.assign(g, { title: val('gTitle').trim() || g.title || 'Untitled goal', pillar: val('gPillar'), why: val('gWhy'), criteria: val('gCrit'), targetDate: val('gTarget'), progressMode: val('gMode'), deps: val('gDeps'), risks: val('gRisks') });
  if ($('#gProg')) g.progress = Number(val('gProg'));
  return touch(g);
}
A.newGoal = () => openSheet('New annual goal', goalForm() + `<button class="btn primary block" data-a="saveNewGoal">Create goal</button>`);
A.saveNewGoal = () => {
  if (!val('gTitle').trim()) return $('#gTitle').focus();
  const g = readGoalForm({ id: uid('g'), cycle: currentCycleStart(), status: 'notstarted', progress: 0, evidence: [], createdAt: nowIso() });
  S.goals.push(g); save('goals'); closeSheet(); go('goals', 'goal', g.id, true);
};
A.editGoal = () => { const g = goalOf(R.arg); openSheet('Edit goal', goalForm(g) + `<button class="btn primary block" data-a="saveGoal">Save</button>`); };
A.saveGoal = () => { readGoalForm(goalOf(R.arg)); save('goals'); closeSheet(); render(); };
A.delGoal = () => openSheet('Delete this goal?', `<p>This removes the goal and its milestones and objectives. Linked tasks stay but lose the link.</p><button class="btn danger block" data-a="confirmDelGoal">Delete goal</button>`);
A.confirmDelGoal = () => {
  const id = R.arg; S.goals = S.goals.filter(g => g.id !== id); tombstone('goals', id);
  S.milestones.filter(m => m.goalId === id).forEach(m => tombstone('milestones', m.id));
  S.milestones = S.milestones.filter(m => m.goalId !== id);
  S.tasks.forEach(t => { if (t.goalId === id) { t.goalId = null; touch(t); } });
  save('goals', 'milestones', 'tasks'); closeSheet(); back();
};
A.addMs = el => {
  const kind = el.dataset.kind, g = goalOf(R.arg), cs = g.cycle || yearStart();
  const months = Array.from({ length: 12 }, (_, i) => monthKey(addMonths(cs, i)));
  openSheet(kind === 'quarter' ? `Q${el.dataset.q} milestone` : 'Monthly objective', `
    <input type="text" id="msTitle" placeholder="${kind === 'quarter' ? 'A clear, checkable milestone' : 'One objective for the month'}">
    ${kind === 'month' ? `<label class="f">Month<select id="msMonth">${months.map(m => `<option value="${m}" ${m === monthKey(today()) ? 'selected' : ''}>${fmtMonth(m)}</option>`).join('')}</select></label>` : ''}
    <button class="btn primary block" data-a="saveMs" data-kind="${kind}" data-q="${el.dataset.q || ''}">Add</button>`, { after: b => setTimeout(() => $('#msTitle', b).focus(), 250) });
};
A.saveMs = el => {
  const title = val('msTitle').trim(); if (!title) return;
  const g = goalOf(R.arg), cs = g.cycle || yearStart(), kind = el.dataset.kind;
  const m = { id: uid('m'), goalId: g.id, kind, title, done: false };
  if (kind === 'quarter') { m.q = Number(el.dataset.q); m.period = `Q${m.q}`; m.due = quarterRange(cs, m.q).end; }
  else { m.period = val('msMonth'); m.due = addDays(addMonths(m.period + '-01', 1), -1); }
  S.milestones.push(touch(m)); save('milestones'); closeSheet(); render();
};
A.editMs = el => {
  const m = S.milestones.find(x => x.id === el.dataset.id);
  openSheet('Milestone', `<input type="text" id="msEdit" value="${esc(m.title)}"><button class="btn primary block" data-a="saveMsEdit" data-id="${m.id}">Save</button><button class="btn ghost danger block" data-a="delMs" data-id="${m.id}">${ICON.trash} Delete</button>`);
};
A.saveMsEdit = el => { const m = S.milestones.find(x => x.id === el.dataset.id); m.title = val('msEdit').trim() || m.title; touch(m); save('milestones'); closeSheet(); render(); };
A.delMs = el => { S.milestones = S.milestones.filter(x => x.id !== el.dataset.id); tombstone('milestones', el.dataset.id); save('milestones'); closeSheet(); render(); };
A.addEvidence = () => openSheet('Evidence of progress', `<label class="f">Date<input type="date" id="evDate" value="${today()}"></label><label class="f">What happened?${textArea('evText', '', 'Outcome, result, feedback, link…')}</label><p class="tiny faint">Keep employer-confidential details out of this app.</p><button class="btn primary block" data-a="saveEvidence">Add evidence</button>`);
A.saveEvidence = () => { const t = val('evText').trim(); if (!t) return; const g = goalOf(R.arg); (g.evidence = g.evidence || []).push({ date: val('evDate') || today(), text: t }); touch(g); save('goals'); closeSheet(); render(); };
A.delEvidence = el => { const g = goalOf(R.arg); g.evidence.splice(Number(el.dataset.i), 1); touch(g); save('goals'); render(); };
A.newCycle = () => {
  const cs = currentCycleStart(), ns = addMonths(cs, 12), nc = cycleFor(ns);
  const list = cycleGoals(cs);
  openSheet(`Start ${nc.label}`, `<p class="small muted">Choose goals to carry into the new year. They start fresh with no milestones; history stays with ${cycleFor(cs).label}.</p>
    <div class="list">${list.map(g => `<label class="task"><input type="checkbox" class="switch" data-carry="${g.id}" ${g.status !== 'done' ? 'checked' : ''}><span class="grow">${esc(g.title)}</span></label>`).join('')}</div>
    <button class="btn primary block" data-a="confirmCycle">Create ${nc.label}</button>`);
};
A.confirmCycle = () => {
  const ns = addMonths(currentCycleStart(), 12), nc = cycleFor(ns);
  $$('[data-carry]').filter(c => c.checked).forEach(c => { const g = goalOf(c.dataset.carry); S.goals.push(touch({ ...g, id: uid('g'), cycle: ns, targetDate: nc.end, status: 'notstarted', progress: 0, evidence: [], carriedFrom: g.id, createdAt: nowIso() })); });
  save('goals'); goalCycle = ns; closeSheet(); render(); toast(`${nc.label} created`);
};
