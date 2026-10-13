/* ===================== Starter content (editable, no invented achievements) ===================== */
const STARTER_GOALS = [
  { key: 'faith-rhythm', pillar: 'faith', on: true, title: 'Keep a steady daily rhythm of Scripture and prayer', why: 'Keeps my life anchored in Christ before anything else.', criteria: 'A morning rhythm I keep on most days, and a reading plan completed or progressing. Tracked as a rhythm, never scored.', m: [['Choose a reading plan and fix a morning time', 'Start a simple prayer list'], ['Add a short weekly reflection on what I am learning'], ['Complete a focused study of one book'], ['Look back on the year and set next year\'s plan']] },
  { key: 'marriage', pillar: 'faith', on: true, title: 'Protect and invest in my marriage', why: 'My wife comes before every project.', criteria: 'Weekly date night kept or moved, never dropped. Daily unhurried time together. A shared plan for the year.', m: [['Agree our date-night rhythm together'], ['Plan a getaway together'], ['Talk through shared goals and finances'], ['Celebrate and review the year together']] },
  { key: 'serve', pillar: 'faith', on: true, title: 'Serve faithfully in Bible study, youth and worship', why: 'Serving well needs preparation, not leftovers.', criteria: 'Every Bible study prepared at least a day ahead. Youth sessions planned monthly. New songs ready before Sunday.', m: [['Fix a weekly preparation slot'], ['Plan a youth teaching series'], ['Mentor someone to share leading'], ['Review the year with church leaders']] },
  { key: 'health-ws', pillar: 'pro', on: true, title: 'Build working mastery of the DVS Health workstream', why: 'Deep sector knowledge makes me the valuer people rely on.', criteria: 'Self-rated 4/5 or above on core Health competencies. Non-confidential learning notes logged every month.', m: [['Map the main Health property types and valuation approaches', 'Set my competency baseline'], ['Study DRC and specialised property methodology in depth'], ['Lead cases with less supervision, as agreed with my line manager'], ['Run a learning session for colleagues']] },
  { key: 'cpd', pillar: 'pro', on: true, title: 'Meet and exceed RICS CPD requirements', why: 'Keeps my practice current and my membership in good standing.', criteria: 'At least 20 hours CPD, of which at least 10 formal, logged with evidence. Check current RICS rules each year.', m: [['Set a CPD plan and log the first 5 hours'], ['Reach 10 hours logged'], ['Reach 15 hours logged'], ['Complete and record 20+ hours']] },
  { key: 'senior', pillar: 'pro', on: false, title: 'Map my route to Principal Surveyor and FRICS', why: 'Long-term ambition needs a visible path.', criteria: 'A written 3-year development plan with evidence gathered against senior-role and FRICS criteria.', m: [['Read the FRICS and senior-role criteria'], ['Draft the 3-year plan with my line manager'], ['Gather evidence against two criteria'], ['Review the plan and update it']] },
  { key: 'pmres', pillar: 'biz', on: true, title: 'Validate PMRes with approved first clients', why: 'Proves the consultancy before I scale it.', criteria: 'Outside-employment approval confirmed. One core offer defined and priced. First paid engagements completed.', ws: 'pmres', m: [['Confirm outside-employment approval and conflict rules', 'Define one core service and its pricing'], ['Launch a simple website and outreach'], ['Complete first engagements and gather feedback'], ['Review the numbers and decide the scale-up plan']] },
  { key: 'pio', pillar: 'biz', on: true, title: 'Grow Property Is One consistently', why: 'Teaching builds trust, audience and future products.', criteria: 'A weekly publishing rhythm kept. Free guide launched.', ws: 'pio', m: [['Set a sustainable posting rhythm'], ['Launch the free guide'], ['Publish the ebook'], ['Review audience growth and plan products']] },
  { key: 'origin', pillar: 'biz', on: true, title: 'Decide on Origin Property with clear terms', why: 'A partnership needs clarity before commitment.', criteria: 'Go or no-go decided, backed by written heads of terms and professional advice.', ws: 'origin', m: [['Agree goals and roles with my partner'], ['Complete due diligence and take legal advice'], ['Make the go or no-go decision'], ['If go: reach the first project milestone']] },
  { key: 'ghana', pillar: 'biz', on: true, title: 'Move the Ghana four-apartment development forward', why: 'Family assets and a base for future growth.', criteria: 'Budget, programme and monitoring in place. Agreed construction stage reached.', ws: 'ghana', m: [['Confirm budget, cost plan and who decides what'], ['Agree contractor terms and payment schedule'], ['Reach the agreed construction stage'], ['Plan the letting or sale strategy']] },
  { key: 'capital', pillar: 'biz', on: true, title: 'Build financial capacity for property development', why: 'Capital and low debt give me options.', criteria: 'Savings, debt and capital targets set in Finance and updated monthly.', m: [['Set savings, debt and capital targets'], ['Automate monthly saving'], ['Review progress against targets'], ['Assess development readiness']] },
  { key: 'comms', pillar: 'comms', on: true, title: 'Communicate with clarity and calm confidence', why: 'Clear communication multiplies technical skill.', criteria: 'Drills most weeks, a rising self-rated clarity trend, and two presentations delivered.', m: [['Start a 10-minute drill habit'], ['Deliver one internal presentation'], ['Lead a stakeholder meeting confidently'], ['Give a talk to a wider audience']] },
  { key: 'health', pillar: 'health', on: true, title: 'Train consistently and protect sleep', why: 'Energy underpins everything else.', criteria: 'Three sessions in most weeks. In bed by bedtime on most nights.', m: [['Settle a three-session weekly routine'], ['Set a fitness benchmark'], ['Improve on the benchmark'], ['Review and plan next year']] },
  { key: 'keys', pillar: 'skills', on: true, title: 'Grow as a worship keyboard player', why: 'Serve the church with skill and freedom.', criteria: 'Wider chord vocabulary, songs learned by ear logged, new songs played confidently on Sundays.', m: [['Settle a practice routine and learn core chord extensions'], ['Play songs by ear in common keys'], ['Learn transitions and reharmonisation'], ['Lead a song confidently by ear']] },
  { key: 'trading', pillar: 'skills', on: true, title: 'Learn trading as a mastery skill, not an income stream', why: 'Understand markets with discipline before risking money.', criteria: 'One structured curriculum completed, written risk rules, and a journal of practice trades.', m: [['Pick one curriculum and a journal format'], ['Practise market structure and chart analysis'], ['Practise trades with written risk rules'], ['Evaluate: keep learning or pause']] },
];

