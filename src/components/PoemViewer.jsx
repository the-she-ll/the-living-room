import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import Drawer from './Drawer';
import SymphonyPlayer from './SymphonyPlayer';
import { FREQUENCIES, FREQUENCY_ORDER } from '../data/frequencies';
import { POEM } from '../data/poem';
import AudioController, { STEMS } from '../audio/AudioController';

/**
 * "Assemble the Sanctuary": each discovered frequency un-blurs its stanza.
 * At 5/5 the whole poem glows in line by line and the full groove plays.
 */
export default function PoemViewer({ open, onClose, discovered, complete }) {
  const [celebrate, setCelebrate] = useState(false);
  const played = useRef(false);

  useEffect(() => {
    if (open && complete && !played.current) {
      played.current = true;
      setCelebrate(true);
      AudioController.playTuneIn();
      const t = setTimeout(() => AudioController.startGroove([...STEMS]), 1200);
      return () => clearTimeout(t);
    }
    if (!open) setCelebrate(false);
    return undefined;
  }, [open, complete]);

  let lineIndex = 0;

  return (
    <Drawer open={open} onClose={onClose} title="Assemble the Sanctuary" eyebrow={`${discovered.length}/5 stanzas tuned in`} accent="#D49B24">
      <div className="pb-6">
        {!POEM.ready && (
          <p className="mb-4 rounded-lg bg-mustard/20 px-3 py-2 text-xs">
            <strong>Poem in progress.</strong> The stanzas below are placeholders until the exhibition poem is finished. The unlock-and-reveal works as it will on opening day.
          </p>
        )}

        <div
          className={`relative rounded-xl border border-ink/15 bg-white/45 px-5 py-6 transition-shadow duration-1000 ${
            celebrate ? 'shadow-[0_0_0_2px_#d49b24,0_0_60px_rgba(212,155,36,0.55)]' : ''
          }`}
        >
          {celebrate && <div className="pointer-events-none absolute inset-0 animate-fade rounded-xl bg-[radial-gradient(ellipse_at_top,rgba(255,179,71,0.35),transparent_70%)]" />}
          <p className="font-display text-center text-2xl font-black">{POEM.title}</p>
          <p className="mb-5 text-center text-xs tracking-widest uppercase opacity-60">{POEM.author}</p>

          <div className="space-y-6">
            {FREQUENCY_ORDER.map((id, s) => {
              const f = FREQUENCIES[id];
              const found = discovered.includes(id);
              const lines = POEM.stanzas[id]?.lines ?? [];
              return (
                <div key={id} className="relative">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: f.color }}>
                    {!found && <Lock size={10} />} {['I', 'II', 'III', 'IV', 'V'][s]} · {found ? f.title : `${f.band} FM · static`}
                  </p>
                  {lines.map((line, i) => {
                    const delay = lineIndex++ * 0.22;
                    return (
                      <p
                        key={i}
                        aria-hidden={!found}
                        className={`font-display text-[19px] leading-relaxed ${found ? '' : 'stanza-locked opacity-60'} ${celebrate ? 'animate-glow-in' : ''}`}
                        style={celebrate ? { animationDelay: `${delay}s` } : undefined}
                      >
                        {found ? line : line.replace(/\S/g, '▒')}
                      </p>
                    );
                  })}
                  {!found && <span className="sr-only">Locked stanza. Discover {f.title} to reveal it.</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <SymphonyPlayer discovered={discovered} complete={complete} />
        </div>
      </div>
    </Drawer>
  );
}
