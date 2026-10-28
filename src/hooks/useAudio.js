import { useEffect, useState } from 'react';
import AudioController from '../audio/AudioController';

/** Subscribe a component to AudioController state. */
export function useAudio() {
  const [state, setState] = useState(AudioController.state);
  useEffect(() => AudioController.subscribe(setState), []);
  return state;
}

/** Live 0..1 output level for VU meters (rAF-driven). */
export function useAudioLevel(active = true) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let raf;
    let smooth = 0;
    const tick = () => {
      const l = AudioController.getLevel();
      smooth = l > smooth ? l : smooth * 0.9 + l * 0.1;
      setLevel(smooth);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  return level;
}
