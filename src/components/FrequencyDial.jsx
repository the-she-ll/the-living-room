import { useEffect, useMemo, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { FREQUENCIES, FREQUENCY_ORDER } from '../data/frequencies';
import { useAudioLevel } from '../hooks/useAudio';
import AudioController from '../audio/AudioController';

const MIN = 87.5;
const MAX = 108.5;
const pct = (mhz) => ((mhz - MIN) / (MAX - MIN)) * 100;
const SNAP = 0.7;

/**
 * Hi-fi receiver dashboard used as the progress tracker:
 * glass tuning dial with station markers, an analog VU meter, a draggable
 * tuning knob, and five preset buttons with amber LEDs.
 */
export default function FrequencyDial({ discovered, lastTuned, onOpen, onShowClue }) {
  const [mhz, setMhz] = useState(() => (lastTuned ? +FREQUENCIES[lastTuned].band : 98));
  const level = useAudioLevel(true);
  const knob = useRef(null);
  const drag = useRef(null);
  const mhzRef = useRef(mhz);
  mhzRef.current = mhz;

  // Glide the needle when something new is tuned in.
  useEffect(() => {
    if (!lastTuned) return undefined;
    const target = +FREQUENCIES[lastTuned].band;
    let raf;
    const step = () => {
      const m = mhzRef.current;
      const next = Math.abs(target - m) < 0.03 ? target : m + (target - m) * 0.12;
      setMhz(next);
      if (next !== target) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [lastTuned]);

  const nearest = useMemo(() => {
    let best = null;
    FREQUENCY_ORDER.forEach((id) => {
      const d = Math.abs(+FREQUENCIES[id].band - mhz);
      if (d < SNAP && (!best || d < best.d)) best = { id, d };
    });
    return best?.id ?? null;
  }, [mhz]);

  const onStation = nearest && discovered.includes(nearest) ? nearest : null;
  const count = discovered.length;

  /* ---- knob: rotate by dragging around its centre ---- */
  const angleFrom = (e) => {
    const r = knob.current.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { a: angleFrom(e), lastClick: mhz };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const a = angleFrom(e);
    let d = a - drag.current.a;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    drag.current.a = a;
    const next = Math.min(MAX - 0.5, Math.max(MIN + 0.5, mhzRef.current + d * 2.2));
    if (Math.abs(next - drag.current.lastClick) > 0.4) {
      drag.current.lastClick = next;
      AudioController.playClick();
    }
    mhzRef.current = next;
    setMhz(next);
  };
  const onPointerUp = () => {
    drag.current = null;
    if (nearest) setMhz(+FREQUENCIES[nearest].band); // snap
  };
  const onKnobKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setMhz((m) => Math.min(MAX - 0.5, m + 0.2));
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setMhz((m) => Math.max(MIN + 0.5, m - 0.2));
  };

  const vuAngle = -50 + level * 100;

  return (
    <section aria-label="Frequency receiver" className="faceplate rounded-2xl p-3 sm:p-4">
      {/* Brand strip */}
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="font-display text-sm font-black tracking-wide text-parchment/85">
          She.LL <span className="text-mustard">Stereo</span>
        </span>
        <span className="text-[10px] tracking-[0.25em] text-parchment/50 uppercase">AM · FM · Memory</span>
      </div>

      {/* Tuning dial glass */}
      <div className="dial-glass relative h-24 overflow-hidden rounded-lg border border-black/70 sm:h-28">
        {/* scale */}
        <div className="absolute inset-x-3 top-2 flex justify-between">
          {[88, 92, 96, 100, 104, 108].map((n) => (
            <span key={n} className="led-text text-sm opacity-80">
              {n}
            </span>
          ))}
        </div>
        <div className="absolute inset-x-3 top-7 h-4">
          {Array.from({ length: 43 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 w-px bg-amber/60"
              style={{ left: `${(i / 42) * 100}%`, height: i % 2 ? '45%' : '100%' }}
            />
          ))}
        </div>
        {/* station markers */}
        <div className="absolute inset-x-3 top-[52px] bottom-2 sm:top-[56px]">
          {FREQUENCY_ORDER.map((id) => {
            const f = FREQUENCIES[id];
            const on = discovered.includes(id);
            return (
              <button
                type="button"
                key={id}
                onClick={() => (on ? onOpen(id) : onShowClue(id))}
                className="absolute flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${pct(+f.band)}%` }}
                aria-label={on ? `${f.title}, ${f.band} FM, open` : `Locked frequency ${f.band}, show clue`}
              >
                <span className={`h-2 w-2 rounded-full ${on ? 'led' : 'led-off'}`} />
                <span className={`led-text mt-0.5 text-[13px] leading-none ${on ? '' : 'opacity-30'}`}>{f.band}</span>
              </button>
            );
          })}
        </div>
        {/* needle */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-[3px] -translate-x-1/2 bg-sienna-light shadow-[0_0_10px_rgba(255,80,30,0.9)]"
          style={{ left: `calc(12px + (100% - 24px) * ${pct(mhz) / 100})` }}
        />
      </div>

      {/* Lower panel: VU meter · readout · knob */}
      <div className="mt-3 flex items-center gap-3">
        {/* VU */}
        <div className="dial-glass relative h-16 w-20 shrink-0 overflow-hidden rounded-md border border-black/70" aria-hidden="true">
          <svg viewBox="0 0 80 64" className="absolute inset-0 h-full w-full">
            <path d="M12 46 A34 34 0 0 1 68 46" fill="none" stroke="#ffb347" strokeOpacity=".5" strokeWidth="1" />
            <path d="M54 30 A34 34 0 0 1 68 46" fill="none" stroke="#d24a1c" strokeWidth="3" />
            {[-50, -25, 0, 25, 50].map((a) => (
              <line key={a} x1="40" y1="58" x2="40" y2="22" stroke="#ffb347" strokeOpacity=".6" strokeWidth="1" strokeDasharray="0 30 6" transform={`rotate(${a} 40 58)`} />
            ))}
            <line x1="40" y1="58" x2="40" y2="20" stroke="#f2e6cc" strokeWidth="1.5" transform={`rotate(${vuAngle} 40 58)`} />
            <circle cx="40" cy="58" r="3" fill="#2e1c14" />
            <text x="40" y="12" textAnchor="middle" fontSize="7" fill="#ffb347" fontFamily="VT323, monospace">VU</text>
          </svg>
        </div>

        {/* Readout */}
        <button
          type="button"
          onClick={() => onStation && onOpen(onStation)}
          disabled={!onStation}
          className="dial-glass min-w-0 flex-1 rounded-md border border-black/70 px-3 py-2 text-left"
        >
          <div className="led-text flex items-baseline justify-between text-2xl leading-none">
            <span>{mhz.toFixed(1)} FM</span>
            <span className="text-base">{count}/5</span>
          </div>
          <div className="led-text mt-1 truncate text-sm opacity-90">
            {onStation
              ? `▶ ${FREQUENCIES[onStation].title.toUpperCase()}`
              : nearest
                ? '··· STATIC · FIND IT IN THE PAINTING'
                : 'SCANNING ···'}
          </div>
        </button>

        {/* Knob */}
        <div
          ref={knob}
          role="slider"
          tabIndex={0}
          aria-label="Tuning knob"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={+mhz.toFixed(1)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKnobKey}
          className="relative h-16 w-16 shrink-0 touch-none rounded-full bg-[conic-gradient(from_0deg,#6b4a36,#2a1a12,#6b4a36,#2a1a12,#6b4a36)] shadow-[0_4px_10px_rgba(0,0,0,0.6),inset_0_2px_2px_rgba(255,255,255,0.2)] outline-none focus-visible:ring-2 focus-visible:ring-mustard"
          style={{ transform: `rotate(${(mhz - MIN) * 40}deg)` }}
        >
          <span className="absolute top-1.5 left-1/2 h-3 w-1 -translate-x-1/2 rounded-full bg-mustard" />
          <span className="absolute inset-4 rounded-full bg-umber-light shadow-inner" />
        </div>
      </div>

      {/* Presets */}
      <div className="mt-3 grid grid-cols-5 gap-1.5">
        {FREQUENCY_ORDER.map((id, i) => {
          const f = FREQUENCIES[id];
          const on = discovered.includes(id);
          return (
            <button
              type="button"
              key={id}
              onClick={() => (on ? onOpen(id) : onShowClue(id))}
              className={`flex flex-col items-center gap-1 rounded-md border border-black/60 px-1 py-2 text-center transition active:translate-y-px ${
                on ? 'bg-[#4a3226]' : 'bg-[#2b1c14]'
              } shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_0_rgba(0,0,0,0.6)]`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${on ? 'led animate-led-pulse' : 'led-off'}`} />
              <span className="text-[10px] font-bold tracking-wider text-parchment/70 uppercase">{i + 1}</span>
              <span className={`flex items-center gap-0.5 text-[10px] leading-tight ${on ? 'text-parchment' : 'text-parchment/40'}`}>
                {on ? f.title.replace(/^The /, '') : <><Lock size={9} /> Locked</>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
