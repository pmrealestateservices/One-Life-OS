// ONE LIFE OS — Notion sync (one-way, app → Notion).
// Uses the official Notion REST API with an internal integration token kept in Netlify env vars.
// Env vars: APP_KEY (shared secret the app sends), NOTION_TOKEN (integration secret).

const NOTION = 'https://api.notion.com/v1';
const VERSION = '2025-09-03';

// Property schema per record type. Every database also gets "Name" (title), "App ID" and "Last synced".
const SCHEMAS = {
  goals: { title: 'ONE LIFE · Goals', props: { Pillar: 'select', Status: 'select', Progress: 'number', 'Target date': 'date', Why: 'text', 'Success criteria': 'text', Risks: 'text', Dependencies: 'text', Evidence: 'text', Cycle: 'text' } },
  milestones: { title: 'ONE LIFE · Milestones', props: { Goal: 'text', Kind: 'select', Period: 'text', Due: 'date', Done: 'checkbox', 'Done on': 'date' } },
  tasks: { title: 'ONE LIFE · Tasks', props: { Pillar: 'select', Status: 'select', Date: 'date', Time: 'text', Minutes: 'number', Essential: 'checkbox', Goal: 'text', Source: 'select', 'Skip reason': 'text', Notes: 'text' } },
  journal: { title: 'ONE LIFE · Journal', props: { Date: 'date', 'What matters most': 'text', Grateful: 'text', 'One action': 'text', Accomplished: 'text', Learned: 'text', Challenged: 'text', Improve: 'text', Notes: 'text', Leadership: 'text' } },
  reviews: { title: 'ONE LIFE · Reviews', props: { Type: 'select', Start: 'date', End: 'date', Facts: 'text', 'Self-assessment': 'text', Suggestions: 'text' } },
  logs: { title: 'ONE LIFE · Activity log', props: { Kind: 'select', Date: 'date', Minutes: 'number', Tags: 'text', Rating: 'number', Note: 'text' } },
};

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const sleep = ms => new Promise(r => setTimeout(r, ms));

