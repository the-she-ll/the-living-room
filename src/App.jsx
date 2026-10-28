import { useCallback, useEffect, useRef, useState } from 'react';
import { BookHeart, Nfc, RotateCcw, Sparkles } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import FrequencyDial from './components/FrequencyDial';
import CanvasMap from './components/CanvasMap';
import ArtifactModal from './components/ArtifactModal';
import PoemViewer from './components/PoemViewer';
import SymphonyPlayer from './components/SymphonyPlayer';
import Guestbook, { TapeReelMarquee, useGuestbook } from './components/Guestbook';
import TuningOverlay from './components/TuningOverlay';
import ARView from './components/ARView';
import AudioController from './audio/AudioController';
import { useAudio } from './hooks/useAudio';
import { useDiscoveries, resolveFrequencyParam } from './hooks/useDiscoveries';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORAGE_KEYS, SITE } from './data/site';

/** Read the NFC/QR deep link once, then strip it so a refresh doesn't replay it. */
function takeDeepLink() {
  const id = resolveFrequencyParam();
  if (window.location.search) {
    const url = new URL(window.location.href);
    ['frequency', 'unlock', 'f'].forEach((k) => url.searchParams.delete(k));
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
  return id;
}

// Read once at module load. (StrictMode would otherwise call an initializer twice, after the URL was already cleaned.)
const DEEP_LINK = takeDeepLink();

export default function App() {
  const pending = DEEP_LINK;
  const [entered, setEntered] = useState(false);
  const { discovered, discover, complete, reset } = useDiscoveries();
  const [lastTuned, setLastTuned] = useState(null);
  const [tuning, setTuning] = useState(null); // { id, isNew }
  const [openId, setOpenId] = useState(null);
  const [poemOpen, setPoemOpen] = useState(false);
  const [guestbookOpen, setGuestbookOpen] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  const [entries, setEntries] = useGuestbook();
  const [ambientPref, setAmbientPref] = useLocalStorage(STORAGE_KEYS.ambient, true);
  const { ambientOn } = useAudio();
  const mapRef = useRef(null);

  /* ---------------- tuning-in flow (NFC, map, dial) ---------------- */
  const tuneIn = useCallback(
    (id) => {
      const isNew = discover(id);
      setOpenId(null);
      setLastTuned(id);
      AudioController.playTuneIn();
      setTuning({ id, isNew });
    },
    [discover],
  );

  const tuningRef = useRef(tuning);
  tuningRef.current = tuning;
  const finishTuning = useCallback(() => {
    const t = tuningRef.current;
    setTuning(null);
    if (!t) return;
    setOpenId(t.id);
    setTimeout(() => AudioController.playSoundbite(t.id), 250);
  }, []);

  const enter = async () => {
    await AudioController.unlock();
    if (ambientPref) AudioController.setAmbient(true);
    setEntered(true);
    if (pending) setTimeout(() => tuneIn(pending), 350);
  };

  const toggleAmbient = async () => {
    await AudioController.unlock();
    const next = !ambientOn;
    AudioController.setAmbient(next);
    setAmbientPref(next);
  };

  /* ---------------- AR ---------------- */
  const onArFound = useCallback(
    (id) => {
      const isNew = discover(id);
      setLastTuned(id);
      if (isNew) AudioController.playTuneIn();
      else AudioController.playClick();
      setTimeout(() => AudioController.playSoundbite(id), isNew ? 1300 : 100);
    },
    [discover],
  );

  const arFallback = () => {
    setArOpen(false);
    setTimeout(() => mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  // Pause the groove when the page is hidden (lock screen, app switch).
  useEffect(() => {
    const onHide = () => document.hidden && AudioController.stopGroove();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  const resetProgress = () => {
    if (window.confirm('Reset your discovered frequencies on this device?')) {
      AudioController.stopGroove();
      reset();
      setLastTuned(null);
    }
  };

  return (
    <div className="wood-panel min-h-dvh">
      {!entered && <SplashScreen pendingFrequency={pending} onEnter={enter} />}

      <Header
        arActive={arOpen}
        onToggleAR={async () => {
          await AudioController.unlock();
          setArOpen((v) => !v);
        }}
        ambientOn={ambientOn}
        onToggleAmbient={toggleAmbient}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-5 pb-32">
        {/* intro */}
        <section className="text-center">
          <p className="text-[11px] tracking-[0.3em] text-mustard uppercase">An interactive companion to the painting</p>
          <h1 className="font-display mt-1 text-4xl leading-none font-black text-parchment sm:text-5xl">Tune into Sunday Afternoon</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-parchment/80">
            Five memory frequencies are hidden inside this living room. Find them in any order. Each one unlocks a story, a sound, and a stanza of the sanctuary.
          </p>
        </section>

        <FrequencyDial discovered={discovered} lastTuned={lastTuned} onOpen={setOpenId} onShowClue={setOpenId} />

        {complete && (
          <button
            type="button"
            onClick={() => setPoemOpen(true)}
            className="w-full animate-rise rounded-2xl bg-[linear-gradient(120deg,#8a3319,#d49b24_45%,#1a535c)] p-5 text-left shadow-[0_0_40px_rgba(212,155,36,0.4)]"
          >
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] text-parchment uppercase">
              <Sparkles size={14} /> 5/5 · All frequencies synchronized
            </p>
            <p className="font-display mt-1 text-2xl font-black text-parchment">The Sanctuary is assembled. Hear the full groove →</p>
          </button>
        )}

        {/* ways to play */}
        <section className="grid grid-cols-3 gap-2 text-center text-[12px] leading-tight text-parchment/85">
          <div className="rounded-xl bg-black/25 p-3">
            <Nfc className="mx-auto mb-1 text-mustard" size={22} />
            Tap your phone to hidden <b>NFC tags</b> on the canvas
          </div>
          <button type="button" onClick={() => setArOpen(true)} className="rounded-xl bg-black/25 p-3">
            <Sparkles className="mx-auto mb-1 text-mustard" size={22} />
            Point the <b>AR Lens</b> at the painting
          </button>
          <button type="button" onClick={() => mapRef.current?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl bg-black/25 p-3">
            <BookHeart className="mx-auto mb-1 text-mustard" size={22} />
            Use the <b>Explore Map</b> & riddles
          </button>
        </section>

        <div ref={mapRef} className="scroll-mt-20">
          <h2 className="font-display mb-2 text-2xl font-black text-parchment">Explore the Room</h2>
          <CanvasMap discovered={discovered} onTuneIn={tuneIn} onOpen={setOpenId} />
        </div>

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-black text-parchment">Assemble the Sanctuary</h2>
            <button type="button" onClick={() => setPoemOpen(true)} className="text-sm font-bold text-mustard">
              Read the poem →
            </button>
          </div>
          <SymphonyPlayer discovered={discovered} complete={complete} />
        </section>

        <footer className="pt-4 text-center text-xs text-parchment/50">
          <p>
            {SITE.title}: {SITE.tagline} · © {SITE.artist}
          </p>
          <button type="button" onClick={resetProgress} className="mt-2 inline-flex items-center gap-1 underline-offset-2 hover:underline">
            <RotateCcw size={11} /> Reset progress
          </button>
        </footer>
      </main>

      {/* guestbook tape reel, docked */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-umber-deep via-umber-deep/90 to-transparent px-3 pt-6">
        <div className="mx-auto max-w-3xl">
          <TapeReelMarquee entries={entries} onOpen={() => setGuestbookOpen(true)} />
        </div>
      </div>

      <ArtifactModal
        frequencyId={openId}
        discoveredIds={discovered}
        onClose={() => setOpenId(null)}
        onOpenGuestbook={() => {
          setOpenId(null);
          setGuestbookOpen(true);
        }}
        onOpenPoem={() => {
          setOpenId(null);
          setPoemOpen(true);
        }}
      />
      <PoemViewer open={poemOpen} onClose={() => setPoemOpen(false)} discovered={discovered} complete={complete} />
      <Guestbook open={guestbookOpen} onClose={() => setGuestbookOpen(false)} entries={entries} setEntries={setEntries} />

      {arOpen && (
        <ARView
          onClose={() => setArOpen(false)}
          onFound={onArFound}
          onOpen={(id) => {
            setArOpen(false);
            setOpenId(id);
          }}
          onFallback={arFallback}
        />
      )}

      {tuning && <TuningOverlay frequencyId={tuning.id} isNew={tuning.isNew} onDone={finishTuning} />}
    </div>
  );
}