const STARTER_COMPETENCIES = [
  'Red Book (RICS Valuation – Global Standards) compliance', 'Health sector property knowledge', 'DRC and specialised property valuation',
  'Investment and comparison methods', 'Development appraisal', 'Landlord and tenant', 'Inspection and measurement',
  'Report writing', 'Negotiation', 'Stakeholder engagement', 'Coaching APC candidates',
];

const STARTER_PROJECTS = [
  { ws: 'pmres', title: 'Validate the PMRes offer', ms: ['Outside-employment approval confirmed', 'Core service and pricing written', 'Simple website live', 'First engagement completed'] },
  { ws: 'pio', title: 'Content system and free guide', ms: ['Posting rhythm agreed', 'Free guide drafted', 'Free guide published', 'Ebook outline'] },
  { ws: 'origin', title: 'JV due diligence', ms: ['Goals and roles agreed', 'Heads of terms drafted', 'Legal advice taken', 'Go or no-go decision'] },
  { ws: 'ghana', title: 'Four-apartment development', ms: ['Budget and cost plan confirmed', 'Contractor terms and payment schedule', 'Monitoring arrangements in place', 'Letting or sale strategy'] },
];

function buildRoutines(o) {
  const wake = toMin(o.wake), bed = toMin(o.bedtime), all = [0, 1, 2, 3, 4, 5, 6];
  const wife = o.wifeName ? o.wifeName : 'my wife';
  const bsDay = Number(o.bibleDay), dn = Number(o.dateNight);
  const R = (pillar, title, days, time, dur, x = {}) => ({ id: uid('r'), pillar, title, days, time, dur, essential: false, mvd: false, anchor: false, when: 'any', active: true, ...x });
  return [
    R('faith', 'Scripture and prayer', all, fromMin(wake + 15), 20, { essential: true, mvd: true, anchor: true }),
    R('faith', `Unhurried time with ${wife}`, all.filter(d => d !== bsDay && d !== dn), '20:15', 30, { essential: true, mvd: true, anchor: true }),
    R('faith', `Time together with ${wife}`, [bsDay].filter(d => d !== dn), '21:15', 20, { essential: true, mvd: true, anchor: true }),
    R('faith', 'Date night', [dn], '19:00', 120, { essential: true, mvd: true }),
    R('faith', 'Lead Bible study', [bsDay], o.bibleTime, 90, { essential: true, mvd: true }),
    R('faith', 'Prepare Bible study', [(bsDay + 5) % 7], '16:00', 45, { essential: true }),
    R('faith', 'Church service and keyboard', [0], o.churchTime, 180, { essential: true, mvd: true }),
    R('pro', 'Professional learning (20 min)', [2, 3, 4], '18:30', 20, { kind: 'cpd' }),
    R('pro', 'Note one thing I learned at work (non-confidential)', [1, 2, 3, 4, 5], o.workEnd, 5, { when: 'workday' }),
    R('comms', 'Communication drill (10 min)', [1, 3, 5], fromMin(wake + 40), 10, { kind: 'comms' }),
    R('health', 'Workout', [2, 4], '17:45', 40, { kind: 'workout' }),
    R('health', 'Workout', [6], '08:00', 45, { kind: 'workout' }),
    R('health', 'Lunchtime walk', [1, 2, 3, 4, 5], '12:30', 20, { when: 'remote' }),
    R('health', 'Screens off, wind down', all, fromMin(bed - 30), 30, { essential: true, mvd: true, anchor: true }),
    R('health', `Lights out by ${o.bedtime}`, all, o.bedtime, 0, { essential: true, mvd: true, anchor: true }),
    R('biz', 'Business block: PMRes or Property Is One', [3], '19:00', 60),
    R('biz', 'Business block: projects and Ghana updates', [6], '09:30', 120),
    R('skills', 'Keyboard practice (20 min)', [2, 4], '19:15', 20, { kind: 'keyboard' }),
    R('skills', 'Keyboard: learn Sunday songs', [6], '15:00', 30, { kind: 'keyboard' }),
    R('skills', 'Trading study (30 min)', [6], '11:30', 30, { kind: 'trading' }),
    R('', 'Weekly review and plan next week', [0], '19:00', 20),
  ].filter(r => r.days.length);
}

