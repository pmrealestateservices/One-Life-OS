/* ===================== More: areas, logs, routines, settings ===================== */
const menuItem = (a, icon, title, sub, extra = '') => `<button class="menu-item" data-a="${a}" ${extra}><span class="mi-ic">${ICON[icon]}</span><span class="grow"><b>${esc(title)}</b>${sub ? `<br><span class="small faint">${esc(sub)}</span>` : ''}</span>${ICON.chev.replace('<svg', '<svg class="chev"')}</button>`;
SCREENS.more = () => ({
  title: 'More', html: `<div class="stack">
  <span class="eyebrow">Areas</span>
  <div class="list">
    ${menuItem('nav', 'brief', 'Professional development', 'Competency confidence, CPD, learning notes', 'data-to="pro"')}
    ${menuItem('nav', 'home', 'Business & property', 'PMRes, Property Is One, Origin, Ghana', 'data-to="biz"')}
    ${menuItem('nav', 'pound', 'Personal finance', 'Savings, debt, investment capital, readiness', 'data-to="finance"')}
    ${menuItem('nav', 'log', 'Activity logs', 'Workouts, keyboard, trading, communication drills', 'data-to="logs"')}
  </div>
  <span class="eyebrow">Planning</span>
  <div class="list">
    ${menuItem('nav', 'repeat', 'Routines', 'Weekly rhythm the daily planner builds from', 'data-to="routines"')}
    ${menuItem('nav', 'cal', 'Calendar import', 'Add events from an .ics file', 'data-to="calendar"')}
  </div>
  <span class="eyebrow">System</span>
  <div class="list">
    ${menuItem('nav', 'cloud', 'Backup, export & Notion', S.sync.lastNotion ? 'Last Notion sync ' + new Date(S.sync.lastNotion).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not synced yet', 'data-to="data"')}
    ${menuItem('nav', 'gear', 'Settings', 'Schedule, theme, PIN lock', 'data-to="settings"')}
    ${menuItem('nav', 'phone', 'Add to iPhone home screen', 'Install as an app', 'data-to="install"')}
  </div>
  <p class="tiny faint" style="text-align:center">ONE LIFE OS ${APP_VERSION} · Data stays on this device unless you back it up or sync it.</p></div>`,
});
A.nav = el => go(R.tab, el.dataset.to, el.dataset.arg || null, true);