function safeEqual(a = '', b = '') {
  if (a.length !== b.length) return false;
  let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

async function notion(path, method = 'GET', body, tries = 0) {
  const res = await fetch(NOTION + path, {
    method,
    headers: { Authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version': VERSION, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 429 && tries < 3) { await sleep((Number(res.headers.get('retry-after')) || 1) * 1000); return notion(path, method, body, tries + 1); }
  if (res.status >= 500 && tries < 2) { await sleep(800); return notion(path, method, body, tries + 1); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.message || `Notion error ${res.status}`); e.status = res.status; e.code = data.code; throw e; }
  await sleep(340); // stay under Notion's ~3 requests/second average
  return data;
}

const pageIdFrom = s => { const m = String(s || '').replace(/-/g, '').match(/([0-9a-f]{32})(?:[?#].*)?$/i) || String(s || '').replace(/-/g, '').match(/([0-9a-f]{32})/i); return m ? m[1] : null; };
const richText = v => { const s = String(v ?? ''); const out = []; for (let i = 0; i < s.length && out.length < 100; i += 1900) out.push({ type: 'text', text: { content: s.slice(i, i + 1900) } }); return out; };
const cleanSelect = v => String(v ?? '').replace(/,/g, ' ').slice(0, 100);

function schemaProps(type) {
  const p = { Name: { title: {} }, 'App ID': { rich_text: {} }, 'Last synced': { date: {} } };
  for (const [k, t] of Object.entries(SCHEMAS[type].props)) p[k] = t === 'text' ? { rich_text: {} } : t === 'number' ? { number: {} } : t === 'date' ? { date: {} } : t === 'checkbox' ? { checkbox: {} } : { select: {} };
  return p;
}
function toProps(type, item) {
  const p = { Name: { title: richText(item.name || 'Untitled').slice(0, 1) }, 'App ID': { rich_text: richText(item.appId) }, 'Last synced': { date: { start: new Date().toISOString() } } };
  for (const [k, t] of Object.entries(SCHEMAS[type].props)) {
    const v = item.props?.[k];
    if (t === 'text') p[k] = { rich_text: richText(v) };
    else if (t === 'number') p[k] = { number: v === null || v === undefined || v === '' || isNaN(v) ? null : Number(v) };
    else if (t === 'date') p[k] = { date: v ? { start: String(v) } : null };
    else if (t === 'checkbox') p[k] = { checkbox: !!v };
    else p[k] = { select: v ? { name: cleanSelect(v) } : null };
  }
  return p;
}

async function ensureDb(type, parentId, dbIds) {
  if (dbIds[type]?.ds) return dbIds[type].ds;
  const db = await notion('/databases', 'POST', {
    parent: { type: 'page_id', page_id: parentId },
    title: richText(SCHEMAS[type].title),
    initial_data_source: { properties: schemaProps(type) },
  });
  const ds = db.data_sources?.[0]?.id;
  if (!ds) throw new Error('Notion did not return a data source for the new database.');
  dbIds[type] = { db: db.id, ds };
  return ds;
}

async function upsert(item, parentId, dbIds) {
  const ds = await ensureDb(item.type, parentId, dbIds);
  const properties = toProps(item.type, item);
  if (item.notionId) {
    try { await notion(`/pages/${item.notionId}`, 'PATCH', { properties }); return item.notionId; }
    catch (e) { if (e.status !== 404 && e.code !== 'object_not_found' && e.code !== 'validation_error') throw e; }
  }
  // Look up by stable App ID before creating, so a lost local map never creates duplicates.
  const q = await notion(`/data_sources/${ds}/query`, 'POST', { filter: { property: 'App ID', rich_text: { equals: item.appId } }, page_size: 1 });
  const hit = q.results?.[0];
  if (hit) { await notion(`/pages/${hit.id}`, 'PATCH', { properties }); return hit.id; }
  const page = await notion('/pages', 'POST', { parent: { type: 'data_source_id', data_source_id: ds }, properties });
  return page.id;
}

async function trash(id) {
  try { await notion(`/pages/${id}`, 'PATCH', { in_trash: true }); }
  catch (e) { if (e.code === 'validation_error') await notion(`/pages/${id}`, 'PATCH', { archived: true }); else if (e.status !== 404) throw e; }
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Use POST' });
  const key = process.env.APP_KEY;
  if (!key || !process.env.NOTION_TOKEN) return json(500, { error: 'Server not configured: set APP_KEY and NOTION_TOKEN in Netlify environment variables, then redeploy.' });
  if (!safeEqual(req.headers.get('x-app-key') || '', key)) return json(401, { error: 'App key does not match APP_KEY on the server.' });

  let body; try { body = await req.json(); } catch { return json(400, { error: 'Invalid request' }); }
  const parentId = pageIdFrom(body.parent);
  if (!parentId) return json(400, { error: 'That Notion link does not contain a page ID. Copy the link from the page\'s Share menu.' });

  try {
    if (body.action === 'test') {
      const page = await notion(`/pages/${parentId}`);
      const t = Object.values(page.properties || {}).find(p => p.type === 'title')?.title?.map(x => x.plain_text).join('') || '';
      return json(200, { ok: true, title: t });
    }
    const dbIds = { ...(body.dbIds || {}) };
    const results = [], archived = [];
    for (const item of (body.items || []).slice(0, 8)) {
      if (!SCHEMAS[item.type]) { results.push({ appId: item.appId, ok: false, error: 'Unknown record type' }); continue; }
      try { const id = await upsert(item, parentId, dbIds); results.push({ appId: item.appId, ok: true, notionId: id }); }
      catch (e) {
        if (e.status === 404 && /database|data source|data_source/i.test(e.message)) return json(409, { error: 'A ONE LIFE database was deleted or is not shared with the integration. Use "Reset link" and sync again.' });
        results.push({ appId: item.appId, ok: false, error: e.message });
      }
    }
    for (const a of (body.archive || []).slice(0, 10)) { try { await trash(a.notionId); archived.push(a.appId); } catch (e) { /* retried next sync */ } }
    return json(200, { dbIds, results, archived });
  } catch (e) {
    if (e.status === 401) return json(502, { error: 'Notion rejected the token. Check NOTION_TOKEN in Netlify.' });
    if (e.status === 404 || e.code === 'object_not_found') return json(502, { error: 'Notion cannot see that page. Open the page in Notion → ••• → Connections and add your integration.' });
    return json(502, { error: e.message });
  }
};

export const config = { path: '/api/notion' };