function seedFromOnboarding(o, goalKeys) {
  const st = S.settings;
  Object.assign(st, {
    name: o.name.trim() || 'Paul', wifeName: o.wifeName.trim(), wake: o.wake, bedtime: o.bedtime,
    workStart: o.workStart, workEnd: o.workEnd, officeDays: o.officeDays, commute: Number(o.commute) || 0,
    bibleDay: Number(o.bibleDay), bibleTime: o.bibleTime, churchTime: o.churchTime, dateNight: Number(o.dateNight),
    yearStart: o.yearStart || '2026-10-14', theme: st.theme || 'auto', onboarded: true, createdAt: nowIso(),
  });
  S.routines = buildRoutines(o);
  const cyc = cycleFor(today() < yearStart() ? yearStart() : today());
  S.goals = []; S.milestones = [];
  for (const g of STARTER_GOALS.filter(g => goalKeys.includes(g.key))) {
    const id = uid('g');
    S.goals.push(touch({ id, pillar: g.pillar, title: g.title, why: g.why, criteria: g.criteria, targetDate: cyc.end, cycle: cyc.start, status: 'notstarted', progressMode: 'auto', progress: 0, evidence: [], risks: '', deps: '', ws: g.ws || '', createdAt: nowIso() }));
    g.m.forEach((arr, qi) => arr.forEach(t => {
      const r = quarterRange(cyc.start, qi + 1);
      S.milestones.push(touch({ id: uid('m'), goalId: id, kind: 'quarter', q: qi + 1, period: `Q${qi + 1}`, due: r.end, title: t, done: false }));
    }));
  }
  S.competencies = STARTER_COMPETENCIES.map(n => touch({ id: uid('c'), name: n, confidence: null, history: [], evidence: [] }));
  S.projects = STARTER_PROJECTS.map(p => touch({ id: uid('p'), ws: p.ws, title: p.title, status: 'active', next: '', notes: '', milestones: p.ms.map(t => ({ id: uid('pm'), title: t, done: false, due: '' })), decisions: [], learning: [] }));
  save(...COLLECTIONS);
}
