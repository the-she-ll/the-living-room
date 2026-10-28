import { useState } from 'react';
import { FRONT_ROOM_NOTES } from '../../data/frequencies';
import AudioController from '../../audio/AudioController';
import ArtifactIllustration from '../ArtifactIllustration';

/** Index cards on a corkboard. Tap one to unfold its archival note. */
export default function FrontRoomNotes({ accent }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-3">
      <div className="film-grain overflow-hidden rounded-lg border-8 border-white shadow-md sepia-[0.4]">
        <ArtifactIllustration id="chair" />
      </div>
      <p className="text-center text-xs italic opacity-60">Archival meeting photos go here (placeholder illustration)</p>

      <ul className="space-y-2.5">
        {FRONT_ROOM_NOTES.map((n, i) => {
          const isOpen = open === i;
          return (
            <li key={i} style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 0.6}deg)` }}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => {
                  AudioController.playClick();
                  setOpen(isOpen ? -1 : i);
                }}
                className="w-full rounded-md bg-[#fffaf0] p-4 text-left shadow-[0_3px_8px_rgba(0,0,0,0.18)]"
                style={{
                  backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 23px, rgba(26,83,92,0.18) 23px 24px)',
                  borderLeft: `4px solid ${accent}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg font-black">{n.kind}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-parchment uppercase" style={{ background: accent }}>
                    {n.tag}
                  </span>
                </div>
                <p className="text-xs opacity-60">{n.when}</p>
                <div className={`grid transition-all duration-300 ${isOpen ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <p className="overflow-hidden font-[cursive] text-[15px] leading-6 text-teal">{n.note}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] italic opacity-55">Notes are illustrative composites. Replace them with documented gatherings from your research.</p>
    </div>
  );
}
