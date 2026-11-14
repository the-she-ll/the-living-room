import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { SESSIONS } from '../../data/frequencies';
import AudioController from '../../audio/AudioController';
import { useAudio } from '../../hooks/useAudio';

/** An original record sleeve: two-tone stripes and the record's title. */
function Sleeve({ s, active }) {
  const [a, b] = s.sleeve;
  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-[3px] shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition ${active ? 'ring-4 ring-mustard' : ''}`}
      style={{ background: `repeating-linear-gradient(135deg, ${a} 0 14px, ${b} 14px 18px)` }}
    >
      <span className="absolute inset-x-1 bottom-1 rounded-sm bg-black/55 px-1 py-0.5 text-center text-[9px] leading-tight font-bold text-parchment">{s.title}</span>
    </div>
  );
}

/**
 * The Rhythm & Sanctuary: pick a record from the crate, drop the needle, and
 * hear a groove in that record's own feel while its story appears.
 */
export default function VinylPlayer({ accent }) {
  const { grooveOn, grooveOwner } = useAudio();
  const [pick, setPick] = useState(0);
  const [needle, setNeedle] = useState(false); // needle down on this player?
  // the radio taking over the music lifts this needle
  const playing = needle && grooveOn && grooveOwner === 'record';
  const mine = useRef(false);
  const s = SESSIONS[pick];

  const start = (session) => {
    AudioController.stopGroove();
    AudioController.playClick(); // the needle meeting the groove
    AudioController.startGroove(session.feel.stems, { owner: 'record', feel: session.feel });
    mine.current = true;
  };

  const stop = () => {
    if (mine.current && AudioController.state.grooveOwner === 'record') AudioController.stopGroove();
    mine.current = false;
  };

  // Lift the needle when the drawer closes.
  useEffect(() => stop, []);

  const toggle = async () => {
    await AudioController.unlock();
    if (playing) {
      stop();
      setNeedle(false);
    } else {
      start(s);
      setNeedle(true);
    }
  };

  const choose = (i) => {
    if (i === pick) return;
    setPick(i);
    AudioController.playClick();
    if (playing) start(SESSIONS[i]); // swap records while it plays
  };

  return (
    <div>
      {/* the crate */}
      <p className="mb-2 text-sm opacity-75">Pick a record from the crate, then drop the needle.</p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {SESSIONS.map((r, i) => (
          <button key={r.id} type="button" onClick={() => choose(i)} aria-pressed={i === pick} aria-label={`${r.title}, ${r.place}, ${r.era}`}>
            <Sleeve s={r} active={i === pick} />
          </button>
        ))}
      </div>

      {/* the turntable */}
      <div className="relative mx-auto aspect-[5/4] w-full max-w-sm rounded-xl bg-[linear-gradient(160deg,#7a4a2a,#4a2b18)] p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.15),0_10px_25px_rgba(0,0,0,0.3)]">
        <div className="absolute inset-3 rounded-lg bg-[#2a1810] shadow-inner" />
        <div className="absolute top-1/2 left-[42%] aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3a3a3a] p-1.5 shadow-lg">
          <div key={s.id} className={`vinyl-grooves relative h-full w-full animate-fade rounded-full ${playing ? 'animate-spin-33' : ''}`} style={{ boxShadow: 'inset 0 0 0 1px #000' }}>
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_30deg,transparent_0_40deg,rgba(255,255,255,0.12)_50deg,transparent_60deg_220deg,rgba(255,255,255,0.08)_230deg,transparent_240deg)]" />
            <div className="absolute top-1/2 left-1/2 grid aspect-square w-[36%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full px-1 text-center" style={{ background: s.sleeve[0] }}>
              <span className="font-display text-[9px] leading-tight font-black text-parchment">{s.title}</span>
              <span className="absolute h-1.5 w-1.5 rounded-full bg-black" />
            </div>
          </div>
        </div>
        <div
          className="absolute top-[14%] right-[10%] h-[62%] w-2 origin-top rounded-full bg-gradient-to-b from-gray-200 to-gray-400 shadow transition-transform duration-700"
          style={{ transform: `rotate(${playing ? 24 : 6}deg)` }}
        >
          <span className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-gray-300 shadow" />
          <span className="absolute -bottom-1 -left-1 h-4 w-4 rounded-sm bg-gray-700" />
        </div>
        <div className="led-text absolute right-5 bottom-4 text-sm">{playing ? `${s.feel.bpm} BPM ●` : '33⅓ ○'}</div>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-bold text-parchment"
        style={{ background: accent }}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />} {playing ? 'Lift the Needle' : 'Drop the Needle'}
      </button>

      {/* the story arrives with the music */}
      <div className="mt-4 min-h-[148px] rounded-xl border border-ink/15 bg-white/50 p-4">
        {playing ? (
          <div key={s.id} className="animate-fade">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-60">
              Now playing · {s.place} · {s.era}
            </p>
            <p className="font-display mt-1 text-xl font-black">{s.title}</p>
            <p className="mt-2 text-[15px] leading-relaxed">{s.story}</p>
          </div>
        ) : (
          <div className="grid h-full min-h-[116px] place-items-center text-center">
            <p className="text-sm opacity-60">
              <span className="font-display block text-lg font-black opacity-100">{s.title}</span>
              {s.place} · {s.era}
              <br />
              Drop the needle to hear its story.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
