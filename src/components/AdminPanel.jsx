import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, LogOut, Mail, RefreshCw, Search, Trash2 } from 'lucide-react';
import { GUESTBOOK, SITE } from '../data/site';
import { sharedGuestbook } from '../lib/guestbookApi';

/**
 * Guestbook admin page: open the site with ?admin. Sign in with a one-time
 * email link; emails listed in the guestbook_admins table can delete
 * memories (the database checks this, not the page).
 */
export default function AdminPanel() {
  const client = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | signed-out | sent | not-admin | ready | error
  const [email, setEmail] = useState('');
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState('');

  const exhibitionUrl = window.location.pathname;
  const adminUrl = `${window.location.origin}${window.location.pathname}?admin`;

  const load = async () => {
    const { data, error } = await client.current
      .from('guestbook_entries')
      .select('id, text, name, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    setEntries(data);
  };

  const check = async (session) => {
    if (!session) return setStatus((s) => (s === 'sent' ? s : 'signed-out'));
    const { data: isAdmin, error } = await client.current.rpc('guestbook_is_admin');
    if (error) {
      setMessage(error.message);
      return setStatus('error');
    }
    if (!isAdmin) return setStatus('not-admin');
    await load();
    return setStatus('ready');
  };

  useEffect(() => {
    if (!sharedGuestbook) return undefined;
    let sub;
    (async () => {
      const { createClient } = await import('@supabase/supabase-js');
      client.current = createClient(GUESTBOOK.supabaseUrl, GUESTBOOK.supabaseAnonKey, {
        auth: { persistSession: true, detectSessionInUrl: true, flowType: 'implicit' },
      });
      const { data } = await client.current.auth.getSession();
      await check(data.session);
      sub = client.current.auth.onAuthStateChange((_event, session) => {
        // tidy the sign-in tokens out of the address bar
        if (window.location.hash.includes('access_token')) window.history.replaceState(null, '', '?admin');
        check(session);
      }).data.subscription;
    })().catch((e) => {
      setMessage(e.message);
      setStatus('error');
    });
    return () => sub?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendLink = async (e) => {
    e.preventDefault();
    setBusy('link');
    setMessage('');
    const { error } = await client.current.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: adminUrl } });
    setBusy(null);
    if (error) setMessage(error.message);
    else setStatus('sent');
  };

  const remove = async (entry) => {
    if (!window.confirm(`Delete this memory for everyone?\n\n“${entry.text}”`)) return;
    setBusy(entry.id);
    const { error, count } = await client.current.from('guestbook_entries').delete({ count: 'exact' }).eq('id', entry.id);
    setBusy(null);
    if (error || !count) setMessage(error?.message || 'That memory could not be deleted. Are you still signed in as an admin?');
    else setEntries((prev) => prev.filter((x) => x.id !== entry.id));
  };

  const signOut = async () => {
    await client.current.auth.signOut();
    setEntries([]);
    setStatus('signed-out');
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? entries.filter((x) => `${x.text} ${x.name || ''}`.toLowerCase().includes(q)) : entries;
  }, [entries, query]);

  return (
    <div className="wood-panel min-h-dvh px-4 py-6">
      <div className="parchment mx-auto max-w-2xl rounded-3xl p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-2">
          <a href={exhibitionUrl} className="flex items-center gap-1 text-sm font-bold opacity-70">
            <ArrowLeft size={16} /> Exhibition
          </a>
          {status === 'ready' && (
            <button type="button" onClick={signOut} className="flex items-center gap-1 text-sm font-bold opacity-70">
              <LogOut size={14} /> Sign out
            </button>
          )}
        </div>
        <p className="mt-4 text-[11px] font-bold tracking-[0.2em] text-sienna uppercase">{SITE.title} · Admin</p>
        <h1 className="font-display text-3xl font-black">Guestbook</h1>

        {!sharedGuestbook && (
          <p className="mt-4 rounded-xl bg-mustard/20 p-4 text-sm">
            The shared guestbook isn’t connected yet. Add your Supabase project URL and anon key to <code>GUESTBOOK</code> in <code>src/data/site.js</code>.
          </p>
        )}

        {sharedGuestbook && status === 'loading' && <p className="mt-4 text-sm opacity-70">Loading…</p>}

        {(status === 'signed-out' || status === 'sent') && (
          <form onSubmit={sendLink} className="mt-4 space-y-3">
            <p className="text-sm opacity-80">Sign in with your admin email. We’ll send you a one-time link; open it on this device.</p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-lg border border-ink/20 bg-white/70 p-3 text-base outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
            />
            <button type="submit" disabled={busy === 'link'} className="flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3.5 font-bold text-parchment disabled:opacity-50">
              <Mail size={16} /> {busy === 'link' ? 'Sending…' : status === 'sent' ? 'Send another link' : 'Email me a sign-in link'}
            </button>
            {status === 'sent' && <p className="rounded-lg bg-avocado/15 p-3 text-sm font-bold">Check your email and tap the link. It opens this page signed in.</p>}
          </form>
        )}

        {status === 'not-admin' && (
          <div className="mt-4 space-y-3 text-sm">
            <p>You’re signed in, but this email isn’t on the guestbook admin list.</p>
            <button type="button" onClick={signOut} className="rounded-full bg-ink/10 px-4 py-2 font-bold">
              Sign out
            </button>
          </div>
        )}

        {status === 'ready' && (
          <div className="mt-4">
            <div className="flex gap-2">
              <label className="flex flex-1 items-center gap-2 rounded-lg border border-ink/20 bg-white/70 px-3">
                <Search size={16} className="opacity-50" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search memories" className="w-full bg-transparent py-2.5 text-base outline-none" />
              </label>
              <button type="button" onClick={() => load().catch((e) => setMessage(e.message))} aria-label="Refresh" className="grid w-11 place-items-center rounded-lg bg-ink/10">
                <RefreshCw size={16} />
              </button>
            </div>
            <p className="mt-2 text-xs opacity-60">
              {entries.length} memor{entries.length === 1 ? 'y' : 'ies'} on the reel{query && ` · ${shown.length} match`}
            </p>
            <ul className="mt-3 space-y-2">
              {shown.map((x) => (
                <li key={x.id} className="flex items-start gap-3 rounded-xl border border-ink/10 bg-white/55 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[16px] leading-snug italic">“{x.text}”</p>
                    <p className="mt-1 text-xs opacity-60">
                      {x.name || 'Anonymous'} · {new Date(x.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(x)}
                    disabled={busy === x.id}
                    aria-label={`Delete memory: ${x.text}`}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-sienna px-3 py-2 text-xs font-bold text-parchment disabled:opacity-50"
                  >
                    <Trash2 size={13} /> {busy === x.id ? '…' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {message && (
          <p role="alert" className="mt-4 rounded-lg bg-sienna/10 p-3 text-sm font-bold text-sienna">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
