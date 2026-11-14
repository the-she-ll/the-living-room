import { GUESTBOOK } from '../data/site';

/** True once a Supabase project has been connected in src/data/site.js. */
export const sharedGuestbook = Boolean(GUESTBOOK.supabaseUrl && GUESTBOOK.supabaseAnonKey);

const base = () => `${GUESTBOOK.supabaseUrl.replace(/\/+$/, '')}/rest/v1/guestbook_entries`;
const headers = () => ({
  apikey: GUESTBOOK.supabaseAnonKey,
  // Legacy anon keys are JWTs and go in Authorization too; the newer
  // sb_publishable_ keys belong in the apikey header only.
  ...(GUESTBOOK.supabaseAnonKey.startsWith('sb_') ? {} : { Authorization: `Bearer ${GUESTBOOK.supabaseAnonKey}` }),
  'Content-Type': 'application/json',
});

const toEntry = (r) => ({ id: r.id, text: r.text, name: r.name || '', prompt: r.prompt || null, at: Date.parse(r.created_at) });

/** Newest first. */
export async function fetchEntries(limit = 200) {
  const url = (cols) => `${base()}?select=${cols}&order=created_at.desc&limit=${limit}`;
  let res = await fetch(url('id,text,name,prompt,created_at'), { headers: headers() });
  // database not updated with the prompt column yet: still show the reel
  if (res.status === 400) res = await fetch(url('id,text,name,created_at'), { headers: headers() });
  if (!res.ok) throw new Error(`guestbook ${res.status}`);
  return (await res.json()).map(toEntry);
}

/**
 * Post a memory. Rejects with err.code = 'blocked' (word filter), 'slow'
 * (flood guard) or 'failed' (network / anything else).
 */
export async function addEntry({ text, name, prompt }) {
  const post = (body) =>
    fetch(base(), { method: 'POST', headers: { ...headers(), Prefer: 'return=representation' }, body: JSON.stringify(body) });
  let res;
  try {
    res = await post({ text, name: name || null, prompt: prompt || null });
    // database not updated with the prompt column yet: post without it
    if (!res.ok && [400, 401, 403].includes(res.status)) {
      const body = await res.clone().json().catch(() => ({}));
      if (/prompt/.test(`${body.message || ''}`)) res = await post({ text, name: name || null });
    }
  } catch {
    throw Object.assign(new Error('offline'), { code: 'failed' });
  }
  if (res.ok) return toEntry((await res.json())[0]);
  const body = await res.json().catch(() => ({}));
  const msg = `${body.message || ''}`;
  const code = msg.includes('blocked_words') ? 'blocked' : msg.includes('slow_down') ? 'slow' : 'failed';
  throw Object.assign(new Error(msg || `guestbook ${res.status}`), { code });
}
