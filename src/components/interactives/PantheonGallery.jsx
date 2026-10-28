import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Volume2 } from 'lucide-react';
import { PANTHEON } from '../../data/frequencies';
import AudioController from '../../audio/AudioController';
import { asset } from '../../data/site';

/** Swipeable gallery of notable figures with quotes and speech snippets. */
export default function PantheonGallery({ accent, clipPlaying }) {
  const [i, setI] = useState(0);
  const touch = useRef(null);
  const p = PANTHEON[i];
  const clipId = `pantheon-${i}`;
  const playing = clipPlaying === clipId;

  const go = (d) => {
    AudioController.stopClip();
    AudioController.playClick();
    setI((n) => (n + d + PANTHEON.length) % PANTHEON.length);
  };

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl bg-umber p-1 text-parchment shadow-xl"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <div className="rounded-xl border-[6px] border-[#b8892b] bg-[linear-gradient(160deg,#4a2f22,#2e1c14)] p-5">
          <div key={i} className="animate-rise">
            <div className="mb-4 flex items-center gap-4">
              <div className="film-grain grid h-20 w-16 shrink-0 place-items-center overflow-hidden rounded-sm bg-parchment-dark sepia">
                {/* PLACEHOLDER portrait: add `image` to PANTHEON entries to show licensed photos */}
                {p.image ? (
                  <img src={asset(p.image)} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-2xl font-black text-umber/70">
                    {p.name.split(' ').map((w) => w[0]).join('')}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-display text-xl leading-tight font-black">{p.name}</p>
                <p className="text-xs text-mustard-light">{p.years}</p>
                <p className="mt-0.5 text-xs text-parchment/70">{p.role}</p>
              </div>
            </div>
            <p className="font-display text-[19px] leading-snug italic">“{p.quote}”</p>
            <p className="mt-1 text-xs text-parchment/55">— {p.source}</p>
            <p className="mt-3 text-sm leading-relaxed text-parchment/85">{p.bio}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={() => go(-1)} aria-label="Previous figure" className="grid h-11 w-11 place-items-center rounded-full bg-ink/10">
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => (playing ? AudioController.stopClip() : AudioController.playClip(clipId, p.audioSrc, 4.5))}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full font-bold text-parchment"
          style={{ background: accent }}
        >
          {playing ? <Pause size={16} /> : <Volume2 size={16} />}
          {playing ? 'Playing…' : p.audioSrc ? 'Hear their voice' : 'Hear snippet (placeholder)'}
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next figure" className="grid h-11 w-11 place-items-center rounded-full bg-ink/10">
          <ChevronRight />
        </button>
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {PANTHEON.map((_, n) => (
          <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-5 bg-ink' : 'w-1.5 bg-ink/25'}`} />
        ))}
      </div>
    </div>
  );
}
