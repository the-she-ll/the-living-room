import { useCallback, useEffect, useRef, useState } from 'react';
import { BookHeart, Nfc, RotateCcw, Sparkles } from 'lucide-react';
import { FREQUENCIES, FREQUENCY_ORDER } from './data/frequencies';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import FrequencyDial from './components/FrequencyDial';
import CanvasMap from './components/CanvasMap';
import ArtifactModal from './components/ArtifactModal';
import Guestbook, { TapeReelMarquee, useGuestbook } from './components/Guestbook';
import TuningOverlay from './components/TuningOverlay';
import ARView from './components/ARView';
import CreditsDrawer from './components/CreditsDrawer';
import Walkthrough from './components/Walkthrough';
import AudioController from './audio/AudioController';
import { useAudio } from './hooks/useAudio';
import { useDiscoveries, resolveFrequencyParam } from './hooks/useDiscoveries';
import { useLocalStorage } from './hooks/useLocalStorage';
import { STORAGE_KEYS, SITE, RIGHTS } from './data/site';

/** Read the NFC/QR deep link once, then strip it so a refresh doesn't replay it. */
function takeDeepLink() {
  const id = resolveFrequencyParam();
  if (window.location.search || window.location.hash) {
    const url = new URL(window.location.href);
    [...url.searchParams.keys()]
      .filter((k) => ['frequency', 'unlock', 'f', 'guestbook'].includes(k.toLowerCase()))
      .forEach((k) => url.searchParams.delete(k));
    const hash = url.hash.toLowerCase().replace(/[^a-z]/g, '') === 'guestbook' ? '' : url.hash;
    window.history.replaceState(null, '', url.pathname + url.search + hash);
  }
  return id;
}

/**
 * Links that open straight to the Living Guestbook (e.g. the tags behind the
 * family photos). Forgiving on purpose, so a tag written slightly differently
 * still works: ?guestbook, ?Guestbook=1, ?frequency=guestbook, #guestbook.
 * Read before takeDeepLink() cleans the address bar.
 */
function wantsGuestbook() {
  const { search, hash } = window.location;
  const params = new URLSearchParams(search.toLowerCase());
  return (
    params.has('guestbook') ||
    ['frequency', 'unlock', 'f'].some((k) => (params.get(k) || '').replace(/[^a-z]/g, '') === 'guestbook') ||
    hash.toLowerCase().replace(/[^a-z]/g, '') === 'guestbook'
  );
}
const GUESTBOOK_LINK = wantsGuestbook();

// Read once at module load. (StrictMode would otherwise call an initializer twice, after the URL was already cleaned.)
const DEEP_LINK = takeDeepLink();

