import { GUESTBOOK } from '../data/site';

/** True once a Supabase project has been connected in src/data/site.js. */
export const sharedGuestbook = Boolean(GUESTBOOK.supabaseUrl && GUESTBOOK.supabaseAnonKey);

const base = () => `${GUESTBOOK.supabaseUrl.replace(/\/+$/, '')}/rest/v1/guestbook_entries`;
const headers = () => ({
  apikey: GUESTBOOK.supabaseAnonKey,
  Authorization: `Bearer ${GUESTBOOK.supabaseAnonKey}`,
  'Content-Type': 'application/json',
});

const toEntry = (r) => ({ id: r.id, text: r.text, name: r.name || '', at: Date.parse(r.created_at) });

/** Newest first. */
export async function fetchEntries(limit = 100) {
  const res = await fetch(`${base()}?select=id,text,name,created_at&order=created_at.desc&limit=${limit}`, { headers: headers() });
  if (!res.ok) throw new Error(`guestbook ${res.status}`);
  return (await res.json()).map(toEntry);
}

/**
 * Post a memory. Rejects with err.code = 'blocked' (word filter), 'slow'
 * (flood guard) or 'failed' (network / anything else).
 */
export async function addEntry({ text, name }) {
  let res;
  try {
    res = await fetch(base(), {
      method: 'POST',
      headers: { ...headers(), Prefer: 'return=representation' },
      body: JSON.stringify({ text, name: name || null }),
    });
  } catch {
    throw Object.assign(new Error('offline'), { code: 'failed' });
  }
  if (res.ok) return toEntry((await res.json())[0]);
  const body = await res.json().catch(() => ({}));
  const msg = `${body.message || ''}`;
  const code = msg.includes('blocked_words') ? 'blocked' : msg.includes('slow_down') ? 'slow' : 'failed';
  throw Object.assign(new Error(msg || `guestbook ${res.status}`), { code });
}
