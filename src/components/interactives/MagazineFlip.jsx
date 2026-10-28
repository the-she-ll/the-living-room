import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { MAGAZINES } from '../../data/frequencies';
import AudioController from '../../audio/AudioController';
import { asset } from '../../data/site';

/** 3D page-flip through a stack of (illustrative) 1970s magazine covers. */
export default function MagazineFlip({ accent }) {
  const [flipped, setFlipped] = useState(0);
  const total = MAGAZINES.length;

  const flip = () => {
    AudioController.playSoundbite('table');
    setFlipped((n) => (n >= total ? 0 : n + 1));
  };

  return (
    <div>
      <div className="relative ml-[50%] aspect-[3/4] w-[46%] max-w-[200px] [perspective:1400px]">
        {/* the table surface */}
        <div className="absolute -inset-x-8 -bottom-6 h-10 rounded-[50%] bg-[#6b3f22]/40 blur-md" />
        {MAGAZINES.map((m, i) => {
          const isFlipped = i < flipped;
          return (
            <button
              type="button"
              key={i}
              onClick={flip}
              aria-label={isFlipped ? 'Next' : `Flip cover: ${m.masthead}, ${m.headline}`}
              className="preserve-3d absolute inset-0 origin-left transition-transform duration-700 ease-[cubic-bezier(.3,.7,.2,1)]"
              style={{
                transform: `rotateY(${isFlipped ? -172 + i * 2 : 0}deg) translateZ(${isFlipped ? i : total - i}px) rotateZ(${isFlipped ? 0 : (i - 1.5) * 1.2}deg)`,
                zIndex: isFlipped ? i : total - i,
              }}
            >
              {/* front cover */}
              <div
                className="backface-hidden film-grain absolute inset-0 flex flex-col overflow-hidden rounded-sm p-3 text-left shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
                style={{ background: m.bg, color: m.accent }}
              >
                {m.image ? (
                  <img src={asset(m.image)} alt={`${m.masthead} cover`} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <>
                    <span className="font-display text-4xl leading-none font-black tracking-tight">{m.masthead}</span>
                    <span className="mt-1 text-[10px] tracking-[0.2em] uppercase opacity-80">{m.issue}</span>
                    <div className="mx-auto my-3 grid w-[78%] flex-1 place-items-end overflow-hidden rounded-t-full" style={{ background: m.accent, opacity: 0.22 }}>
                      <div className="mx-auto h-[70%] w-[60%] rounded-t-full" style={{ background: m.accent }} />
                    </div>
                    <span className="font-display text-lg leading-tight font-black">{m.headline}</span>
                    <span className="mt-2 self-start rounded bg-black/25 px-1.5 py-0.5 text-[9px] tracking-wider uppercase">Illustrative recreation</span>
                  </>
                )}
              </div>
              {/* inside page */}
              <div className="backface-hidden absolute inset-0 rounded-sm bg-[#f7efdc] p-3 text-left text-ink shadow-inner [transform:rotateY(180deg)]">
                <p className="text-[10px] tracking-widest uppercase opacity-60">{m.masthead} · {m.issue}</p>
                <p className="font-display mt-2 text-base leading-tight font-black">{m.headline}</p>
                <div className="mt-3 space-y-1.5">
                  {Array.from({ length: 9 }).map((_, k) => (
                    <div key={k} className="h-1.5 rounded bg-ink/15" style={{ width: `${70 + ((k * 13) % 30)}%` }} />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between text-sm">
        <span className="opacity-70">
          {flipped >= total ? 'End of the stack' : `Cover ${flipped + 1} of ${total}`}. Tap to turn
        </span>
        <button
          type="button"
          onClick={() => setFlipped(0)}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-parchment"
          style={{ background: accent }}
        >
          <RotateCcw size={12} /> Restack
        </button>
      </div>
      <p className="mt-2 text-[11px] italic opacity-55">
        Covers are stylized stand-ins. Add licensed archival scans with the <code>image</code> field in <code>src/data/frequencies.js</code>.
      </p>
    </div>
  );
}
