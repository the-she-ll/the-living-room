import { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { MAGAZINES } from '../../data/frequencies';
import AudioController from '../../audio/AudioController';
import { asset, RIGHTS } from '../../data/site';

/** Real cover scan, or a plain "cover coming soon" page when none is set (or it fails to load). */
function Cover({ m }) {
  const [failed, setFailed] = useState(false);
  if (m.image && !failed) {
    return <img src={asset(m.image)} alt={`${m.masthead} cover, ${m.date}`} className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} />;
  }
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#efe4cc] p-3 text-center text-ink">
      <span className="font-display text-3xl font-black tracking-tight">{m.masthead}</span>
      <span className="text-[10px] tracking-[0.2em] uppercase opacity-60">{m.date}</span>
      <span className="mt-2 rounded border border-dashed border-ink/30 px-2 py-1 text-[10px] opacity-60">Cover image coming soon</span>
    </div>
  );
}

/** The back of each cover: that issue's story. */
function StoryPage({ m }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#f7efdc] p-3 text-left text-ink">
      <p className="text-[9px] tracking-widest uppercase opacity-60">
        {m.masthead} · {m.date}
      </p>
      <p className="font-display mt-1 text-[15px] leading-tight font-black">{m.coverLine}</p>
      <p className="mt-2 text-[11px] leading-snug opacity-85">{m.story}</p>
      <p className="mt-auto pt-2 text-[8px] leading-tight opacity-50">© {m.credit}</p>
    </div>
  );
}

/**
 * Coffee-table flip-through: each cover turns over like a page to show its
 * story, so the open spread reads story (left) · next cover (right).
 */
export default function MagazineFlip({ accent }) {
  const [flipped, setFlipped] = useState(0);
  const total = MAGAZINES.length;

  const go = (d) => {
    const next = Math.max(0, Math.min(total, flipped + d));
    if (next === flipped) return;
    AudioController.playPageTurn();
    setFlipped(next);
  };

  const reading = flipped > 0 ? MAGAZINES[flipped - 1] : null;

  return (
    <div>
      <div
        className="relative ml-[50%] aspect-[2/3] w-[46%] max-w-[200px] [perspective:1400px]"
        onTouchStart={(e) => (e.currentTarget.dataset.x = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - Number(e.currentTarget.dataset.x || 0);
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="absolute -inset-x-[110%] -bottom-6 h-10 rounded-[50%] bg-[#6b3f22]/35 blur-md" />
        {MAGAZINES.map((m, i) => {
          const isFlipped = i < flipped;
          return (
            <button
              type="button"
              key={i}
              onClick={() => go(isFlipped ? -1 : 1)}
              aria-label={isFlipped ? `Turn back to ${m.masthead} ${m.date}` : `Turn over ${m.masthead} ${m.date} to read its story`}
              className="preserve-3d absolute inset-0 origin-left transition-transform duration-700 ease-[cubic-bezier(.3,.7,.2,1)]"
              style={{
                transform: `rotateY(${isFlipped ? -178 + i * 0.6 : 0}deg) translateZ(${isFlipped ? i : total - i}px)`,
                zIndex: isFlipped ? i : total - i,
              }}
            >
              <div className="backface-hidden absolute inset-0 overflow-hidden rounded-[2px] shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
                <Cover m={m} />
              </div>
              <div className="backface-hidden absolute inset-0 overflow-hidden rounded-[2px] shadow-inner [transform:rotateY(180deg)]">
                <StoryPage m={m} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-2">
        <button type="button" onClick={() => go(-1)} disabled={flipped === 0} aria-label="Previous page" className="grid h-10 w-10 place-items-center rounded-full bg-ink/10 disabled:opacity-30">
          <ChevronLeft size={18} />
        </button>
        <p className="flex-1 text-center text-sm opacity-75">
          {flipped === 0 ? 'Tap or swipe the cover to open it' : flipped >= total ? 'End of the stack' : `Issue ${flipped} of ${total}`}
        </p>
        <button type="button" onClick={() => go(1)} disabled={flipped >= total} aria-label="Next page" className="grid h-10 w-10 place-items-center rounded-full text-parchment disabled:opacity-30" style={{ background: accent }}>
          <ChevronRight size={18} />
        </button>
      </div>

      <p className="mt-3 text-[11px] leading-snug opacity-55">
        {reading ? (
          <>
            {reading.masthead}, {reading.date} · © {reading.credit}.{' '}
            {reading.sourceUrl && (
              <a href={reading.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
                Source <ExternalLink size={10} />
              </a>
            )}{' '}
          </>
        ) : null}
        {RIGHTS.short}
      </p>
    </div>
  );
}