/* ---------- Professional ---------- */
SCREENS.pro = () => {
  const y = today().slice(0, 4);
  const cpd = S.logs.filter(l => l.kind === 'cpd' && l.date.startsWith(y));
  const hrs = Math.round(sum(cpd.map(l => l.mins)) / 6) / 10, formal = Math.round(sum(cpd.filter(l => l.formal).map(l => l.mins)) / 6) / 10;
  return { title: 'Professional', html: `<div class="stack">
    <div class="card stack-sm"><div class="row between"><h3>CPD ${y}</h3><button class="btn sm" data-a="logKind" data-k="cpd">${ICON.plus} Log CPD</button></div>
      <div class="row"><span class="grow small muted">Total</span><b class="num">${hrs} / 20 h</b></div><div class="bar"><i style="width:${clamp(hrs / 20 * 100, 0, 100)}%"></i></div>
      <div class="row"><span class="grow small muted">Formal</span><b class="num">${formal} / 10 h</b></div><div class="bar"><i style="width:${clamp(formal / 10 * 100, 0, 100)}%;background:var(--p-pro)"></i></div>
      <p class="tiny faint">RICS CPD is recorded per calendar year. Check the current RICS requirements and record officially on the RICS site.</p></div>
    <section class="section"><div class="section-head"><h2>Competency confidence</h2><button class="link" data-a="addComp">+ Add</button></div>
      <p class="small muted">Self-assessed, 1 (aware) to 5 (could teach it). Update monthly and attach evidence of learning.</p>
      <div class="list">${S.competencies.map(c => `<button class="menu-item" data-a="openComp" data-id="${c.id}"><span class="grow"><b style="font-weight:500">${esc(c.name)}</b><br><span class="small faint">${c.evidence.length} evidence notes${c.history.length ? ' · updated ' + fmtDate(c.history[c.history.length - 1].date) : ''}</span></span>
        <span class="row" style="gap:3px" aria-label="Confidence ${c.confidence ?? 'not rated'}">${[1, 2, 3, 4, 5].map(i => `<i class="dot" style="width:8px;height:8px;background:${c.confidence >= i ? 'var(--p-pro)' : 'var(--surface-2)'}"></i>`).join('')}</span></button>`).join('') || empty('No competencies', 'Add the skills you want to grow.')}</div></section>
    <section class="section"><div class="section-head"><h2>Learning notes</h2></div>
      <div class="list">${cpd.slice().reverse().slice(0, 10).map(l => `<div class="task"><span class="grow"><span class="ttl">${esc(l.topic || 'CPD')}</span><br><span class="meta num">${fmtDate(l.date)} · ${l.mins} min${l.formal ? ' · formal' : ''}</span>${l.note ? `<br><span class="small muted">${esc(l.note)}</span>` : ''}</span></div>`).join('') || empty('No notes yet', 'Log CPD or a learning note after study or a useful day at work. No case details.')}</div></section>
  </div>` };
};
A.openComp = el => {
  const c = S.competencies.find(x => x.id === el.dataset.id);
  openSheet(c.name, `<label class="f">Confidence now</label>${scaleInput('compConf', c.confidence, 5, ['Aware', 'Learning', 'Competent', 'Confident', 'Could teach it'])}
    <label class="f">Evidence of learning (optional)${textArea('compEv', '', 'What did you study, practise or achieve?')}</label>
    <button class="btn primary block" data-a="saveComp" data-id="${c.id}">Save</button>
    ${c.evidence.length ? `<span class="eyebrow">Evidence</span><div class="list">${c.evidence.slice().reverse().map(e => `<div class="task"><span class="grow small"><b class="num">${fmtDate(e.date)}</b> ${esc(e.text)}</span></div>`).join('')}</div>` : ''}
    ${c.history.length ? `<p class="small muted">History: ${c.history.map(h => `${fmtDate(h.date)} → ${h.value}`).join(' · ')}</p>` : ''}
    <input type="text" id="compName" value="${esc(c.name)}" aria-label="Rename competency">
    <button class="btn ghost danger block" data-a="delComp" data-id="${c.id}">${ICON.trash} Remove competency</button>`);
};
A.saveComp = el => {
  const c = S.competencies.find(x => x.id === el.dataset.id), v = scaleVal('compConf'), ev = val('compEv').trim();
  if (v && v !== c.confidence) { c.confidence = v; const last = c.history[c.history.length - 1]; if (last && last.date === today()) last.value = v; else c.history.push({ date: today(), value: v }); }
  if (ev) c.evidence.push({ date: today(), text: ev });
  c.name = val('compName').trim() || c.name; touch(c); save('competencies'); closeSheet(); render();
};
A.delComp = el => { S.competencies = S.competencies.filter(x => x.id !== el.dataset.id); save('competencies'); closeSheet(); render(); };
A.addComp = () => openSheet('New competency', `<input type="text" id="newComp" placeholder="e.g. Compulsory purchase basics"><button class="btn primary block" data-a="saveNewComp">Add</button>`);
A.saveNewComp = () => { const n = val('newComp').trim(); if (!n) return; S.competencies.push(touch({ id: uid('c'), name: n, confidence: null, history: [], evidence: [] })); save('competencies'); closeSheet(); render(); };

/* ---------- Business workspaces ---------- */
SCREENS.biz = () => ({ title: 'Business & property', html: `<div class="stack">
  <p class="small muted">Track approved activity only. Keep business work separate from DVS duties and confirm outside-employment rules with your employer.</p>
  <div class="list">${WORKSPACES.map(w => { const ps = S.projects.filter(p => p.ws === w.id); const ms = ps.flatMap(p => p.milestones); return menuItem('nav', 'home', w.name, `${w.blurb} · ${ps.length} projects · ${ms.filter(m => m.done).length}/${ms.length} milestones`, `data-to="ws" data-arg="${w.id}"`); }).join('')}</div></div>` });
