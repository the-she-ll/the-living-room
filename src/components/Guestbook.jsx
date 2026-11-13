import { useCallback, useEffect, useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import Drawer from './Drawer';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GUESTBOOK, STORAGE_KEYS } from '../data/site';
import { addEntry, fetchEntries, sharedGuestbook } from '../lib/guestbookApi';
import { hasBlockedWords } from '../lib/wordFilter';

const PROMPTS = [
  'What was the most sacred object in your family living room?',
  'What record always meant it was Sunday?',
  'What was never, ever to be sat on?',
  'Whose voice do you still hear on the other end of the line?',
];

const MAX = 160;

const ERRORS = {
  blocked: 'Some of that language can’t go on the reel. Please rephrase your memory.',
  slow: 'Lots of memories coming in right now. Please try again in a minute.',
  failed: 'Couldn’t reach the reel. Check your connection and try again.',
};

/** Visitor memories, scrolling on a tape-reel marquee. */
export function TapeReelMarquee({ entries, onOpen }) {
  const items = entries.slice(0, 30);
  const doubled = [...items, ...items];
  const duration = Math.max(24, items.length * 9);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="faceplate group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left"
      aria-label="Open the Living Guestbook"
    >
      {/* reels */}
      <span className="relative h-9 w-9 shrink-0 animate-spin-slow rounded-full border-4 border-[#1a110c] bg-[#5a3a24]" aria-hidden="true">
        <span className="absolute inset-2 rounded-full bg-parchment/80" />
        <span className="absolute top-0 left-1/2 h-1/2 w-0.5 -translate-x-1/2 bg-[#1a110c]" />
      </span>
      <div className="dial-glass relative min-w-0 flex-1 overflow-hidden rounded-md py-1.5">
        {items.length ? (
          <div className="marquee-track flex w-max gap-10 whitespace-nowrap" style={{ '--marquee-duration': `${duration}s` }}>
            {doubled.map((e, i) => (
              <span key={i} className="led-text text-lg">
                ✦ “{e.text}” <span className="opacity-60">· {e.name || 'Anonymous'}</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="led-text block truncate px-2 text-lg">✦ TAP TO RECORD THE FIRST MEMORY</span>
        )}
      </div>
      <span className="shrink-0 text-[10px] font-bold tracking-widest text-mustard uppercase">Guestbook</span>
    </button>
  );
}

export default function Guestbook({ open, onClose, book }) {
  const { entries, add, shared } = book;
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [thanks, setThanks] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const prompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    const clean = text.replace(/\s+/g, ' ').trim().slice(0, MAX);
    const who = name.replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!clean || sending) return;
    if (hasBlockedWords(clean) || hasBlockedWords(who)) {
      setError('blocked');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await add({ text: clean, name: who });
      setText('');
      setThanks(true);
      setTimeout(() => setThanks(false), 3000);
    } catch (err) {
      setError(err.code || 'failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="The Living Guestbook" eyebrow="Audience Archive" accent="#1A535C">
      <div className="space-y-5 pb-6">
        <div className="rounded-xl bg-teal p-4 text-parchment">
          <p className="text-[11px] tracking-[0.2em] text-mustard-light uppercase">Reflection prompt</p>
          <p className="font-display mt-1 text-xl leading-snug font-bold">{prompt}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-bold">Your memory, in one sentence</span>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX));
                setError(null);
              }}
              rows={3}
              maxLength={MAX}
              placeholder="My grandmother’s living room smelled like…"
              className="mt-1 w-full resize-none rounded-lg border border-ink/20 bg-white/70 p-3 text-base outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
            />
            <span className="block text-right text-xs opacity-60">{text.length}/{MAX}</span>
          </label>
          <label className="block">
            <span className="text-sm font-bold">Name or initials (optional)</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              maxLength={40}
              placeholder="e.g. Grandbaby from Detroit"
              className="mt-1 w-full rounded-lg border border-ink/20 bg-white/70 p-3 text-base outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-sienna/10 px-3 py-2 text-sm font-bold text-sienna">
              {ERRORS[error] || ERRORS.failed}
            </p>
          )}
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3.5 font-bold text-parchment transition disabled:opacity-40"
          >
            <Send size={16} /> {sending ? 'Recording…' : thanks ? 'Recorded to tape. Thank you.' : 'Add to the Reel'}
          </button>
          <p className="text-[11px] opacity-60">
            {shared
              ? 'Your memory (and name, if you add one) will be shared with everyone visiting the exhibition. Please don’t include other people’s full names or contact details.'
              : 'Memories are saved on this device only.'}
          </p>
        </form>

        <div>
          <h3 className="font-display mb-2 text-lg font-black">On the reel</h3>
          {entries.length === 0 ? (
            <p className="text-sm opacity-60">{shared ? 'No memories yet. Yours could be the first.' : 'No memories yet from this phone. Yours could be the first.'}</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.id || e.at} className="rounded-lg border border-ink/10 bg-white/50 p-3">
                  <p className="font-display text-[16px] leading-snug italic">“{e.text}”</p>
                  <p className="mt-1 text-xs opacity-60">
                    {e.name || 'Anonymous'} · {new Date(e.at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}

/**
 * Guestbook data. Shared through Supabase when it's connected (refreshed
 * every few seconds while the page is open); otherwise kept on this phone.
 */
export function useGuestbook() {
  const [local, setLocal] = useLocalStorage(STORAGE_KEYS.guestbook, []);
  const [remote, setRemote] = useState([]);

  useEffect(() => {
    if (!sharedGuestbook) return undefined;
    let alive = true;
    const load = () => {
      if (document.hidden) return;
      fetchEntries()
        .then((rows) => alive && setRemote(rows))
        .catch(() => {}); // keep showing what we have
    };
    load();
    const timer = setInterval(load, GUESTBOOK.refreshSeconds * 1000);
    document.addEventListener('visibilitychange', load);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  const add = useCallback(
    async ({ text, name }) => {
      if (sharedGuestbook) {
        const entry = await addEntry({ text, name });
        setRemote((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)]);
        return;
      }
      setLocal((prev) => [{ text, name, at: Date.now() }, ...(Array.isArray(prev) ? prev : [])].slice(0, 200));
    },
    [setLocal],
  );

  const entries = sharedGuestbook ? remote : Array.isArray(local) ? local : [];
  return { entries, add, shared: sharedGuestbook };
}
