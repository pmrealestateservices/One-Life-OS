// ONE LIFE OS — encrypted backup store (Netlify Blobs).
// The app encrypts data on the phone (AES-GCM, key from your passphrase) before upload; the server never sees plaintext.
// Env var: APP_KEY. Keeps "latest" plus one snapshot per day for the last 30 days.
import { getStore } from '@netlify/blobs';

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function safeEqual(a = '', b = '') { if (a.length !== b.length) return false; let x = 0; for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i); return x === 0; }

export default async (req) => {
  const key = process.env.APP_KEY;
  if (!key) return json(500, { error: 'Server not configured: set APP_KEY in Netlify environment variables, then redeploy.' });
  if (!safeEqual(req.headers.get('x-app-key') || '', key)) return json(401, { error: 'App key does not match APP_KEY on the server.' });
  const store = getStore({ name: 'one-life-os-backups', consistency: 'strong' });
  const url = new URL(req.url);
  try {
    if (req.method === 'PUT') {
      const body = await req.json();
      if (!body?.payload?.ct) return json(400, { error: 'Backup must be encrypted before upload.' });
      const at = new Date().toISOString();
      const doc = JSON.stringify({ payload: body.payload, meta: { ...(body.meta || {}), at } });
      if (doc.length > 4.5e6) return json(413, { error: 'Backup too large for one upload.' });
      await store.set('latest', doc);
      await store.set(`daily/${at.slice(0, 10)}`, doc);
      const { blobs } = await store.list({ prefix: 'daily/' });
      const old = blobs.map(b => b.key).sort().slice(0, -30);
      for (const k of old) await store.delete(k);
      return json(200, { ok: true, at });
    }
    if (req.method === 'GET') {
      if (url.searchParams.has('list')) { const { blobs } = await store.list({ prefix: 'daily/' }); return json(200, { snapshots: blobs.map(b => b.key.slice(6)).sort().reverse() }); }
      const k = url.searchParams.get('key') || 'latest';
      const doc = await store.get(k === 'latest' ? 'latest' : `daily/${k.replace(/[^0-9-]/g, '')}`);
      return json(200, doc ? JSON.parse(doc) : { payload: null });
    }
    return json(405, { error: 'Use GET or PUT' });
  } catch (e) { return json(500, { error: 'Backup store error: ' + e.message }); }
};

export const config = { path: '/api/backup' };
