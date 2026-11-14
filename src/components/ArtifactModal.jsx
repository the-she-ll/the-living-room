import { useEffect, useState } from 'react';
import { Disc3, Lock, MessageCircleHeart, Newspaper, Phone } from 'lucide-react';

import Drawer from './Drawer';
import { FREQUENCIES } from '../data/frequencies';
import { asset } from '../data/site';
import AudioController from '../audio/AudioController';
import { useAudio } from '../hooks/useAudio';
import ArtifactIllustration from './ArtifactIllustration';
import PantheonGallery from './interactives/PantheonGallery';
import MagazineFlip from './interactives/MagazineFlip';
import VinylPlayer from './interactives/VinylPlayer';
import RotaryDial from './interactives/RotaryDial';
import RaisedFist from './RaisedFist';

// Icons for the 'how to unlock' hint on locked frequencies.
const HINT_ICONS = { fist: RaisedFist, magazine: Newspaper, vinyl: Disc3, phone: Phone };

const INTERACTIVES = {
  pantheon: PantheonGallery,
  magazines: MagazineFlip,
  vinyl: VinylPlayer,
  rotary: RotaryDial,
};


/**
 * Slide-up drawer for one artifact. Locked artifacts only say how to find them,
 * so the hunt still has to happen in front of the painting.
 */
export default function ArtifactModal({ frequencyId, discoveredIds, onClose, onOpenGuestbook }) {
  // Keep the last artifact rendered while the drawer animates closed.
  const [shownId, setShownId] = useState(frequencyId);
  useEffect(() => {
    if (frequencyId) setShownId(frequencyId);
  }, [frequencyId]);
  const f = FREQUENCIES[frequencyId || shownId] || null;
  const { clipPlaying } = useAudio();

  useEffect(() => () => AudioController.stopClip(), [frequencyId]);

  if (!f) return null;
  const discovered = discoveredIds.includes(f.id);

  const Interactive = INTERACTIVES[f.interactive];

  return (
    <Drawer
      open={!!frequencyId}
      onClose={onClose}
      title={f.title}
      eyebrow={`${f.band} FM · ${f.subtitle}`}
      accent={f.color}
      labelId={`artifact-${f.id}`}
    >
      {!discovered ? (
        <div className="mb-6 rounded-xl border-2 border-dashed border-ink/25 p-5 text-center">
          {(() => {
            const HintIcon = HINT_ICONS[f.hintIcon] || Lock;
            return (
              <span className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full text-parchment shadow-md" style={{ background: f.color }}>
                <HintIcon size={f.hintIcon === 'fist' ? 36 : 30} />
              </span>
            );
          })()}
          <p className="font-display text-lg font-bold">This frequency is still static.</p>
          <p className="font-display mt-2 text-[17px] leading-snug">{f.hint}</p>
          <p className="mt-2 text-xs opacity-60">No tap feature on your phone? Find it on the Explore Map instead.</p>
        </div>
      ) : (
        // One scrolling page: the history first, then the hands-on piece, then Reflect.
        <div className="space-y-5 pb-6">
          <figure>
            <div className="film-grain overflow-hidden rounded-lg border-[10px] border-white bg-white shadow-[0_10px_25px_rgba(0,0,0,0.25)] sepia-[0.35]">
              {f.photo ? <img src={asset(f.photo)} alt={f.photoCaption} className="block h-auto w-full" /> : <ArtifactIllustration id={f.id} />}
            </div>
            <figcaption className="mt-2 text-center text-xs italic opacity-60">
              {f.photoCaption}
              {f.photoCredit && <span className="mt-0.5 block text-[10px] not-italic opacity-80">{f.photoCredit}</span>}
            </figcaption>
          </figure>
          {f.archive.map((p, i) => (
            <p
              key={i}
              className={`text-[15px] leading-relaxed ${i === 0 ? 'first-letter:font-display first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:leading-[0.85] first-letter:font-black first-letter:text-sienna' : ''}`}
            >
              {p}
            </p>
          ))}

          <div className="border-t border-ink/15 pt-5">
            <h3 className="font-display mb-4 text-xl font-black">{f.interactiveLabel}</h3>
            <Interactive accent={f.color} clipPlaying={clipPlaying} />
          </div>

          <div className="rounded-xl p-5 text-parchment" style={{ background: f.color }}>
            <p className="font-display text-xl leading-snug font-bold">{f.reflection}</p>
            <button
              type="button"
              onClick={onOpenGuestbook}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-parchment py-3.5 font-bold text-ink"
            >
              <MessageCircleHeart size={18} /> Reflect
            </button>
          </div>
        </div>
      )}

    </Drawer>
  );
}
