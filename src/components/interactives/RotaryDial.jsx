import { useEffect, useRef, useState } from 'react';
import { PhoneCall, PhoneOff, Voicemail } from 'lucide-react';
import { VOICEMAILS } from '../../data/frequencies';
import AudioController from '../../audio/AudioController';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const SPACING = 28;
const FIRST = -20; // angle of the "1" hole (deg, SVG coords)
const STOP = 50; // finger-stop angle
const R = 74; // finger-hole ring radius

const holeAngle = (k) => FIRST - k * SPACING;

/**
 * Working rotary dial. Tap a finger hole: the dial winds to the stop, clicks
 * back, rings, then plays a voicemail-style oral history (1–5).
 */
export default function RotaryDial({ accent, clipPlaying }) {
  const [rot, setRot] = useState(0);
  const [dur, setDur] = useState(0.4);
  const [status, setStatus] = useState('idle'); // idle | dialing | ringing | playing | missing
  const [active, setActive] = useState(null);
  const timers = useRef([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  // When the clip ends naturally, return to idle.
  useEffect(() => {
    if (status === 'playing' && !clipPlaying) setStatus('idle');
  }, [clipPlaying, status]);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const dial = (k) => {
    if (status === 'dialing' || status === 'ringing') return;
    clear();
    AudioController.stopClip();
    const digit = DIGITS[k];
    const travel = STOP - holeAngle(k);
    setActive(digit);
    setStatus('dialing');
    setDur(0.45);
    setRot(travel);
    later(() => {
      const back = AudioController.playDial(digit);
      setDur(back);
      setRot(0);
      later(() => {
        const vm = VOICEMAILS.find((v) => v.digit === digit);
        if (!vm) {
          setStatus('missing');
          return;
        }
        setStatus('ringing');
        AudioController.playSoundbite('phone');
        later(() => {
          setStatus('playing');
          AudioController.playClip(`vm-${digit}`, vm.audioSrc, 5, { phone: true });
        }, 1900);
      }, back * 1000 + 150);
    }, 480);
  };

  const hangUp = () => {
    clear();
    AudioController.stopClip();
    setStatus('idle');
    setRot(0);
  };

  const vm = VOICEMAILS.find((v) => v.digit === active);

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-[300px]">
        <svg viewBox="-100 -100 200 200" className="h-full w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]">
          {/* body */}
          <circle r="98" fill={accent} />
          <circle r="96" fill="none" stroke="#000" strokeOpacity=".2" strokeWidth="2" />
          {/* number plate (fixed) */}
          <circle r="90" fill="#f2e6cc" />
          {/* rotating finger wheel */}
          <g style={{ transform: `rotate(${rot}deg)`, transition: `transform ${dur}s ${rot ? 'ease-out' : 'linear'}` }}>
            <circle r="90" fill="#111" fillOpacity=".88" />
            {DIGITS.map((d, k) => {
              const a = (holeAngle(k) * Math.PI) / 180;
              return (
                <circle
                  key={d}
                  cx={Math.cos(a) * R}
                  cy={Math.sin(a) * R}
                  r="13.5"
                  fill="#f2e6cc"
                  stroke="#000"
                  strokeOpacity=".4"
                />
              );
            })}
            <circle r="44" fill="#2a1810" />
          </g>
          {/* digits re-drawn so they show through the holes */}
          <g pointerEvents="none">
            {rot === 0 &&
              DIGITS.map((d, k) => {
                const a = (holeAngle(k) * Math.PI) / 180;
                return (
                  <text key={d} x={Math.cos(a) * R} y={Math.sin(a) * R + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill={d >= 1 && d <= 5 ? '#8a3319' : '#2e1c1488'} fontFamily="DM Sans, sans-serif">
                    {d}
                  </text>
                );
              })}
          </g>
          {/* centre card */}
          <circle r="36" fill="#f2e6cc" />
          <text y="-8" textAnchor="middle" fontSize="8" fontWeight="700" fill="#2e1c14" letterSpacing="1.5">PORCH LINE</text>
          <text y="6" textAnchor="middle" fontSize="12" fontWeight="900" fill="#8a3319" fontFamily="Fraunces, serif">LIFELINE</text>
          <text y="19" textAnchor="middle" fontSize="7" fill="#2e1c14aa">DIAL 1–5</text>
          {/* finger stop */}
          <path d="M0 0 L8 0 L4 -16 Z" fill="#c0c0c0" stroke="#555" transform={`rotate(${STOP + 90}) translate(-4 -97)`} />
        </svg>

        {/* invisible tap targets on top of the holes */}
        {DIGITS.map((d, k) => {
          const a = (holeAngle(k) * Math.PI) / 180;
          return (
            <button
              type="button"
              key={d}
              onClick={() => dial(k)}
              aria-label={`Dial ${d}`}
              className="absolute h-[15%] w-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${50 + (Math.cos(a) * R) / 2}%`, top: `${50 + (Math.sin(a) * R) / 2}%` }}
            />
          );
        })}
      </div>

      <div className="mt-4 min-h-[132px] rounded-xl bg-umber p-4 text-parchment" aria-live="polite">
        {status === 'idle' && !active && (
          <p className="flex items-center gap-2 text-sm text-parchment/80">
            <Voicemail size={16} /> Dial 1–5 to hear voicemail-style oral histories from the community grapevine.
          </p>
        )}
        {status === 'dialing' && <p className="led-text text-2xl">DIALING {active}…</p>}
        {status === 'ringing' && (
          <p className="led-text flex items-center gap-2 text-2xl">
            <PhoneCall size={18} className="animate-led-pulse" /> RINGING…
          </p>
        )}
        {status === 'missing' && (
          <p className="text-sm">
            <span className="led-text block text-xl">BEEP · BEEP · BEEP</span>
            The number you have dialed is not in service. Try 1 through 5.
          </p>
        )}
        {(status === 'playing' || (status === 'idle' && vm)) && vm && (
          <div className="animate-fade">
            <div className="flex items-center justify-between">
              <p className="text-[11px] tracking-[0.2em] text-mustard uppercase">Message {vm.digit} · {vm.duration}</p>
              {status === 'playing' && (
                <button type="button" onClick={hangUp} className="flex items-center gap-1 rounded-full bg-sienna px-2.5 py-1 text-xs font-bold">
                  <PhoneOff size={12} /> Hang up
                </button>
              )}
            </div>
            <p className="mt-1 text-sm font-bold">{vm.caller}</p>
            <p className="font-display mt-1 text-[17px] leading-snug italic">{vm.transcript}</p>
            {!vm.audioSrc && <p className="mt-2 text-[10px] italic opacity-50">Placeholder audio & composite transcript. Replace with recorded oral histories.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
