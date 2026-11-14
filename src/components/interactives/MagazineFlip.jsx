import { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { MAGAZINES } from '../../data/frequencies';
import AudioController from '../../audio/AudioController';
import { asset, RIGHTS } from '../../data/site';

/** Page 1: real cover scan, or a plain "cover coming soon" page when none is set (or it fails to load). */
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

/** Page 2 (back of the cover): the issue's story summary. */
function StoryPage({ m }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#f7efdc] p-3 text-left text-ink">
      <p className="text-[9px] tracking-widest uppercase opacity-60">
        {m.masthead} · {m.date}
      </p>
      <p className="font-display mt-1 text-[15px] leading-tight font-black">{m.coverLine}</p>
      {/* on the small page the summary fades out; it's printed in full below the book */}
      <p className="relative mt-2 min-h-0 flex-1 overflow-hidden text-[11px] leading-snug opacity-85 [mask-image:linear-gradient(to_bottom,black_75%,transparent)]">{m.story}</p>
    </div>
  );
}

/** Page 3: one photo from the article, with caption and credit. */
function PhotoPage({ m }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#f7efdc] p-3 text-left text-ink">
      {m.insideImage ? (
        <>
          <img src={asset(m.insideImage)} alt={m.insideCaption || `Photo from ${m.masthead}, ${m.date}`} className="min-h-0 w-full flex-1 object-contain" />
          {m.insideCaption && <p className="mt-1.5 text-[10px] leading-tight italic opacity-80">{m.insideCaption}</p>}
          {m.insideCredit && <p className="mt-0.5 text-[8px] opacity-55">Photo: {m.insideCredit}</p>}
        </>
      ) : (
        <div className="grid flex-1 place-items-center rounded border border-dashed border-ink/30 text-center text-[10px] opacity-60">
          Photo from the issue
          <br />
          coming soon
        </div>
      )}
    </div>
  );
}

/**
 * Coffee-table magazines, one issue at a time, read like the real thing:
 * cover → open to the summary (left) and an article photo (right) → next
 * issue. Steps run 0..2n-1: even = closed on the cover, odd = open.
 */
export default function MagazineFlip({ accent }) {
  const [step, setStep] = useState(0);
  const total = MAGAZINES.length;
  const last = total * 2 - 1;
  const magIndex = Math.floor(step / 2);
  const open = step % 2 === 1;
  const m = MAGAZINES[magIndex];

  const go = (d) => {
    const next = Math.max(0, Math.min(last, step + d));
    if (next === step) return;
    AudioController.playPageTurn();
    setStep(next);
  };

  return (
    <div>
      <div
        key={magIndex}
        className={`relative aspect-[2/3] w-[48%] max-w-[260px] animate-fade transition-[margin] duration-500 [perspective:1400px] ${open ? 'ml-[50%]' : 'mx-auto'}`}
        onTouchStart={(e) => (e.currentTarget.dataset.x = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - Number(e.currentTarget.dataset.x || 0);
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="absolute -inset-x-[110%] -bottom-6 h-10 rounded-[50%] bg-[#6b3f22]/35 blur-md" />
        {/* page 3 sits underneath on the right */}
        <div className={`absolute inset-0 overflow-hidden rounded-[2px] shadow-inner transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}>
          <PhotoPage m={m} />
        </div>
        {/* the cover leaf: front = cover, back = summary */}
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={open ? 'Next magazine' : `Open ${m.masthead}, ${m.date}`}
          className="preserve-3d absolute inset-0 origin-left transition-transform duration-700 ease-[cubic-bezier(.3,.7,.2,1)]"
          style={{ transform: `rotateY(${open ? -178 : 0}deg)` }}
        >
          <div className="backface-hidden absolute inset-0 overflow-hidden rounded-[2px] shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
            <Cover m={m} />
          </div>
          <div className="backface-hidden absolute inset-0 overflow-hidden rounded-[2px] shadow-inner [transform:rotateY(180deg)]">
            <StoryPage m={m} />
          </div>
        </button>
      </div>

      <div className="mt-8 flex items-center gap-2">
        <button type="button" onClick={() => go(-1)} disabled={step === 0} aria-label="Previous page" className="grid h-10 w-10 place-items-center rounded-full bg-ink/10 disabled:opacity-30">
          <ChevronLeft size={18} />
        </button>
        <p className="flex-1 text-center text-sm leading-tight opacity-75">
          <b>
            {m.masthead} · {magIndex + 1} of {total}
          </b>
          <br />
          <span className="text-xs">{open ? (step === last ? 'End of the stack' : 'Next: another magazine') : 'Tap or swipe the cover to open it'}</span>
        </p>
        <button type="button" onClick={() => go(1)} disabled={step === last} aria-label="Next page" className="grid h-10 w-10 place-items-center rounded-full text-parchment disabled:opacity-30" style={{ background: accent }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {open && (
        <div className="mt-4 animate-fade rounded-xl border border-ink/10 bg-white/50 p-4">
          <p className="font-display text-lg leading-tight font-black">{m.coverLine}</p>
          <p className="mt-2 text-[15px] leading-relaxed">{m.story}</p>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-snug opacity-55">
        {m.masthead}, {m.date} · © {m.credit}.{' '}
        {m.insideCredit && <>Photo: {m.insideCredit}. </>}
        {m.sourceUrl && (
          <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
            Read the full issue <ExternalLink size={10} />
          </a>
        )}{' '}
        {RIGHTS.short}
      </p>
    </div>
  );
}