export default function App() {
  const pending = DEEP_LINK;
  const [entered, setEntered] = useState(false);
  const { discovered, discover, reset } = useDiscoveries();
  const [lastTuned, setLastTuned] = useState(null);
  const [tuning, setTuning] = useState(null); // { id, isNew }
  const [openId, setOpenId] = useState(null);
  const [guestbookOpen, setGuestbookOpen] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [onboarded, setOnboarded] = useLocalStorage(STORAGE_KEYS.onboarded, false);
  const [guideOpen, setGuideOpen] = useState(false);
  const book = useGuestbook();
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
    else if (GUESTBOOK_LINK) setTimeout(() => setGuestbookOpen(true), 350);
  };

  const toggleAmbient = async () => {
    await AudioController.unlock();
    const next = !ambientOn;
    AudioController.setAmbient(next);
    setAmbientPref(next);
  };

  /* ---------------- AR ---------------- */
  // Every sound layer unlocked so far (optionally counting one just found).
  const unlockedStems = useCallback(
    (extra) => FREQUENCY_ORDER.filter((id) => id === extra || discovered.includes(id)).flatMap((id) => FREQUENCIES[id].stems),
    [discovered],
  );

  const onArFound = useCallback(
    (id) => {
      const isNew = discover(id);
      setLastTuned(id);
      if (isNew) AudioController.playTuneIn();
      else AudioController.playClick();
      if (id === 'turntable') {
        // the turntable's visuals dance to the radio, so start the music
        setTimeout(() => AudioController.startGroove(unlockedStems(id)), isNew ? 1300 : 100);
      } else {
        setTimeout(() => AudioController.playSoundbite(id), isNew ? 1300 : 100);
      }
    },
    [discover, unlockedStems],
  );

  const toggleMusic = async () => {
    await AudioController.unlock();
    if (AudioController.state.grooveOn) AudioController.stopGroove();
    else AudioController.startGroove(unlockedStems());
  };

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

  // First visit: show the walkthrough once the app is at rest. A visitor who
  // arrived by tapping a tag sees their story first, then the guide.
  useEffect(() => {
    if (entered && !onboarded && !tuning && !openId && !arOpen && !guestbookOpen) {
      const t = setTimeout(() => setGuideOpen(true), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [entered, onboarded, tuning, openId, arOpen, guestbookOpen]);

  const closeGuide = () => {
    setGuideOpen(false);
    setOnboarded(true);
  };

  // "Sound unlocked" in a story drawer: close it and play the radio's mix.
  const playRadio = async () => {
    setOpenId(null);
    await AudioController.unlock();
    AudioController.startGroove(FREQUENCY_ORDER.filter((id) => discovered.includes(id)).flatMap((id) => FREQUENCIES[id].stems));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetProgress = () => {
    if (window.confirm('Reset your discovered frequencies on this device?')) {
      AudioController.stopGroove();
      reset();
      setLastTuned(null);
    }
  };

  return (
    <div className="wood-panel min-h-dvh">
      {!entered && <SplashScreen pendingFrequency={pending} guestbook={GUESTBOOK_LINK} onEnter={enter} />}

      <Header
        arActive={arOpen}
        onToggleAR={async () => {
          await AudioController.unlock();
          setArOpen((v) => !v);
        }}
        ambientOn={ambientOn}
        onToggleAmbient={toggleAmbient}
        onHelp={() => setGuideOpen(true)}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-5 pb-32">
        {/* intro */}
        <section className="text-center">
          <p className="text-[11px] tracking-[0.3em] text-mustard uppercase">An interactive companion to the painting</p>
          <h1 className="font-display mt-1 text-4xl leading-none font-black text-parchment sm:text-5xl">Tune into Sunday Afternoon</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-parchment/80">
            Four memory frequencies are hidden in this living room. Find them in any order. Each one opens a story and adds a new sound to your radio.
          </p>
        </section>

        <FrequencyDial discovered={discovered} lastTuned={lastTuned} onOpen={setOpenId} onShowClue={setOpenId} />

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
            Use the <b>Explore Map</b> in the app
          </button>
        </section>

        <div ref={mapRef} className="scroll-mt-20">
          <h2 className="font-display mb-2 text-2xl font-black text-parchment">Explore the Room</h2>
          <CanvasMap discovered={discovered} onTuneIn={tuneIn} onOpen={setOpenId} />
        </div>

        <footer className="pt-4 text-center text-xs text-parchment/50">
          <p>
            {SITE.title}: {SITE.tagline} · © {SITE.artist}
          </p>
          <p className="mx-auto mt-1 max-w-sm">{RIGHTS.short}</p>
          <div className="mt-2 flex justify-center gap-4">
            <button type="button" onClick={() => setCreditsOpen(true)} className="underline underline-offset-2">
              Credits &amp; rights
            </button>
            <button type="button" onClick={resetProgress} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
              <RotateCcw size={11} /> Reset progress
            </button>
          </div>
        </footer>
      </main>

      {/* guestbook tape reel, docked */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-umber-deep via-umber-deep/90 to-transparent px-3 pt-6">
        <div className="mx-auto max-w-3xl">
          <TapeReelMarquee entries={book.entries} onOpen={() => setGuestbookOpen(true)} />
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
        onPlayRadio={playRadio}
      />
      <CreditsDrawer open={creditsOpen} onClose={() => setCreditsOpen(false)} />
      <Guestbook open={guestbookOpen} onClose={() => setGuestbookOpen(false)} book={book} />

      {arOpen && (
        <ARView
          onClose={() => setArOpen(false)}
          onFound={onArFound}
          onOpen={(id) => {
            setArOpen(false);
            setOpenId(id);
          }}
          onFallback={arFallback}
          onToggleMusic={toggleMusic}
        />
      )}

      <Walkthrough open={guideOpen} onClose={closeGuide} />

      {tuning && <TuningOverlay frequencyId={tuning.id} isNew={tuning.isNew} onDone={finishTuning} />}
    </div>
  );
}