SCREENS.ws = () => {
  const w = WORKSPACES.find(x => x.id === R.arg); const ps = S.projects.filter(p => p.ws === w.id);
  const goals = S.goals.filter(g => g.ws === w.id);
  return { title: w.name, html: `<div class="stack"><p class="small muted">${esc(w.blurb)}</p>
    ${goals.length ? `<span class="eyebrow">Linked goals</span><div class="list">${goals.map(goalCard).join('')}</div>` : ''}
    <div class="section-head"><h2>Projects</h2><button class="link" data-a="addProject">+ Add</button></div>
    ${ps.map(p => { const d = p.milestones.filter(m => m.done).length; return `<div class="card stack-sm"><div class="row between"><h3>${esc(p.title)}</h3><span class="badge">${esc(p.status)}</span></div>
      <div class="row"><span class="bar grow"><i style="width:${pct(d, p.milestones.length) || 0}%;background:var(--p-biz)"></i></span><span class="small num faint">${d}/${p.milestones.length}</span></div>
      ${p.next ? `<p class="small"><b>Next:</b> ${esc(p.next)}</p>` : ''}
      <div class="list">${p.milestones.map(m => `<div class="task ${m.done ? 'done' : ''}"><button class="check" data-a="toggleProjMs" data-p="${p.id}" data-m="${m.id}" aria-label="Toggle">${ICON.check}</button><span class="grow ttl">${esc(m.title)}</span></div>`).join('')}</div>
      <div class="row wrap"><button class="btn sm" data-a="editProject" data-id="${p.id}">Edit</button><button class="btn sm" data-a="projLog" data-id="${p.id}" data-f="decisions">+ Decision</button><button class="btn sm" data-a="projLog" data-id="${p.id}" data-f="learning">+ Learning</button></div>
      ${p.decisions.length ? `<details><summary>Decisions (${p.decisions.length})</summary>${p.decisions.slice().reverse().map(x => `<p class="small"><b class="num">${fmtDate(x.date, { year: true })}</b> ${esc(x.text)}</p>`).join('')}</details>` : ''}
      ${p.learning.length ? `<details><summary>Learning (${p.learning.length})</summary>${p.learning.slice().reverse().map(x => `<p class="small"><b class="num">${fmtDate(x.date, { year: true })}</b> ${esc(x.text)}</p>`).join('')}</details>` : ''}
    </div>`; }).join('') || `<div class="list">${empty('No projects', 'Add a project to track milestones and decisions.')}</div>`}</div>` };
};
A.toggleProjMs = el => { const p = S.projects.find(x => x.id === el.dataset.p), m = p.milestones.find(x => x.id === el.dataset.m); m.done = !m.done; m.doneAt = m.done ? nowIso() : null; touch(p); save('projects'); render(); };
const projForm = (p = {}) => `<label class="f">Project<input type="text" id="pjTitle" value="${esc(p.title || '')}"></label>
  <label class="f">Status<select id="pjStatus">${['idea', 'active', 'on hold', 'complete'].map(s => `<option ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
  <label class="f">Next action<input type="text" id="pjNext" value="${esc(p.next || '')}"></label>
  <label class="f">Milestones (one per line)<textarea id="pjMs">${esc((p.milestones || []).map(m => m.title).join('\n'))}</textarea></label>`;
A.addProject = () => openSheet('New project', projForm({ status: 'active' }) + `<button class="btn primary block" data-a="saveProject">Create</button>`);
A.editProject = el => openSheet('Edit project', projForm(S.projects.find(x => x.id === el.dataset.id)) + `<button class="btn primary block" data-a="saveProject" data-id="${el.dataset.id}">Save</button><button class="btn ghost danger block" data-a="delProject" data-id="${el.dataset.id}">${ICON.trash} Delete project</button>`);
A.saveProject = el => {
  let p = el.dataset.id && S.projects.find(x => x.id === el.dataset.id);
  if (!p) { p = { id: uid('p'), ws: R.arg, milestones: [], decisions: [], learning: [], notes: '' }; S.projects.push(p); }
  const titles = val('pjMs').split('\n').map(s => s.trim()).filter(Boolean);
  p.milestones = titles.map(t => p.milestones.find(m => m.title === t) || { id: uid('pm'), title: t, done: false });
  Object.assign(p, { title: val('pjTitle').trim() || 'Untitled project', status: val('pjStatus'), next: val('pjNext') });
  touch(p); save('projects'); closeSheet(); render();
};
A.delProject = el => { S.projects = S.projects.filter(x => x.id !== el.dataset.id); save('projects'); closeSheet(); render(); };
A.projLog = el => openSheet(el.dataset.f === 'decisions' ? 'Record a decision' : 'Business learning', `${textArea('pjLogText', '', el.dataset.f === 'decisions' ? 'What was decided, and why?' : 'What did you learn?')}<button class="btn primary block" data-a="saveProjLog" data-id="${el.dataset.id}" data-f="${el.dataset.f}">Save</button>`);
A.saveProjLog = el => { const t = val('pjLogText').trim(); if (!t) return; const p = S.projects.find(x => x.id === el.dataset.id); p[el.dataset.f].push({ date: today(), text: t }); touch(p); save('projects'); closeSheet(); render(); };

/* ---------- Finance (user-entered only) ---------- */
function finCurrent(t) { const e = S.finance.entries.filter(x => x.targetId === t.id).sort((a, b) => a.date.localeCompare(b.date)); return e.length ? e[e.length - 1].value : t.start; }
function finProgress(t) { const cur = finCurrent(t); if (t.target == null || t.start == null || cur == null) return null; const span = t.target - t.start; if (!span) return 100; return clamp(Math.round((cur - t.start) / span * 100), 0, 100); }
SCREENS.finance = () => ({ title: 'Personal finance', html: `<div class="stack">
  <p class="small muted">Every figure here is entered by you. Nothing is estimated or invented. Debt targets count down towards your target.</p>
  ${S.finance.targets.length ? S.finance.targets.map(t => { const p = finProgress(t), cur = finCurrent(t); return `<div class="card stack-sm"><div class="row between"><h3>${esc(t.name)}</h3><span class="badge">${esc(t.kind)}</span></div>
    <div class="row between small"><span class="muted">Start ${money(t.start)}</span><b class="num">${money(cur)}</b><span class="muted">Target ${money(t.target)}</span></div>
    <div class="bar"><i style="width:${p ?? 0}%;background:var(--p-biz)"></i></div><span class="tiny faint">${p ?? 0}% of the way · ${S.finance.entries.filter(e => e.targetId === t.id).length} updates</span>
    <div class="row"><button class="btn sm" data-a="finUpdate" data-id="${t.id}">Update balance</button><button class="btn sm ghost" data-a="finEdit" data-id="${t.id}">Edit</button></div></div>`; }).join('')
    : `<div class="list">${empty('No targets yet', 'Add a target with your own figures.')}</div>`}
  <span class="eyebrow">Add a target</span>
  <div class="chips">${[['Emergency fund', 'savings'], ['Debt reduction', 'debt'], ['Investment capital', 'investment'], ['Development fund', 'development']].map(([n, k]) => `<button class="chip" data-a="finNew" data-n="${n}" data-k="${k}">${ICON.plus.replace('<svg', '<svg width="14" height="14"')} ${n}</button>`).join('')}<button class="chip" data-a="finNew" data-n="" data-k="savings">Custom</button></div></div>` });
const finForm = (t = {}) => `<label class="f">Name<input type="text" id="fnName" value="${esc(t.name || '')}"></label>
  <label class="f">Type<select id="fnKind">${['savings', 'debt', 'investment', 'development'].map(k => `<option ${t.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
  <div class="field-row"><label class="f">Starting figure (£)<input type="number" inputmode="decimal" id="fnStart" value="${t.start ?? ''}"></label><label class="f">Target (£)<input type="number" inputmode="decimal" id="fnTarget" value="${t.target ?? ''}"></label></div>
  <label class="f">Target date<input type="date" id="fnDate" value="${t.date || ''}"></label>`;
A.finNew = el => openSheet('New financial target', finForm({ name: el.dataset.n, kind: el.dataset.k }) + `<p class="tiny faint">For debt, the target is usually 0.</p><button class="btn primary block" data-a="finSave">Create</button>`);
A.finEdit = el => openSheet('Edit target', finForm(S.finance.targets.find(x => x.id === el.dataset.id)) + `<button class="btn primary block" data-a="finSave" data-id="${el.dataset.id}">Save</button><button class="btn ghost danger block" data-a="finDel" data-id="${el.dataset.id}">${ICON.trash} Delete target and history</button>`);
A.finSave = el => {
  const num = id => val(id) === '' ? null : Number(val(id));
  if (num('fnStart') == null || num('fnTarget') == null) { toast('Enter a starting figure and a target'); return; }
  let t = el.dataset.id && S.finance.targets.find(x => x.id === el.dataset.id);
  if (!t) { t = { id: uid('f') }; S.finance.targets.push(t); }
  Object.assign(t, { name: val('fnName').trim() || 'Target', kind: val('fnKind'), start: num('fnStart'), target: num('fnTarget'), date: val('fnDate') }); touch(t);
  save('finance'); closeSheet(); render();
};
A.finDel = el => { S.finance.targets = S.finance.targets.filter(x => x.id !== el.dataset.id); S.finance.entries = S.finance.entries.filter(x => x.targetId !== el.dataset.id); save('finance'); closeSheet(); render(); };
A.finUpdate = el => openSheet('Update balance', `<div class="field-row"><label class="f">Date<input type="date" id="feDate" value="${today()}"></label><label class="f">Balance (£)<input type="number" inputmode="decimal" id="feVal"></label></div><button class="btn primary block" data-a="finEntry" data-id="${el.dataset.id}">Save</button>`, { after: b => setTimeout(() => $('#feVal', b).focus(), 250) });
A.finEntry = el => { if (val('feVal') === '') return; S.finance.entries.push({ id: uid('fe'), targetId: el.dataset.id, date: val('feDate') || today(), value: Number(val('feVal')) }); save('finance'); closeSheet(); render(); toast('Balance recorded'); };

/* ---------- Activity logs ---------- */
const LOG_FIELDS = {
  workout: { title: 'Workout', chips: ['Strength', 'Cardio', 'Walk', 'Sport', 'Mobility'], rate: 'Effort' },
  keyboard: { title: 'Keyboard practice', chips: ['Chord vocabulary', 'Song learning', 'Ear training', 'Musical application', 'Retention review'], rate: 'How well it stuck', extra: [['chords', 'New chords or voicings'], ['song', 'Song(s)']] },
  trading: { title: 'Trading study', chips: ['Learning', 'Chart analysis', 'Structure recognition', 'Risk management', 'Practice (paper)'], rate: 'Understanding', note: 'Secondary, mastery-based learning. Not an income plan.' },
  comms: { title: 'Communication drill', chips: ['2-minute talk', 'Explain it simply', 'Presentation practice', 'Stakeholder conversation', 'Active listening'], rate: 'Clarity' },
  cpd: { title: 'CPD / learning note', chips: ['Course', 'Reading', 'Webinar', 'On-the-job learning', 'Mentoring'], rate: 'Usefulness', extra: [['topic', 'Topic']], formal: true },
};
function openLog(kind, pre = {}) {
  const f = LOG_FIELDS[kind];
  openSheet(f.title, `${f.note ? `<p class="small muted">${f.note}</p>` : ''}
    <div class="field-row"><label class="f">Date<input type="date" id="lgDate" value="${pre.date || today()}"></label><label class="f">Minutes<input type="number" inputmode="numeric" id="lgMins" value="${pre.mins || ''}"></label></div>
    <div class="chips" id="lgChips">${f.chips.map(c => `<button class="chip" data-a="lgChip" aria-pressed="false">${c}</button>`).join('')}</div>
    ${(f.extra || []).map(([k, l]) => `<label class="f">${l}<input type="text" id="lg_${k}"></label>`).join('')}
    ${f.formal ? toggleRow('lgFormal', 'Formal CPD', false, 'Structured learning with a defined outcome') : ''}
    <label class="f">${f.rate}</label>${scaleInput('lgRate', null)}
    <label class="f">Note (optional)${textArea('lgNote', '', kind === 'cpd' ? 'What did you learn? Non-confidential only.' : '')}</label>
    <button class="btn primary block" data-a="saveLog" data-k="${kind}" data-task="${pre.taskId || ''}">Save</button>`);
}
A.lgChip = el => el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') !== 'true');
A.logKind = el => openLog(el.dataset.k);
A.saveLog = el => {
  const k = el.dataset.k, mins = Number(val('lgMins')) || 0;
  const l = { id: uid('l'), kind: k, pillar: { workout: 'health', keyboard: 'skills', trading: 'skills', comms: 'comms', cpd: 'pro' }[k], date: val('lgDate') || today(), mins, tags: $$('#lgChips [aria-pressed="true"]').map(c => c.textContent), rating: scaleVal('lgRate'), note: val('lgNote'), taskId: el.dataset.task || null };
  (LOG_FIELDS[k].extra || []).forEach(([x]) => l[x] = val('lg_' + x));
  if (LOG_FIELDS[k].formal) l.formal = val('lgFormal');
  S.logs.push(touch(l)); save('logs');
  if (!l.taskId) { const t = S.tasks.find(t => t.date === l.date && t.kind === k && t.status === 'open'); if (t) { t.status = 'done'; t.doneAt = nowIso(); touch(t); save('tasks'); } }
  closeSheet(); render(); toast('Logged');
};
SCREENS.logs = () => {
  const recent = S.logs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const kb = S.logs.filter(l => l.kind === 'keyboard');
  const chords = [...new Set(kb.flatMap(l => (l.chords || '').split(',').map(s => s.trim()).filter(Boolean)))];
  const songs = [...new Set(kb.map(l => (l.song || '').trim()).filter(Boolean))];
  return { title: 'Activity logs', html: `<div class="stack">
    <div class="list">${Object.entries(LOG_FIELDS).map(([k, f]) => `<button class="menu-item" data-a="logKind" data-k="${k}"><span class="mi-ic">${ICON[k === 'keyboard' ? 'music' : k === 'cpd' ? 'book' : k === 'comms' ? 'people' : 'log']}</span><span class="grow"><b>${f.title}</b><br><span class="small faint">${S.logs.filter(l => l.kind === k).length} entries</span></span>${ICON.plus.replace('<svg', '<svg class="chev"')}</button>`).join('')}</div>
    <div class="card stack-sm"><h3>Keyboard vocabulary</h3><p class="small"><b>${chords.length}</b> chords or voicings logged${chords.length ? ': ' + esc(chords.slice(-12).join(', ')) : ''}</p><p class="small"><b>${songs.length}</b> songs${songs.length ? ': ' + esc(songs.slice(-8).join(', ')) : ''}</p></div>
    <section class="section"><h2>Recent</h2><div class="list">${recent.map(l => `<div class="task"><span class="grow"><span class="ttl">${esc(LOG_FIELDS[l.kind]?.title || l.kind)}${l.tags?.length ? ' · ' + esc(l.tags.join(', ')) : ''}</span><br><span class="meta num">${fmtDate(l.date, { dow: true })} · ${l.mins} min${l.rating ? ' · ' + l.rating + '/5' : ''}</span></span><button class="icon-btn" data-a="delLog" data-id="${l.id}" aria-label="Delete log">${ICON.trash}</button></div>`).join('') || empty('No logs yet', 'Completing a workout, practice or drill task offers a quick log.')}</div></section></div>` };
};
A.delLog = el => { const i = S.logs.findIndex(l => l.id === el.dataset.id); const [l] = S.logs.splice(i, 1); save('logs'); render(); toast('Log deleted', () => { S.logs.push(l); save('logs'); render(); }); };

/* ---------- Routines ---------- */
SCREENS.routines = () => ({ title: 'Routines', html: `<div class="stack">
  <p class="small muted">The daily planner builds each day from these. Changes apply from the next day you open (or tap "Apply to today").</p>
  ${[...PILLARS, { id: '', short: 'General' }].map(p => { const rs = S.routines.filter(r => r.pillar === p.id); return rs.length ? `<span class="eyebrow">${esc(p.short)}</span><div class="list">${rs.sort((a, b) => toMin(a.time) - toMin(b.time)).map(r => `<button class="menu-item" data-a="editRoutine" data-id="${r.id}" style="${r.active ? '' : 'opacity:.5'}"><span class="grow"><b style="font-weight:500">${esc(r.title)}</b><br><span class="small faint num">${r.days.length === 7 ? 'Daily' : r.days.map(d => DOW[d]).join(' ')} · ${r.time || 'any time'}${r.dur ? ' · ' + r.dur + 'm' : ''}${r.essential ? ' · essential' : ''}${r.mvd ? ' · minimum day' : ''}${r.when !== 'any' ? ' · ' + r.when + ' days' : ''}</span></span></button>`).join('')}</div>` : ''; }).join('')}
  <button class="btn block" data-a="editRoutine">${ICON.plus} Add routine</button>
  <button class="btn block ghost" data-a="applyToday">Apply to today</button></div>` });
A.editRoutine = el => {
  const r = (el.dataset.id && S.routines.find(x => x.id === el.dataset.id)) || { days: [1, 2, 3, 4, 5], time: '', dur: 20, when: 'any', active: true, pillar: '' };
  openSheet(r.id ? 'Edit routine' : 'New routine', `<input type="text" id="rtTitle" value="${esc(r.title || '')}" placeholder="e.g. Read a valuation case study">
    <div class="chips" id="rtDays">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button class="chip" data-a="lgChip" data-d="${d}" aria-pressed="${r.days.includes(d)}">${DOW[d]}</button>`).join('')}</div>
    <div class="field-row"><label class="f">Time<input type="time" id="rtTime" value="${r.time || ''}"></label><label class="f">Minutes<input type="number" id="rtDur" inputmode="numeric" value="${r.dur ?? ''}"></label></div>
    <div class="field-row"><label class="f">Area${pillarSelect('rtPillar', r.pillar)}</label><label class="f">Only on<select id="rtWhen">${[['any', 'Any day'], ['workday', 'Work days'], ['office', 'Office days'], ['remote', 'Remote days']].map(([v, l]) => `<option value="${v}" ${r.when === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <label class="f">Offer a quick log for<select id="rtKind"><option value="">Nothing</option>${Object.entries(LOG_FIELDS).map(([k, f]) => `<option value="${k}" ${r.kind === k ? 'selected' : ''}>${f.title}</option>`).join('')}</select></label>
    ${toggleRow('rtEss', 'Essential commitment', r.essential)}${toggleRow('rtMvd', 'Keep on a Minimum Viable Day', r.mvd)}${toggleRow('rtAnchor', 'Daily anchor (not a top-three candidate)', r.anchor)}${toggleRow('rtActive', 'Active', r.active)}
    <button class="btn primary block" data-a="saveRoutine" data-id="${r.id || ''}">Save</button>
    ${r.id ? `<button class="btn ghost danger block" data-a="delRoutine" data-id="${r.id}">${ICON.trash} Delete routine</button>` : ''}`);
};
A.saveRoutine = el => {
  let r = el.dataset.id && S.routines.find(x => x.id === el.dataset.id);
  if (!r) { r = { id: uid('r') }; S.routines.push(r); }
  Object.assign(r, { title: val('rtTitle').trim() || 'Routine', days: $$('#rtDays [aria-pressed="true"]').map(b => Number(b.dataset.d)), time: val('rtTime') || null, dur: Number(val('rtDur')) || 0, pillar: val('rtPillar'), when: val('rtWhen'), kind: val('rtKind'), essential: val('rtEss'), mvd: val('rtMvd'), anchor: val('rtAnchor'), active: val('rtActive') });
  save('routines'); closeSheet(); render(); toast('Routine saved');
};
A.delRoutine = el => { S.routines = S.routines.filter(x => x.id !== el.dataset.id); save('routines'); closeSheet(); render(); };
A.applyToday = () => {
  const d = today();
  S.tasks = S.tasks.filter(t => !(t.date === d && t.source === 'routine' && t.status === 'open'));
  const day = getDay(d); day.generated = false; generateDay(d); save('tasks', 'days'); toast('Today rebuilt from routines (completed items kept)');
};

/* ---------- Calendar import (.ics) ---------- */
SCREENS.calendar = () => {
  const up = S.events.filter(e => e.date >= today()).sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || ''))).slice(0, 30);
  return { title: 'Calendar import', html: `<div class="stack">
    <p class="small muted">Export a calendar as an .ics file (from Outlook, Google or Apple Calendar) and import it here. Events show on Today's timeline. Only events from the past week to four months ahead are kept. Repeating events import their first occurrence only. Don't import a work calendar that holds confidential details.</p>
    <label class="btn primary block" for="icsIn">${ICON.cal} Choose .ics file</label><input type="file" id="icsIn" accept=".ics,text/calendar" data-onchange="icsFile" hidden>
    <div class="list">${up.map(e => `<div class="task"><span class="grow"><span class="ttl">${esc(e.title)}</span><br><span class="meta num">${fmtDate(e.date, { dow: true })}${e.start ? ' · ' + e.start + (e.end ? '–' + e.end : '') : ' · all day'}</span></span></div>`).join('') || empty('No upcoming events', 'Imported events appear here.')}</div>
    ${S.events.length ? `<button class="btn ghost danger block" data-a="clearEvents">Remove all imported events</button>` : ''}</div>` };
};
ON.icsFile = async el => {
  const f = el.files[0]; if (!f) return;
  const txt = (await f.text()).replace(/\r?\n[ \t]/g, '');
  const evs = []; const lo = addDays(today(), -7), hi = addDays(today(), 120);
  for (const block of txt.split('BEGIN:VEVENT').slice(1)) {
    const get = k => { const m = block.match(new RegExp('^' + k + '(;[^:]*)?:(.*)$', 'm')); return m ? { params: m[1] || '', v: m[2].trim() } : null; };
    const s = get('DTSTART'), e = get('DTEND'), sum = get('SUMMARY'); if (!s) continue;
    const parse = x => { if (!x) return null; const v = x.v; if (/^\d{8}$/.test(v)) return { date: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, time: null };
      const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/); if (!m) return null;
      if (v.endsWith('Z')) { const d = new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5])); return { date: ds(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }; }
      return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` }; };
    const ps = parse(s), pe = parse(e); if (!ps || ps.date < lo || ps.date > hi) continue;
    evs.push({ id: uid('e'), date: ps.date, start: ps.time, end: pe && pe.date === ps.date ? pe.time : null, title: (sum?.v || 'Event').replace(/\\,/g, ',').replace(/\\n/g, ' ') });
  }
  S.events = S.events.filter(x => x.date < lo).concat(evs); save('events'); render(); toast(`${evs.length} events imported`);
};
A.clearEvents = () => { S.events = []; save('events'); render(); };

/* ---------- Settings ---------- */
SCREENS.settings = () => { const s = S.settings; return { title: 'Settings', html: `<div class="stack">
  <div class="card stack"><h3>You</h3>
    <div class="field-row"><label class="f">Your name<input type="text" id="stName" value="${esc(s.name || '')}"></label><label class="f">Wife's name<input type="text" id="stWife" value="${esc(s.wifeName || '')}"></label></div></div>
  <div class="card stack"><h3>Week shape</h3>
    <div class="field-row"><label class="f">Wake<input type="time" id="stWake" value="${s.wake}"></label><label class="f">Bedtime target<input type="time" id="stBed" value="${s.bedtime}"></label></div>
    <div class="field-row"><label class="f">Work starts<input type="time" id="stWs" value="${s.workStart}"></label><label class="f">Work ends<input type="time" id="stWe" value="${s.workEnd}"></label></div>
    <label class="f">Usual office days</label><div class="chips" id="stOffice">${[1, 2, 3, 4, 5].map(d => `<button class="chip" data-a="lgChip" data-d="${d}" aria-pressed="${(s.officeDays || []).includes(d)}">${DOW[d]}</button>`).join('')}</div>
    <label class="f">Commute each way (minutes)<input type="number" id="stCommute" inputmode="numeric" value="${s.commute ?? 0}"></label>
    <p class="tiny faint">Bedtime and commitments live in Routines. Changing them here updates the planner's work blocks.</p></div>
  <div class="card stack"><h3>Appearance</h3><div class="seg">${[['auto', 'Automatic'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button data-a="setTheme" data-v="${v}" aria-pressed="${(s.theme || 'auto') === v}">${l}</button>`).join('')}</div></div>
  <div class="card stack"><h3>Privacy lock</h3><p class="small muted">${s.pinHash ? 'A PIN is required when the app opens.' : 'Add a 4-digit PIN that is asked for when the app opens.'}</p>
    <button class="btn block" data-a="setPin">${s.pinHash ? 'Change PIN' : 'Set a PIN'}</button>${s.pinHash ? '<button class="btn ghost block" data-a="removePin">Remove PIN</button>' : ''}</div>
  <div class="card stack"><h3>Year</h3><label class="f">Year starts on<input type="date" id="stYear" value="${yearStart()}"></label><p class="tiny faint">Quarters run in three-month blocks from this date. The plan continues into later years automatically.</p></div>
  <button class="btn primary block" data-a="saveSettings">Save settings</button>
  <div class="card stack"><h3>Delete everything</h3><p class="small muted">Removes all data on this device. Notion and cloud backups are not touched. Type DELETE to confirm.</p><input type="text" id="delConfirm" autocomplete="off" placeholder="DELETE"><button class="btn danger block" data-a="wipe">Delete all data on this device</button></div></div>` }; };
A.saveSettings = () => {
  const s = S.settings;
  Object.assign(s, { name: val('stName').trim() || s.name, wifeName: val('stWife').trim(), wake: val('stWake'), bedtime: val('stBed'), workStart: val('stWs'), workEnd: val('stWe'), commute: Number(val('stCommute')) || 0, officeDays: $$('#stOffice [aria-pressed="true"]').map(b => Number(b.dataset.d)), yearStart: val('stYear') || s.yearStart });
  save('settings'); toast('Settings saved'); render();
};
A.setTheme = el => { S.settings.theme = el.dataset.v; save('settings'); applyTheme(); render(); };
A.wipe = async () => {
  if (val('delConfirm') !== 'DELETE') { toast('Type DELETE to confirm'); return; }
  try { IDB.db && IDB.db.close(); } catch (e) { }
  await new Promise(r => { const q = indexedDB.deleteDatabase('one-life-os'); q.onsuccess = q.onerror = q.onblocked = () => r(); });
  try { localStorage.clear(); } catch (e) { }
  location.reload();
};

/* ---------- Install instructions ---------- */
SCREENS.install = () => ({ title: 'Add to iPhone', html: `<div class="stack"><div class="card stack-sm">
  <h3>Install on your iPhone</h3>
  <p>1. Open the app's web address in <b>Safari</b> (not Chrome or an in-app browser).</p>
  <p>2. Tap the <b>Share</b> button (square with an arrow).</p>
  <p>3. Scroll and tap <b>Add to Home Screen</b>, then <b>Add</b>.</p>
  <p>4. Open ONE LIFE OS from the new home-screen icon. It runs full screen and works offline.</p>
  <p class="small muted">Your data lives in the app's storage on this phone. Use the home-screen icon every time so you always see the same data. Opening the site in a Safari tab keeps a separate copy.</p>
  <p class="small muted">${window.navigator.standalone || matchMedia('(display-mode: standalone)').matches ? 'You are using the installed app.' : 'You are in a browser tab right now.'}</p></div></div>` });
