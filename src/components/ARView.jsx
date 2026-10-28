import { useEffect, useRef, useState } from 'react';
import { CameraOff, ChevronLeft, ChevronRight, Loader2, Map as MapIcon, ScanLine, X } from 'lucide-react';
import { FREQUENCIES } from '../data/frequencies';
import { SITE, RIGHTS } from '../data/site';

const ERRORS = {
  insecure: {
    title: 'The AR Lens needs a secure connection',
    body: 'Cameras only open on HTTPS. Open this exhibition from its https:// link, or explore with the illustrated map.',
  },
  'no-camera': {
    title: 'No camera found',
    body: 'This device or browser doesn’t offer a camera to the web. The illustrated map has everything the lens does.',
  },
  denied: {
    title: 'Camera access was declined',
    body: 'No problem. To try again, allow camera access for this site in your browser settings. Or keep exploring with the map.',
  },
  'no-targets': {
    title: 'The lens is still being calibrated',
    body: 'The AR image targets for this painting haven’t been installed yet. Explore with the illustrated map for now.',
  },
  failed: {
    title: 'The lens couldn’t start',
    body: 'Something interrupted the camera. Close other apps that use the camera and try again, or use the map.',
  },
};

/**
 * Full-screen MindAR camera view. Finding a target marks that frequency
 * discovered; any failure offers a seamless fallback to the map.
 */
export default function ARView({ onClose, onFound, onOpen, onFallback }) {
  const container = useRef(null);
  const session = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | scanning | error
  const [error, setError] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [lastFound, setLastFound] = useState(null);
  const [mag, setMag] = useState(null); // coffee-table flip-through state
  const swipeX = useRef(null);
  const onFoundRef = useRef(onFound);
  onFoundRef.current = onFound;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { startAR } = await import('../ar/arScene.js');
        const s = await startAR({
          container: container.current,
          targetsSrc: SITE.arTargetsSrc,
          targetOrder: SITE.arTargetOrder,
          onFound: (id) => {
            setTracking(id);
            setLastFound(id);
            onFoundRef.current?.(id);
          },
          onLost: () => setTracking(null),
        });
        if (cancelled) s.stop();
        else {
          session.current = s;
          const table = s.controls?.table;
          if (table) {
            table.onChange = setMag;
            setMag(table.state());
          }
          setStatus('scanning');
        }
      } catch (err) {
        if (cancelled) return;
        setError(ERRORS[err?.code] ? err.code : 'failed');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      session.current?.stop();
      session.current = null;
    };
  }, []);

  const found = lastFound ? FREQUENCIES[lastFound] : null;
  const table = session.current?.controls?.table;
  const showMag = status === 'scanning' && tracking === 'table' && table && mag;
  const e = error ? ERRORS[error] : null;

  return (
    <div
      className="fixed inset-0 z-[55] bg-black text-parchment"
      onTouchStart={(ev) => (swipeX.current = ev.touches[0].clientX)}
      onTouchEnd={(ev) => {
        if (!showMag || swipeX.current == null) return;
        const dx = ev.changedTouches[0].clientX - swipeX.current;
        if (Math.abs(dx) > 50) (dx < 0 ? table.next : table.prev)();
        swipeX.current = null;
      }}
    >
      <div ref={container} className="absolute inset-0 overflow-hidden [&_canvas]:max-w-none [&_video]:max-w-none" />

      {/* top bar */}
      <div className="safe-top absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 pb-6">
        <span className="led-text text-lg">{status === 'scanning' ? (tracking ? '● SIGNAL LOCKED' : '○ SCANNING THE CANVAS') : 'AR LENS'}</span>
        <button type="button" onClick={onClose} className="flex h-10 items-center gap-1.5 rounded-full bg-parchment px-3.5 text-sm font-bold text-umber">
          <X size={16} /> Exit AR
        </button>
      </div>

      {status === 'loading' && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="animate-spin text-mustard" size={36} />
            <p className="led-text text-xl">WARMING UP THE LENS…</p>
            <p className="max-w-xs text-sm text-parchment/70">Allow camera access when asked. The image never leaves your phone.</p>
          </div>
        </div>
      )}

      {status === 'scanning' && !tracking && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="relative h-[55vmin] w-[55vmin]">
            {['top-0 left-0 border-t-4 border-l-4', 'top-0 right-0 border-t-4 border-r-4', 'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((c) => (
              <span key={c} className={`absolute h-10 w-10 rounded-sm border-mustard ${c}`} />
            ))}
            <ScanLine className="absolute inset-0 m-auto animate-led-pulse text-mustard/70" size={48} />
          </div>
          <p className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] max-w-xs px-4 text-center text-sm font-bold text-parchment drop-shadow">
            Point at the wall portraits, the record player, or the coffee table.
          </p>
        </div>
      )}

      {status === 'scanning' && found && (
        <div className="safe-bottom absolute inset-x-0 bottom-0 z-10 space-y-2 px-4">
          {showMag && (
            <div className="mx-auto max-w-md rounded-2xl bg-umber-deep/85 p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <button type="button" onClick={table.prev} disabled={mag.flipped === 0} aria-label="Previous page" className="grid h-11 w-11 place-items-center rounded-full bg-parchment/15 disabled:opacity-30">
                  <ChevronLeft size={20} />
                </button>
                <div className="min-w-0 flex-1 text-center leading-tight">
                  <p className="led-text text-lg">
                    {mag.flipped === 0 ? 'TAP NEXT TO OPEN' : mag.flipped >= mag.total ? 'END OF THE STACK' : `ISSUE ${mag.flipped} OF ${mag.total}`}
                  </p>
                  {mag.reading && (
                    <p className="truncate text-xs text-parchment/80">
                      {mag.reading.masthead} · {mag.reading.date}
                    </p>
                  )}
                </div>
                <button type="button" onClick={table.next} disabled={mag.flipped >= mag.total} aria-label="Next page" className="grid h-11 w-11 place-items-center rounded-full bg-mustard text-umber disabled:opacity-30">
                  <ChevronRight size={20} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] leading-snug text-parchment/55">{RIGHTS.short}</p>
            </div>
          )}
          <div className="parchment animate-rise mx-auto max-w-md rounded-2xl p-4 shadow-2xl" style={{ borderTop: `6px solid ${found.color}` }}>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-60">{found.band} FM · Tuned in</p>
            <p className="font-display text-xl font-black">{found.title}</p>
            <button
              type="button"
              onClick={() => onOpen(lastFound)}
              className="mt-3 w-full rounded-full py-3 font-bold text-parchment"
              style={{ background: found.color }}
            >
              Open the story
            </button>
          </div>
        </div>
      )}

      {status === 'error' && e && (
        <div className="wood-panel absolute inset-0 grid place-items-center px-6">
          <div className="parchment w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl">
            <CameraOff className="mx-auto mb-3 text-sienna" size={36} />
            <h2 className="font-display text-2xl font-black">{e.title}</h2>
            <p className="mt-2 text-sm opacity-80">{e.body}</p>
            <button type="button" onClick={onFallback} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-teal py-3.5 font-bold text-parchment">
              <MapIcon size={16} /> Explore the Illustrated Map
            </button>
            <button type="button" onClick={onClose} className="mt-2 w-full py-2 text-sm font-bold opacity-70">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
