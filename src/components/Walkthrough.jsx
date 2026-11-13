import { useEffect, useState } from 'react';
import { BookOpen, Camera, Map as MapIcon, MessageCircleHeart, Nfc, Play, Radio } from 'lucide-react';

const STEPS = [
  {
    icon: Radio,
    eyebrow: 'Welcome',
    title: 'Four memories are hidden in this painting',
    body: 'Each one is a radio frequency. Find them in any order to tune into a Sunday afternoon in a 1970s Black living room.',
  },
  {
    icon: Nfc,
    eyebrow: 'Step 1 · Find them',
    title: 'Three ways to tune in',
    body: null, // rendered as the list below
  },
  {
    icon: Play,
    eyebrow: 'Step 2 · Listen',
    title: 'Your radio grows with every find',
    body: 'Each frequency lights a station on the radio and unlocks a new sound: bass and drums, piano, organ and more. Press Play to hear them together. Find all four for the full band.',
  },
  {
    icon: BookOpen,
    eyebrow: 'Step 3 · Explore',
    title: 'Open the story behind each object',
    body: 'Tap any lit station to explore its story, read the history, and reflect. Locked stations show a riddle to help you find them. You can also turn the knob to tune across the dial.',
  },
  {
    icon: MessageCircleHeart,
    eyebrow: 'Step 4 · Share',
    title: 'Leave a memory of your own',
    body: 'Tap the tape reel at the bottom of the screen to add a one-sentence memory from your family’s living room.',
  },
];

const WAYS = [
  { icon: Nfc, label: 'Tap your phone', text: 'on the small tags hidden on the painting.' },
  { icon: Camera, label: 'AR Lens', text: 'Point your camera at the portrait, the turntable or the magazines.' },
  { icon: MapIcon, label: 'Explore map', text: 'Tap the glowing ? spots in the app and solve the riddles.' },
];

/** First-time, click-through guide. Reopened any time from the header's "?" button. */
export default function Walkthrough({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setStep(0);
    const r = requestAnimationFrame(() => setVisible(true));
    const onKey = (e) => e.key === 'Escape' && finish();
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(r);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  function finish() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  const s = STEPS[step];
  const Icon = s.icon;
  const last = step === STEPS.length - 1;

  return (
    <div
      className={`fixed inset-0 z-[65] flex items-end justify-center bg-black/70 p-3 backdrop-blur-[2px] transition-opacity duration-250 sm:items-center ${visible ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
    >
      <div className="parchment safe-bottom w-full max-w-md rounded-3xl p-6 pb-5 shadow-2xl">
        <div className="flex items-center justify-between">
          {/* progress as amber LEDs, like the radio */}
          <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full ${i <= step ? 'led' : 'bg-ink/15'}`} />
            ))}
          </div>
          {!last && (
            <button type="button" onClick={finish} className="text-sm font-bold opacity-60">
              Skip
            </button>
          )}
        </div>

        <div key={step} className="animate-rise">
          <span className="mt-5 grid h-16 w-16 place-items-center rounded-full bg-umber text-mustard shadow-[0_0_24px_rgba(212,155,36,0.45)]">
            <Icon size={30} />
          </span>
          <p className="mt-4 text-[11px] font-bold tracking-[0.2em] text-sienna uppercase">{s.eyebrow}</p>
          <h2 id="walkthrough-title" className="font-display mt-1 text-[26px] leading-tight font-black">
            {s.title}
          </h2>

          {s.body ? (
            <p className="mt-2 text-[15px] leading-relaxed opacity-85">{s.body}</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {WAYS.map(({ icon: WIcon, label, text }) => (
                <li key={label} className="flex items-start gap-3 rounded-xl bg-white/50 p-3">
                  <WIcon size={20} className="mt-0.5 shrink-0 text-teal" />
                  <p className="text-[14px] leading-snug">
                    <b>{label}</b> {text}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="rounded-full bg-ink/10 px-5 py-3.5 font-bold">
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="flex-1 rounded-full bg-umber py-3.5 font-bold text-parchment"
          >
            {last ? 'Start exploring' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
