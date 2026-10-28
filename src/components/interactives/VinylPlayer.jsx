import { useEffect, useState } from 'react';
import { Disc3, Pause, Play } from 'lucide-react';
import { LINER_NOTES } from '../../data/frequencies';
import AudioController from '../../audio/AudioController';
import { useAudio } from '../../hooks/useAudio';

/** Spinning record + tonearm. Plays the bassline stem with drums underneath. */
export default function VinylPlayer({ accent }) {
  const { grooveOn } = useAudio();
  const [mine, setMine] = useState(false); // did this player start the groove?
  const [note, setNote] = useState(0);
  const playing = grooveOn && mine;

  useEffect(() => () => {
    if (mine) AudioController.stopGroove();
  }, [mine]);

  const toggle = () => {
    if (playing) {
      AudioController.stopGroove();
      setMine(false);
    } else {
      AudioController.playSoundbite('turntable');
      AudioController.stopGroove();
      AudioController.startGroove(['bass', 'drums']);
      setMine(true);
    }
  };

  return (
    <div>
      <div className="relative mx-auto aspect-[5/4] w-full max-w-sm rounded-xl bg-[linear-gradient(160deg,#7a4a2a,#4a2b18)] p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.15),0_10px_25px_rgba(0,0,0,0.3)]">
        <div className="absolute inset-3 rounded-lg bg-[#2a1810] shadow-inner" />
        {/* platter */}
        <div className="absolute top-1/2 left-[42%] aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3a3a3a] p-1.5 shadow-lg">
          <div
            className={`vinyl-grooves relative h-full w-full rounded-full ${playing ? 'animate-spin-33' : ''}`}
            style={{ boxShadow: 'inset 0 0 0 1px #000' }}
          >
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_30deg,transparent_0_40deg,rgba(255,255,255,0.12)_50deg,transparent_60deg_220deg,rgba(255,255,255,0.08)_230deg,transparent_240deg)]" />
            <div className="absolute top-1/2 left-1/2 grid aspect-square w-[34%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-center" style={{ background: accent }}>
              <span className="font-display px-1 text-[9px] leading-tight font-black text-parchment">SUNDAY<br />SESSIONS</span>
              <span className="absolute h-1.5 w-1.5 rounded-full bg-black" />
            </div>
          </div>
        </div>
        {/* tonearm */}
        <div
          className="absolute top-[14%] right-[10%] h-[62%] w-2 origin-top rounded-full bg-gradient-to-b from-gray-200 to-gray-400 shadow transition-transform duration-700"
          style={{ transform: `rotate(${playing ? 24 : 6}deg)` }}
        >
          <span className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-gray-300 shadow" />
          <span className="absolute -bottom-1 -left-1 h-4 w-4 rounded-sm bg-gray-700" />
        </div>
        <div className="led-text absolute right-5 bottom-4 text-sm">{playing ? '33⅓ ●' : '33⅓ ○'}</div>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-bold text-parchment"
        style={{ background: accent }}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />} {playing ? 'Lift the Needle' : 'Drop the Needle'}
      </button>

      <div className="mt-4 rounded-lg border border-ink/15 bg-white/50 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase opacity-60">
          <Disc3 size={14} /> Liner Notes
        </p>
        <div className="mb-2 flex gap-1.5">
          {LINER_NOTES.map((t, i) => (
            <button
              type="button"
              key={t.side}
              onClick={() => setNote(i)}
              className={`rounded px-2 py-1 text-xs font-bold ${note === i ? 'bg-ink text-parchment' : 'bg-ink/10'}`}
            >
              {t.side}
            </button>
          ))}
        </div>
        <p className="font-display text-lg font-black">{LINER_NOTES[note].title}</p>
        <p className="text-sm opacity-80">{LINER_NOTES[note].note}</p>
      </div>
    </div>
  );
}
