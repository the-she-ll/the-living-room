import { Lock, Pause, Play, Sparkles } from 'lucide-react';
import { FREQUENCIES, FREQUENCY_ORDER } from '../data/frequencies';
import AudioController, { STEMS } from '../audio/AudioController';
import { useAudio, useAudioLevel } from '../hooks/useAudio';

/**
 * Stem mixer. Each discovered frequency unlocks one layer of the groove.
 * At 5/5 the "All Frequencies Synchronized" button brings in the full band.
 */
export default function SymphonyPlayer({ discovered, complete, compact = false }) {
  const { grooveOn, stems } = useAudio();
  const level = useAudioLevel(grooveOn);
  const unlockedStems = FREQUENCY_ORDER.filter((id) => discovered.includes(id)).map((id) => FREQUENCIES[id].stem);

  const playUnlocked = () => {
    if (grooveOn) return AudioController.stopGroove();
    if (!unlockedStems.length) return undefined;
    return AudioController.startGroove(unlockedStems);
  };

  const synchronize = () => {
    AudioController.playTuneIn();
    setTimeout(() => AudioController.startGroove([...STEMS]), 900);
  };

  return (
    <section className="faceplate rounded-2xl p-4" aria-label="Soul groove mixer">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-mustard uppercase">Stem Mixer</p>
          <p className="font-display text-lg font-black text-parchment">Sunday Afternoon Groove</p>
        </div>
        <button
          type="button"
          onClick={playUnlocked}
          disabled={!unlockedStems.length}
          className="grid h-12 w-12 place-items-center rounded-full bg-mustard text-umber shadow-[0_4px_0_#8a5c0c] transition active:translate-y-0.5 disabled:opacity-40"
          aria-label={grooveOn ? 'Pause groove' : 'Play unlocked stems'}
        >
          {grooveOn ? <Pause size={20} /> : <Play size={20} className="translate-x-0.5" />}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {FREQUENCY_ORDER.map((id) => {
          const f = FREQUENCIES[id];
          const unlocked = discovered.includes(id);
          const on = stems[f.stem];
          const h = !unlocked ? 0 : grooveOn && on ? 30 + level * 70 : 8;
          return (
            <button
              type="button"
              key={id}
              disabled={!unlocked}
              onClick={() => {
                AudioController.setStem(f.stem, !on);
                if (!grooveOn) AudioController.startGroove();
              }}
              aria-pressed={!!on}
              aria-label={unlocked ? `${f.stemLabel} ${on ? 'on' : 'off'}` : 'Locked stem'}
              className="flex flex-col items-center gap-1.5 disabled:opacity-40"
            >
              <div className="dial-glass relative h-20 w-full overflow-hidden rounded-md border border-black/70">
                <div
                  className="absolute inset-x-1.5 bottom-1 rounded-sm transition-[height] duration-100"
                  style={{ height: `${h}%`, background: `linear-gradient(0deg, ${f.color}, #ffb347)` }}
                />
                {!unlocked && <Lock size={14} className="absolute inset-0 m-auto text-amber/60" />}
              </div>
              <span className={`h-2 w-2 rounded-full ${on ? 'led' : 'led-off'}`} />
              <span className="text-center text-[10px] leading-tight text-parchment/75">{unlocked ? f.stemLabel : '—'}</span>
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-4">
          {complete ? (
            <button
              type="button"
              onClick={synchronize}
              className="relative w-full overflow-hidden rounded-full bg-[linear-gradient(90deg,#8a3319,#d49b24,#4f5d2f,#1a535c,#8a3319)] py-4 font-display text-lg font-black text-parchment shadow-[0_0_24px_rgba(212,155,36,0.55)]"
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles size={18} /> All Frequencies Synchronized
              </span>
            </button>
          ) : (
            <p className="led-text text-center text-base">
              {5 - discovered.length} STEM{5 - discovered.length === 1 ? '' : 'S'} STILL HIDING IN THE PAINTING
            </p>
          )}
        </div>
      )}
    </section>
  );
}
