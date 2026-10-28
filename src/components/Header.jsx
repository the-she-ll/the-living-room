import { useState } from 'react';
import { Camera, CameraOff, Volume2, VolumeX } from 'lucide-react';
import { SITE } from '../data/site';

export default function Header({ arActive, onToggleAR, ambientOn, onToggleAmbient }) {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-black/40 bg-umber/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pb-2">
        {logoOk ? (
          <img src={SITE.logoSrc} alt="" className="h-9 w-9 shrink-0 object-contain" onError={() => setLogoOk(false)} />
        ) : null}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="font-display truncate text-lg font-black text-parchment">{SITE.title}</p>
          <p className="truncate text-[11px] tracking-wide text-mustard-light/80">
            {SITE.tagline} · {SITE.artist}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleAmbient}
          aria-pressed={ambientOn}
          aria-label={ambientOn ? 'Turn vinyl crackle off' : 'Turn vinyl crackle on'}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition ${
            ambientOn ? 'border-mustard bg-mustard/15 text-mustard' : 'border-parchment/20 text-parchment/60'
          }`}
        >
          {ambientOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          type="button"
          onClick={onToggleAR}
          aria-pressed={arActive}
          className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition ${
            arActive ? 'bg-parchment text-umber' : 'bg-teal text-parchment shadow-[0_0_0_2px_rgba(212,155,36,0.5)]'
          }`}
        >
          {arActive ? <CameraOff size={16} /> : <Camera size={16} />}
          <span>{arActive ? 'Exit AR' : 'AR Lens'}</span>
        </button>
      </div>
    </header>
  );
}
