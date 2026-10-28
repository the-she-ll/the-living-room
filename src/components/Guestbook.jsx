import { useMemo, useState } from 'react';
import { Send } from 'lucide-react';
import Drawer from './Drawer';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS } from '../data/site';

const PROMPTS = [
  'What was the most sacred object in your family living room?',
  'What record always meant it was Sunday?',
  'What was never, ever to be sat on?',
  'Whose voice do you still hear on the other end of the line?',
];

// Seed memories so the reel never starts empty (stored only in memory).
const SEED = [
  { text: 'The good couch had plastic on it until I was twelve.', name: 'A visitor', at: 0 },
  { text: 'My grandmother kept every Jet in a cedar chest.', name: 'A visitor', at: 0 },
  { text: 'Al Green on the console meant the greens were almost done.', name: 'A visitor', at: 0 },
];

const MAX = 160;

/** Visitor memories, scrolling on a tape-reel marquee. */
export function TapeReelMarquee({ entries, onOpen }) {
  const items = entries.length ? entries : SEED;
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
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap" style={{ '--marquee-duration': `${duration}s` }}>
          {doubled.map((e, i) => (
            <span key={i} className="led-text text-lg">
              ✦ “{e.text}” <span className="opacity-60">· {e.name || 'Anonymous'}</span>
            </span>
          ))}
        </div>
      </div>
      <span className="shrink-0 text-[10px] font-bold tracking-widest text-mustard uppercase">Guestbook</span>
    </button>
  );
}

export default function Guestbook({ open, onClose, entries, setEntries }) {
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [thanks, setThanks] = useState(false);
  const prompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault();
    const clean = text.replace(/\s+/g, ' ').trim().slice(0, MAX);
    if (!clean) return;
    setEntries((prev) => [{ text: clean, name: name.trim().slice(0, 40), at: Date.now() }, ...(Array.isArray(prev) ? prev : [])].slice(0, 200));
    setText('');
    setThanks(true);
    setTimeout(() => setThanks(false), 3000);
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
              onChange={(e) => setText(e.target.value.slice(0, MAX))}
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
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="e.g. Grandbaby from Detroit"
              className="mt-1 w-full rounded-lg border border-ink/20 bg-white/70 p-3 text-base outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
            />
          </label>
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3.5 font-bold text-parchment transition disabled:opacity-40"
          >
            <Send size={16} /> {thanks ? 'Recorded to tape. Thank you.' : 'Add to the Reel'}
          </button>
          <p className="text-[11px] opacity-55">Memories are saved on this device only.</p>
        </form>

        <div>
          <h3 className="font-display mb-2 text-lg font-black">On the reel</h3>
          {entries.length === 0 ? (
            <p className="text-sm opacity-60">No memories yet from this phone. Yours could be the first.</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((e) => (
                <li key={e.at} className="rounded-lg border border-ink/10 bg-white/50 p-3">
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

export function useGuestbook() {
  const [entries, setEntries] = useLocalStorage(STORAGE_KEYS.guestbook, []);
  return [Array.isArray(entries) ? entries : [], setEntries];
}
