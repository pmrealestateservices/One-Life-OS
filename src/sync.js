/* ===================== Export, cloud backup and Notion sync ===================== */
function tombstone(type, id) { if (S.sync.map[id]) { S.sync.deleted.push({ type, id, at: nowIso() }); save('sync'); } }
function untombstone(id) { S.sync.deleted = S.sync.deleted.filter(d => d.id !== id); save('sync'); }
async function deliverFile(name, text, mime) {
  const blob = new Blob([text], { type: mime });
  try {
    const file = new File([blob], name, { type: mime });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
const csvCell = v => { const s = Array.isArray(v) ? v.join('; ') : (v && typeof v === 'object') ? JSON.stringify(v) : String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
function toCsv(rows, cols) { return [cols.join(','), ...rows.map(r => cols.map(c => csvCell(r[c])).join(','))].join('\n'); }
function snapshot() { const o = { app: 'one-life-os', version: APP_VERSION, exportedAt: nowIso(), data: {} }; COLLECTIONS.forEach(k => o.data[k] = S[k]); const s = o.data.settings = { ...S.settings }; delete s.pinHash; delete s.pinSalt; delete s.backupPass; delete s.appKey; return o; }
const stamp = () => today();
A.exportJson = () => deliverFile(`one-life-os-backup-${stamp()}.json`, JSON.stringify(snapshot(), null, 1), 'application/json');
A.exportCsv = el => {
  const k = el.dataset.k; const gName = id => goalOf(id)?.title || '';
  const sets = {
    tasks: () => toCsv(S.tasks.map(t => ({ ...t, goal: gName(t.goalId), area: P[t.pillar]?.short || 'General' })), ['id', 'date', 'time', 'title', 'area', 'status', 'skipReason', 'essential', 'dur', 'goal', 'source', 'doneAt', 'notes']),
    goals: () => toCsv(S.goals.map(g => ({ ...g, area: P[g.pillar]?.short, progressPct: goalProgress(g), evidence: (g.evidence || []).map(e => `${e.date}: ${e.text}`) })), ['id', 'cycle', 'area', 'title', 'status', 'progressPct', 'targetDate', 'why', 'criteria', 'deps', 'risks', 'evidence']),
    milestones: () => toCsv(S.milestones.map(m => ({ ...m, goal: gName(m.goalId) })), ['id', 'goal', 'kind', 'period', 'title', 'due', 'done', 'doneAt']),
    journal: () => toCsv(Object.values(S.journal).sort((a, b) => a.date.localeCompare(b.date)).map(j => ({ date: j.date, ...Object.fromEntries(Object.entries(j.morning || {}).map(([k, v]) => ['morning_' + k, v])), ...Object.fromEntries(Object.entries(j.evening || {}).map(([k, v]) => ['evening_' + k, v])), notes: j.notes, leadership: j.leader })), ['date', 'morning_matters', 'morning_grateful', 'morning_action', 'evening_accomplished', 'evening_learned', 'evening_challenged', 'evening_improve', 'notes', 'leadership']),
    logs: () => toCsv(S.logs, ['id', 'date', 'kind', 'mins', 'tags', 'rating', 'formal', 'topic', 'chords', 'song', 'note']),
    days: () => toCsv(Object.values(S.days).map(d => ({ date: d.date, mode: d.mode, workType: d.workType, focus: d.focus, sleep: d.checkin?.sleep, energy: d.checkin?.energy, recovery: d.checkin?.recovery, wellbeing: d.checkin?.wellbeing })), ['date', 'mode', 'workType', 'focus', 'sleep', 'energy', 'recovery', 'wellbeing']),
  };
  deliverFile(`one-life-os-${k}-${stamp()}.csv`, sets[k](), 'text/csv');
};
A.exportMd = () => {
  let md = `# ONE LIFE OS export\n\nExported ${new Date().toLocaleString('en-GB')}\n\n## Goals\n`;
  for (const g of S.goals) {
    md += `\n### ${g.title}\n- Area: ${P[g.pillar]?.name}\n- Status: ${GOAL_STATUS[g.status]?.[0]} · ${goalProgress(g)}%\n- Target: ${g.targetDate}\n- Why: ${g.why}\n- Success: ${g.criteria}\n`;
    S.milestones.filter(m => m.goalId === g.id).forEach(m => md += `- [${m.done ? 'x' : ' '}] ${m.kind === 'quarter' ? m.period : fmtMonth(m.period)}: ${m.title}\n`);
    (g.evidence || []).forEach(e => md += `- Evidence ${e.date}: ${e.text}\n`);
  }
  md += `\n## Journal\n`;
  Object.values(S.journal).filter(hasJournal).sort((a, b) => a.date.localeCompare(b.date)).forEach(j => {
    md += `\n### ${fmtLong(j.date)} ${j.date.slice(0, 4)}\n`;
    PROMPTS.morning.concat(PROMPTS.evening).forEach(([k, q]) => { const v = j.morning?.[k] ?? j.evening?.[k]; if (v) md += `**${q}** ${v}\n\n`; });
    if (j.notes) md += `**Notes** ${j.notes}\n\n`; if (j.leader) md += `**Leadership** ${j.leader}\n\n`;
  });
  md += `\n## Reviews\n`;
  S.reviews.forEach(r => { const f = facts(r.start, r.end); md += `\n### ${r.type} review ${r.start} – ${r.end}\n**Facts:** completion ${f.completion ?? '—'}%, ${f.done}/${f.planned} done, ${f.workouts} workouts, ${f.journalDays} journal days.\n\n**Self-assessment:** ${Object.entries(r.self || {}).map(([k, v]) => `${k}: ${v}`).join('; ')}\n\n**Suggestions (rules-based):** ${suggestions(f).join(' ')}\n`; });
  deliverFile(`one-life-os-${stamp()}.md`, md, 'text/markdown');
};
ON.importJson = async el => {
  const f = el.files[0]; if (!f) return;
  try { const o = JSON.parse(await f.text()); if (o.app !== 'one-life-os' || !o.data) throw new Error('Not a ONE LIFE OS backup'); confirmRestore(o, 'file'); }
  catch (e) { toast('That file could not be read: ' + e.message); }
};
function confirmRestore(o, src) {
  openSheet('Restore backup?', `<p>This replaces everything on this device with the backup from <b>${esc(new Date(o.exportedAt).toLocaleString('en-GB'))}</b> (${src}). Your PIN and connection keys stay as they are.</p><button class="btn danger block" data-a="doRestore">Replace data with backup</button>`);
  A.doRestore = () => {
    const keep = { pinHash: S.settings.pinHash, pinSalt: S.settings.pinSalt, appKey: S.settings.appKey, backupPass: S.settings.backupPass, server: S.settings.server };
    COLLECTIONS.forEach(k => { if (o.data[k] !== undefined) S[k] = o.data[k]; });
    Object.assign(S.settings, keep); save(...COLLECTIONS); closeSheet(); applyTheme(); go('today'); toast('Backup restored');
  };
}

/* ---- Server helpers (Netlify Functions on the same site) ---- */
const apiBase = () => (S.settings.server || '').replace(/\/$/, '');
async function api(path, opts = {}) {
  if (!S.settings.appKey) throw new Error('Add your app key first (set as APP_KEY in Netlify).');
  let res;
  try { res = await fetch(apiBase() + path, { ...opts, headers: { 'content-type': 'application/json', 'x-app-key': S.settings.appKey, ...(opts.headers || {}) } }); }
  catch (e) { throw new Error(navigator.onLine ? 'Could not reach the server. Is the site deployed with functions?' : 'You are offline. Try again when connected.'); }
  let body = null; try { body = await res.json(); } catch (e) { }
  if (!res.ok) throw new Error(body?.error || `Server error ${res.status}${res.status === 404 ? ': functions not deployed' : ''}`);
  return body;
}

/* ---- Encrypted cloud backup ---- */
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encrypt(obj, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pass, salt), new TextEncoder().encode(JSON.stringify(obj)));
  return { v: 1, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
async function decrypt(p, pass) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(p.iv) }, await deriveKey(pass, unb64(p.salt)), unb64(p.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function cloudBackup(silent) {
  if (!S.settings.backupPass) throw new Error('Set a backup passphrase first.');
  const payload = await encrypt(snapshot(), S.settings.backupPass);
  const r = await api('/api/backup', { method: 'PUT', body: JSON.stringify({ payload, meta: { at: nowIso(), version: APP_VERSION } }) });
  S.sync.lastBackup = r.at || nowIso(); S.sync.lastBackupError = null; save('sync');
  if (!silent) { toast('Encrypted backup saved'); render(); }
}
A.cloudBackup = async el => { el.disabled = true; el.textContent = 'Backing up…'; try { await cloudBackup(); } catch (e) { S.sync.lastBackupError = e.message; save('sync'); toast(e.message); render(); } };
A.cloudRestore = async el => {
  el.disabled = true;
  try { const r = await api('/api/backup?key=latest'); if (!r.payload) throw new Error('No cloud backup found yet.'); const o = await decrypt(r.payload, S.settings.backupPass || ''); confirmRestore(o, 'cloud'); }
  catch (e) { toast(e.name === 'OperationError' ? 'Wrong passphrase for this backup.' : e.message); el.disabled = false; }
};

/* ---- Notion sync (one-way, app → Notion) ---- */
const txt = v => (v ?? '').toString();
function syncRecords() {
  const inc = S.settings.notionRoutines;
  const gName = id => goalOf(id)?.title || '';
  const out = [];
  S.goals.forEach(g => out.push({ type: 'goals', appId: g.id, u: [g.updatedAt, ...S.milestones.filter(m => m.goalId === g.id).map(m => m.updatedAt)].filter(Boolean).sort().pop(), name: g.title, props: { Pillar: P[g.pillar]?.short, Status: GOAL_STATUS[g.status]?.[0], Progress: goalProgress(g), 'Target date': g.targetDate, Why: g.why, 'Success criteria': g.criteria, Risks: g.risks, Dependencies: g.deps, Evidence: (g.evidence || []).map(e => `${e.date}: ${e.text}`).join('\n'), Cycle: cycleFor(g.cycle || yearStart()).label } }));
  S.milestones.forEach(m => out.push({ type: 'milestones', appId: m.id, u: m.updatedAt, name: m.title, props: { Goal: gName(m.goalId), Kind: m.kind === 'quarter' ? 'Quarterly' : 'Monthly', Period: m.kind === 'quarter' ? m.period : fmtMonth(m.period), Due: m.due, Done: !!m.done, 'Done on': m.doneAt ? m.doneAt.slice(0, 10) : null } }));
  S.tasks.filter(t => inc || t.source !== 'routine').forEach(t => out.push({ type: 'tasks', appId: t.id, u: t.updatedAt, name: t.title, props: { Pillar: P[t.pillar]?.short || 'General', Status: { open: 'Open', done: 'Done', skipped: 'Skipped' }[t.status], Date: t.date, Time: t.time, Minutes: t.dur, Essential: !!t.essential, Goal: gName(t.goalId), Source: { routine: 'Routine', weekly: 'Weekly action', manual: 'Task' }[t.source] || 'Task', 'Skip reason': t.skipReason, Notes: t.notes } }));
  Object.values(S.journal).filter(hasJournal).forEach(j => out.push({ type: 'journal', appId: 'j-' + j.date, u: j.updatedAt, name: `Journal ${j.date}`, props: { Date: j.date, 'What matters most': j.morning?.matters, Grateful: j.morning?.grateful, 'One action': j.morning?.action, Accomplished: j.evening?.accomplished, Learned: j.evening?.learned, Challenged: j.evening?.challenged, Improve: j.evening?.improve, Notes: j.notes, Leadership: j.leader } }));
  S.reviews.forEach(r => { const f = facts(r.start, r.end); out.push({ type: 'reviews', appId: r.id, u: r.updatedAt, name: `${r.type[0].toUpperCase() + r.type.slice(1)} review ${r.start}`, props: { Type: r.type, Start: r.start, End: r.end, Facts: `Completion ${f.completion ?? '—'}% (${f.done}/${f.planned}), skipped ${f.skipped}, workouts ${f.workouts}, drills ${f.drills}, CPD ${f.cpdHours}h, journal days ${f.journalDays}, milestones ${f.milestonesDone}, avg sleep ${f.avgSleep ?? '—'}h`, 'Self-assessment': Object.entries(r.self || {}).map(([k, v]) => `${k}: ${v}`).join('\n'), Suggestions: suggestions(f).join('\n') } }); });
  S.logs.forEach(l => out.push({ type: 'logs', appId: l.id, u: l.updatedAt, name: `${LOG_FIELDS[l.kind]?.title || l.kind} ${l.date}`, props: { Kind: LOG_FIELDS[l.kind]?.title || l.kind, Date: l.date, Minutes: l.mins, Tags: (l.tags || []).join(', '), Rating: l.rating, Note: [l.topic, l.song, l.chords, l.note].filter(Boolean).join(' · ') } }));
  return out;
}
function pendingSync() { const map = S.sync.map; return syncRecords().filter(r => !map[r.appId] || (r.u && r.u > map[r.appId].at)); }
let syncing = false;
async function notionSync(silent) {
  if (syncing) return; syncing = true;
  const prog = $('#syncProg');
  try {
    if (!S.settings.notionPage) throw new Error('Paste the Notion page link where your databases should live.');
    const items = pendingSync();
    const archive = S.sync.deleted.filter(d => S.sync.map[d.id]?.notionId).map(d => ({ appId: d.id, notionId: S.sync.map[d.id].notionId }));
    let ok = 0, failed = 0, lastErr = null;
    const batches = []; for (let i = 0; i < items.length; i += 4) batches.push(items.slice(i, i + 4));
    if (!batches.length && archive.length) batches.push([]);
    for (let bi = 0; bi < batches.length; bi++) {
      if (prog) prog.textContent = `Syncing ${Math.min((bi + 1) * 4, items.length)} of ${items.length}…`;
      const b = batches[bi];
      const r = await api('/api/notion', { method: 'POST', body: JSON.stringify({ action: 'sync', parent: S.settings.notionPage, dbIds: S.sync.dbIds || {}, items: b.map(x => ({ type: x.type, appId: x.appId, notionId: S.sync.map[x.appId]?.notionId, name: x.name, props: x.props })), archive: bi === 0 ? archive : [] }) });
      S.sync.dbIds = r.dbIds;
      for (const res of r.results) {
        const rec = b.find(x => x.appId === res.appId);
        if (res.ok) { S.sync.map[res.appId] = { notionId: res.notionId, at: rec?.u || nowIso(), type: rec?.type }; ok++; } else { failed++; lastErr = res.error; }
      }
      for (const a of (r.archived || [])) { delete S.sync.map[a]; S.sync.deleted = S.sync.deleted.filter(d => d.id !== a); }
      save('sync');
    }
    S.sync.lastNotionAttempt = nowIso();
    if (failed) { S.sync.notionError = `${failed} records failed: ${lastErr}`; }
    else { S.sync.lastNotion = nowIso(); S.sync.notionError = null; }
    S.sync.lastNotionCount = ok; save('sync');
    if (!silent) toast(failed ? `${ok} synced, ${failed} failed` : ok ? `${ok} records written to Notion` : 'Notion is already up to date');
  } catch (e) {
    S.sync.notionError = e.message; S.sync.lastNotionAttempt = nowIso(); save('sync'); if (!silent) toast(e.message);
  } finally { syncing = false; if (R.sub === 'data') render(); }
}
A.notionSync = el => { el.disabled = true; el.textContent = 'Syncing…'; notionSync(); };
A.notionTest = async el => {
  el.disabled = true;
  try { const r = await api('/api/notion', { method: 'POST', body: JSON.stringify({ action: 'test', parent: S.settings.notionPage }) }); toast(`Connected to “${r.title || 'your page'}”`); }
  catch (e) { toast(e.message); } finally { el.disabled = false; }
};
A.notionReset = () => openSheet('Reset Notion link?', `<p class="small">Use this if you deleted the databases in Notion or want to sync into a new page. The next sync creates fresh databases and writes every record again. Nothing in Notion is deleted.</p><button class="btn danger block" data-a="doNotionReset">Reset and resync from scratch</button>`);
A.doNotionReset = () => { S.sync.map = {}; S.sync.dbIds = {}; S.sync.deleted = []; save('sync'); closeSheet(); render(); toast('Notion link reset'); };
A.saveConn = () => {
  Object.assign(S.settings, { server: val('cnServer').trim(), appKey: val('cnKey').trim(), notionPage: val('cnPage').trim(), notionRoutines: val('cnRoutines'), notionAuto: val('cnAuto'), backupAuto: val('cnBackupAuto') });
  if (val('cnPass')) S.settings.backupPass = val('cnPass');
  save('settings'); toast('Connection settings saved'); render();
};
async function autoJobs() {
  const s = S.settings; if (!s.appKey || !navigator.onLine) return;
  const stale = iso => !iso || (Date.now() - new Date(iso).getTime()) > 20 * 3600e3;
  try { if (s.backupAuto && s.backupPass && stale(S.sync.lastBackup)) await cloudBackup(true); } catch (e) { S.sync.lastBackupError = e.message; save('sync'); }
  if (s.notionAuto && s.notionPage && stale(S.sync.lastNotionAttempt)) await notionSync(true);
}
const when = iso => iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never';
SCREENS.data = () => {
  const s = S.settings, pend = pendingSync().length, del = S.sync.deleted.length;
  return { title: 'Backup, export & Notion', html: `<div class="stack">
  <div class="card stack-sm"><h3>Download a backup</h3><p class="small muted">Works offline with no setup. On iPhone, choose "Save to Files".</p>
    <button class="btn primary block" data-a="exportJson">${ICON.download} Full backup (.json)</button>
    <button class="btn block" data-a="exportMd">${ICON.download} Readable export (.md)</button>
    <div class="chips">${['tasks', 'goals', 'milestones', 'journal', 'logs', 'days'].map(k => `<button class="chip" data-a="exportCsv" data-k="${k}">${k}.csv</button>`).join('')}</div>
    <label class="btn ghost block" for="impIn">Restore from a .json backup</label><input type="file" id="impIn" accept="application/json,.json" data-onchange="importJson" hidden></div>

  <div class="card stack-sm"><div class="row between"><h3>Notion sync</h3><span class="badge ${S.sync.notionError ? 'bad' : S.sync.lastNotion ? 'ok' : ''}">${S.sync.notionError ? 'Error' : S.sync.lastNotion ? 'Connected' : 'Not set up'}</span></div>
    <p class="small muted">One-way: the app writes goals, milestones, tasks, journal, reviews and logs into six Notion databases. Each record carries a stable App ID, so syncing again updates it rather than duplicating it.</p>
    <div class="row between small"><span class="muted">Last successful sync</span><b>${when(S.sync.lastNotion)}</b></div>
    <div class="row between small"><span class="muted">Waiting to sync</span><b class="num">${pend} changes${del ? ` · ${del} deletions` : ''}</b></div>
    ${S.sync.notionError ? `<div class="callout" style="border-color:var(--bad)"><b>Last attempt failed.</b> ${esc(S.sync.notionError)}</div>` : ''}
    <p class="small" id="syncProg" aria-live="polite"></p>
    <button class="btn primary block" data-a="notionSync" ${!s.appKey || !s.notionPage ? 'disabled' : ''}>${S.sync.notionError ? 'Retry sync' : 'Sync to Notion now'}</button>
    <div class="row"><button class="btn block sm" data-a="notionTest" ${!s.appKey || !s.notionPage ? 'disabled' : ''}>Test connection</button><button class="btn block sm ghost" data-a="notionReset">Reset link</button></div></div>

  <div class="card stack-sm"><div class="row between"><h3>Encrypted cloud backup</h3><span class="badge ${S.sync.lastBackupError ? 'bad' : S.sync.lastBackup ? 'ok' : ''}">${S.sync.lastBackup ? 'On' : 'Off'}</span></div>
    <p class="small muted">Encrypted on this phone with your passphrase before upload, then stored with your Netlify site. Restore it onto a new phone with the same passphrase. Nobody can read it without the passphrase, and it cannot be recovered if you forget it.</p>
    <div class="row between small"><span class="muted">Last backup</span><b>${when(S.sync.lastBackup)}</b></div>
    ${S.sync.lastBackupError ? `<div class="callout" style="border-color:var(--bad)">${esc(S.sync.lastBackupError)}</div>` : ''}
    <div class="row"><button class="btn block" data-a="cloudBackup" ${!s.appKey || !s.backupPass ? 'disabled' : ''}>Back up now</button><button class="btn block ghost" data-a="cloudRestore" ${!s.appKey || !s.backupPass ? 'disabled' : ''}>Restore</button></div></div>

  <div class="card stack"><h3>Connection settings</h3>
    <label class="f">App key (the APP_KEY you set in Netlify)<input type="password" id="cnKey" value="${esc(s.appKey || '')}" autocomplete="off"></label>
    <label class="f">Notion page link (share it with your integration first)<input type="url" id="cnPage" value="${esc(s.notionPage || '')}" placeholder="https://www.notion.so/…"></label>
    <label class="f">Backup passphrase ${s.backupPass ? '(set, leave blank to keep)' : ''}<input type="password" id="cnPass" autocomplete="new-password" placeholder="${s.backupPass ? '••••••••' : 'Choose something memorable'}"></label>
    ${toggleRow('cnRoutines', 'Include routine tasks in Notion', s.notionRoutines, 'Off keeps Notion focused on goal actions and one-off tasks')}
    ${toggleRow('cnAuto', 'Sync to Notion once a day', s.notionAuto, 'Runs when you open the app, at most once every 20 hours')}
    ${toggleRow('cnBackupAuto', 'Cloud backup once a day', s.backupAuto, 'Runs when you open the app')}
    <details><summary>Advanced</summary><label class="f">Server address (leave blank when using the Netlify site)<input type="url" id="cnServer" value="${esc(s.server || '')}" placeholder="https://your-site.netlify.app"></label></details>
    <button class="btn primary block" data-a="saveConn">Save connection settings</button></div>
  <p class="tiny faint">Setup steps are in the README that comes with the app.</p></div>` };
};
