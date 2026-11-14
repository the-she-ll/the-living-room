import { useEffect, useRef, useState } from 'react';
import { CameraOff, ChevronLeft, ChevronRight, ExternalLink, Loader2, Map as MapIcon, Pause, ScanLine, Volume2, X } from 'lucide-react';
import { FREQUENCIES } from '../data/frequencies';
import { SITE, RIGHTS, asset } from '../data/site';
import AudioController from '../audio/AudioController';
import { useAudio } from '../hooks/useAudio';

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
  const [pan, setPan] = useState(null); // portrait (Portraits of Power) state
  const [deck, setDeck] = useState(null); // turntable: which record is on
  const [deckInfo, setDeckInfo] = useState(false); // record story panel expanded?
  const { clipPlaying, grooveOn, grooveOwner } = useAudio();
  const [panInfo, setPanInfo] = useState(false); // portrait panel starts collapsed; visitors tap "Learn More"
  const [panCredits, setPanCredits] = useState(false); // photo credit revealed?
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
          const turntable = s.controls?.turntable;
          if (turntable) {
            turntable.onChange = setDeck;
            setDeck(turntable.state());
          }
          const portraits = s.controls?.portraits;
          if (portraits) {
            portraits.onChange = (st) => {
              AudioController.stopClip();
              setPanCredits(false);
              setPan(st);
            };
            setPan(portraits.state());
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
  const portraits = session.current?.controls?.portraits;
  const showPan = status === 'scanning' && tracking === 'portraits' && portraits && pan;
  const person = pan?.person;
  const clipId = person ? `ar-${person.name}` : null;
  const deckApi = session.current?.controls?.turntable;
  const showDeck = status === 'scanning' && tracking === 'turntable' && deckApi && deck;
  const swiper = showMag ? table : showPan ? portraits : showDeck ? deckApi : null;
  const rec = deck?.record;
  const recordPlaying = grooveOn && grooveOwner === 'record';

  // The record on the turntable plays its own piece (not the radio). Switching
  // records while the needle is down plays the new one.
  const playRecord = (r) => {
    AudioController.stopGroove();
    AudioController.startGroove(null, { owner: 'record', feel: r.feel, piece: r.id });
  };
  const toggleRecord = async () => {
    await AudioController.unlock();
    if (recordPlaying) AudioController.stopGroove();
    else if (rec) playRecord(rec);
  };
  const lastRec = useRef(null);
  useEffect(() => {
    if (!showDeck || !rec) return;
    if (lastRec.current !== rec.id) {
      const first = lastRec.current === null;
      lastRec.current = rec.id;
      // drop the needle on first find; keep the needle where it was when switching
      if (first || AudioController.state.grooveOwner === 'record') playRecord(rec);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeck, rec]);
  // lift the needle when the lens closes
  useEffect(() => () => {
    if (AudioController.state.grooveOwner === 'record') AudioController.stopGroove();
  }, []);
  const e = error ? ERRORS[error] : null;

  return (
    <div
      className="fixed inset-0 z-[55] bg-black text-parchment"
      onTouchStart={(ev) => (swipeX.current = ev.touches[0].clientX)}
      onTouchEnd={(ev) => {
        if (!swiper || swipeX.current == null) return;
        const dx = ev.changedTouches[0].clientX - swipeX.current;
        if (Math.abs(dx) > 50) (dx < 0 ? swiper.next : swiper.prev)();
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
            Point at the portrait of the woman on the wall, the turntable on the dresser, or the magazines on the coffee table. Stand in front of it and let it fill most of your screen.
          </p>
        </div>
      )}

      {status === 'scanning' && found && (
        <div className="safe-bottom absolute inset-x-0 bottom-0 z-10 space-y-2 px-4">
          {showDeck && rec && (
            <div className="mx-auto max-w-md rounded-2xl bg-umber-deep/90 p-3 backdrop-blur">
              <div className="flex items-start gap-2">
                <button type="button" onClick={deckApi.prev} aria-label="Previous record" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-parchment/15">
                  <ChevronLeft size={20} />
                </button>
                <div className="min-w-0 flex-1 text-center leading-tight">
                  {deckInfo && <p className="led-text text-sm">{deck.index + 1} OF {deck.total} · THE RHYTHM & SANCTUARY</p>}
                  <p className="font-display text-xl font-black">{rec.title}</p>
                  <p className="text-[11px] text-parchment/70">
                    {rec.place} · {rec.era}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
                    <button
                      type="button"
                      onClick={toggleRecord}
                      className="inline-flex items-center gap-1 rounded-full bg-mustard px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-umber"
                    >
                      {recordPlaying ? <Pause size={12} /> : <Volume2 size={12} />} {recordPlaying ? 'Lift the needle' : 'Drop the needle'}
                    </button>
                    <button type="button" onClick={deckApi.nextVisual} aria-label={`Change visual (now ${deck.visualName})`} className="text-[11px] font-bold whitespace-nowrap text-parchment/80">
                      ✦ {deck.visualName}
                    </button>
                    <button type="button" onClick={() => setDeckInfo((v) => !v)} aria-expanded={deckInfo} className="text-[11px] font-bold whitespace-nowrap text-mustard">
                      {deckInfo ? 'Hide info ▾' : 'Learn More ▴'}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={deckApi.next} aria-label="Next record" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mustard text-umber">
                  <ChevronRight size={20} />
                </button>
              </div>
              {deckInfo && (
                <div className="no-scrollbar mt-2 max-h-[42vh] overflow-y-auto">
                  <p className="text-[12px] leading-snug text-parchment/85">{rec.story}</p>
                  {rec.images?.length > 0 && (
                    <div className="no-scrollbar -mx-3 mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3">
                      {rec.images.map((img) => (
                        <figure key={img.src} className={`shrink-0 snap-start ${rec.images.length > 1 ? 'w-[70%]' : 'w-full'}`}>
                          <img src={asset(img.src)} alt={img.caption} className="max-h-48 w-full rounded-md bg-black/30 object-contain sepia-[0.25]" />
                          <figcaption className="mt-1 text-[10px] leading-snug text-parchment/70">
                            {img.caption}
                            <span className="block text-[9px] text-parchment/50">{img.credit}</span>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {showPan && person && (
            <div className="mx-auto max-w-md rounded-2xl bg-umber-deep/90 p-3 backdrop-blur">
              <div className="flex items-start gap-2">
                <button type="button" onClick={portraits.prev} aria-label="Previous trailblazer" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-parchment/15">
                  <ChevronLeft size={20} />
                </button>
                <div className="min-w-0 flex-1 text-center leading-tight">
                  {panInfo && <p className="led-text text-sm">{pan.index + 1} OF {pan.total} · PORTRAITS OF POWER</p>}
                  <p className="font-display text-xl font-black">{person.name}</p>
                  {panInfo && (
                    <p className="text-[11px] text-parchment/70">
                      {person.years} · {person.role}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setPanInfo((v) => !v)}
                    aria-expanded={panInfo}
                    className="mt-0.5 text-[11px] font-bold text-mustard"
                  >
                    {panInfo ? 'Hide info ▾' : 'Learn More ▴'}
                  </button>
                </div>
                <button type="button" onClick={portraits.next} aria-label="Next trailblazer" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mustard text-umber">
                  <ChevronRight size={20} />
                </button>
              </div>
              {panInfo && (
                <>
              <p className="font-display mt-2 text-center text-[15px] leading-snug italic">“{person.quote}”</p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <span className="text-center text-[10px] text-parchment/55">— {person.source}</span>
                {person.audioSrc ? (
                  <button
                    type="button"
                    onClick={() => (clipPlaying === clipId ? AudioController.stopClip() : AudioController.playClip(clipId, person.audioSrc, 20))}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-mustard px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-umber"
                  >
                    {clipPlaying === clipId ? <Pause size={12} /> : <Volume2 size={12} />} {clipPlaying === clipId ? 'Playing…' : 'Hear their voice'}
                  </button>
                ) : (
                  <a
                    href={person.listenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 rounded-full bg-mustard px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-umber"
                  >
                    <Volume2 size={12} /> Hear their voice <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <p className="mt-2 text-[12px] leading-snug text-parchment/85">{person.bio}</p>
              {panCredits ? (
                <p className="mt-1.5 text-center text-[9px] leading-snug text-parchment/55">
                  {person.imageCredit && (
                    <>
                      Photo: {person.imageCredit}{' '}
                      {person.imageLicense && (
                        <a href={person.imageLicense.url} target="_blank" rel="noreferrer" className="underline">
                          {person.imageLicense.label}
                        </a>
                      )}{' '}
                    </>
                  )}
                  {RIGHTS.short}{' '}
                  <button type="button" onClick={() => setPanCredits(false)} className="font-bold text-mustard">
                    Hide
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setPanCredits(true)}
                  aria-expanded={false}
                  className="mx-auto mt-1.5 block text-[10px] font-bold text-parchment/55 underline underline-offset-2"
                >
                  Photo credits
                </button>
              )}
                </>
              )}
            </div>
          )}
          {showMag && (
            <div className="mx-auto max-w-md rounded-2xl bg-umber-deep/85 p-3 backdrop-blur">
              <div className="flex items-center gap-2">
                <button type="button" onClick={table.prev} disabled={mag.step === 0} aria-label="Previous page" className="grid h-11 w-11 place-items-center rounded-full bg-parchment/15 disabled:opacity-30">
                  <ChevronLeft size={20} />
                </button>
                <div className="min-w-0 flex-1 text-center leading-tight">
                  <p className="led-text text-lg">
                    {`${mag.reading.masthead} · ${mag.mag + 1} OF ${mag.total}`}
                  </p>
                  {mag.reading && (
                    <p className="truncate text-xs text-parchment/80">
                      {mag.reading.date}
                      {' · '}
                      {mag.open ? (mag.step === mag.lastStep ? 'end of the stack' : 'next: another magazine') : 'tap next to open'}
                    </p>
                  )}
                  {mag.reading?.sourceUrl && (
                    <a href={mag.reading.sourceUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-mustard">
                      Read the full issue <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <button type="button" onClick={table.next} disabled={mag.step === mag.lastStep} aria-label="Next page" className="grid h-11 w-11 place-items-center rounded-full bg-mustard text-umber disabled:opacity-30">
                  <ChevronRight size={20} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] leading-snug text-parchment/55">{RIGHTS.short}</p>
            </div>
          )}
          {!showPan && !showMag && !showDeck && (
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
          )}
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
