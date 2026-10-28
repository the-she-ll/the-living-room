import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { SITE, RIGHTS } from '../data/site';
import CreditsDrawer from './CreditsDrawer';
import { FREQUENCIES } from '../data/frequencies';

/**
 * Logo loading screen + the "tap to tune in" gesture that unlocks audio on
 * iOS/Android. If the visitor arrived from an NFC tag we tell them which
 * frequency is waiting.
 */
export default function SplashScreen({ pendingFrequency, onEnter }) {
  const [ready, setReady] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [credits, setCredits] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(t);
  }, []);

  const enter = () => {
    if (leaving) return;
    setLeaving(true);
    onEnter();
  };

  const freq = pendingFrequency ? FREQUENCIES[pendingFrequency] : null;

  return (
    <div
      className={`wood-panel fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-y-auto px-8 py-6 text-center transition-opacity duration-500 ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,155,36,0.22),transparent_65%)]" />

      <div className="relative mb-8 w-64 animate-fade sm:w-80">
        {logoOk ? (
          <img
            src={SITE.logoSrc}
            alt={SITE.artist}
            width="1000"
            height="736"
            className="h-auto w-full drop-shadow-[0_0_28px_rgba(212,155,36,0.35)]"
            onError={() => setLogoOk(false)}
          />
        ) : (
          <span className="font-display text-3xl font-black text-mustard">{SITE.artist}</span>
        )}
      </div>

      <p className="relative mb-2 text-xs tracking-[0.3em] text-mustard uppercase">presents</p>
      <h1 className="font-display relative text-5xl leading-[0.95] font-black text-parchment sm:text-6xl">
        {SITE.title}
      </h1>
      <p className="font-display relative mt-3 text-xl text-mustard-light italic">{SITE.tagline}</p>

      <div className="relative mt-10 min-h-24">
        {!ready ? (
          <div className="flex flex-col items-center gap-3" aria-live="polite">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="led h-2.5 w-2.5 animate-led-pulse rounded-full" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="led-text text-xl">WARMING UP THE TUBES…</span>
          </div>
        ) : (
          <div className="flex animate-rise flex-col items-center gap-3">
            {freq && (
              <p className="led-text text-lg">
                SIGNAL DETECTED · {freq.band} FM · {freq.title.toUpperCase()}
              </p>
            )}
            <button
              type="button"
              onClick={enter}
              className="flex items-center gap-2 rounded-full bg-mustard px-8 py-4 font-display text-lg font-black text-umber shadow-[0_8px_0_#8a5c0c,0_14px_30px_rgba(0,0,0,0.4)] transition active:translate-y-1 active:shadow-[0_4px_0_#8a5c0c]"
            >
              <Radio size={22} /> {freq ? 'Tune In Now' : 'Tap to Tune In'}
            </button>
            <p className="text-xs text-parchment/60">Best with sound on 🔊</p>
          </div>
        )}
      </div>

      {/* Rights notice for the whole app: quiet, but up front. */}
      <p className="relative mt-8 max-w-sm text-center text-[11px] leading-snug text-parchment/55">
        {RIGHTS.short}{' '}
        <button type="button" onClick={() => setCredits(true)} className="underline underline-offset-2 hover:text-parchment">
          Credits &amp; rights
        </button>
      </p>
      <CreditsDrawer open={credits} onClose={() => setCredits(false)} zClass="z-[80]" />
    </div>
  );
}
