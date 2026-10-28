import { useEffect, useState } from 'react';
import { FREQUENCIES } from '../data/frequencies';

/** Full-screen "Tuning In…" unlock animation (~2.4s). */
export default function TuningOverlay({ frequencyId, isNew, onDone }) {
  const f = FREQUENCIES[frequencyId];
  const [phase, setPhase] = useState('scan');
  const [readout, setReadout] = useState(88.0);

  useEffect(() => {
    if (!f) return undefined;
    const target = +f.band;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 1300);
      const eased = 1 - Math.pow(1 - p, 3);
      setReadout(88 + (target - 88) * eased + (p < 1 ? (Math.random() - 0.5) * 0.6 : 0));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setPhase('locked');
    };
    raf = requestAnimationFrame(tick);
    const done = setTimeout(onDone, 2500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [f, onDone]);

  if (!f) return null;

  return (
    <div className="fixed inset-0 z-[60] flex animate-fade flex-col items-center justify-center bg-umber-deep/95 px-6" role="status" aria-live="assertive">
      {/* static noise bars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30" aria-hidden="true">
        {phase === 'scan' &&
          Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-px w-full bg-amber"
              style={{ top: `${(i * 7.3 + readout * 13) % 100}%`, opacity: 0.2 + ((i * 37) % 10) / 15 }}
            />
          ))}
      </div>

      <div className="dial-glass relative w-full max-w-sm rounded-2xl border border-black p-6 text-center">
        <p className="led-text text-lg opacity-80">{phase === 'scan' ? 'TUNING IN…' : isNew ? 'SIGNAL LOCKED · NEW FREQUENCY' : 'SIGNAL LOCKED'}</p>
        <p className="led-text my-2 text-7xl leading-none">{readout.toFixed(1)}</p>
        <p className="led-text text-xl">FM</p>
        <div className="mt-4 flex h-8 items-end justify-center gap-1" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="w-2 rounded-sm bg-amber transition-all duration-150"
              style={{
                height: phase === 'locked' ? `${30 + Math.sin(i * 0.7) * 25 + 40}%` : `${10 + Math.random() * 80}%`,
                opacity: phase === 'locked' ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      </div>

      <div className={`mt-8 text-center transition-all duration-500 ${phase === 'locked' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <p className="text-xs tracking-[0.3em] text-mustard uppercase">{f.subtitle}</p>
        <h2 className="font-display mt-1 text-4xl font-black text-parchment">{f.title}</h2>
      </div>
    </div>
  );
}
