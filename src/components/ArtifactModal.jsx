import { useEffect, useState } from 'react';
import { BookOpen, Feather, Lock, MessageCircleHeart, Play, Sparkles, Square } from 'lucide-react';
import Drawer from './Drawer';
import { FREQUENCIES } from '../data/frequencies';
import { POEM } from '../data/poem';
import AudioController from '../audio/AudioController';
import { useAudio } from '../hooks/useAudio';
import ArtifactIllustration from './ArtifactIllustration';
import PantheonGallery from './interactives/PantheonGallery';
import FrontRoomNotes from './interactives/FrontRoomNotes';
import MagazineFlip from './interactives/MagazineFlip';
import VinylPlayer from './interactives/VinylPlayer';
import RotaryDial from './interactives/RotaryDial';

const INTERACTIVES = {
  pantheon: PantheonGallery,
  frontroom: FrontRoomNotes,
  magazines: MagazineFlip,
  vinyl: VinylPlayer,
  rotary: RotaryDial,
};

const TABS = [
  { id: 'explore', label: 'Explore', icon: Sparkles },
  { id: 'archive', label: 'The Archive', icon: BookOpen },
  { id: 'reflect', label: 'Reflect', icon: MessageCircleHeart },
];

/**
 * Slide-up drawer for one artifact. Locked artifacts only reveal their riddle
 * so the hunt still has to happen in front of the painting.
 */
export default function ArtifactModal({ frequencyId, discoveredIds, onClose, onOpenGuestbook, onOpenPoem }) {
  // Keep the last artifact rendered while the drawer animates closed.
  const [shownId, setShownId] = useState(frequencyId);
  useEffect(() => {
    if (frequencyId) setShownId(frequencyId);
  }, [frequencyId]);
  const f = FREQUENCIES[frequencyId || shownId] || null;
  const [tab, setTab] = useState('explore');
  const { clipPlaying } = useAudio();

  useEffect(() => {
    if (frequencyId) setTab('explore');
  }, [frequencyId]);
  useEffect(() => () => AudioController.stopClip(), [frequencyId]);

  if (!f) return null;
  const discovered = discoveredIds.includes(f.id);

  const Interactive = INTERACTIVES[f.interactive];
  const stanza = POEM.stanzas[f.id];

  return (
    <Drawer
      open={!!frequencyId}
      onClose={onClose}
      title={f.title}
      eyebrow={`${f.band} FM · ${f.subtitle}`}
      accent={f.color}
      labelId={`artifact-${f.id}`}
    >
      {/* Riddle, always visible */}
      <blockquote className="relative mb-4 rounded-xl border border-ink/15 bg-white/40 p-4 pl-10">
        <Feather size={18} className="absolute top-4 left-3.5" style={{ color: f.color }} />
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase opacity-60">The Riddle</p>
        <p className="font-display mt-1 text-[17px] leading-snug italic">{f.clue}</p>
      </blockquote>

      {!discovered ? (
        <div className="mb-6 rounded-xl border-2 border-dashed border-ink/25 p-5 text-center">
          <Lock className="mx-auto mb-2 opacity-60" />
          <p className="font-display text-lg font-bold">This frequency is still static.</p>
          <p className="mt-1 text-sm opacity-75">
            Find the artifact in the painting and tap its hidden NFC tag, point the AR Lens at it, or tap it on the Explore Map.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div role="tablist" className="sticky top-0 z-10 -mx-5 mb-4 flex gap-1 bg-parchment/95 px-5 py-2 backdrop-blur">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[13px] font-bold transition ${
                  tab === id ? 'text-parchment shadow' : 'bg-ink/5 text-ink/70'
                }`}
                style={tab === id ? { background: f.color } : undefined}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {tab === 'explore' && (
            <div className="animate-fade space-y-5 pb-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-black">{f.interactiveLabel}</h3>
                <button
                  type="button"
                  onClick={() => AudioController.playSoundbite(f.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1.5 text-xs font-bold"
                >
                  <Play size={12} /> Soundbite
                </button>
              </div>
              <Interactive accent={f.color} clipPlaying={clipPlaying} />

              <button
                type="button"
                onClick={onOpenPoem}
                className="w-full rounded-xl bg-umber p-4 text-left text-parchment shadow-lg"
              >
                <p className="text-[11px] tracking-[0.2em] text-mustard uppercase">Stanza unlocked</p>
                <p className="font-display mt-1 text-lg leading-snug italic">“{stanza?.lines[0]} {stanza?.lines[1]}…”</p>
                <p className="mt-2 text-xs text-parchment/60">Open “Assemble the Sanctuary” →</p>
              </button>
            </div>
          )}

          {tab === 'archive' && (
            <div className="animate-fade space-y-4 pb-6">
              <figure>
                <div className="film-grain overflow-hidden rounded-lg border-[10px] border-white bg-white shadow-[0_10px_25px_rgba(0,0,0,0.25)] sepia-[0.35]">
                  <ArtifactIllustration id={f.id} />
                </div>
                <figcaption className="mt-2 text-center text-xs italic opacity-60">{f.photoCaption}</figcaption>
              </figure>
              {f.archive.map((p, i) => (
                <p
                  key={i}
                  className={`text-[15px] leading-relaxed ${i === 0 ? 'first-letter:font-display first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:leading-[0.85] first-letter:font-black first-letter:text-sienna' : ''}`}
                >
                  {p}
                </p>
              ))}
            </div>
          )}

          {tab === 'reflect' && (
            <div className="animate-fade space-y-4 pb-6">
              <div className="rounded-xl p-5 text-parchment" style={{ background: f.color }}>
                <p className="text-[11px] tracking-[0.2em] uppercase opacity-80">Reflection</p>
                <p className="font-display mt-2 text-2xl leading-snug font-bold">{f.reflection}</p>
              </div>
              <p className="text-sm opacity-75">Take a moment with someone beside you, or leave your memory in the Living Guestbook so it plays on for the next visitor.</p>
              <button
                type="button"
                onClick={onOpenGuestbook}
                className="w-full rounded-full bg-ink py-3.5 font-bold text-parchment"
              >
                Add to the Living Guestbook
              </button>
            </div>
          )}
        </>
      )}

      {clipPlaying && (
        <button
          type="button"
          onClick={() => AudioController.stopClip()}
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-parchment shadow-xl"
        >
          <Square size={12} /> Stop audio
        </button>
      )}
    </Drawer>
  );
}
